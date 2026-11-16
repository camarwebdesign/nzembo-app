// proxy-suno.js
// Serveur proxy local et relais sécurisé Nzembo pour l'API Suno (https://apibox.erweima.ai/api/v1/)
// Gère l'authentification Bearer, résout les problèmes de certificats et CORS,
// et fournit le stockage / mise en cache permanente des médias audio et vidéo.

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PROXY_PORT || 3001;
const SUNO_HOST = 'apibox.erweima.ai';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, 'server', '.env'));

const SUNO_BEARER_TOKEN = process.env.SUNO_BEARER_TOKEN || process.env.SUNO_API_KEY || '';
if (!SUNO_BEARER_TOKEN) {
  console.warn('⚠️ [Nzembo Suno Proxy] SUNO_BEARER_TOKEN manquant dans .env.');
}

// Dossier de stockage local permanent pour les médias
const STORAGE_DIR = path.join(__dirname, 'storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
const AUDIO_DIR = path.join(STORAGE_DIR, 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
const VIDEO_DIR = path.join(STORAGE_DIR, 'video');
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Fonction de téléchargement et sauvegarde permanente de fichiers média
async function downloadAndPersistMedia(remoteUrl, category = 'audio', fileId = '') {
  if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;
  try {
    const ext = path.extname(new URL(remoteUrl).pathname) || (category === 'video' ? '.mp4' : '.mp3');
    const filename = `${fileId || 'media_' + Date.now()}${ext}`;
    const targetDir = category === 'video' ? VIDEO_DIR : AUDIO_DIR;
    const destPath = path.join(targetDir, filename);

    // Télécharger le média si pas déjà en cache local
    if (!fs.existsSync(destPath)) {
      await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(destPath);
        const req = (remoteUrl.startsWith('https') ? https : http).get(remoteUrl, { rejectUnauthorized: false }, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download media, status: ${res.statusCode}`));
            return;
          }
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
        });
        req.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });
      console.log(`💾 [Stockage Permanent] Média sauvegardé: ${destPath}`);
    }

    return `/media/${category}/${filename}`;
  } catch (err) {
    console.warn(`⚠️ [Stockage Permanent] Échec du téléchargement pour ${remoteUrl}:`, err.message);
    return remoteUrl; // Retourner l'URL distante en fallback
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Servir les médias stockés en local de manière permanente
  if (pathname.startsWith('/media/')) {
    const relativePath = pathname.replace('/media/', '');
    const filePath = path.join(STORAGE_DIR, relativePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Fichier média introuvable' }));
      return;
    }
  }

  // Endpoint de persistance directe déclenchable depuis le client
  if (pathname === '/api/persist-media' && req.method === 'POST') {
    let bodyData = [];
    req.on('data', chunk => bodyData.push(chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(bodyData).toString('utf8'));
        const { url: mediaUrl, category, id } = body;
        const localUrl = await downloadAndPersistMedia(mediaUrl, category, id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, localUrl, permanent: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Relais multipart/base64 sans CORS vers sunoapiorg.redpandaai.co pour les uploads mobiles/locaux
  if ((pathname === '/api/file-stream-upload' || pathname === '/api/file-base64-upload') && req.method === 'POST') {
    if (!SUNO_BEARER_TOKEN) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: false, error: 'SUNO_BEARER_TOKEN non configuré dans .env' }));
      return;
    }
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const bodyBuf = Buffer.concat(chunks);
      const fwdHeaders = {
        'host': 'sunoapiorg.redpandaai.co',
        'authorization': `Bearer ${SUNO_BEARER_TOKEN}`,
        'user-agent': 'Nzembo-Suno-Proxy/2.0',
        'content-length': bodyBuf.length
      };
      if (req.headers['content-type']) {
        fwdHeaders['content-type'] = req.headers['content-type'];
      }
      const fwdReq = https.request({
        hostname: 'sunoapiorg.redpandaai.co',
        port: 443,
        path: pathname,
        method: 'POST',
        rejectUnauthorized: false,
        headers: fwdHeaders
      }, (fwdRes) => {
        let resChunks = [];
        fwdRes.on('data', c => resChunks.push(c));
        fwdRes.on('end', () => {
          const out = Buffer.concat(resChunks);
          res.writeHead(fwdRes.statusCode || 200, {
            'Content-Type': fwdRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(out);
        });
      });
      fwdReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
      if (bodyBuf.length > 0) fwdReq.write(bodyBuf);
      fwdReq.end();
    });
    return;
  }

  // Endpoint de téléversement direct de fichiers audio (reprise / cover) avec extraction multipart propre
  if (pathname === '/api/upload-audio' && req.method === 'POST') {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        let fileBuffer = Buffer.concat(chunks);
        let ext = '.mp3';
        const ct = String(req.headers['content-type'] || '');
        const bMatch = ct.match(/boundary=([^\s;]+)/i);
        if (bMatch) {
          const boundary = bMatch[1].replace(/^["']|["']$/g, '');
          const headerEndIdx = fileBuffer.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEndIdx !== -1) {
            const hdrText = fileBuffer.slice(0, headerEndIdx).toString('utf8');
            const fnMatch = hdrText.match(/filename="([^"]+)"/i);
            if (fnMatch && fnMatch[1]) {
              const parsedExt = path.extname(fnMatch[1]).toLowerCase();
              if (/^\.[a-z0-9]{2,5}$/.test(parsedExt)) ext = parsedExt;
            }
            const start = headerEndIdx + 4;
            const endMarker = Buffer.from(`\r\n--${boundary}`);
            const endIdx = fileBuffer.indexOf(endMarker, start);
            if (endIdx !== -1 && endIdx > start) {
              fileBuffer = fileBuffer.slice(start, endIdx);
            } else {
              fileBuffer = fileBuffer.slice(start);
            }
          }
        }
        const filename = `uploaded_${Date.now()}${ext}`;
        const destPath = path.join(AUDIO_DIR, filename);
        fs.writeFileSync(destPath, fileBuffer);
        const host = req.headers.host || `localhost:${PORT}`;
        const localUrl = `http://${host}/media/audio/${filename}`;
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, url: localUrl }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Relais vers l'API Suno : correspond aux routes /api/v1/...
  if (!SUNO_BEARER_TOKEN) {
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ success: false, error: 'SUNO_BEARER_TOKEN non configuré dans .env' }));
    return;
  }
  let targetPath = parsedUrl.path;
  if (!targetPath.startsWith('/api/v1/')) {
    targetPath = '/api/v1' + (targetPath.startsWith('/') ? '' : '/') + targetPath;
  }

  let reqData = [];
  req.on('data', chunk => reqData.push(chunk));
  req.on('end', () => {
    let postBody = Buffer.concat(reqData);

    // Ajustement dynamique si génération Suno pour injecter callBackUrl et model par défaut
    if (req.method === 'POST' && (targetPath.includes('/generate') || targetPath.includes('/lyrics') || targetPath.includes('/vocal-removal') || targetPath.includes('/mp4'))) {
      try {
        const json = JSON.parse(postBody.toString('utf8'));
        if (!json.callBackUrl) {
          json.callBackUrl = 'https://nzembo.com/api/suno-webhook-noop';
        }
        if (targetPath.includes('/generate') && !targetPath.includes('/extend') && !json.model) {
          json.model = 'V4'; // Modèle officiel Suno recommandé (V4 / V3_5 / V4_5)
        }
        postBody = Buffer.from(JSON.stringify(json));
      } catch (e) {}
    }

    const forwardHeaders = {
      'host': SUNO_HOST,
      'authorization': `Bearer ${SUNO_BEARER_TOKEN}`,
      'content-type': 'application/json',
      'user-agent': 'Nzembo-Suno-Proxy/2.0'
    };
    if (postBody.length > 0) {
      forwardHeaders['content-length'] = Buffer.byteLength(postBody);
    }

    const proxyReq = https.request({
      hostname: SUNO_HOST,
      port: 443,
      path: targetPath,
      method: req.method,
      rejectUnauthorized: false, // Résout la validation du certificat Cloudflare
      headers: forwardHeaders
    }, (proxyRes) => {
      // Capturer la réponse pour intercepter et éventuellement télécharger en tâche de fond les médias
      let resChunks = [];
      proxyRes.on('data', c => resChunks.push(c));
      proxyRes.on('end', async () => {
        const rawRes = Buffer.concat(resChunks);
        const resText = rawRes.toString('utf8');

        // Si la réponse est un succès de génération avec URLs audio, déclencher la persistance en tâche de fond
        try {
          const parsedRes = JSON.parse(resText);
          if (parsedRes && parsedRes.data && parsedRes.data.response) {
            const sunoData = parsedRes.data.response.sunoData;
            if (Array.isArray(sunoData)) {
              for (const track of sunoData) {
                if (track.audio_url) {
                  downloadAndPersistMedia(track.audio_url, 'audio', track.id).catch(() => {});
                }
              }
            }
            if (parsedRes.data.response.videoUrl) {
              downloadAndPersistMedia(parsedRes.data.response.videoUrl, 'video', parsedRes.data.musicId || parsedRes.data.taskId).catch(() => {});
            }
          }
        } catch (e) {}

        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(rawRes);
      });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Suno Proxy Error]:`, err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });

    if (postBody.length > 0) {
      proxyReq.write(postBody);
    }
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Nzembo Suno Proxy] en cours d'écoute sur http://localhost:${PORT}`);
  console.log(`📁 Répertoire de stockage permanent: ${STORAGE_DIR}`);
});
