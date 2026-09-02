const express = require('express');
const db = require('../db');
const github = require('../services/github');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT qf.added_at, f.id AS finding_id, f.title, f.severity, f.scanner_type,
              f.file_path, f.line_number, r.suggestion AS remediation
       FROM queued_fixes qf
       JOIN findings f ON f.id = qf.finding_id
       LEFT JOIN remediations r ON r.finding_id = f.id
       ORDER BY qf.added_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch fix queue error:', err);
    res.status(500).json({ error: 'Failed to fetch fix queue' });
  }
});

// Registered before the /:findingId routes below - otherwise Express would
// match "pr" as a findingId value and this route would never be reached.
router.post('/pr', async (req, res) => {
  try {
    const queued = await db.query(
      `SELECT f.* FROM queued_fixes qf JOIN findings f ON f.id = qf.finding_id`
    );
    if (queued.rows.length === 0) {
      return res.status(400).json({ error: 'No fixes queued' });
    }
    const prUrl = await github.createFixPullRequest(queued.rows);
    await db.query(
      'DELETE FROM queued_fixes WHERE finding_id = ANY($1)',
      [queued.rows.map((f) => f.id)]
    );
    res.json({ prUrl });
  } catch (err) {
    console.error('Create fix PR error:', err);
    res.status(500).json({ error: err.message || 'Failed to create pull request' });
  }
});

router.post('/:findingId', async (req, res) => {
  try {
    await db.query(
      'INSERT INTO queued_fixes (finding_id) VALUES ($1) ON CONFLICT (finding_id) DO NOTHING',
      [req.params.findingId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Add to fix queue error:', err);
    res.status(500).json({ error: 'Failed to add finding to fix queue' });
  }
});

router.delete('/:findingId', async (req, res) => {
  try {
    await db.query('DELETE FROM queued_fixes WHERE finding_id = $1', [req.params.findingId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Remove from fix queue error:', err);
    res.status(500).json({ error: 'Failed to remove finding from fix queue' });
  }
});

module.exports = router;
