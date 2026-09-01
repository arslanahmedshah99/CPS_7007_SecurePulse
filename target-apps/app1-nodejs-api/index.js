// Deliberately vulnerable API used as a SAST/SCA scan target for SecurePulse.
const express = require('express');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 4001;

// Hardcoded secret - deliberately vulnerable, fake key for demo purposes only
const API_KEY = 'sk_live_51H8fakeDemoKeyDoNotUse00000000';

let db;

function rowsFromResult(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

async function start() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT)');
  db.run(`
    INSERT INTO users (name, email, role) VALUES
      ('Alice Admin', 'alice@example.com', 'admin'),
      ('Bob Baker', 'bob@example.com', 'user'),
      ('Carol Chen', 'carol@example.com', 'user')
  `);

  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Safe listing endpoint - no user input involved
  app.get('/api/users', (req, res) => {
    res.json(rowsFromResult(db.exec('SELECT id, name, email, role FROM users')));
  });

  // Vulnerable: SQL injection via string concatenation
  app.get('/api/users/search', (req, res) => {
    const name = req.query.name || '';
    const query = `SELECT id, name, email, role FROM users WHERE name LIKE '%${name}%'`;
    try {
      res.json(rowsFromResult(db.exec(query)));
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Exposes the hardcoded secret - deliberately vulnerable
  app.get('/api/config', (req, res) => {
    res.json({ apiKey: API_KEY, service: 'app1-nodejs-api' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`app1-nodejs-api running on port ${PORT}`);
  });
}

start();
