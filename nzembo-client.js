// nzembo-client.js - Moteur client autonome Nzembo Full-Stack
// Intégration complète : Supabase (Auth, Storage Bucket 'nzembo-media', Database PostgreSQL 'creations' & 'profiles')
// et Moteur Audio IA Nzembo pour la génération musicale, vidéos MP4 visualiseur, covers & stems.

(function(window) {
  // ================= CONFIGURATION SUPABASE & MOTEUR AUDIO IA =================
  function resolveNzemboEnv() {
    if (typeof window !== 'undefined' && window.__NZEMBO_ENV__) {
      return window.__NZEMBO_ENV__;
    }
    if (typeof process !== 'undefined' && process.env) {
      if (!process.env.SUPABASE_ANON_KEY && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const envPath = path.join(__dirname, '.env');
          if (fs.existsSync(envPath)) {
            for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
              const line = rawLine.trim();
              if (!line || line.startsWith('#')) continue;
              const eq = line.indexOf('=');
              if (eq === -1) continue;
              const k = line.slice(0, eq).trim();
              let v = line.slice(eq + 1).trim();
              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
              }
              if (!process.env[k]) process.env[k] = v;
            }
          }
        } catch (e) {}
      }
      return process.env;
    }
    return {};
  }

  const _nzemboEnv = resolveNzemboEnv();
  const SUPABASE_URL = _nzemboEnv.SUPABASE_URL || _nzemboEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = _nzemboEnv.SUPABASE_ANON_KEY || _nzemboEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const STORAGE_BUCKET = "nzembo-media";

  const ENGINE_BEARER_TOKEN = _nzemboEnv.ENGINE_BEARER_TOKEN || _nzemboEnv.SUNO_BEARER_TOKEN || _nzemboEnv.SUNO_API_KEY || "";
  const DIRECT_ENGINE_BASE = "https://api.sunoapi.org/api/v1";
  const FILE_UPLOAD_BASE = "https://sunoapiorg.redpandaai.co/api";
  const WEBHOOK_NOOP_URL = "https://nzembo.com/api/webhook-noop";

  // Masquage absolu de tout nom de fournisseur tiers dans les messages visibles ou erreurs
  function sanitizeApiErrorMessage(rawMsg, fallback = "Une erreur est survenue lors du traitement, réessaie.") {
    if (!rawMsg) return fallback;
    const str = String(rawMsg);
    if (/Invalid login credentials/i.test(str)) return "Email ou mot de passe incorrect.";
    if (/Email not confirmed/i.test(str)) return "Confirme d'abord ton compte avec le lien reçu par email.";
    if (/User already registered/i.test(str)) return "Un compte existe déjà avec cette adresse email.";
    if (/Password should be at least 6/i.test(str)) return "Le mot de passe doit comporter au moins 6 caractères.";
    if (/security purposes|rate limit|too many requests/i.test(str)) return "Trop de tentatives, réessaie dans quelques minutes.";
    if (/Token has expired|invalid token/i.test(str)) return "Le lien est expiré ou invalide. Fais une nouvelle demande.";

    // Neutralize any technical backend or provider leakage
    let cleaned = str
      .replace(/https?:\/\/[^\s"'<>]*/gi, '')
      .replace(/\b(?:suno|erweima|redpandaai|supabase|postgres|postgresql|database|storage|cloud|bucket|neon|jwt|oauth|api_key|bearer)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleaned || cleaned.length < 4 || /failed to fetch|network error|status code|internal server/i.test(cleaned)) {
      return fallback;
    }
    return cleaned;
  }

  // Session utilisateur
  const SESSION_KEY = 'nzembo_auth_user';

  // Instance Supabase partagée
  let _supabaseInstance = null;

  function getSupabase() {
    if (_supabaseInstance) return _supabaseInstance;
    if (typeof window !== 'undefined' && window.supabaseClient) {
      _supabaseInstance = window.supabaseClient;
      return _supabaseInstance;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Supabase] Configuration manquante : définissez SUPABASE_URL et SUPABASE_ANON_KEY dans env.local.js ou .env.');
      return null;
    }
    if (typeof window !== 'undefined') {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          _supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          });
          window.supabaseClient = _supabaseInstance;
          return _supabaseInstance;
        } catch (e) {
          console.warn('[Supabase] Initialisation browser:', e.message);
        }
      }
    }
    // Environnement Node / Tests
    if (typeof require !== 'undefined') {
      try {
        const { createClient } = require('@supabase/supabase-js');
        _supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return _supabaseInstance;
      } catch (e) {}
    }
    return null;
  }

  // Détection dynamique du proxy local (Support Mobile, Émulateur Android et Local PC)
  function getProxyBase() {
    const port = '3001';
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:${port}/api/v1`;
      }
    }
    return `http://localhost:${port}/api/v1`;
  }

  // Détection de l'hôte pour la persistance locale
  function getStorageBase() {
    const port = '3001';
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:${port}`;
      }
    }
    return `http://localhost:${port}`;
  }

  // Fonction fetch robuste pour le moteur audio IA avec bascule automatique Proxy Local <-> Direct
  async function fetchAudioEngine(path, options = {}) {
    options.headers = options.headers || {};
    if (ENGINE_BEARER_TOKEN) {
      options.headers['Authorization'] = `Bearer ${ENGINE_BEARER_TOKEN}`;
    }
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const isHttpOrigin = (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:');

    // 1. Essai via le proxy local uniquement sur environnement HTTP local (évite Mixed Content en HTTPS)
    if (isHttpOrigin) {
      try {
        const proxyBase = getProxyBase();
        const fetchOpts = { ...options };
        if (!fetchOpts.signal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
          fetchOpts.signal = AbortSignal.timeout(12000);
        }
        const proxyRes = await fetch(`${proxyBase}${cleanPath}`, fetchOpts);
        if (proxyRes.ok || proxyRes.status === 400 || proxyRes.status === 429) {
          return proxyRes;
        }
      } catch (e) {
        // Proxy local temporairement indisponible, bascule directe
      }
    }

    // 2. Essai direct sur l'hôte officiel Suno API avec repli miroir
    try {
      const directRes = await fetch(`${DIRECT_ENGINE_BASE}${cleanPath}`, options);
      if (directRes.ok || directRes.status === 400 || directRes.status === 429) {
        return directRes;
      }
    } catch (e) {}

    return await fetch(`https://apibox.erweima.ai/api/v1${cleanPath}`, options);
  }

  // ================= VALIDATION DES IDENTIFIANTS MOTEUR IA =================
  // Les identifiants locaux (placeholders) ne doivent JAMAIS être transmis à l'API distante,
  // sinon celle-ci répond « 400 Record does not exist ».
  const LOCAL_ID_PREFIXES = ['task_', 'vid_', 'upload_', 'studio_', 'audio_', 'meta_', 'nz_', 'nz-', 'track_', 'temp_', 'local_'];
  function isValidEngineId(id) {
    if (!id || typeof id !== 'string') return false;
    const v = id.trim();
    if (v.length < 16) return false;
    const low = v.toLowerCase();
    if (LOCAL_ID_PREFIXES.some(p => low.startsWith(p))) return false;
    return /^[a-z0-9-]+$/i.test(v);
  }

  // ================= PAROLES SYNCHRONISÉES (WebVTT interne) =================
  function formatVttTime(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = (s % 60).toFixed(3).padStart(6, '0');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${r}`;
  }

  function buildLyricsVtt(alignedWords) {
    if (!Array.isArray(alignedWords) || alignedWords.length === 0) return '';
    const cues = [];
    let cur = null;
    const flush = () => {
      if (cur && cur.words.length) {
        const end = Math.max(cur.end, cur.start + 0.5);
        cues.push({ start: cur.start, end, text: cur.words.join(' ') });
      }
      cur = null;
    };
    for (const w of alignedWords) {
      if (!w || typeof w.startS !== 'number') continue;
      if (cur && (w.startS - cur.end) > 1.5) flush();
      const parts = String(w.word || '').replace(/\[[^\]]*\]/g, '').split('\n');
      parts.forEach((part, i) => {
        if (i > 0) flush();
        const t = part.trim();
        if (!t) return;
        if (!cur) cur = { start: w.startS, end: w.endS || w.startS, words: [] };
        cur.words.push(t);
        cur.end = w.endS || cur.end;
      });
      if (cur && cur.words.length >= 10) flush();
    }
    flush();
    if (!cues.length) return '';
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${formatVttTime(c.start)} --> ${formatVttTime(c.end)}\n${esc(c.text)}`).join('\n\n') + '\n';
  }

  // Normalisation MIME audio universelle (formats téléphone Android/iOS & PC)
  const AUDIO_EXT_MIME_MAP = {
    '.mp3': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.mpga': 'audio/mpeg',
    '.mp2': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.wave': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.m4b': 'audio/mp4',
    '.m4r': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.spx': 'audio/ogg',
    '.flac': 'audio/flac',
    '.webm': 'audio/webm',
    '.amr': 'audio/amr',
    '.3gp': 'audio/3gpp',
    '.3gpp': 'audio/3gpp',
    '.wma': 'audio/x-ms-wma',
    '.aiff': 'audio/aiff',
    '.aif': 'audio/aiff',
    '.caf': 'audio/x-caf',
    '.mp4': 'audio/mp4'
  };

  function resolveUploadMimeType(fileOrBlob, fileName = 'track.mp3') {
    const low = String(fileName || '').toLowerCase().trim();
    const rawType = (fileOrBlob && fileOrBlob.type) ? String(fileOrBlob.type).split(';')[0].trim().toLowerCase() : '';
    if (low.endsWith('.mp4') && rawType.startsWith('video/')) return 'audio/mp4';
    if (rawType === 'image/png' || low.endsWith('.png')) return 'image/png';
    if (rawType === 'image/jpeg' || rawType === 'image/jpg' || low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
    if (rawType === 'image/webp' || low.endsWith('.webp')) return 'image/webp';
    for (const [ext, mime] of Object.entries(AUDIO_EXT_MIME_MAP)) {
      if (low.endsWith(ext)) return mime;
    }
    if (rawType === 'audio/mpeg' || rawType === 'audio/mp3') return 'audio/mpeg';
    if (rawType === 'audio/wav' || rawType === 'audio/x-wav' || rawType === 'audio/wave') return 'audio/wav';
    if (rawType === 'audio/x-m4a' || rawType === 'audio/mp4' || rawType === 'audio/m4a') return 'audio/mp4';
    if (rawType === 'audio/aac' || rawType === 'audio/x-aac') return 'audio/aac';
    if (rawType === 'audio/ogg' || rawType === 'audio/opus' || rawType === 'application/ogg') return 'audio/ogg';
    if (rawType === 'audio/flac' || rawType === 'audio/x-flac') return 'audio/flac';
    if (rawType === 'audio/webm' || rawType === 'video/webm') return 'audio/webm';
    if (rawType === 'audio/amr' || rawType === 'audio/amr-wb') return 'audio/amr';
    if (rawType === 'audio/3gpp' || rawType === 'audio/3gpp2' || rawType === 'video/3gpp') return 'audio/3gpp';
    if (rawType.startsWith('audio/')) return rawType;
    return 'audio/mpeg';
  }

  function ensureAudioFileName(fileName, fileOrBlob) {
    let clean = String(fileName || (fileOrBlob && fileOrBlob.name) || 'audio_track').replace(/[^a-zA-Z0-9._-]/g, '_');
    const dotIdx = clean.lastIndexOf('.');
    const ext = dotIdx !== -1 ? clean.slice(dotIdx).toLowerCase() : '';
    if (ext && AUDIO_EXT_MIME_MAP[ext]) {
      return clean.slice(0, dotIdx) + ext;
    }
    const rawType = (fileOrBlob && fileOrBlob.type) ? String(fileOrBlob.type).split(';')[0].trim().toLowerCase() : '';
    const mimeToExt = {
      'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav',
      'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/m4a': '.m4a',
      'audio/aac': '.aac', 'audio/x-aac': '.aac',
      'audio/ogg': '.ogg', 'audio/opus': '.ogg', 'application/ogg': '.ogg',
      'audio/flac': '.flac', 'audio/x-flac': '.flac',
      'audio/webm': '.webm', 'video/webm': '.webm',
      'audio/3gpp': '.3gp', 'audio/amr': '.amr',
      'audio/mpeg': '.mp3', 'audio/mp3': '.mp3'
    };
    const inferredExt = mimeToExt[rawType] || '.mp3';
    return (clean || 'audio_track') + inferredExt;
  }

  // Encodage PCM 16-bit WAV compact depuis AudioBuffer (conversion universelle côté navigateur)
  function encodeAudioBufferToWavBlob(audioBuffer) {
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    const dataLength = samples.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataLength, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  async function transcodeAudioBlobToWav(fileOrBlob) {
    if (typeof window === 'undefined' || !fileOrBlob || typeof fileOrBlob.arrayBuffer !== 'function') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioCtx || !OfflineCtx) return null;
    let ctx = null;
    try {
      ctx = new AudioCtx();
      const rawBuf = await fileOrBlob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(rawBuf.slice(0));
      const maxDurSec = Math.min(decoded.duration || 0, 480);
      if (maxDurSec <= 0.1) return null;
      const targetRate = maxDurSec > 200 ? 16000 : 22050;
      const frameCount = Math.max(1, Math.ceil(maxDurSec * targetRate));
      const offline = new OfflineCtx(1, frameCount, targetRate);
      const src = offline.createBufferSource();
      src.buffer = decoded;
      src.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      return encodeAudioBufferToWavBlob(rendered);
    } catch (e) {
      console.warn('[Audio Normalize] Conversion WebAudio ignoree:', e.message);
      return null;
    } finally {
      if (ctx && typeof ctx.close === 'function') {
        try { await ctx.close(); } catch (e) {}
      }
    }
  }

  function getSavedAvatarForUser(userId) {
    if (typeof localStorage === 'undefined') return null;
    try {
      if (userId) {
        const scoped = localStorage.getItem(`nzembo_user_avatar_${userId}`);
        if (scoped) return scoped;
      }
      return localStorage.getItem('nzembo_user_avatar') || null;
    } catch (e) {
      return null;
    }
  }

  function saveLocalAvatarForUser(userId, avatarUrl) {
    if (typeof localStorage === 'undefined' || !avatarUrl) return;
    try {
      localStorage.setItem('nzembo_user_avatar', avatarUrl);
      if (userId) localStorage.setItem(`nzembo_user_avatar_${userId}`, avatarUrl);
    } catch (e) {}
  }

  // ================= SUPABASE STORAGE (BUCKET 'nzembo-media') =================
  async function uploadMediaToSupabase(fileOrBlob, fileName = 'track.mp3', folder = 'audio') {
    const sb = getSupabase();
    if (!sb) {
      console.warn('⚠️ [Supabase Storage] Client Supabase non prêt.');
      return null;
    }
    try {
      const safeName = (fileName || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;
      const contentType = resolveUploadMimeType(fileOrBlob, safeName);

      console.log(`📤 [Supabase Storage] Envoi vers '${STORAGE_BUCKET}/${uniquePath}' (${contentType})...`);

      const { data, error } = await sb.storage.from(STORAGE_BUCKET).upload(uniquePath, fileOrBlob, {
        contentType: contentType,
        upsert: true
      });

      if (error) {
        console.error('❌ [Supabase Storage] Erreur upload:', error.message);
        return null;
      }

      const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(uniquePath);
      const publicUrl = urlData ? urlData.publicUrl : null;
      console.log('✅ [Supabase Storage] Média disponible publiquement:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ [Supabase Storage] Exception:', err);
      return null;
    }
  }

  // Fonction pour persister automatiquement un média temporaire vers Supabase Storage
  async function persistMediaLocally(remoteUrl, category = 'audio', fileId = '') {
    if (!remoteUrl) return remoteUrl;
    // Si c'est déjà hébergé sur notre Supabase ou en chemin relatif, ne rien faire
    if (remoteUrl.includes('supabase.co/storage') || remoteUrl.startsWith('/') || remoteUrl.includes('/media/')) {
      return remoteUrl;
    }

    // Essayer de rapatrier et d'uploader vers Supabase Storage
    try {
      const sb = getSupabase();
      if (sb) {
        const timeoutMs = category === 'video' ? 35000 : 15000;
        const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(timeoutMs) });
        if (resp.ok) {
          const blob = await resp.blob();
          const ext = category === 'video' ? 'mp4' : (category === 'image' ? 'jpg' : 'mp3');
          const fileName = `${fileId || ('nz_media_' + Date.now())}.${ext}`;
          const uploadedUrl = await uploadMediaToSupabase(blob, fileName, category === 'video' ? 'videos' : (category === 'image' ? 'covers' : 'audio'));
          if (uploadedUrl) {
            console.log(`💾 [Supabase Storage] Média Nzembo sauvegardé durablement sur Supabase: ${uploadedUrl}`);
            return uploadedUrl;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Sauvegarde média vers Supabase non aboutie, conservation remoteUrl:', e.message);
    }

    // Relais proxy local si disponible
    try {
      const storageBase = getStorageBase();
      const res = await fetch(`${storageBase}/api/persist-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: remoteUrl, category, id: fileId }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.localUrl) {
          return `${storageBase}${data.localUrl}`;
        }
      }
    } catch (e) {}

    return remoteUrl;
  }

  // ================= GESTION DES SESSIONS UTILISATEUR =================
  function getPersistedCredits(userId, fallback = null) {
    try {
      if (typeof localStorage !== 'undefined') {
        if (userId) {
          const byUser = localStorage.getItem('nzembo_credits_' + userId);
          if (byUser !== null && byUser !== '' && !isNaN(Number(byUser))) {
            return Math.max(0, Number(byUser));
          }
        }
        const globalCreds = localStorage.getItem('nzembo_user_credits');
        if (globalCreds !== null && globalCreds !== '' && !isNaN(Number(globalCreds))) {
          return Math.max(0, Number(globalCreds));
        }
      }
    } catch (e) {}
    return fallback;
  }

  function savePersistedCredits(val, userId) {
    const clean = Math.max(0, Number(val) || 0);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nzembo_user_credits', String(clean));
        localStorage.setItem('nzembo_credits_updated_at', String(Date.now()));
        if (userId) {
          localStorage.setItem('nzembo_credits_' + userId, String(clean));
        }
      }
    } catch (e) {}
    return clean;
  }

  function getCurrentUser() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const persisted = getPersistedCredits(parsed.id, null);
            if (persisted !== null) {
              parsed.credits = persisted;
            }
            return parsed;
          }
        }
      }
    } catch (e) {}
    return null;
  }

  function setCurrentUser(user) {
    try {
      if (typeof localStorage !== 'undefined') {
        if (user) {
          if (user.credits !== undefined && user.credits !== null && !isNaN(Number(user.credits))) {
            user.credits = savePersistedCredits(user.credits, user.id);
          }
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          if (user.credits !== undefined && typeof window !== 'undefined' && window.NzemboStore && typeof window.NzemboStore.setUserCredits === 'function') {
            window.NzemboStore.setUserCredits(user.credits);
          }
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem('nzembo_demo_session');
          localStorage.removeItem('nzembo_user_credits');
          localStorage.removeItem('nzembo_credits_updated_at');
        }
      }
    } catch (e) {}
  }

  // ================= CRUD CRÉATIONS DANS SUPABASE POSTGRESQL =================
  // Sauvegarder ou mettre à jour une création dans la table public.creations
  async function saveCreation(creation) {
    if (!creation) return null;
    const sb = getSupabase();
    if (!sb) {
      console.warn('[Supabase Database] Client non disponible pour saveCreation');
      return creation;
    }

    const user = getCurrentUser();
    const creationId = String(creation.id || creation.taskId || ('nz_' + Date.now()));
    const isProcessing = (creation.isProcessing !== undefined) 
      ? Boolean(creation.isProcessing) 
      : (creation.status === 'IN_PROGRESS' || creation.status === 'en_cours' || creation.status === 'PENDING');

    const statusVal = creation.status 
      ? creation.status 
      : (isProcessing ? 'en_cours' : 'termine');

    const payload = {
      id: creationId,
      user_id: (user && user.id && user.id.includes('-')) ? user.id : null,
      task_id: creation.taskId || creationId,
      audio_id: creation.audioId || null,
      audio_id_2: creation.audioId2 || null,
      title: (creation.title || 'Création Nzembo').slice(0, 150),
      artist: (creation.artist || 'Nzembo Studio').slice(0, 100),
      style: (creation.style || '').slice(0, 200),
      tool_category: creation.toolCategory || 'generation',
      recipient: creation.recipient || null,
      occasion: creation.occasion || null,
      lyrics: creation.lyrics || null,
      prompt: creation.prompt || null,
      audio_url: creation.audioUrl || null,
      audio_url_2: creation.audioUrl2 || null,
      video_url: creation.videoUrl || null,
      vocal_url: creation.vocalUrl || null,
      instrumental_url: creation.instrumentalUrl || null,
      cover_url: creation.coverUrl || creation.albumCover || null,
      album_cover: creation.albumCover || creation.coverUrl || null,
      visualizer_style: creation.visualizerStyle || null,
      visualizer_style_label: creation.visualizerStyleLabel || null,
      status: statusVal,
      is_processing: isProcessing,
      metadata: creation.metadata || {}
    };

    try {
      const { data, error } = await sb.from('creations').upsert([payload], { onConflict: 'id' }).select();
      if (error) {
        console.warn('⚠️ [Supabase Database] Erreur sauvegarde création:', error.message);
      } else {
        console.log('💾 [Supabase Database] Création sauvegardée avec succès:', creationId);
      }
      return (data && data[0]) ? data[0] : payload;
    } catch (e) {
      console.warn('⚠️ [Supabase Database] Exception saveCreation:', e.message);
      return payload;
    }
  }

  // Mettre à jour une création existante par son ID ou taskId
  async function updateCreation(creationId, updates) {
    if (!creationId || !updates) return null;
    const sb = getSupabase();
    if (!sb) return null;

    const mapped = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.isProcessing !== undefined) mapped.is_processing = Boolean(updates.isProcessing);
    if (updates.audioUrl !== undefined) mapped.audio_url = updates.audioUrl;
    if (updates.audioUrl2 !== undefined) mapped.audio_url_2 = updates.audioUrl2;
    if (updates.videoUrl !== undefined) mapped.video_url = updates.videoUrl;
    if (updates.vocalUrl !== undefined) mapped.vocal_url = updates.vocalUrl;
    if (updates.instrumentalUrl !== undefined) mapped.instrumental_url = updates.instrumentalUrl;
    if (updates.coverUrl !== undefined) {
      mapped.cover_url = updates.coverUrl;
      mapped.album_cover = updates.coverUrl;
    }
    if (updates.albumCover !== undefined) {
      mapped.album_cover = updates.albumCover;
      mapped.cover_url = updates.albumCover;
    }
    if (updates.lyrics !== undefined) mapped.lyrics = updates.lyrics;
    if (updates.title !== undefined) mapped.title = updates.title;
    if (updates.artist !== undefined) mapped.artist = updates.artist;
    if (updates.audioId !== undefined) mapped.audio_id = updates.audioId;
    if (updates.audioId2 !== undefined) mapped.audio_id_2 = updates.audioId2;
    if (updates.taskId !== undefined) mapped.task_id = updates.taskId;
    if (updates.visualizerStyle !== undefined) mapped.visualizer_style = updates.visualizerStyle;
    if (updates.visualizerStyleLabel !== undefined) mapped.visualizer_style_label = updates.visualizerStyleLabel;
    if (updates.metadata !== undefined) mapped.metadata = updates.metadata;

    try {
      const { data, error } = await sb
        .from('creations')
        .update(mapped)
        .or(`id.eq.${creationId},task_id.eq.${creationId}`)
        .select();

      if (error) {
        console.warn('⚠️ [Supabase Database] Erreur updateCreation:', error.message);
      } else {
        console.log('🔄 [Supabase Database] Création mise à jour:', creationId);
      }
      return data;
    } catch (e) {
      console.warn('⚠️ [Supabase Database] Exception updateCreation:', e.message);
      return null;
    }
  }

  // Récupérer toutes les créations d'un utilisateur (ou créations publiques/locales)
  async function getUserCreations(userId) {
    const sb = getSupabase();
    if (!sb) return [];

    try {
      const activeUser = getCurrentUser();
      const effectiveUserId = (userId && typeof userId === 'string' && userId.includes('-')) 
        ? userId 
        : (activeUser && activeUser.id && String(activeUser.id).includes('-') ? activeUser.id : null);

      let rows = [];
      if (effectiveUserId) {
        const { data, error } = await sb
          .from('creations')
          .select('*')
          .or(`user_id.eq.${effectiveUserId},user_id.is.null`)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        }
      }

      // Repli automatique sans filtre restrictif sur user_id si la requête filtrée ne renvoie rien
      if (!rows || rows.length === 0) {
        const { data: allData, error: allErr } = await sb
          .from('creations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (allErr) {
          console.warn('⚠️ [Supabase Database] Erreur lecture créations:', allErr.message);
          return [];
        }
        rows = allData || [];
      }

      // Mapper les enregistrements Supabase vers le format objet JavaScript du frontend Nzembo
      return rows.map(row => {
        const meta = (row.metadata && typeof row.metadata === 'object') ? row.metadata : {};
        const resolvedVideoUrl = row.video_url || meta.videoUrl || meta.video_url || '';
        const resolvedAudioUrl = row.audio_url || meta.audioUrl || meta.audio_url || '';
        const resolvedCoverUrl = row.album_cover || row.cover_url || meta.coverUrl || meta.albumCover || '';
        const rawCat = String(row.tool_category || row.category || meta.toolCategory || (resolvedVideoUrl && !resolvedAudioUrl ? 'video' : 'generation')).toLowerCase().trim();
        return {
          id: row.id,
          taskId: row.task_id || row.id,
          audioId: row.audio_id || row.id,
          audioId2: row.audio_id_2 || '',
          title: row.title || 'Création Studio',
          artist: row.artist || 'Nzembo Studio',
          style: row.style || '',
          toolCategory: rawCat,
          category: rawCat,
          duration: (row.duration && !isNaN(row.duration)) ? Number(row.duration) : ((meta.duration && !isNaN(meta.duration)) ? Number(meta.duration) : null),
          recipient: row.recipient || '',
          occasion: row.occasion || '',
          lyrics: row.lyrics || meta.lyrics || '',
          prompt: row.prompt || meta.prompt || '',
          audioUrl: resolvedAudioUrl,
          audioUrl2: row.audio_url_2 || meta.audioUrl2 || '',
          videoUrl: resolvedVideoUrl,
          vocalUrl: row.vocal_url || meta.vocalUrl || '',
          instrumentalUrl: row.instrumental_url || meta.instrumentalUrl || '',
          albumCover: resolvedCoverUrl,
          coverUrl: resolvedCoverUrl,
          visualizerStyle: row.visualizer_style || meta.visualizerStyle || '',
          visualizerStyleLabel: row.visualizer_style_label || meta.visualizerStyleLabel || '',
          metadata: meta,
          lyricsVtt: meta.lyricsVtt || '',
          sourceTaskId: meta.sourceTaskId || '',
          sourceAudioId: meta.sourceAudioId || '',
          hasFailed: row.status === 'echoue',
          status: row.status || (row.is_processing ? 'en_cours' : 'termine'),
          isProcessing: Boolean(row.is_processing || row.status === 'en_cours' || row.status === 'IN_PROGRESS'),
          date: row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : 'Récemment',
          createdAt: row.created_at
        };
      });
    } catch (e) {
      console.warn('⚠️ [Supabase Database] Exception getUserCreations:', e.message);
      return [];
    }
  }

  // Supprimer définitivement une création
  async function deleteCreation(creationId) {
    if (!creationId) return false;
    const sb = getSupabase();
    if (!sb) return false;

    try {
      const { error } = await sb.from('creations').delete().or(`id.eq.${creationId},task_id.eq.${creationId}`);
      if (error) {
        console.warn('⚠️ [Supabase Database] Erreur deleteCreation:', error.message);
        return false;
      }
      console.log('🗑️ [Supabase Database] Création supprimée:', creationId);
      return true;
    } catch (e) {
      console.warn('⚠️ [Supabase Database] Exception deleteCreation:', e.message);
      return false;
    }
  }

  // ================= API PUBLIQUE NZEMBO BACKEND =================
  window.NzemboBackend = {
    // Exposer l'instance et la configuration Supabase
    supabaseUrl: SUPABASE_URL,
    storageBucket: STORAGE_BUCKET,
    getSupabase: getSupabase,

    // Utilitaires Moteur Audio IA
    isValidEngineId: isValidEngineId,
    isValidSunoId: isValidEngineId,
    sanitizeApiMessage: sanitizeApiErrorMessage,
    buildLyricsVtt: buildLyricsVtt,

    getUserCredits: async function() {
      const user = getCurrentUser();
      const sb = getSupabase();
      const uid = (user && user.id && String(user.id).includes('-')) ? user.id : null;
      const localPersisted = getPersistedCredits(uid, null);

      if (sb && uid) {
        try {
          const { data: profile } = await sb.from('profiles').select('credits').eq('id', uid).maybeSingle();
          if (profile && profile.credits !== undefined && profile.credits !== null) {
            const dbCredits = Math.max(0, Number(profile.credits) || 0);
            // Si une mise à jour locale a eu lieu mais que la DB renvoie encore l'ancien défaut 3, synchroniser la DB
            if (localPersisted !== null && localPersisted !== dbCredits && dbCredits === 3) {
              await sb.from('profiles').update({ credits: localPersisted }).eq('id', uid);
              return localPersisted;
            }
            const resolved = localPersisted !== null ? localPersisted : dbCredits;
            savePersistedCredits(resolved, uid);
            return resolved;
          }
        } catch (e) {}
      }
      if (localPersisted !== null) return localPersisted;
      if (user && user.credits !== undefined && !isNaN(Number(user.credits))) return Math.max(0, Number(user.credits));
      return 0;
    },

    setUserCredits: async function(newCredits) {
      const val = Math.max(0, Number(newCredits) || 0);
      const user = getCurrentUser();
      const uid = (user && user.id) ? user.id : null;
      savePersistedCredits(val, uid);

      if (user) {
        user.credits = val;
        setCurrentUser(user);
      }
      if (typeof window !== 'undefined') {
        window.userCredits = val;
        if (window.NzemboStore && typeof window.NzemboStore.setUserCredits === 'function') {
          try { window.NzemboStore.setUserCredits(val); } catch (e) {}
        }
        if (typeof window.updateCreditDisplays === 'function') {
          try { window.updateCreditDisplays(val); } catch (e) {}
        }
      }

      const sb = getSupabase();
      if (sb && uid && String(uid).includes('-')) {
        try {
          const { data: updData, error: updErr } = await sb
            .from('profiles')
            .update({ credits: val })
            .eq('id', uid)
            .select();
          if (updErr || !updData || updData.length === 0) {
            await sb.from('profiles').upsert([{
              id: uid,
              email: (user && user.email) || '',
              name: (user && user.name) || 'Artiste',
              credits: val
            }], { onConflict: 'id' });
          }
        } catch (e) {
          console.warn('⚠️ [Supabase Database] Erreur mise à jour crédits:', e.message);
        }
      }
      return val;
    },

    addCredits: async function(amount = 1) {
      const added = Math.max(0, Number(amount) || 0);
      const user = getCurrentUser();
      const uid = (user && user.id) ? user.id : null;
      let currentCredits = getPersistedCredits(uid, null);
      if (currentCredits === null) {
        if (user && user.credits != null && !isNaN(Number(user.credits))) {
          currentCredits = Number(user.credits);
        } else if (typeof window !== 'undefined' && window.userCredits != null && !isNaN(Number(window.userCredits))) {
          currentCredits = Number(window.userCredits);
        } else {
          currentCredits = 0;
        }
      }
      const newCredits = Math.max(0, currentCredits + added);
      return await this.setUserCredits(newCredits);
    },

    deductCredits: async function(amount = 1, reason = 'Action') {
      const cost = Math.max(0, Number(amount) || 1);
      const user = getCurrentUser();
      const uid = (user && user.id) ? user.id : null;
      let currentCredits = getPersistedCredits(uid, null);
      if (currentCredits === null) {
        if (user && user.credits != null && !isNaN(Number(user.credits))) {
          currentCredits = Number(user.credits);
        } else if (typeof window !== 'undefined' && window.userCredits != null && !isNaN(Number(window.userCredits))) {
          currentCredits = Number(window.userCredits);
        } else {
          currentCredits = 0;
        }
      }
      const newCredits = Math.max(0, currentCredits - cost);
      await this.setUserCredits(newCredits);
      return newCredits;
    },

    // CRUD Créations
    saveCreation: saveCreation,
    updateCreation: updateCreation,
    getUserCreations: getUserCreations,
    getUserSongs: getUserCreations, // Rétrocompatibilité nom historique
    deleteCreation: deleteCreation,

    // Storage Supabase
    uploadMediaToSupabase: uploadMediaToSupabase,

    // 1. Authentification Native Supabase (Email / Password & Google OAuth)
    signInWithGoogle: async function() {
      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');
      const redirectUrl = (typeof window !== 'undefined' && window.location) 
        ? (window.location.origin + window.location.pathname) 
        : 'https://app.nzembo.com';

      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) {
        throw new Error(sanitizeApiErrorMessage(error.message, 'Connexion avec Google impossible, réessaie.'));
      }
      return data;
    },

    login: async function(email, password) {
      email = (email || '').trim().toLowerCase();
      password = (password || '').trim();
      if (!email) throw new Error('Veuillez renseigner votre email.');
      if (!password) throw new Error('Veuillez renseigner votre mot de passe.');

      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');

      const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        if (/Email not confirmed/i.test(error.message)) {
          const unconfErr = new Error("Confirme d'abord ton compte avec le lien reçu par email.");
          unconfErr.isUnconfirmedEmail = true;
          unconfErr.email = email;
          throw unconfErr;
        }
        if (/Invalid login credentials/i.test(error.message)) {
          throw new Error('Email ou mot de passe incorrect.');
        }
        throw new Error(sanitizeApiErrorMessage(error.message, 'Email ou mot de passe incorrect.'));
      }

      const authUser = data.user;
      if (!authUser) throw new Error('Connexion impossible, réessaie.');

      let profile = null;
      try {
        const { data: pData } = await sb.from('profiles').select('*').eq('id', authUser.id).single();
        profile = pData;
      } catch (pe) {}

      const persistedLoginCredits = getPersistedCredits(authUser.id, null);
      const dbLoginCredits = (profile && profile.credits !== undefined && profile.credits !== null) ? Number(profile.credits) : 0;
      const resolvedLoginCredits = (persistedLoginCredits !== null && (dbLoginCredits === 3 || !profile))
        ? persistedLoginCredits
        : dbLoginCredits;
      savePersistedCredits(resolvedLoginCredits, authUser.id);

      const user = {
        id: authUser.id,
        email: authUser.email,
        name: (profile && profile.name) ? profile.name : (authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0]),
        credits: resolvedLoginCredits,
        referral_code: (profile && profile.referral_code) ? profile.referral_code : (authUser.user_metadata?.referral_code || 'NZ-' + authUser.id.substring(0, 5).toUpperCase())
      };

      setCurrentUser(user);
      return user;
    },

    register: async function(name, email, password, referralCodeUsed = '') {
      name = (name || '').trim();
      email = (email || '').trim().toLowerCase();
      password = (password || '').trim();

      if (!name) throw new Error('Veuillez renseigner votre nom complet.');
      if (!email || !email.includes('@')) throw new Error('Veuillez renseigner un email valide.');
      if (!password || password.length < 6) throw new Error('Le mot de passe doit comporter au moins 6 caractères.');

      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');

      const generatedRefCode = 'NZ-' + Math.floor(10000 + Math.random() * 90000);
      const redirectUrl = (typeof window !== 'undefined' && window.location)
        ? (window.location.origin + window.location.pathname + '#confirmed')
        : 'https://app.nzembo.com/#confirmed';

      const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            full_name: name,
            referral_code: generatedRefCode,
            referral_code_used: referralCodeUsed || null
          }
        }
      });

      if (error) {
        if (/User already registered/i.test(error.message)) {
          throw new Error('Un compte existe déjà avec cette adresse email. Connecte-toi.');
        }
        throw new Error(sanitizeApiErrorMessage(error.message, 'Création de compte impossible pour le moment, réessaie.'));
      }

      const authUser = data.user;
      if (!authUser) throw new Error('Échec de la création du compte.');

      // Si confirmation d'email requise (pas de session active immédiate)
      const needsConfirmation = !data.session || !authUser.confirmed_at;

      let profile = null;
      try {
        const { data: pData } = await sb.from('profiles').select('*').eq('id', authUser.id).single();
        profile = pData;
        if (!profile) {
          const { data: insData } = await sb.from('profiles').insert([{
            id: authUser.id,
            email: authUser.email,
            name: name,
            credits: 3,
            referral_code: generatedRefCode
          }]).select().single();
          profile = insData;
        }
      } catch (pe) {}

      const user = {
        id: authUser.id,
        email: authUser.email,
        name: name,
        credits: (profile && profile.credits !== undefined && profile.credits !== null) ? Number(profile.credits) : 0,
        referral_code: (profile && profile.referral_code) ? profile.referral_code : generatedRefCode,
        needsConfirmation: needsConfirmation
      };

      if (!needsConfirmation) {
        setCurrentUser(user);
      }
      return user;
    },

    resendConfirmationEmail: async function(email) {
      email = (email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) throw new Error('Veuillez renseigner un email valide.');
      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');

      const redirectUrl = (typeof window !== 'undefined' && window.location)
        ? (window.location.origin + window.location.pathname + '#confirmed')
        : 'https://app.nzembo.com/#confirmed';

      const { error } = await sb.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) {
        if (/security purposes|rate limit/i.test(error.message)) {
          throw new Error('Trop de tentatives, réessaie dans quelques minutes.');
        }
        throw new Error("Impossible d'envoyer l'email pour le moment, réessaie.");
      }
      return { success: true };
    },

    requestPasswordReset: async function(email) {
      email = (email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) throw new Error('Veuillez renseigner un email valide.');
      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');

      const redirectUrl = (typeof window !== 'undefined' && window.location)
        ? (window.location.origin + window.location.pathname + '#reset-password')
        : 'https://app.nzembo.com/#reset-password';

      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) {
        if (/security purposes|rate limit/i.test(error.message)) {
          throw new Error('Trop de tentatives, réessaie dans quelques minutes.');
        }
      }
      return { success: true };
    },

    updateUserPassword: async function(newPassword) {
      newPassword = (newPassword || '').trim();
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
      }
      const sb = getSupabase();
      if (!sb) throw new Error('Connexion impossible, réessaie.');

      const { data, error } = await sb.auth.updateUser({
        password: newPassword
      });
      if (error) {
        if (/same password/i.test(error.message)) {
          throw new Error('Choisis un mot de passe différent du précédent.');
        }
        throw new Error(sanitizeApiErrorMessage(error.message, 'Impossible de mettre à jour le mot de passe, réessaie.'));
      }
      if (data && data.user) {
        await this.refreshUserData();
      }
      return { success: true };
    },

    handleAuthSessionExchange: async function() {
      const sb = getSupabase();
      if (!sb || typeof window === 'undefined') return null;

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashStr = window.location.hash || '';

        // Erreur OAuth dans l'URL
        if (searchParams.get('error') || hashStr.includes('error=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
          return { error: 'Connexion annulée ou non autorisée.' };
        }

        // Code PKCE
        const code = searchParams.get('code');
        if (code && typeof sb.auth.exchangeCodeForSession === 'function') {
          const { data, error } = await sb.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, document.title, window.location.pathname);
          if (!error && data && data.user) {
            return await this.refreshUserData();
          }
        }

        // Token Hash
        if (hashStr.includes('access_token=') || hashStr.includes('refresh_token=')) {
          const { data: sessData } = await sb.auth.getSession();
          if (sessData && sessData.session && sessData.session.user) {
            window.history.replaceState({}, document.title, window.location.pathname);
            return await this.refreshUserData();
          }
        }
      } catch (e) {
        console.warn('Session exchange notice:', e);
      }
      return null;
    },

    logout: async function() {
      const sb = getSupabase();
      if (sb) {
        try { await sb.auth.signOut(); } catch (e) {}
      }
      setCurrentUser(null);
    },

    getCurrentUser: getCurrentUser,

    refreshUserData: async function() {
      const sb = getSupabase();
      if (!sb) return getCurrentUser();

      try {
        let current = getCurrentUser();
        let authUser = null;
        if (!current) {
          const { data: uData } = await sb.auth.getUser();
          if (uData && uData.user) {
            authUser = uData.user;
          }
        } else {
          // Vérifier aussi avec getUser pour récupérer les métadonnées fraîches de Google OAuth
          try {
            const { data: uData } = await sb.auth.getUser();
            if (uData && uData.user) authUser = uData.user;
          } catch (e) {}
        }

        const userId = current ? current.id : (authUser ? authUser.id : null);
        if (!userId) return null;

        let { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
        const localPersisted = getPersistedCredits(userId, null);
        if (!profile && authUser) {
          const generatedRef = 'NZ-' + Math.floor(10000 + Math.random() * 90000);
          const userName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || (authUser.email ? authUser.email.split('@')[0] : 'Artiste');
          const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
          const initialCredits = localPersisted !== null ? localPersisted : 0;
          const { data: insData } = await sb.from('profiles').insert([{
            id: authUser.id,
            email: authUser.email,
            name: userName,
            avatar_url: avatarUrl,
            credits: initialCredits,
            referral_code: generatedRef
          }]).select().single();
          profile = insData;
        }

        if (profile) {
          const googleName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
          const googleGivenName = authUser?.user_metadata?.given_name;
          const savedLocalAvatar = getSavedAvatarForUser(userId);
          const avatarUrl = savedLocalAvatar || profile.avatar_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null;
          const resolvedName = profile.name || googleName || (current ? current.name : 'Artiste');

          let firstName = '';
          if (profile.first_name) {
            firstName = profile.first_name;
          } else if (googleGivenName) {
            firstName = googleGivenName;
          } else if (resolvedName) {
            const parts = resolvedName.trim().split(/\s+/);
            if (parts.length > 0 && parts[0].length >= 2) firstName = parts[0];
          } else if (authUser?.email) {
            firstName = authUser.email.split('@')[0];
          }

          if (firstName) {
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          }

          const dbCredits = (profile.credits !== undefined && profile.credits !== null) ? Number(profile.credits) : 0;
          let resolvedCredits = dbCredits;
          // Si le solde a été modifié par achat/consommation mais que la DB renvoie encore le défaut 3 (ex: RLS), conserver le vrai solde et resynchroniser
          if (localPersisted !== null && localPersisted !== dbCredits) {
            resolvedCredits = localPersisted;
          }
          savePersistedCredits(resolvedCredits, userId);

          if (profile && ((!profile.first_name && firstName) || (!profile.avatar_url && avatarUrl) || (resolvedCredits !== dbCredits))) {
            const updates = {};
            if (!profile.first_name && firstName) updates.first_name = firstName;
            if (!profile.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;
            if (resolvedCredits !== dbCredits) updates.credits = resolvedCredits;
            sb.from('profiles').update(updates).eq('id', userId).then(() => {}).catch(() => {});
          }

          const fresh = {
            id: userId,
            email: profile.email || (authUser ? authUser.email : (current ? current.email : '')),
            name: resolvedName,
            first_name: firstName,
            avatar_url: avatarUrl,
            credits: resolvedCredits,
            referral_code: profile.referral_code || 'NZ-00000'
          };
          setCurrentUser(fresh);
          return fresh;
        }
        if (current) {
          if (localPersisted !== null) {
            current.credits = localPersisted;
            setCurrentUser(current);
          }
          return current;
        }
      } catch (e) {
        console.warn('Rafraîchissement profil:', e.message);
      }
      return getCurrentUser();
    },

    // Consultation des crédits moteur audio restants
    getEngineCredits: async function() {
      try {
        const res = await fetchAudioEngine('/generate/credit', { method: 'GET' });
        const data = await res.json();
        return data && typeof data.data === 'number' ? data.data : 0;
      } catch (e) {
        return 0;
      }
    },

    // 2. Génération Musicale Réelle avec le moteur audio IA Nzembo
    generateMusic: async function({ prompt, style, occasion, recipient, relationship = '', language = '', secondaryLanguage = '', lyrics, isInstrumental = false, make_instrumental, instrumental, gender = 'female', title = '', styleConfig = null, tags = '', custom_mode, customMode, count = 1, personaId = '', personaModel = 'voice_persona' }) {
      const user = getCurrentUser();

      const isInstru = Boolean(isInstrumental || make_instrumental || instrumental);

      let resolvedStyleConfig = styleConfig;
      if (!resolvedStyleConfig && typeof window !== 'undefined' && typeof window.getMusicStyleConfig === 'function') {
        resolvedStyleConfig = window.getMusicStyleConfig(style);
      }
      if (!resolvedStyleConfig && typeof MUSIC_STYLES_DICTIONARY !== 'undefined') {
        resolvedStyleConfig = MUSIC_STYLES_DICTIONARY[style] || MUSIC_STYLES_DICTIONARY["rumba_congolaise"];
      }

      const styleDisplayName = resolvedStyleConfig ? resolvedStyleConfig.name : (style || 'Rumba congolaise');
      const songTitle = (title || (recipient ? `Pour ${recipient} (${styleDisplayName})` : `${occasion || 'Chanson'} (${styleDisplayName})`)).slice(0, 80);

      let engineStyle = tags || (resolvedStyleConfig ? (resolvedStyleConfig.sunoStylePrompt || resolvedStyleConfig.mandatoryTags) : styleDisplayName);
      if (!isInstru && language) {
        const isBilingual = Boolean(secondaryLanguage && secondaryLanguage.toLowerCase() !== language.toLowerCase());
        const langHeader = isBilingual
          ? `${language} and ${secondaryLanguage} bilingual vocals, sing in ${language} and ${secondaryLanguage}`
          : `100% ${language} vocals only, strictly sing in ${language}`;
        if (!engineStyle.toLowerCase().includes(language.toLowerCase()) || !engineStyle.toLowerCase().includes('sing in')) {
          engineStyle = langHeader + ', ' + engineStyle;
        }
      }
      if (!isInstru && !personaId) {
        let genderTag = '';
        const gLower = String(gender || '').toLowerCase();
        if (gLower === 'male' || gLower.includes('masculin') || gLower.includes('homme') || gLower === 'm') {
          genderTag = 'male vocals, solo male singer, masculine tone';
        } else if (gLower === 'female' || gLower.includes('feminin') || gLower.includes('féminin') || gLower.includes('femme') || gLower === 'f') {
          genderTag = 'female vocals, solo female singer, feminine tone';
        } else if (gLower.includes('duo') || gLower.includes('duet')) {
          genderTag = 'male and female duet vocals, vocal harmony';
        } else if (gLower.includes('choeur') || gLower.includes('chœur') || gLower.includes('gospel')) {
          genderTag = 'gospel choir vocals, vocal ensemble';
        }

        if (genderTag && !engineStyle.toLowerCase().includes('male vocal') && !engineStyle.toLowerCase().includes('female vocal') && !engineStyle.toLowerCase().includes('duet') && !engineStyle.toLowerCase().includes('choir')) {
          engineStyle = genderTag + ', ' + engineStyle;
        }
      } else if (personaId && !engineStyle.toLowerCase().includes('persona')) {
        engineStyle += ', custom vocal persona';
      }

      const hasCustomLyrics = Boolean(!isInstru && lyrics && lyrics.trim().length > 0);
      const isCustomMode = (custom_mode !== undefined) ? Boolean(custom_mode) : ((customMode !== undefined) ? Boolean(customMode) : (hasCustomLyrics || isInstru));

      let lyricPrompt = '';
      if (isInstru) {
        lyricPrompt = '';
      } else if (hasCustomLyrics) {
        const rawLyr = lyrics.trim();
        const isBilingual = Boolean(secondaryLanguage && secondaryLanguage.toLowerCase() !== language.toLowerCase());
        const langTag = language
          ? (isBilingual ? `[Language: ${language} & ${secondaryLanguage} Bilingual]\n` : `[Language: ${language} ONLY (100% Monolingual)]\n`)
          : '';
        lyricPrompt = (rawLyr.startsWith('[Language:') ? rawLyr : (langTag + rawLyr)).slice(0, 5000);
      } else {
        const langNote = language
          ? (secondaryLanguage ? ` chantée en ${language} et ${secondaryLanguage}` : ` chantée exclusivement en ${language}`)
          : '';
        const recNote = recipient ? ` dédiée à ${recipient}` : '';
        lyricPrompt = (prompt || `Chanson ${styleDisplayName}${langNote} pleine d'émotion pour l'occasion ${occasion || 'fête'}${recNote}`).slice(0, 2900);
      }

      console.log('🎵 [Nzembo Audio] Envoi de la requête de composition musicale...');
      console.log('📝 Mode:', isCustomMode ? 'Custom Mode (Lyrics)' : 'Description Mode', '| Titre:', songTitle);

      const payload = {
        customMode: isCustomMode,
        style: engineStyle.slice(0, 1000),
        instrumental: isInstru,
        model: 'V6',
        count: 1, // Restitution stricte d'1 seule version unique par tâche
        callBackUrl: WEBHOOK_NOOP_URL
      };

      if (personaId) {
        payload.personaId = personaId;
        payload.personaModel = personaModel || 'voice_persona';
      }

      if (!isInstru && !personaId) {
        const gLower = String(gender || '').toLowerCase();
        if (gLower === 'male' || gLower.includes('masculin') || gLower.includes('homme') || gLower === 'm') {
          payload.vocalGender = 'm';
        } else if (gLower === 'female' || gLower.includes('feminin') || gLower.includes('féminin') || gLower.includes('femme') || gLower === 'f') {
          payload.vocalGender = 'f';
        }
      }

      if (isCustomMode) {
        payload.title = songTitle;
        if (hasCustomLyrics) {
          payload.lyrics = lyricPrompt;
          payload.prompt = lyricPrompt;
        } else if (lyricPrompt) {
          payload.prompt = lyricPrompt;
        }
      } else {
        payload.prompt = lyricPrompt;
        if (hasCustomLyrics) payload.lyrics = lyricPrompt;
      }

      const res = await fetchAudioEngine('/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.code !== 200 || !data.data || !data.data.taskId) {
        const errorMsg = sanitizeApiErrorMessage(data.msg || data.message, `Erreur serveur audio (Code ${data.code || res.status})`);
        console.error('❌ [Nzembo Audio] Échec de la requête:', data);
        if (data.code === 429) {
          throw new Error('Les crédits de génération audio sont temporairement épuisés. Veuillez recharger votre solde.');
        }
        throw new Error(errorMsg);
      }

      const taskId = data.data.taskId;
      const songId = 'nz_' + Date.now();
      console.log('✅ [Nzembo Audio] Tâche acceptée avec succès! Task ID:', taskId);

      // ── SAUVEGARDE IMMÉDIATE DANS SUPABASE POSTGRESQL AVEC STATUT 'en_cours' ──
      await saveCreation({
        id: songId,
        taskId: taskId,
        title: songTitle,
        prompt: lyricPrompt,
        lyrics: lyricPrompt,
        style: styleDisplayName,
        occasion: occasion,
        recipient: recipient,
        toolCategory: 'generation',
        status: 'en_cours',
        isProcessing: true
      }).catch(e => console.warn('Sauvegarde création initiale:', e.message));

      // Décrémenter les crédits de l'utilisateur et synchroniser partout
      if (user && user.credits > 0) {
        const nextCredits = Math.max(0, Number(user.credits) - 1);
        await this.setUserCredits(nextCredits);
      }

      return {
        songId,
        taskId,
        eta: 120,
        title: songTitle,
        lyrics: lyricPrompt,
        styleConfig: resolvedStyleConfig
      };
    },

    // 3. Polling du statut de la génération musicale (/generate/record-info) avec dédoublonnage anti-boucle
    pollMusicStatus: function(taskId) {
      if (!taskId) return Promise.resolve({ completed: false, status: 'IN_PROGRESS' });
      const cache = this._musicPollCache || (this._musicPollCache = {});
      if (cache[taskId] && cache[taskId].done) return Promise.resolve(cache[taskId].done);
      if (cache[taskId] && cache[taskId].inFlight) return cache[taskId].inFlight;

      const run = (async () => {
        try {
          const res = await fetchAudioEngine(`/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
            method: 'GET'
          });

          const data = await res.json().catch(() => ({}));
          if (!data || !data.data) {
            return { completed: false, status: 'IN_PROGRESS' };
          }

          const taskData = data.data;
          const status = taskData.status || '';

          const hasReadyTrack = taskData.response && Array.isArray(taskData.response.sunoData) && taskData.response.sunoData.length > 0 && Boolean(taskData.response.sunoData[0].audio_url || taskData.response.sunoData[0].stream_audio_url);

          // Tâche terminée avec succès (Restitution stricte d'1 seule version unique dès FIRST_SUCCESS ou SUCCESS)
          if ((status === 'SUCCESS' || (status === 'FIRST_SUCCESS' && hasReadyTrack)) && hasReadyTrack) {
            const tracks = taskData.response.sunoData;
            const track1 = tracks[0] || {};

            // Sauvegarde unique du média audio et de la pochette vers Supabase Storage
            const audio1 = await persistMediaLocally(track1.audio_url || track1.stream_audio_url, 'audio', track1.id || `${taskId}_1`);
            const albumCover = await persistMediaLocally(track1.image_url || track1.source_image_url, 'image', `${taskId}_cover`);

            // ── MISE À JOUR DANS SUPABASE POSTGRESQL (1 SEULE VERSION UNIQUE) ──
            await updateCreation(taskId, {
              status: 'termine',
              isProcessing: false,
              audioUrl: audio1,
              audioUrl2: null,
              albumCover: albumCover,
              title: track1.title,
              lyrics: track1.prompt,
              audioId: track1.id,
              audioId2: null
            }).catch(e => console.warn('Mise à jour création terminée:', e.message));

            const doneResult = {
              completed: true,
              status: 'COMPLETED',
              title: track1.title,
              audioUrl: audio1,
              audioUrl2: null,
              albumCover: albumCover,
              lyrics: track1.prompt,
              duration: track1.duration,
              audioId: track1.id,
              audioId2: null
            };
            cache[taskId] = { done: doneResult };
            return doneResult;
          }

          if (status === 'GENERATE_AUDIO_FAILED' || status === 'CREATE_TASK_FAILED' || status === 'FAILED' || status === 'ERROR') {
            await updateCreation(taskId, {
              status: 'echoue',
              isProcessing: false
            }).catch(() => {});

            const failResult = {
              completed: false,
              failed: true,
              status: 'FAILED',
              message: sanitizeApiErrorMessage(taskData.errorMessage, 'La composition musicale a échoué côté serveur.')
            };
            cache[taskId] = { done: failResult };
            return failResult;
          }

          return {
            completed: false,
            status: status || 'IN_PROGRESS'
          };
        } catch (pollErr) {
          return { completed: false, status: 'IN_PROGRESS', error: sanitizeApiErrorMessage(pollErr.message) };
        } finally {
          if (cache[taskId]) cache[taskId].inFlight = null;
        }
      })();

      cache[taskId] = Object.assign(cache[taskId] || {}, { inFlight: run });
      return run;
    },

    // 3.bis Transformation de style & Reprise / Cover (/generate/upload-cover)
    // Conforme aux spécifications officielles : modèle V6, uploadUrl OU (taskId + audioId) mutuellement exclusifs
    uploadAndCoverAudio: async function({ uploadUrl, taskId, audioId, prompt, lyrics, style, title, instrumental = false, vocalGender, audioWeight, model = 'V6' }) {
      const isInstru = Boolean(instrumental);
      const payload = {
        model: model || 'V6',
        callBackUrl: WEBHOOK_NOOP_URL,
        instrumental: isInstru
      };

      const hasHttpUpload = Boolean(uploadUrl && /^https?:\/\//i.test(uploadUrl));
      const validIds = Boolean(isValidEngineId(taskId) && isValidEngineId(audioId));
      if (hasHttpUpload) {
        payload.uploadUrl = uploadUrl;
      } else if (validIds) {
        payload.taskId = taskId;
        payload.audioId = audioId;
      } else {
        throw new Error('Source audio invalide. Veuillez importer un fichier audio valide ou sélectionner une chanson générée.');
      }

      const rawStyle = String(style || '').trim();
      const preserveOriginalStyle = !rawStyle || rawStyle === 'Par défaut' || rawStyle.toLowerCase().startsWith('par défaut');
      if (!preserveOriginalStyle) {
        payload.customMode = true;
        payload.style = rawStyle.slice(0, 1000);
        payload.title = (title && String(title).trim())
          ? String(title).trim().slice(0, 80)
          : 'Reprise Studio Nzembo';
        if (typeof audioWeight === 'number') {
          payload.audioWeight = Math.min(1, Math.max(0, Number(audioWeight)));
        }
        if (!isInstru) {
          const cleanLyrics = String(lyrics || prompt || title || rawStyle).trim();
          if (cleanLyrics) {
            payload.prompt = cleanLyrics.slice(0, 5000);
          }
          if (vocalGender === 'm' || vocalGender === 'f') {
            payload.vocalGender = vocalGender;
          }
        }
      } else {
        payload.customMode = false;
        payload.audioWeight = typeof audioWeight === 'number'
          ? Math.min(1, Math.max(0, Number(audioWeight)))
          : 0.72;
        const cleanSimplePrompt = String(prompt || lyrics || title || 'Fidèle reprise musicale conservant le style et l\'identité sonore d\'origine').trim();
        payload.prompt = cleanSimplePrompt.slice(0, 500);
        if (!isInstru && (vocalGender === 'm' || vocalGender === 'f')) {
          payload.vocalGender = vocalGender;
        }
      }

      console.log('🚀 [Nzembo Audio] Envoi upload-cover:', payload);
      const res = await fetchAudioEngine('/generate/upload-cover', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Erreur lors du lancement de la reprise / remix'));
    },

    // 3.ter Ajout de voix sur un instrumental (/generate/add-vocals)
    addVocalsToAudio: async function({ uploadUrl, title, style, lyrics, prompt, vocalGender, negativeTags, model = 'V6' }) {
      if (!uploadUrl || !/^https?:\/\//i.test(uploadUrl)) {
        throw new Error('Veuillez fournir un fichier instrumental accessible pour poser une voix.');
      }
      const targetStyle = (style || 'Afrobeat, Rumba').slice(0, 1000);
      const payload = {
        uploadUrl: uploadUrl,
        callBackUrl: WEBHOOK_NOOP_URL,
        title: (title || 'Chant Studio sur Instrumental').slice(0, 80),
        negativeTags: (negativeTags || 'Heavy Metal, Aggressive Screaming Vocals').slice(0, 1000),
        style: targetStyle,
        model: model || 'V6'
      };
      if (vocalGender === 'm' || vocalGender === 'f') {
        payload.vocalGender = vocalGender;
      }
      if (lyrics && String(lyrics).trim()) payload.lyrics = String(lyrics).trim().slice(0, 5000);
      if (prompt && String(prompt).trim()) payload.prompt = String(prompt).trim().slice(0, 5000);

      console.log('🚀 [Nzembo Audio] Envoi add-vocals:', payload);
      const res = await fetchAudioEngine('/generate/add-vocals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Erreur lors de l\'ajout de voix sur l\'instrumentale'));
    },

    // 3.quater Ajout d'accompagnement instrumental sur une voix (/generate/add-instrumental)
    // Conforme aux spécifications officielles : required uploadUrl, title, negativeTags, tags, callBackUrl (+ model V6)
    addInstrumentalToAudio: async function({ uploadUrl, title, tags, style, negativeTags, lyrics, vocalGender, model = 'V6' }) {
      if (!uploadUrl || !/^https?:\/\//i.test(uploadUrl)) {
        throw new Error('Veuillez fournir ou téléverser une piste vocale valide pour composer l\'instrumental.');
      }
      const targetTags = (tags || style || 'Acoustic Guitar, Warm Bass, Rumba Congolaise, Soft Percussion').slice(0, 1000);
      const payload = {
        uploadUrl: uploadUrl,
        title: (title || 'Arrangement Instrumental Studio').slice(0, 80),
        tags: targetTags,
        negativeTags: (negativeTags || 'Distortion, Harsh Noise, Clipping, Low Quality, Out of tune').slice(0, 1000),
        callBackUrl: WEBHOOK_NOOP_URL,
        model: model || 'V6'
      };
      if (lyrics && String(lyrics).trim()) payload.lyrics = String(lyrics).trim().slice(0, 5000);
      if (vocalGender === 'm' || vocalGender === 'f') payload.vocalGender = vocalGender;

      console.log('🚀 [Nzembo Audio] Envoi add-instrumental:', payload);
      const res = await fetchAudioEngine('/generate/add-instrumental', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Erreur lors de la génération de l\'arrangement instrumental'));
    },

    // 4. Génération de Paroles autonomes (/api/v1/lyrics - limite stricte 200 caractères)
    generateLyrics: async function(input, languageOverride = '') {
      let condensedPrompt = '';
      if (input && typeof input === 'object') {
        const lang = String(input.language || languageOverride || '').trim();
        const secLang = String(input.secondaryLanguage || '').trim();
        const isBilingual = Boolean(secLang && secLang.toLowerCase() !== lang.toLowerCase());
        const style = String(input.style || '').trim();
        const occasion = String(input.occasion || '').trim();
        const recipient = String(input.recipient || '').trim();
        const tone = String(input.tone || '').trim();
        const rawStory = String(input.story || input.theme || input.prompt || '').replace(/\s+/g, ' ').trim();

        const langDir = lang
          ? (isBilingual
              ? `Écris en mélange bilingue ${lang}+${secLang}.`
              : `Écris toutes les paroles en ${lang}, sans mélange.`)
          : '';
        const occPart = occasion ? ` ${occasion}.` : '';
        const stylePart = style ? ` Style: ${style}.` : '';
        const tonePart = tone ? ` Ton: ${tone}.` : '';
        const recPart = recipient ? ` Pour: ${recipient}.` : '';
        const structRule = ` Structure: couplet, refrain, pont.`;
        const hasStory = Boolean(rawStory && rawStory.length >= 10);
        const storyIntro = hasStory ? ` Histoire vraie: ` : ` Thème: `;
        const storyContent = hasStory ? rawStory : (rawStory || `Célébration ${occasion || 'joyeuse'}`);

        const prefix = `${langDir}${occPart}${stylePart}${tonePart}${recPart}${structRule}${storyIntro}`.trim();
        const remain = Math.max(20, 198 - prefix.length);
        const clippedTheme = storyContent.length > remain ? storyContent.slice(0, remain).replace(/\s+\S*$/, '') : storyContent;
        condensedPrompt = `${prefix} ${clippedTheme}`.replace(/\s+/g, ' ').trim();
      } else {
        const lang = String(languageOverride || '').trim();
        const raw = String(input || 'Chanson joyeuse pleine d\'émotion').replace(/\s+/g, ' ').trim();
        condensedPrompt = lang
          ? `Écris toutes les paroles en ${lang}, sans mélange: ${raw}`.replace(/\s+/g, ' ').trim()
          : raw;
      }

      if (condensedPrompt.length > 200) {
        condensedPrompt = condensedPrompt.slice(0, 200).replace(/\s+\S*$/, '') || condensedPrompt.slice(0, 200);
      }

      const payload = {
        prompt: condensedPrompt,
        callBackUrl: WEBHOOK_NOOP_URL
      };

      console.log('✍️ [Nzembo Lyrics] Prompt <= 200 chars:', payload.prompt);
      const res = await fetchAudioEngine('/lyrics', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Erreur lors du lancement de la génération de paroles'));
    },

    pollLyricsStatus: async function(taskId) {
      try {
        const res = await fetchAudioEngine(`/lyrics/record-info?taskId=${encodeURIComponent(taskId)}`, {
          method: 'GET'
        });
        const data = await res.json().catch(() => ({}));
        if (!data || !data.data) {
          return { completed: false, status: 'IN_PROGRESS' };
        }
        const st = data.data.status;
        if (st === 'SUCCESS') {
          let text = '';
          let title = 'Paroles IA';
          const resp = data.data.response;
          if (resp) {
            if (Array.isArray(resp.data) && resp.data.length > 0) {
              text = resp.data[0].text || '';
              title = resp.data[0].title || title;
            } else if (resp.text) {
              text = resp.text;
              title = resp.title || title;
            }
          }
          if (text) {
            return { completed: true, status: 'SUCCESS', lyrics: text, title: title, textResult: text };
          }
        }
        if (st === 'GENERATE_LYRICS_FAILED' || st === 'CREATE_TASK_FAILED' || st === 'FAILED') {
          return { completed: false, failed: true, status: 'FAILED', message: sanitizeApiErrorMessage(data.data.errorMessage, 'Échec de la génération de paroles') };
        }
        return { completed: false, status: st || 'IN_PROGRESS' };
      } catch (e) {
        return { completed: false, status: 'RETRY' };
      }
    },

    // 5. Séparation de pistes & Stem Audio (/vocal-removal/generate)
    separateStems: async function({ taskId, audioId, audioUrl, type = 'separate_vocal', stemName = '' }) {
      const payload = {
        type: type || 'separate_vocal',
        callBackUrl: WEBHOOK_NOOP_URL
      };

      if (audioUrl && audioUrl.startsWith('http') && (!audioId || audioId.startsWith('audio_') || !isValidEngineId(audioId))) {
        payload.audioUrl = audioUrl;
      } else {
        if (taskId) payload.taskId = taskId;
        if (audioId) payload.audioId = audioId;
      }

      if (stemName && type === 'split_stem_advanced') {
        payload.stemName = stemName;
      }

      console.log('🚀 [Nzembo Audio] Envoi vocal-removal/generate:', payload);
      const res = await fetchAudioEngine('/vocal-removal/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Échec de la séparation des pistes audio'));
    },

    pollStemStatus: async function(taskId) {
      const res = await fetchAudioEngine(`/vocal-removal/record-info?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET'
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.data && (data.data.successFlag === 'SUCCESS' || data.data.status === 'SUCCESS')) {
        const resp = data.data.response || {};
        const vocalUrl = await persistMediaLocally(resp.vocalUrl, 'audio', `${taskId}_vocals`);
        const instrumentalUrl = await persistMediaLocally(resp.instrumentalUrl, 'audio', `${taskId}_instru`);

        await updateCreation(taskId, {
          status: 'termine',
          isProcessing: false,
          vocalUrl: vocalUrl,
          instrumentalUrl: instrumentalUrl,
          audioUrl: instrumentalUrl || vocalUrl
        }).catch(() => {});

        return {
          completed: true,
          status: 'SUCCESS',
          vocalUrl: vocalUrl,
          instrumentalUrl: instrumentalUrl,
          audioUrl: instrumentalUrl || vocalUrl,
          stems: resp
        };
      }
      if (data && data.data && (data.data.successFlag === 'FAILED' || data.data.errorCode)) {
        return { completed: false, failed: true, message: sanitizeApiErrorMessage(data.data.errorMessage, 'Échec de la séparation des pistes') };
      }
      return { completed: false, status: 'IN_PROGRESS' };
    },

    // 6. Extension de morceau (/generate/extend)
    extendMusic: async function({ taskId, audioId, uploadUrl, lyrics, style, title, continueAt = 60, model = 'V6' }) {
      const targetModel = model || 'V6';
      const payload = {
        model: targetModel,
        continueAt: Math.max(1, parseInt(continueAt, 10) || 60),
        callBackUrl: WEBHOOK_NOOP_URL
      };

      let endpoint = '/generate/extend';
      if (uploadUrl && uploadUrl.startsWith('http')) {
        payload.uploadUrl = uploadUrl;
        endpoint = '/generate/upload-extend';
      } else {
        if (taskId) payload.taskId = taskId;
        if (audioId) payload.audioId = audioId;
      }

      const targetStyle = (style || 'Afrobeat, Rumba Modern').slice(0, 1000);
      if (lyrics) payload.lyrics = lyrics.slice(0, 5000);
      if (targetStyle) {
        payload.style = targetStyle;
      }
      if (title) payload.title = title.slice(0, 80);

      console.log('🚀 [Nzembo Audio] Envoi extend:', endpoint, payload);
      const res = await fetchAudioEngine(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Échec de l\'extension du morceau'));
    },

    // 7. Génération de Vidéo MP4 HD avec paroles intégrées (/mp4/generate)
    // Paramètres optionnels author/domainName volontairement omis pour éviter tout watermark textuel
    createMusicVideo: async function({ taskId, audioId, audioUrl = '', title = '' }) {
      let srcTaskId = String(taskId || '').trim();
      let srcAudioId = String(audioId || '').trim();

      if ((!isValidEngineId(srcTaskId) || !isValidEngineId(srcAudioId)) && typeof window !== 'undefined' && Array.isArray(window.userSongs)) {
        const matchLocal = window.userSongs.find(s =>
          s && (isValidEngineId(s.taskId) || isValidEngineId(s.audioId)) &&
          ((srcTaskId && (s.id === srcTaskId || s.taskId === srcTaskId)) ||
           (audioUrl && (s.audioUrl === audioUrl || s.audioUrl2 === audioUrl)) ||
           (title && s.title && s.title.toLowerCase() === String(title).toLowerCase()))
        );
        if (matchLocal) {
          if (!isValidEngineId(srcTaskId) && isValidEngineId(matchLocal.taskId)) srcTaskId = matchLocal.taskId;
          if (!isValidEngineId(srcAudioId) && isValidEngineId(matchLocal.audioId)) srcAudioId = matchLocal.audioId;
          if (!audioUrl && matchLocal.audioUrl) audioUrl = matchLocal.audioUrl;
        }
      }

      if (!isValidEngineId(srcAudioId) && audioUrl) {
        const uuidMatch = String(audioUrl).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch && isValidEngineId(uuidMatch[0])) {
          srcAudioId = uuidMatch[0];
        }
      }

      if (!isValidEngineId(srcTaskId) || !isValidEngineId(srcAudioId)) {
        try {
          const sb = getSupabase();
          if (sb) {
            const { data: rows } = await sb.from('creations').select('id,task_id,audio_id,audio_url,title').limit(50);
            if (Array.isArray(rows)) {
              const found = rows.find(r =>
                r && (isValidEngineId(r.task_id) || isValidEngineId(r.audio_id)) &&
                ((srcTaskId && (r.id === srcTaskId || r.task_id === srcTaskId)) ||
                 (srcAudioId && r.audio_id === srcAudioId) ||
                 (audioUrl && r.audio_url === audioUrl) ||
                 (title && r.title && r.title.toLowerCase() === String(title).toLowerCase()))
              );
              if (found) {
                if (!isValidEngineId(srcTaskId) && isValidEngineId(found.task_id)) srcTaskId = found.task_id;
                if (!isValidEngineId(srcAudioId) && isValidEngineId(found.audio_id)) srcAudioId = found.audio_id;
              }
            }
          }
        } catch (e) {}
      }

      if (isValidEngineId(srcTaskId) && !isValidEngineId(srcAudioId)) {
        try {
          const recRes = await fetchAudioEngine(`/generate/record-info?taskId=${encodeURIComponent(srcTaskId)}`, { method: 'GET' });
          const recData = await recRes.json().catch(() => ({}));
          const tracks = recData && recData.data && recData.data.response && recData.data.response.sunoData;
          if (Array.isArray(tracks) && tracks[0] && isValidEngineId(tracks[0].id)) {
            srcAudioId = tracks[0].id;
          }
        } catch (e) {}
      }

      if (!isValidEngineId(srcTaskId) || !isValidEngineId(srcAudioId)) {
        throw new Error('Cette chanson n\'a pas d\'identifiant audio compatible pour la vidéo MP4. Sélectionnez une chanson créée dans Nzembo Studio.');
      }

      const payload = {
        taskId: srcTaskId,
        audioId: srcAudioId,
        callBackUrl: WEBHOOK_NOOP_URL
      };

      console.log('🎬 [Nzembo Video /mp4/generate] Payload officiel:', payload);
      const res = await fetchAudioEngine('/mp4/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (data && data.data && data.data.taskId && (res.ok || data.code === 200 || data.code === 409)) {
        console.log(`✅ [Nzembo Video /mp4/generate] Tâche vidéo prête/en cours (code ${data.code}). TaskId:`, data.data.taskId);
        return {
          success: true,
          isEngineTask: true,
          taskId: data.data.taskId,
          sourceTaskId: srcTaskId,
          sourceAudioId: srcAudioId,
          conversionType: 'mp4',
          eta: data.code === 409 ? 6 : 90
        };
      }

      console.warn('⚠️ [Nzembo Video /mp4/generate] Refus serveur:', data);
      if (data.code === 429) throw new Error('Crédits vidéo épuisés. Veuillez recharger votre solde.');
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, `Échec du lancement de la vidéo (code ${data.code || res.status}).`));
    },

    // Polling du statut de la vidéo MP4 (/mp4/record-info)
    pollMusicVideoStatus: function(taskId) {
      if (!taskId) return Promise.resolve({ completed: false, status: 'PENDING' });
      if (!isValidEngineId(taskId)) {
        return Promise.resolve({ completed: false, failed: true, status: 'FAILED', message: 'Tâche vidéo invalide (identifiant local).' });
      }

      const cache = this._videoPollCache || (this._videoPollCache = {});
      if (cache[taskId] && cache[taskId].done) return Promise.resolve(cache[taskId].done);
      if (cache[taskId] && cache[taskId].inFlight) return cache[taskId].inFlight;

      const self = this;
      const run = (async () => {
        try {
          const res = await fetchAudioEngine(`/mp4/record-info?taskId=${encodeURIComponent(taskId)}`, { method: 'GET' });
          const data = await res.json().catch(() => ({}));
          if (!data || data.code !== 200 || !data.data) {
            return { completed: false, status: 'PENDING' };
          }

          const taskData = data.data;
          const flag = String(taskData.successFlag || taskData.status || 'PENDING').toUpperCase();
          const rawVideoUrl = (taskData.response && (taskData.response.videoUrl || taskData.response.video_url)) || '';

          if (flag === 'SUCCESS' && rawVideoUrl) {
            console.log('🎉 [Nzembo Video] Vidéo MP4 prête:', rawVideoUrl);
            const result = { completed: true, status: 'SUCCESS', videoUrl: rawVideoUrl, rawVideoUrl, audioUrl: '' };
            cache[taskId] = { done: result };

            updateCreation(taskId, { status: 'termine', isProcessing: false, videoUrl: rawVideoUrl, audioUrl: '' })
              .catch(e => console.warn('Mise à jour Supabase creations:', e.message));

            self.persistVideoInBackground(taskId, rawVideoUrl);
            return result;
          }

          if (flag === 'SUCCESS' && !rawVideoUrl) {
            return { completed: false, status: 'PENDING' };
          }

          if (['GENERATE_MP4_FAILED', 'CREATE_TASK_FAILED', 'CALLBACK_EXCEPTION', 'FAILED'].includes(flag) || taskData.errorCode) {
            const result = {
              completed: false,
              failed: true,
              status: 'FAILED',
              message: sanitizeApiErrorMessage(taskData.errorMessage, 'La génération de la vidéo MP4 a échoué sur les serveurs Nzembo.')
            };
            cache[taskId] = { done: result };
            updateCreation(taskId, { status: 'echoue', isProcessing: false }).catch(() => {});
            return result;
          }

          return { completed: false, status: flag || 'PENDING' };
        } catch (err) {
          console.warn('⚠️ Polling /mp4/record-info:', err.message);
          return { completed: false, status: 'PENDING' };
        } finally {
          if (cache[taskId]) cache[taskId].inFlight = null;
        }
      })();

      cache[taskId] = Object.assign(cache[taskId] || {}, { inFlight: run });
      return run;
    },

    // Copie de la vidéo MP4 vers Supabase Storage (non bloquant) puis notification de l'UI
    persistVideoInBackground: function(taskId, rawVideoUrl) {
      const store = this._persistedVideos || (this._persistedVideos = {});
      if (!rawVideoUrl || store[taskId]) return;
      store[taskId] = true;
      persistMediaLocally(rawVideoUrl, 'video', `${taskId}_video`).then(storedUrl => {
        if (!storedUrl || storedUrl === rawVideoUrl || !/^https?:\/\//.test(storedUrl) || /localhost|127\.0\.0\.1/.test(storedUrl)) return;
        console.log('💾 [Supabase Storage] Vidéo MP4 hébergée durablement:', storedUrl);
        updateCreation(taskId, { videoUrl: storedUrl }).catch(() => {});
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nzembo-video-persisted', { detail: { taskId, rawVideoUrl, storedUrl } }));
        }
      }).catch(e => console.warn('Persistance vidéo Supabase:', e.message));
    },

    // Paroles horodatées internes (/generate/get-timestamped-lyrics) -> sous-titres WebVTT
    getTimestampedLyrics: async function({ taskId, audioId }) {
      if (!isValidEngineId(taskId) || !isValidEngineId(audioId)) return { alignedWords: [], vtt: '' };
      try {
        const res = await fetchAudioEngine('/generate/get-timestamped-lyrics', {
          method: 'POST',
          body: JSON.stringify({ taskId, audioId })
        });
        const data = await res.json().catch(() => ({}));
        const words = (data && data.code === 200 && data.data && Array.isArray(data.data.alignedWords)) ? data.data.alignedWords : [];
        return { alignedWords: words, vtt: buildLyricsVtt(words) };
      } catch (e) {
        console.warn('Paroles horodatées indisponibles:', e.message);
        return { alignedWords: [], vtt: '' };
      }
    },

    // 8. Conversion Audio en WAV haute fidélité (/wav/generate)
    convertToWav: async function({ taskId, audioId }) {
      if (!taskId && !audioId) {
        throw new Error('Identifiant audioId ou taskId requis pour la conversion WAV Master.');
      }
      const payload = {
        callBackUrl: WEBHOOK_NOOP_URL
      };
      if (taskId) payload.taskId = taskId;
      if (audioId) payload.audioId = audioId;

      const res = await fetchAudioEngine('/wav/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Échec de la conversion au format WAV'));
    },

    pollWavStatus: async function(taskId) {
      const res = await fetchAudioEngine(`/wav/record-info?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET'
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.data && (data.data.successFlag === 'SUCCESS' || data.data.status === 'SUCCESS')) {
        const rawWavUrl = data.data.response?.audioWavUrl;
        const wavUrl = await persistMediaLocally(rawWavUrl, 'audio', `${taskId}_wav`);

        await updateCreation(taskId, {
          status: 'termine',
          isProcessing: false,
          audioUrl: wavUrl
        }).catch(() => {});

        return {
          completed: true,
          status: 'SUCCESS',
          audioUrl: wavUrl
        };
      }
      if (data && data.data && (data.data.successFlag === 'FAILED' || data.data.errorCode)) {
        return { completed: false, failed: true, message: sanitizeApiErrorMessage(data.data.errorMessage, 'Échec de la conversion WAV') };
      }
      return { completed: false, status: 'IN_PROGRESS' };
    },

    // 9. Génération de Pochette d'Album Personnalisée
    generateAlbumCover: async function(taskId) {
      if (!taskId) {
        throw new Error('Veuillez sélectionner une chanson générée pour créer sa pochette (taskId requis).');
      }
      const payload = {
        taskId: taskId,
        callBackUrl: WEBHOOK_NOOP_URL
      };

      const res = await fetchAudioEngine('/suno/cover/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.code === 200 && data.data && data.data.taskId) {
        return { success: true, taskId: data.data.taskId };
      }
      throw new Error(sanitizeApiErrorMessage(data.msg || data.message, 'Échec de la génération de la pochette d\'album'));
    },

    pollAlbumCoverStatus: async function(taskId) {
      const res = await fetchAudioEngine(`/suno/cover/record-info?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET'
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.data && (data.data.successFlag === 1 || data.data.status === 'SUCCESS')) {
        const images = data.data.response?.images || [];
        const rawCover = images[0] || '';
        const localCover = await persistMediaLocally(rawCover, 'image', `${taskId}_cover_art`);

        await updateCreation(taskId, {
          status: 'termine',
          isProcessing: false,
          albumCover: localCover,
          coverUrl: localCover
        }).catch(() => {});

        return {
          completed: true,
          status: 'SUCCESS',
          coverUrl: localCover,
          images: images
        };
      }
      return { completed: false, status: 'IN_PROGRESS' };
    },

    // 10. Téléversement universel d'un fichier audio ou vidéo local (Mobile/PC -> File Upload + Supabase CDN + Transcodage WAV secours)
    uploadLocalAudioFile: async function(fileOrBlob, fileName = 'track.mp3', options = {}) {
      if (!fileOrBlob || (typeof fileOrBlob.size === 'number' && fileOrBlob.size === 0)) {
        throw new Error('Fichier audio vide ou illisible. Réessaie avec un autre fichier.');
      }

      const safeName = ensureAudioFileName(fileName || (fileOrBlob && fileOrBlob.name), fileOrBlob);
      const mimeType = resolveUploadMimeType(fileOrBlob, safeName);
      const requireRemoteUrl = options.requireRemoteUrl !== false;

      console.log('📤 [Nzembo Cloud] Téléversement audio universel...', { fileName: safeName, mimeType, size: fileOrBlob.size });

      async function tryUploadSingleBlob(blobCandidate, candidateName, candidateMime) {
        let uploadBlob = blobCandidate;
        try {
          if (blobCandidate && typeof Blob !== 'undefined' && blobCandidate instanceof Blob && (!blobCandidate.type || blobCandidate.type !== candidateMime)) {
            uploadBlob = new Blob([blobCandidate], { type: candidateMime });
          }
        } catch (e) {}

        const isHttpOrigin = (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:');

        // A. Relais proxy local sans CORS sur environnement HTTP local
        if (isHttpOrigin) {
          try {
            const storageBase = getStorageBase();
            const fdProxy = new FormData();
            fdProxy.append('file', uploadBlob, candidateName);
            fdProxy.append('uploadPath', 'nzembo/audio');
            fdProxy.append('fileName', `${Date.now()}_${candidateName}`);
            const fetchOpts = { method: 'POST', body: fdProxy };
            if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
              fetchOpts.signal = AbortSignal.timeout(35000);
            }
            const resP = await fetch(`${storageBase}/api/file-stream-upload`, fetchOpts);
            const jP = await resP.json().catch(() => ({}));
            const dlP = jP && (jP.downloadUrl || jP.url || (jP.data && (jP.data.downloadUrl || jP.data.fileUrl || jP.data.url)));
            if (resP.ok && dlP && /^https?:\/\//i.test(dlP)) {
              console.log('✅ [Nzembo Cloud] Hébergé via Proxy Stream:', dlP);
              return dlP;
            }
          } catch (proxyUploadErr) {}
        }

        // B. Endpoint direct File Stream Upload
        try {
          const fd = new FormData();
          fd.append('file', uploadBlob, candidateName);
          fd.append('uploadPath', 'nzembo/audio');
          fd.append('fileName', `${Date.now()}_${candidateName}`);
          const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
          const timer = controller ? setTimeout(() => controller.abort(), 45000) : null;
          try {
            if (!ENGINE_BEARER_TOKEN) throw new Error('ENGINE_BEARER_TOKEN absent');
            const res = await fetch(`${FILE_UPLOAD_BASE}/file-stream-upload`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${ENGINE_BEARER_TOKEN}` },
              body: fd,
              signal: controller ? controller.signal : undefined
            });
            const json = await res.json().catch(() => ({}));
            const dlUrl = json && (json.downloadUrl || json.url || (json.data && (json.data.downloadUrl || json.data.fileUrl || json.data.url)));
            if (res.ok && dlUrl && /^https?:\/\//i.test(dlUrl)) {
              console.log('✅ [Nzembo Cloud] Fichier audio hébergé via Stream Upload:', dlUrl);
              return dlUrl;
            }
          } finally {
            if (timer) clearTimeout(timer);
          }
        } catch (streamErr) {
          console.warn('⚠️ [Nzembo Cloud] File Stream Upload indisponible:', streamErr.message);
        }

        // C. Relais Supabase Storage Public Bucket ('nzembo-media')
        try {
          const supabasePublicUrl = await uploadMediaToSupabase(uploadBlob, candidateName, 'audio');
          if (supabasePublicUrl && /^https?:\/\//i.test(supabasePublicUrl)) {
            console.log('✅ [Nzembo Cloud] Fichier hébergé sur Supabase CDN:', supabasePublicUrl);
            return supabasePublicUrl;
          }
        } catch (sbErr) {
          console.warn('⚠️ [Nzembo Cloud] Relais Supabase indisponible:', sbErr);
        }

        // D. Fallback Base64 Upload (uniquement <= 10 Mo pour préserver la mémoire mobile)
        if (!uploadBlob.size || uploadBlob.size <= 10 * 1024 * 1024) {
          try {
            let base64Data = '';
            if (typeof FileReader !== 'undefined' && uploadBlob instanceof Blob) {
              base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(new Error('Lecture impossible'));
                reader.readAsDataURL(uploadBlob);
              });
            } else if (typeof Buffer !== 'undefined' && uploadBlob && typeof uploadBlob.arrayBuffer === 'function') {
              const buf = Buffer.from(await uploadBlob.arrayBuffer());
              base64Data = `data:${candidateMime};base64,${buf.toString('base64')}`;
            }
            if (base64Data && ENGINE_BEARER_TOKEN) {
              const resB64 = await fetch(`${FILE_UPLOAD_BASE}/file-base64-upload`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${ENGINE_BEARER_TOKEN}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  base64Data: base64Data,
                  uploadPath: 'nzembo/audio',
                  fileName: `${Date.now()}_${candidateName}`
                })
              });
              const jB64 = await resB64.json().catch(() => ({}));
              const dlB64 = jB64 && (jB64.downloadUrl || jB64.url || (jB64.data && (jB64.data.downloadUrl || jB64.data.fileUrl || jB64.data.url)));
              if (resB64.ok && dlB64 && /^https?:\/\//i.test(dlB64)) {
                console.log('✅ [Nzembo Cloud] Fichier audio hébergé via Base64 Upload:', dlB64);
                return dlB64;
              }
            }
          } catch (b64Err) {
            console.warn('⚠️ [Nzembo Cloud] File Base64 Upload indisponible:', b64Err.message);
          }
        }

        return null;
      }

      const exoticExts = ['.amr', '.3gp', '.3gpp', '.caf', '.wma', '.webm', '.opus', '.aiff', '.aif'];
      const lowSafe = safeName.toLowerCase();
      const shouldPreConvert = (fileOrBlob.size && fileOrBlob.size > 18 * 1024 * 1024) || exoticExts.some(ext => lowSafe.endsWith(ext));

      let convertedWavBlob = null;
      let primaryBlob = fileOrBlob;
      let primaryName = safeName;
      let primaryMime = mimeType;

      if (shouldPreConvert) {
        convertedWavBlob = await transcodeAudioBlobToWav(fileOrBlob);
        if (convertedWavBlob && convertedWavBlob.size > 0) {
          primaryBlob = convertedWavBlob;
          primaryName = safeName.replace(/\.[^/.]+$/, '') + '.wav';
          primaryMime = 'audio/wav';
        }
      }

      let remoteUrl = await tryUploadSingleBlob(primaryBlob, primaryName, primaryMime);

      // Si l'envoi direct échoue (ex: conteneur mobile non reconnu), normaliser en WAV universel et réessayer
      if (!remoteUrl && !convertedWavBlob) {
        convertedWavBlob = await transcodeAudioBlobToWav(fileOrBlob);
        if (convertedWavBlob && convertedWavBlob.size > 0) {
          const wavName = safeName.replace(/\.[^/.]+$/, '') + '.wav';
          remoteUrl = await tryUploadSingleBlob(convertedWavBlob, wavName, 'audio/wav');
        }
      }

      if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
        return remoteUrl;
      }

      if (requireRemoteUrl) {
        throw new Error('Envoi audio impossible pour le moment. Vérifie ta connexion et réessaie.');
      }

      if (typeof URL !== 'undefined' && URL.createObjectURL && fileOrBlob instanceof Blob) {
        return URL.createObjectURL(fileOrBlob);
      }
      return '';
    },

    // Photo de profil utilisateur (Supabase Storage + Profil + fallback local)
    updateUserAvatar: async function(fileOrDataUrl) {
      const current = getCurrentUser() || {};
      const userId = current.id || null;
      let finalAvatarUrl = '';

      if (typeof fileOrDataUrl === 'string') {
        finalAvatarUrl = fileOrDataUrl;
      } else if (fileOrDataUrl && typeof Blob !== 'undefined' && fileOrDataUrl instanceof Blob) {
        // Optimiser l'image en carré 360x360 JPEG côté navigateur
        let uploadCandidate = fileOrDataUrl;
        let dataUrlFallback = '';
        if (typeof document !== 'undefined' && typeof Image !== 'undefined' && typeof URL !== 'undefined') {
          try {
            const objUrl = URL.createObjectURL(fileOrDataUrl);
            try {
              const img = await new Promise((resolve, reject) => {
                const im = new Image();
                im.onload = () => resolve(im);
                im.onerror = reject;
                im.src = objUrl;
              });
              const size = 360;
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              const minSide = Math.min(img.naturalWidth || img.width || size, img.naturalHeight || img.height || size);
              const sx = Math.max(0, ((img.naturalWidth || img.width) - minSide) / 2);
              const sy = Math.max(0, ((img.naturalHeight || img.height) - minSide) / 2);
              ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
              dataUrlFallback = canvas.toDataURL('image/jpeg', 0.86);
              uploadCandidate = await new Promise(resolve => canvas.toBlob(b => resolve(b || fileOrDataUrl), 'image/jpeg', 0.86));
            } finally {
              URL.revokeObjectURL(objUrl);
            }
          } catch (e) {}
        }

        const safeFileName = `avatar_${userId || 'user'}_${Date.now()}.jpg`;
        const uploadedUrl = await uploadMediaToSupabase(uploadCandidate, safeFileName, 'avatars').catch(() => null);
        if (uploadedUrl && /^https?:\/\//i.test(uploadedUrl)) {
          finalAvatarUrl = uploadedUrl;
        } else if (dataUrlFallback) {
          finalAvatarUrl = dataUrlFallback;
        } else if (typeof FileReader !== 'undefined') {
          finalAvatarUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(fileOrDataUrl);
          });
        }
      }

      if (!finalAvatarUrl) {
        throw new Error('Impossible de charger cette image de profil.');
      }

      saveLocalAvatarForUser(userId, finalAvatarUrl);
      const updatedUser = { ...current, avatar_url: finalAvatarUrl };
      setCurrentUser(updatedUser);

      const sb = getSupabase();
      if (sb && userId && /^[0-9a-f-]{36}$/i.test(String(userId))) {
        try {
          await sb.from('profiles').update({ avatar_url: finalAvatarUrl }).eq('id', userId);
        } catch (e) {}
        try {
          await sb.auth.updateUser({ data: { avatar_url: finalAvatarUrl } });
        } catch (e) {}
      }

      return finalAvatarUrl;
    },

    // 10b. Capture vocale et gestion des Personas Vocaux (Suno Voice / Voice Persona)
    validateVoiceSample: async function({ voiceUrl, vocalStartS = 0, vocalEndS = 15, language = 'fr', callBackUrl = WEBHOOK_NOOP_URL }) {
      if (!voiceUrl || !/^https?:\/\//i.test(voiceUrl)) {
        throw new Error('Une URL audio publique et accessible est requise pour valider votre voix.');
      }
      const payload = {
        voiceUrl,
        vocalStartS: Number(vocalStartS) || 0,
        vocalEndS: Math.max(Number(vocalEndS) || 15, (Number(vocalStartS) || 0) + 10),
        language: language || 'fr',
        callBackUrl: callBackUrl || WEBHOOK_NOOP_URL
      };
      console.log('🎙️ [Nzembo Voice] Validation de l\'extrait vocal...', payload);
      const res = await fetchAudioEngine('/voice/validate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!data || data.code !== 200 || !data.data || !data.data.taskId) {
        throw new Error(sanitizeApiErrorMessage(data?.msg || data?.message, 'Impossible d\'initier la validation vocale.'));
      }
      return data.data; // { taskId: '...' }
    },

    createCustomVoice: async function({ taskId, verifyUrl, voiceName = 'Voix Utilisateur', description = 'Voix personnalisée Studio Nzembo', style = 'pop', callBackUrl = WEBHOOK_NOOP_URL }) {
      if (!taskId) throw new Error('Un identifiant de tâche (taskId) est requis pour créer la voix.');
      if (!verifyUrl || !/^https?:\/\//i.test(verifyUrl)) throw new Error('Une URL d\'enregistrement de vérification est requise.');
      const payload = {
        taskId,
        verifyUrl,
        voiceName: (voiceName || 'Voix Nzembo').slice(0, 50),
        description: (description || 'Voix personnalisée').slice(0, 200),
        style: style || 'pop',
        callBackUrl: callBackUrl || WEBHOOK_NOOP_URL
      };
      console.log('🎙️ [Nzembo Voice] Création du persona vocal...', payload);
      const res = await fetchAudioEngine('/voice/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!data || (data.code !== 200 && data.code !== 409) || !data.data) {
        throw new Error(sanitizeApiErrorMessage(data?.msg || data?.message, 'Échec du lancement de la création de voix.'));
      }
      return data.data; // { taskId: '...' }
    },

    getVoiceRecordInfo: async function(taskId) {
      if (!taskId) return null;
      try {
        const res = await fetchAudioEngine(`/voice/record-info?taskId=${encodeURIComponent(taskId)}`, { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (!data || data.code !== 200) return null;
        return data.data; // { taskId, voiceId, status, errorCode, errorMessage, validateInfo }
      } catch (e) {
        return null;
      }
    },

    createVoicePersonaPipeline: async function({ fileOrBlob, fileName = 'voix_sample.mp3', voiceName = 'Ma Voix', onProgress = () => {} }) {
      console.log('🚀 [Nzembo Voice Pipeline] Démarrage du pipeline de capture vocale...', { fileName, voiceName });
      
      // 1. Upload
      onProgress({ step: 'upload', message: "Téléversement de l'enregistrement vocal...", pct: 20 });
      const publicUrl = await this.uploadLocalAudioFile(fileOrBlob, fileName);
      if (!publicUrl || !/^https?:\/\//i.test(publicUrl)) {
        throw new Error("Impossible d'héberger le fichier audio sur le serveur distant.");
      }

      // 2. Initialiser validation
      onProgress({ step: 'validate', message: "Analyse acoustique et validation vocale...", pct: 40 });
      const valData = await this.validateVoiceSample({
        voiceUrl: publicUrl,
        vocalStartS: 0,
        vocalEndS: 15,
        language: 'fr'
      });
      const valTaskId = valData.taskId;

      // 3. Polling validation acoustique
      let validateSuccess = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const rec = await this.getVoiceRecordInfo(valTaskId);
        if (rec) {
          const st = String(rec.status || '').toLowerCase();
          if (rec.voiceId) {
            onProgress({ step: 'ready', message: "Empreinte vocale prête !", pct: 100 });
            return { success: true, voiceId: rec.voiceId, voiceUrl: publicUrl };
          }
          if (st.includes('fail') || (rec.errorCode && rec.errorCode >= 400)) {
            const err = sanitizeApiErrorMessage(rec.errorMessage, "La vérification vocale a échoué. Assurez-vous d'enregistrer une voix humaine audible et sans bruit parasite.");
            throw new Error(err);
          }
          if (st.includes('success') || rec.validateInfo || st === 'processing_validate_success') {
            validateSuccess = true;
            break;
          }
        }
      }

      // 4. Génération du modèle de voix
      onProgress({ step: 'generate', message: "Création de votre empreinte vocale (Voice Persona)...", pct: 70 });
      const genData = await this.createCustomVoice({
        taskId: valTaskId,
        verifyUrl: publicUrl,
        voiceName: voiceName
      });
      const genTaskId = (genData && genData.taskId) || valTaskId;

      // 5. Polling final pour l'identifiant vocal
      onProgress({ step: 'finalize', message: "Finalisation et enregistrement du profil vocal...", pct: 90 });
      for (let j = 0; j < 20; j++) {
        await new Promise(r => setTimeout(r, 2500));
        const rec2 = await this.getVoiceRecordInfo(genTaskId);
        if (rec2) {
          if (rec2.voiceId) {
            onProgress({ step: 'ready', message: "Empreinte vocale validée avec succès !", pct: 100 });
            return {
              success: true,
              voiceId: rec2.voiceId,
              voiceUrl: publicUrl
            };
          }
          const st2 = String(rec2.status || '').toLowerCase();
          if (st2.includes('fail') || (rec2.errorCode && rec2.errorCode >= 400)) {
            throw new Error(sanitizeApiErrorMessage(rec2.errorMessage, "Échec lors de la création de la voix personnalisée."));
          }
        }
      }

      // Renvoyer le genTaskId si le traitement en tâche de fond se prolonge
      return {
        success: true,
        voiceId: genTaskId,
        voiceUrl: publicUrl,
        isPending: true
      };
    },

    // 11. Outils Studio Nzembo vérifiés et conformes (Outils 1 à 12)
    executeStudioTool: async function({ toolKey, inputPrompt, audioUrl, creditCost = 1, options = {} }) {
      console.log(`🎛️ [Nzembo Studio] Exécution de l'outil ${toolKey}...`, { audioUrl, options });

      // 1. REPRISE & REMIX : uploadAndCoverAudio (1 seule version unique)
      if (toolKey === 'reprise' || toolKey === 'remix') {
        const defaultStyle = toolKey === 'remix' ? 'Amapiano, Afrobeat Club Remix, High Energy Drums' : 'Par défaut';
        const coverResult = await this.uploadAndCoverAudio({
          uploadUrl: audioUrl && /^https?:\/\//i.test(audioUrl) ? audioUrl : undefined,
          taskId: options.taskId,
          audioId: options.audioId,
          prompt: inputPrompt,
          lyrics: options.lyrics || inputPrompt || '',
          style: options.style !== undefined ? options.style : defaultStyle,
          title: options.title || (toolKey === 'remix' ? 'Remix Studio Club' : 'Reprise Studio'),
          instrumental: false,
          vocalGender: options.vocalGender,
          audioWeight: options.audioWeight,
          model: 'V6'
        });
        return {
          ...coverResult,
          conversionType: 'cover',
          eta: 75
        };
      }

      // 2. CHANTER SUR INSTRUMENTAL : addVocalsToAudio
      if (toolKey === 'sing_instru') {
        const vocalResult = await this.addVocalsToAudio({
          uploadUrl: audioUrl,
          title: options.title || 'Chant Studio sur Instrumental',
          style: options.style || 'Afrobeat, Rumba',
          lyrics: options.lyrics || inputPrompt,
          prompt: inputPrompt,
          vocalGender: options.vocalGender,
          model: 'V6'
        });
        return {
          ...vocalResult,
          conversionType: 'generate',
          eta: 70
        };
      }

      // 3. HARMONISATION VOCALE : addInstrumentalToAudio
      if (toolKey === 'sing_vocal') {
        const harmResult = await this.addInstrumentalToAudio({
          uploadUrl: audioUrl,
          title: options.title || 'Harmonisation Chorale Studio',
          tags: options.style || 'Gospel Choir SATB, Rich Vocal Harmonies, Accompagnement Doux',
          negativeTags: 'Heavy Metal, Screaming, Harsh Noise',
          lyrics: options.lyrics || inputPrompt,
          vocalGender: options.vocalGender,
          model: 'V6'
        });
        return {
          ...harmResult,
          conversionType: 'generate',
          eta: 70
        };
      }

      // 4. EXTRACTION STEMS
      if (toolKey === 'extraction' || toolKey === 'stems') {
        const type = options.stem === 'all' ? 'split_stem' : 'separate_vocal';
        const stemRes = await this.separateStems({
          taskId: options.taskId,
          audioId: options.audioId,
          audioUrl: audioUrl,
          type: type
        });
        return {
          ...stemRes,
          conversionType: 'vocal-removal',
          eta: 45
        };
      }

      // 5. EXTEND
      if (toolKey === 'extend') {
        const extRes = await this.extendMusic({
          taskId: options.taskId,
          audioId: options.audioId,
          uploadUrl: audioUrl,
          lyrics: options.lyrics || inputPrompt,
          style: options.style || 'Afrobeat, Rumba',
          title: options.title || 'Extension Studio',
          continueAt: options.continueAt || 60,
          model: 'V6'
        });
        return {
          ...extRes,
          conversionType: 'generate',
          eta: 65
        };
      }

      // 5b. POSER L'INSTRUMENTAL SUR LA VOIX (Outil 12) : addInstrumentalToAudio strict (pas de génération instrumentale isolée)
      if (toolKey === 'instru_on_voice' || toolKey === 'voice_to_instru') {
        const styleName = options.style || 'Rumba Congolaise';
        const instruTitle = (options.title || `Instrumental ${styleName}`).slice(0, 80);

        if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) {
          throw new Error('Veuillez fournir ou téléverser un fichier vocal valide avant de poser l\'instrumental.');
        }

        // Orchestration riche et adaptée au style musical pour Suno V6
        const STYLE_TAGS_MAP = {
          'Rumba Congolaise': 'Rumba Congolaise, Solo Electric Guitar Sebene, Melodic Bass Guitar, Warm Drums, Brass, Congas',
          'Afrobeat': 'Afrobeat, Groovy Brass Section, Driving Percussions, Warm Bassline, Rhythm Guitar, Afro Pop',
          'Amapiano': 'Amapiano, Deep Log Drums, Syncopated Jazzy Piano, Shakers, Warm Sub Bass',
          'Gospel Urbain': 'Urban Gospel, Uplifting Piano, Organ, Dynamic Drums, Rich Bassline, Modern Praise',
          'Ndombolo': 'Ndombolo, Fast Tempo, High Cadence Sebene Guitars, Atalaku, Heavy Bass, Kinshasa Groove',
          'Coupé-Décalé': 'Coupe Decale, Fast Dance Beat, Club Synths, Heavy Kicks, Abidjan Party Groove',
          'Acoustique / Soul': 'Acoustic Soul, Warm Fingerpicking Guitar, Soft Percussion, Upright Bass, Intimate Ambience',
          'R&B / Soul': 'Smooth R&B, Velvet Rhodes Piano, Warm Bassline, Gentle Trap Soul Drums, Lush Pads',
          'Zouk / Kizomba': 'Zouk Kizomba, Sensual Tropical Groove, Warm Bass, Smooth Synthesizers, Romantic Flow',
          'Makossa': 'Makossa, Slap Bass Guitar, Punchy Horn Section, Cameroonian Groove, Upbeat Drums',
          'Bikutsi': 'Bikutsi, Fast Balafon Rhythms, High Speed Guitar Picking, Energetic Cameroonian Percussion',
          'Reggae / Dancehall': 'Reggae Dancehall, Heavy Sub Bass, Skank Guitar, Steppers Drums, Dub Atmosphere',
          'Afro-Trap': 'Afro Trap, 808 Sliding Bass, Danceable Beats, Melodic Guitars, Modern Trap Drums',
          'Pop Moderne': 'Modern Pop, Catchy Melodic Synth, Driving Pop Drums, Acoustic Accents, Radio Mix',
          'Hip-Hop / Rap': 'Hip-Hop Boom Bap, Crisp Snare, Punchy Kick, Groovy Bassline, Soul Sample Beats',
          'Trap / Drill': 'Melodic Trap Drill, Gliding 808 Bass, Crisp Hi-Hats, Dark Melodic Plucks',
          'Bongo Flava': 'Bongo Flava, East African Melodic Guitar, Smooth Drums, Afro Fusion, Melodic Bass',
          'Jazz / Blues': 'Mellow Jazz Blues, Smooth Saxophone, Feathery Clean Guitar, Double Bass, Brushed Drums',
          'Lo-Fi Hip-Hop': 'Lo-Fi Hip Hop, Chill Nostalgic Piano, Vinyl Crackle, Mellow Beats, Warm Lo-Fi Bass'
        };

        const targetTags = options.tags || STYLE_TAGS_MAP[styleName] || `${styleName}, Full Band Arrangement, Acoustic Guitar, Bass, Drums`;

        const addInstruRes = await this.addInstrumentalToAudio({
          uploadUrl: audioUrl,
          title: instruTitle,
          tags: targetTags,
          negativeTags: options.negativeTags || 'Distortion, Harsh Noise, Clipping, Low Quality, Out of tune',
          lyrics: options.lyrics || '',
          vocalGender: options.vocalGender,
          model: 'V6'
        });
        return {
          ...addInstruRes,
          conversionType: 'generate',
          eta: 65
        };
      }

      // 6. VIDÉO MP4 HD (sans watermark textuel imposé)
      if (toolKey === 'video' || toolKey === 'mp4') {
        const vidRes = await this.createMusicVideo({
          taskId: options.taskId,
          audioId: options.audioId,
          audioUrl: audioUrl || options.audioUrl || '',
          title: options.title || inputPrompt || ''
        });
        return {
          ...vidRes,
          conversionType: 'mp4'
        };
      }

      // 7. CONVERSION WAV MASTER HD
      if (toolKey === 'wav') {
        const wavRes = await this.convertToWav({
          taskId: options.taskId,
          audioId: options.audioId
        });
        return {
          ...wavRes,
          conversionType: 'wav',
          eta: 30
        };
      }

      // 8. CRÉATION POCHETTE D'ALBUM HD (strictement isolée de Mes Créations)
      if (toolKey === 'cover_art') {
        if (typeof generateHDCoverArt === 'function') {
          const coverUrl = await generateHDCoverArt({
            prompt: inputPrompt,
            title: options.title || '',
            artist: options.author || ''
          });
          return {
            completed: true,
            status: 'SUCCESS',
            coverUrl: coverUrl,
            conversionType: 'cover_art',
            title: options.title || '',
            artist: options.author || ''
          };
        }
        if (options.taskId) {
          const artRes = await this.generateAlbumCover(options.taskId).catch(() => ({}));
          return {
            ...artRes,
            conversionType: 'cover_art',
            eta: 35
          };
        }
        return {
          completed: true,
          status: 'SUCCESS',
          coverUrl: '',
          conversionType: 'cover_art'
        };
      }

      // 9. GÉNÉRATEUR DE PAROLES IA (/api/v1/lyrics <= 200 chars + langue stricte)
      if (toolKey === 'lyrics_gen') {
        const lyrRes = await this.generateLyrics({
          prompt: inputPrompt,
          theme: options.theme || inputPrompt,
          style: options.style || '',
          language: options.language || '',
          secondaryLanguage: options.secondaryLanguage || ''
        });
        return {
          ...lyrRes,
          conversionType: 'lyrics',
          eta: 20
        };
      }

      // Par défaut : nouvelle génération musicale
      const genRes = await this.generateMusic({
        prompt: inputPrompt,
        style: options.style || 'Rumba congolaise',
        lyrics: options.lyrics || '',
        isInstrumental: Boolean(options.isInstrumental),
        title: options.title || 'Studio Composition'
      });
      return {
        ...genRes,
        conversionType: 'generate',
        eta: 70
      };
    },

    pollStudioTask: async function(taskId, toolType = 'generate') {
      if (toolType === 'vocal-removal' || toolType === 'stem' || toolType === 'extraction') {
        return await this.pollStemStatus(taskId);
      }
      if (toolType === 'mp4' || toolType === 'video') {
        return await this.pollMusicVideoStatus(taskId);
      }
      if (toolType === 'wav') {
        return await this.pollWavStatus(taskId);
      }
      if (toolType === 'cover_art' || toolType === 'suno_cover') {
        return await this.pollAlbumCoverStatus(taskId);
      }
      if (toolType === 'lyrics') {
        return await this.pollLyricsStatus(taskId);
      }
      return await this.pollMusicStatus(taskId);
    }
  };
})(typeof window !== 'undefined' ? window : global);
