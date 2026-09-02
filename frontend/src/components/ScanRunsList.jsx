import { SCANNER_META } from '../lib/severity.js';
import { timeAgo } from '../lib/time.js';

export default function ScanRunsList({ runs }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 shadow-sm transition-shadow hover:shadow-md dark:border-hairline-dark dark:bg-surface-dark">
      <p className="mb-3 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">Recent scan runs</p>
      {runs.length === 0 ? (
        <p className="text-sm text-ink-muted">No scan runs yet.</p>
      ) : (
        <ul className="divide-y divide-hairline dark:divide-hairline-dark">
          {runs.map((run) => {
            const meta = SCANNER_META[run.scanner_type] || { label: run.scanner_type, text: 'text-ink-muted', bg: 'bg-ink-muted/10' };
            return (
              <li key={run.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${meta.bg} ${meta.text}`}>
                    {meta.label}
                  </span>
                  <span className="truncate text-ink-primary dark:text-ink-primary-dark">{run.project_name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-ink-muted">
                  <span className="tabular-nums">{run.finding_count} findings</span>
                  <span title={new Date(run.started_at).toLocaleString()}>{timeAgo(run.started_at)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
