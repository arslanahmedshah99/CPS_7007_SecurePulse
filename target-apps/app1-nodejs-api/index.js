// Deliberately vulnerable API used as a SAST/SCA scan target for SecurePulse.
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4001;

// Hardcoded secret - deliberately vulnerable, fake key for demo purposes only
const API_KEY = 'sk_live_51H8fakeDemoKeyDoNotUse00000000';

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT)');
  const seed = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)');
  seed.run('Alice Admin', 'alice@example.com', 'admin');
  seed.run('Bob Baker', 'bob@example.com', 'user');
  seed.run('Carol Chen', 'carol@example.com', 'user');
  seed.finalize();
});

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Safe listing endpoint - parameterized query
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, role FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Vulnerable: SQL injection via string concatenation
app.get('/api/users/search', (req, res) => {
  const name = req.query.name || '';
  const query = `SELECT id, name, email, role FROM users WHERE name LIKE '%${name}%'`;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Exposes the hardcoded secret - deliberately vulnerable
app.get('/api/config', (req, res) => {
  res.json({ apiKey: API_KEY, service: 'app1-nodejs-api' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`app1-nodejs-api running on port ${PORT}`);
});
