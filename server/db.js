const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant dans server/.env');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialisation automatique des tables Neon PostgreSQL
async function initDb() {
  const client = await pool.connect();
  try {
    console.log('⚡ Connexion à Neon PostgreSQL en cours...');

    // 1. Table Utilisateurs & Authentification
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        credits INT DEFAULT 3,
        role VARCHAR(20) DEFAULT 'user',
        country VARCHAR(50) DEFAULT 'RD Congo',
        referral_code VARCHAR(50) UNIQUE,
        referred_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Table Chansons générées avec Suno AI
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        prompt TEXT,
        lyrics TEXT,
        style VARCHAR(100),
        occasion VARCHAR(100),
        recipient VARCHAR(100),
        audio_url TEXT,
        task_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'COMPLETED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table Transactions & Paiements
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        pack VARCHAR(100) NOT NULL,
        credits INT NOT NULL,
        amount_usd NUMERIC(10, 2),
        amount_cdf NUMERIC(15, 2),
        method VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Complété',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Table Demandes de Retrait / Rachat
    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        credits_converted INT NOT NULL,
        amount_usd NUMERIC(10, 2),
        amount_local VARCHAR(100),
        method VARCHAR(150),
        country VARCHAR(100),
        status VARCHAR(50) DEFAULT 'En attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Table Messages & Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        target VARCHAR(50) DEFAULT 'all',
        category VARCHAR(50) DEFAULT 'annonce',
        category_label VARCHAR(100),
        title VARCHAR(200),
        subject VARCHAR(255),
        content TEXT,
        likes INT DEFAULT 0,
        loves INT DEFAULT 0,
        fires INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insérer l'utilisateur démo par défaut si absent
    await client.query(`
      INSERT INTO users (id, name, email, credits, role, referral_code)
      VALUES ('usr_84920', 'Utilisateur Démo', 'demo@nzembo.com', 3, 'creator', 'NZ-84920')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Tables Neon PostgreSQL vérifiées et prêtes avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation de Neon DB:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb
};

if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
