import { useState } from 'react';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, CheckIcon, ChevronRightIcon, InfoCircleIcon, PlusIcon } from './Icons.jsx';
import { SCANNER_META, SEVERITY_META } from '../lib/severity.js';
import { timeAgo } from '../lib/time.js';
import RemediationMarkdown from './RemediationMarkdown.jsx';

const SEVERITY_ICONS = {
  'alert-triangle': AlertTriangleIcon,
  'alert-circle': AlertCircleIcon,
  'check-circle': CheckCircleIcon,
  'info-circle': InfoCircleIcon,
};

function SeverityBadge({ severity }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.info;
  const Icon = SEVERITY_ICONS[meta.icon];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring}`}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function ScannerBadge({ scannerType }) {
  const meta = SCANNER_META[scannerType] || { label: scannerType, text: 'text-ink-muted', bg: 'bg-ink-muted/10' };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

function Spinner() {
  return <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-muted/25 border-t-series-blue align-[-2px]" />;
}

export default function FindingsTable({ findings, apiBase, queuedIds, onAddToQueue, onRemoveFromQueue }) {
  const [expandedId, setExpandedId] = useState(null);
  const [remediations, setRemediations] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  async function toggleRow(finding) {
    if (expandedId === finding.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(finding.id);
    setErrorId(null);

    const cached = remediations[finding.id] ?? finding.remediation;
    if (cached) return;

    setLoadingId(finding.id);
    try {
      const res = await fetch(`${apiBase}/api/scans/findings/${finding.id}/remediate`, { method: 'POST' });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setRemediations((prev) => ({ ...prev, [finding.id]: data.suggestion }));
    } catch {
      setErrorId(finding.id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm dark:border-hairline-dark dark:bg-surface-dark">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-plane text-xs uppercase tracking-wide text-ink-muted dark:bg-plane-dark">
            <tr>
              <th className="w-8 px-2 py-2.5" />
              <th className="px-2 py-2.5 font-medium">Severity</th>
              <th className="px-4 py-2.5 font-medium">Scanner</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Location</th>
              <th className="px-4 py-2.5 font-medium">Found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline dark:divide-hairline-dark">
            {findings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                  No findings match the current filters.
                </td>
              </tr>
            )}
            {findings.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                expanded={expandedId === finding.id}
                loading={loadingId === finding.id}
                error={errorId === finding.id}
                remediation={remediations[finding.id] ?? finding.remediation}
                queued={queuedIds.has(finding.id)}
                onToggle={() => toggleRow(finding)}
                onAddToQueue={() => onAddToQueue(finding)}
                onRemoveFromQueue={() => onRemoveFromQueue(finding.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FindingRow({ finding, expanded, loading, error, remediation, queued, onToggle, onAddToQueue, onRemoveFromQueue }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer transition-colors hover:bg-plane dark:hover:bg-plane-dark">
        <td className="px-2 py-2.5 text-ink-muted">
          <ChevronRightIcon size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </td>
        <td className="px-2 py-2.5">
          <SeverityBadge severity={finding.severity} />
        </td>
        <td className="px-4 py-2.5">
          <ScannerBadge scannerType={finding.scanner_type} />
        </td>
        <td className="px-4 py-2.5 text-ink-primary dark:text-ink-primary-dark">{finding.title}</td>
        <td className="px-4 py-2.5 text-ink-secondary dark:text-ink-secondary-dark">
          {finding.file_path || '—'}
          {finding.line_number ? `:${finding.line_number}` : ''}
        </td>
        <td className="px-4 py-2.5 text-ink-muted" title={new Date(finding.created_at).toLocaleString()}>
          {timeAgo(finding.created_at)}
        </td>
      </tr>
      {expanded && (
        <tr className="animate-fade-in">
          <td colSpan={6} className="bg-plane px-4 py-4 dark:bg-plane-dark">
            <p className="mb-3 text-sm text-ink-secondary dark:text-ink-secondary-dark">{finding.description}</p>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">AI remediation</p>
            {loading && (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner /> Generating suggestion...
              </p>
            )}
            {error && <p className="text-sm text-status-critical">Failed to generate a remediation. Try again.</p>}
            {!loading && !error && remediation && (
              <>
                <RemediationMarkdown>{remediation}</RemediationMarkdown>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    queued ? onRemoveFromQueue() : onAddToQueue();
                  }}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    queued
                      ? 'bg-status-good/10 text-status-good ring-1 ring-inset ring-status-good/25'
                      : 'bg-series-blue text-white hover:bg-series-blue-dark'
                  }`}
                >
                  {queued ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
                  {queued ? 'In fix queue' : 'Add to fix queue'}
                </button>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
