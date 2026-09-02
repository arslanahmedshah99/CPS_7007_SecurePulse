import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons.jsx';
import { SEVERITY_META } from '../lib/severity.js';

const CARDS = [
  { key: 'critical', Icon: AlertTriangleIcon },
  { key: 'high', Icon: AlertTriangleIcon },
  { key: 'medium', Icon: AlertCircleIcon },
  { key: 'low', Icon: CheckCircleIcon },
];

export default function SeverityCards({ bySeverity }) {
  const counts = Object.fromEntries((bySeverity || []).map((row) => [row.severity, row.count]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ key, Icon }) => {
        const meta = SEVERITY_META[key];
        return (
          <div
            key={key}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-hairline bg-surface p-4 shadow-sm transition-shadow hover:shadow-md dark:border-hairline-dark dark:bg-surface-dark"
          >
            <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: meta.hex }} />
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">{meta.label}</p>
              <p className="text-2xl font-semibold tabular-nums text-ink-primary dark:text-ink-primary-dark">
                {counts[key] || 0}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
