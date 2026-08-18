const SCANNER_LABELS = { sast: 'SAST', dast: 'DAST', sca: 'SCA' };

export default function ScanRunsList({ runs }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-gray-700">Recent scan runs</p>
      {runs.length === 0 ? (
        <p className="text-sm text-gray-400">No scan runs yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {runs.map((run) => (
            <li key={run.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                  {SCANNER_LABELS[run.scanner_type] || run.scanner_type}
                </span>
                <span className="text-gray-700">{run.project_name}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <span>{run.finding_count} findings</span>
                <span>{new Date(run.started_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
