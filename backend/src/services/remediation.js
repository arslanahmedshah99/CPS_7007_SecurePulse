const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

function buildPrompt(finding) {
  return `You are a security engineer reviewing a vulnerability finding from an automated scan.

Scanner type: ${finding.scanner_type.toUpperCase()}
Severity: ${finding.severity}
Title: ${finding.title}
File: ${finding.file_path || 'not applicable'}${finding.line_number ? `, line ${finding.line_number}` : ''}
Rule/CVE: ${finding.rule_id || finding.cve_id || 'not specified'}
Description: ${finding.description || 'no additional description provided'}

Explain in plain terms why this is a security risk, then give a specific, actionable fix. Include a short code or configuration snippet where it helps. Keep the whole response under 200 words.`;
}

async function generateRemediationForFinding(findingId) {
  const existing = await db.query('SELECT suggestion FROM remediations WHERE finding_id = $1', [findingId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].suggestion;
  }

  const findingResult = await db.query('SELECT * FROM findings WHERE id = $1', [findingId]);
  if (findingResult.rows.length === 0) {
    throw new Error(`Finding ${findingId} not found`);
  }
  const finding = findingResult.rows[0];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: buildPrompt(finding) }],
  });

  const suggestion = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  await db.query(
    `INSERT INTO remediations (finding_id, suggestion, model)
     VALUES ($1, $2, $3)
     ON CONFLICT (finding_id) DO UPDATE SET suggestion = EXCLUDED.suggestion, model = EXCLUDED.model`,
    [findingId, suggestion, MODEL]
  );

  return suggestion;
}

function stripCodeFence(text) {
  const fenced = text.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1] : text;
}

async function generateFileFix(filePath, originalContent, findings) {
  const issues = findings
    .map((f) => `- [${f.severity}] ${f.title}: ${f.description || ''}${f.line_number ? ` (line ${f.line_number})` : ''}`)
    .join('\n');

  const prompt = `You are fixing security issues in the file \`${filePath}\`.

Issues to fix:
${issues}

Current file content:
\`\`\`
${originalContent}
\`\`\`

Return ONLY the complete corrected file content. Do not include markdown code fences, explanations, or commentary - your entire response must be the raw file content that will directly replace this file.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return stripCodeFence(text);
}

module.exports = { generateRemediationForFinding, generateFileFix };
