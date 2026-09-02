CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  repo_url VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_runs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scanner_type VARCHAR(10) NOT NULL CHECK (scanner_type IN ('sast', 'dast', 'sca')),
  finding_count INTEGER NOT NULL DEFAULT 0,
  raw_summary JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS findings (
  id SERIAL PRIMARY KEY,
  scan_run_id INTEGER NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
  scanner_type VARCHAR(10) NOT NULL CHECK (scanner_type IN ('sast', 'dast', 'sca')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title VARCHAR(512) NOT NULL,
  description TEXT,
  file_path VARCHAR(1024),
  line_number INTEGER,
  rule_id VARCHAR(255),
  cve_id VARCHAR(50),
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS remediations (
  id SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES findings(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  model VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queued_fixes (
  id SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES findings(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_runs_project_id ON scan_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan_run_id ON findings(scan_run_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_scanner_type ON findings(scanner_type);

INSERT INTO projects (name, repo_url)
VALUES ('SecurePulse Target', 'https://github.com/arslanahmedshah99/CPS_7007_SecurePulse')
ON CONFLICT (name) DO NOTHING;
