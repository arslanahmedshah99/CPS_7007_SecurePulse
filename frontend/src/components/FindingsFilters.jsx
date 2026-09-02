import { SCANNER_META, SEVERITY_META, SEVERITY_ORDER } from '../lib/severity.js';

function Chip({ active, onClick, activeClasses, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
        active
          ? activeClasses
          : 'text-ink-secondary ring-hairline hover:bg-plane dark:text-ink-secondary-dark dark:ring-hairline-dark dark:hover:bg-plane-dark'
      }`}
    >
      {children}
    </button>
  );
}

export default function FindingsFilters({ severity, scanner, onSeverityChange, onScannerChange, count, total }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={severity === 'all'} onClick={() => onSeverityChange('all')} activeClasses="bg-ink-primary text-white ring-ink-primary dark:bg-ink-primary-dark dark:text-ink-primary dark:ring-ink-primary-dark">
            All severities
          </Chip>
          {SEVERITY_ORDER.map((key) => {
            const meta = SEVERITY_META[key];
            return (
              <Chip
                key={key}
                active={severity === key}
                onClick={() => onSeverityChange(severity === key ? 'all' : key)}
                activeClasses={`${meta.bg} ${meta.text} ${meta.ring}`}
              >
                {meta.label}
              </Chip>
            );
          })}
        </div>
        <div className="h-4 w-px bg-hairline dark:bg-hairline-dark" />
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SCANNER_META).map(([key, meta]) => (
            <Chip
              key={key}
              active={scanner === key}
              onClick={() => onScannerChange(scanner === key ? 'all' : key)}
              activeClasses={`${meta.bg} ${meta.text} ring-transparent`}
            >
              {meta.label}
            </Chip>
          ))}
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        {count === total ? `${total} finding${total === 1 ? '' : 's'}` : `${count} of ${total}`}
      </p>
    </div>
  );
}
