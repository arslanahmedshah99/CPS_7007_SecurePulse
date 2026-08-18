import { useState } from 'react';

const SEVERITY_BADGES = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  info: 'bg-gray-100 text-gray-600',
};

export default function FindingsTable({ findings, apiBase }) {
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2">Severity</th>
            <th className="px-4 py-2">Scanner</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2">Found</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {findings.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                No findings yet.
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
              onToggle={() => toggleRow(finding)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindingRow({ finding, expanded, loading, error, remediation, onToggle }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer hover:bg-gray-50">
        <td className="px-4 py-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGES[finding.severity] || SEVERITY_BADGES.info}`}>
            {finding.severity}
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs uppercase text-gray-500">{finding.scanner_type}</td>
        <td className="px-4 py-2 text-gray-800">{finding.title}</td>
        <td className="px-4 py-2 text-gray-500">
          {finding.file_path || '—'}
          {finding.line_number ? `:${finding.line_number}` : ''}
        </td>
        <td className="px-4 py-2 text-gray-400">{new Date(finding.created_at).toLocaleDateString()}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <p className="mb-2 text-sm text-gray-600">{finding.description}</p>
            <p className="mb-1 text-xs font-medium uppercase text-gray-400">AI remediation</p>
            {loading && <p className="text-sm text-gray-400">Generating suggestion...</p>}
            {error && <p className="text-sm text-red-600">Failed to generate a remediation. Try again.</p>}
            {!loading && !error && remediation && (
              <p className="whitespace-pre-wrap text-sm text-gray-700">{remediation}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
