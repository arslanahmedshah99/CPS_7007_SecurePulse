// Deliberately vulnerable API used as a DAST scan target for SecurePulse.
// Do not deploy this outside an isolated local environment.
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;

// Insecure CORS - allows any origin, deliberately vulnerable
app.use(cors());
app.use(express.json());
// No helmet() here - deliberately missing security headers

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

let comments = [{ id: 1, author: 'System', text: 'Welcome to the guestbook!' }];

// Comment text is stored and returned as-is, with no sanitization (stored XSS
// once the frontend renders it via dangerouslySetInnerHTML)
app.get('/api/comments', (req, res) => {
  res.json(comments);
});

app.post('/api/comments', (req, res) => {
  const { author, text } = req.body || {};
  if (!author || !text) return res.status(400).json({ error: 'author and text are required' });
  const comment = { id: comments.length + 1, author, text };
  comments.push(comment);
  res.status(201).json(comment);
});

// No rate limiting on login - vulnerable to brute force
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'admin123') {
    return res.json({ token: 'demo-token-12345' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`app2 backend running on port ${PORT}`);
});
