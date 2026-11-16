const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool, query, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SUNO_KEY = process.env.SUNO_API_KEY || '';
const SUNO_BASE = 'https://apibox.erweima.ai/api/v1';

app.use(cors());
app.use(express.json());

// ================= TEST DE SANTÉ =================
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as now');
    res.json({
      status: 'ok',
      service: 'Nzembo API Backend (Suno AI Engine)',
      neon_database: 'connected',
      db_time: dbRes.rows[0].now,
      suno_configured: !!SUNO_KEY
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      neon_database: 'disconnected',
      error: err.message
    });
  }
});

// ================= AUTHENTIFICATION / UTILISATEURS =================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    let userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      const newId = 'usr_' + Math.floor(10000 + Math.random() * 90000);
      const code = 'NZ-' + Math.floor(10000 + Math.random() * 90000);
      userRes = await query(
        `INSERT INTO users (id, name, email, credits, referral_code) 
         VALUES ($1, $2, $3, 3, $4) RETURNING *`,
        [newId, name || 'Créateur Nzembo', email, code]
      );
    }
    res.json({ success: true, user: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(userRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GÉNÉRATION MUSICALE AVEC SUNO API =================
/**
 * POST /api/music/generate
 * Corps: { prompt, style, occasion, recipient, lyrics, userId, isInstrumental }
 */
app.post('/api/music/generate', async (req, res) => {
  try {
    if (!SUNO_KEY) {
      return res.status(500).json({ success: false, error: 'SUNO_API_KEY non configurée dans server/.env' });
    }
    const { prompt, style, occasion, recipient, lyrics, userId, isInstrumental } = req.body;

    const songTitle = (`Pour ${recipient || 'un être cher'} (${style || 'Rumba'})`).slice(0, 80);
    const hasLyrics = Boolean(!isInstrumental && lyrics && lyrics.trim().length > 0);
    const lyricPrompt = hasLyrics ? lyrics.trim() : (prompt || `Chanson ${style || 'Rumba congolaise'} pour ${occasion || 'célébration'}`);

    console.log(`🎵 Envoi de la requête de génération à Suno pour "${songTitle}"...`);

    const payload = {
      customMode: hasLyrics || Boolean(isInstrumental),
      prompt: lyricPrompt,
      style: (style || 'Congolese rumba, acoustic guitar, sebene').slice(0, 400),
      title: songTitle,
      instrumental: Boolean(isInstrumental),
      model: 'V4',
      callBackUrl: 'https://nzembo.com/api/suno-webhook-noop'
    };

    const response = await fetch(`${SUNO_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Réponse Suno API:', data);

    if (!response.ok || data.code !== 200 || !data.data || !data.data.taskId) {
      return res.status(response.status || 400).json({
        success: false,
        error: data.msg || 'Erreur Suno API',
        details: data
      });
    }

    const taskId = data.data.taskId;
    const songId = 'nz_' + Date.now();

    // Sauvegarde initiale dans Neon Database
    await query(
      `INSERT INTO songs (id, user_id, title, prompt, lyrics, style, occasion, recipient, task_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PROCESSING')`,
      [songId, userId || 'usr_84920', songTitle, lyricPrompt, lyricPrompt, style, occasion, recipient, taskId]
    );

    // Déduire 1 crédit
    if (userId) {
      await query('UPDATE users SET credits = GREATEST(0, credits - 1) WHERE id = $1', [userId]);
    }

    res.json({
      success: true,
      songId,
      taskId,
      status: 'PROCESSING',
      eta: 120,
      title: songTitle,
      sunoResponse: data
    });

  } catch (err) {
    console.error('❌ Erreur génération musique Suno:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= VÉRIFICATION DU STATUT DE LA GÉNÉRATION (POLLING SUNO) =================
app.get('/api/music/status/:taskId', async (req, res) => {
  try {
    if (!SUNO_KEY) {
      return res.status(500).json({ success: false, error: 'SUNO_API_KEY non configurée dans server/.env' });
    }
    const { taskId } = req.params;

    const response = await fetch(`${SUNO_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_KEY}`
      }
    });

    const data = await response.json();

    if (data.data && data.data.status === 'SUCCESS' && Array.isArray(data.data.response?.sunoData)) {
      const track = data.data.response.sunoData[0];
      if (track && track.audio_url) {
        await query(
          'UPDATE songs SET status = $1, audio_url = $2 WHERE task_id = $3',
          ['COMPLETED', track.audio_url, taskId]
        );
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LISTE DES CHANSONS DE L'UTILISATEUR =================
app.get('/api/songs/user/:userId', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM songs WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Démarrage du serveur
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Nzembo connecté à Neon DB et démarré sur http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Impossible de démarrer le serveur sans connexion Neon:', err);
  app.listen(PORT, () => {
    console.log(`⚠️ Serveur Nzembo démarré sur http://localhost:${PORT} (Mode secours local)`);
  });
});
