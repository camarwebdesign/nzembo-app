const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const app = express();

function extractRequestHost(req) {
  const forwarded = req.headers['x-forwarded-host'];
  const rawHost = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || req.headers.host || req.hostname || '');
  return String(rawHost).split(',')[0].trim().toLowerCase().split(':')[0];
}

function resolveTargetView(req) {
  const host = extractRequestHost(req);
  if (host.startsWith('admin.')) return 'admin.html';
  if (host.startsWith('app.')) return 'app.html';

  const reqPath = (req.path || '/').toLowerCase();
  if (reqPath === '/admin' || reqPath.startsWith('/admin/')) return 'admin.html';
  if (reqPath === '/app' || reqPath.startsWith('/app/') || reqPath.startsWith('/invite/')) return 'app.html';
  return 'landing.html';
}

function sendResolvedView(req, res) {
  const viewFile = resolveTargetView(req);
  return res.sendFile(path.join(PUBLIC_DIR, viewFile));
}

// Endpoint client env.local.js (sert le fichier local en dev, ou expose la config publique depuis process.env en production)
app.get('/env.local.js', (_req, res) => {
  const localEnvFile = path.join(PUBLIC_DIR, 'env.local.js');
  if (fs.existsSync(localEnvFile)) {
    return res.sendFile(localEnvFile);
  }
  const clientEnv = {
    BACKEND_URL: process.env.BACKEND_URL || '',
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    ENGINE_BEARER_TOKEN: process.env.ENGINE_BEARER_TOKEN || process.env.NEXT_PUBLIC_ENGINE_BEARER_TOKEN || ''
  };
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(`window.__NZEMBO_ENV__ = ${JSON.stringify(clientEnv)};`);
});

// Montage des routes API Backend existantes (SasPay, Neon DB, Suno, Auth) sans altérer req.rawBody
let backendServer = null;
if (process.env.DATABASE_URL) {
  try {
    backendServer = require('./server/server');
    app.use('/api', async (_req, _res, next) => {
      if (backendServer && typeof backendServer.ensureDbReady === 'function') {
        await backendServer.ensureDbReady().catch(() => {});
      }
      next();
    });
    app.use(backendServer.app);
  } catch (err) {
    console.warn('⚠️ Backend DB non monté au démarrage:', err.message);
  }
}

if (!backendServer) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Nzembo Unified Router',
      database: 'not_configured'
    });
  });
  app.all('/api/*', (_req, res) => {
    res.status(503).json({
      success: false,
      error: 'DATABASE_URL non configurée pour cet environnement.'
    });
  });
}

// Repli compatibilité pour les assets demandés sous /public/*, /app/* ou /admin/*
app.get(['/public/:asset', '/app/:asset', '/admin/:asset'], (req, res, next) => {
  const safeName = path.basename(req.params.asset || '');
  if (!safeName || !safeName.includes('.') || safeName.endsWith('.html')) {
    return next();
  }
  const candidate = path.join(PUBLIC_DIR, safeName);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return res.sendFile(candidate);
  }
  return next();
});

// Service des fichiers statiques centralisés (index désactivé pour préserver le routage multi-vues sur '/')
app.use(express.static(PUBLIC_DIR, { index: false }));

// Routes explicites des 3 applications unifiées
app.get(['/', '/app', '/app/*', '/admin', '/admin/*', '/invite/*'], sendResolvedView);

// Fallback SPA sur sous-domaines app.nzembo.* et admin.nzembo.* (hors fichiers statiques et /api)
app.get('*', (req, res, next) => {
  const host = extractRequestHost(req);
  if ((host.startsWith('app.') || host.startsWith('admin.')) && !req.path.startsWith('/api/') && !path.extname(req.path)) {
    return sendResolvedView(req, res);
  }
  return next();
});

if (require.main === module) {
  const startServer = () => {
    app.listen(PORT, () => {
      console.log(`🚀 [Nzembo Router] Actif sur http://localhost:${PORT}`);
      console.log(`   - Landing Page : http://localhost:${PORT}/`);
      console.log(`   - Studio & Outils : http://localhost:${PORT}/app`);
      console.log(`   - Dashboard Admin : http://localhost:${PORT}/admin`);
    });
  };
  if (backendServer && typeof backendServer.ensureDbReady === 'function') {
    backendServer.ensureDbReady().then(startServer).catch(startServer);
  } else {
    startServer();
  }
}

module.exports = app;
