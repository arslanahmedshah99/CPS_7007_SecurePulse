const express = require('express');
const db = require('../db');
const remediation = require('../services/remediation');

const router = express.Router();

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!process.env.SECUREPULSE_API_KEY || key !== process.env.SECUREPULSE_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

async function getDefaultProjectId() {
  const result = await db.query('SELECT id FROM projects ORDER BY id ASC LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('No project found. Has the database been initialized?');
  }
  return result.rows[0].id;
}

async function insertScanRun(projectId, scannerType, rawSummary) {
  const result = await db.query(
    'INSERT INTO scan_runs (project_id, scanner_type, raw_summary) VALUES ($1, $2, $3) RETURNING id',
    [projectId, scannerType, rawSummary]
  );
  return result.rows[0].id;
}

async function insertFindings(scanRunId, scannerType, findings) {
  for (const finding of findings) {
    await db.query(
      `INSERT INTO findings
        (scan_run_id, scanner_type, severity, title, description, file_path, line_number, rule_id, cve_id, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        scanRunId,
        scannerType,
        finding.severity,
        finding.title,
        finding.description,
        finding.filePath,
        finding.lineNumber,
        finding.ruleId,
        finding.cveId,
        finding.rawData,
      ]
    );
  }
  await db.query('UPDATE scan_runs SET finding_count = $1 WHERE id = $2', [findings.length, scanRunId]);
}

// Semgrep
function mapSemgrepSeverity(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'ERROR':
      return 'high';
    case 'WARNING':
      return 'medium';
    case 'INFO':
      return 'low';
    default:
      return 'medium';
  }
}

function parseSemgrepResults(body) {
  const results = Array.isArray(body.results) ? body.results : [];
  return results.map((r) => ({
    severity: mapSemgrepSeverity(r.extra && r.extra.severity),
    title: r.check_id || 'Semgrep finding',
    description: (r.extra && r.extra.message) || '',
    filePath: r.path || null,
    lineNumber: r.start ? r.start.line : null,
    ruleId: r.check_id || null,
    cveId: null,
    rawData: r,
  }));
}

// OWASP ZAP
function mapZapRisk(riskcode) {
  switch (String(riskcode)) {
    case '3':
      return 'high';
    case '2':
      return 'medium';
    case '1':
      return 'low';
    default:
      return 'info';
  }
}

function parseZapResults(body) {
  const sites = Array.isArray(body.site) ? body.site : [];
  const findings = [];
  for (const site of sites) {
    const alerts = Array.isArray(site.alerts) ? site.alerts : [];
    for (const alert of alerts) {
      const instances = Array.isArray(alert.instances) && alert.instances.length > 0 ? alert.instances : [{}];
      for (const instance of instances) {
        findings.push({
          severity: mapZapRisk(alert.riskcode),
          title: alert.name || alert.alert || 'ZAP finding',
          description: alert.desc || '',
          filePath: instance.uri || site['@name'] || null,
          lineNumber: null,
          ruleId: alert.pluginid ? String(alert.pluginid) : null,
          cveId: null,
          rawData: alert,
        });
      }
    }
  }
  return findings;
}

// OWASP Dependency-Check (SCA) 
function mapDependencyCheckSeverity(severity) {
  const s = (severity || '').toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(s)) return s;
  return 'medium';
}

function sanitizeScaFilePath(filePath) {
  if (!filePath) return null;
  let path = filePath.split('?')[0];
  path = path.replace(/^\/?repo\//, '').replace(/^\/?src\//, '');
  if (path.endsWith('package-lock.json')) {
    path = path.replace(/package-lock\.json$/, 'package.json');
  }
  return path || null;
}
function parseDependencyCheckResults(body) {
  const dependencies = Array.isArray(body.dependencies) ? body.dependencies : [];
  const findings = [];
  for (const dep of dependencies) {
    const vulnerabilities = Array.isArray(dep.vulnerabilities) ? dep.vulnerabilities : [];
    for (const vuln of vulnerabilities) {
      findings.push({
        severity: mapDependencyCheckSeverity(vuln.severity),
        title: vuln.name || 'Dependency vulnerability',
        description: vuln.description || '',
        filePath: sanitizeScaFilePath(dep.filePath || dep.fileName),
        lineNumber: null,
        ruleId: null,
        cveId: vuln.name && vuln.name.startsWith('CVE') ? vuln.name : null,
        rawData: vuln,
      });
    }
  }
  return findings;
}

// Ingest endpoints
router.post('/sast', requireApiKey, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();
    const findings = parseSemgrepResults(req.body || {});
    const scanRunId = await insertScanRun(projectId, 'sast', req.body);
    await insertFindings(scanRunId, 'sast', findings);
    res.status(201).json({ scanRunId, findingCount: findings.length });
  } catch (err) {
    console.error('SAST ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest SAST results' });
  }
});

router.post('/dast', requireApiKey, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();
    const findings = parseZapResults(req.body || {});
    const scanRunId = await insertScanRun(projectId, 'dast', req.body);
    await insertFindings(scanRunId, 'dast', findings);
    res.status(201).json({ scanRunId, findingCount: findings.length });
  } catch (err) {
    console.error('DAST ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest DAST results' });
  }
});

router.post('/sca', requireApiKey, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();
    const findings = parseDependencyCheckResults(req.body || {});
    const scanRunId = await insertScanRun(projectId, 'sca', req.body);
    await insertFindings(scanRunId, 'sca', findings);
    res.status(201).json({ scanRunId, findingCount: findings.length });
  } catch (err) {
    console.error('SCA ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest SCA results' });
  }
});

// Read endpoints
router.get('/runs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sr.id, sr.scanner_type, sr.finding_count, sr.started_at, p.name AS project_name
       FROM scan_runs sr
       JOIN projects p ON p.id = sr.project_id
       ORDER BY sr.started_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch scan runs error:', err);
    res.status(500).json({ error: 'Failed to fetch scan runs' });
  }
});

router.get('/findings', async (req, res) => {
  try {
    const { severity, scannerType, scanRunId } = req.query;
    const conditions = [];
    const values = [];
    if (severity) {
      values.push(severity);
      conditions.push(`f.severity = $${values.length}`);
    }
    if (scannerType) {
      values.push(scannerType);
      conditions.push(`f.scanner_type = $${values.length}`);
    }
    if (scanRunId) {
      values.push(scanRunId);
      conditions.push(`f.scan_run_id = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT f.id, f.scan_run_id, f.scanner_type, f.severity, f.title, f.description,
              f.file_path, f.line_number, f.rule_id, f.cve_id, f.created_at,
              r.suggestion AS remediation
       FROM findings f
       LEFT JOIN remediations r ON r.finding_id = f.id
       ${where}
       ORDER BY f.created_at DESC
       LIMIT 500`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch findings error:', err);
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const bySeverity = await db.query('SELECT severity, COUNT(*)::int AS count FROM findings GROUP BY severity');
    const byScanner = await db.query('SELECT scanner_type, COUNT(*)::int AS count FROM findings GROUP BY scanner_type');
    res.json({ bySeverity: bySeverity.rows, byScanner: byScanner.rows });
  } catch (err) {
    console.error('Fetch summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// AI remediation
router.post('/findings/:id/remediate', async (req, res) => {
  try {
    const suggestion = await remediation.generateRemediationForFinding(req.params.id);
    res.json({ suggestion });
  } catch (err) {
    console.error('Remediation error:', err);
    res.status(500).json({ error: 'Failed to generate remediation' });
  }
});

module.exports = router;
