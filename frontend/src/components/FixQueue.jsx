import { useEffect, useRef, useState } from 'react';
import { ExternalLinkIcon, GitBranchIcon, TrashIcon, XIcon } from './Icons.jsx';
import { SEVERITY_META } from '../lib/severity.js';

export default function FixQueue({ items, onRemove, onCreatePR }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(items.length);

  useEffect(() => {
    const grew = items.length > prevCount.current;
    prevCount.current = items.length;
    if (grew) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [items.length]);

  async function handleCreatePR() {
    setCreating(true);
    setResult(null);
    try {
      const prUrl = await onCreatePR();
      setResult({ prUrl });
    } catch (err) {
      setResult({ error: err.message || 'Failed to create pull request' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-series-blue text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Open fix queue"
      >
        <GitBranchIcon size={22} />
        {items.length > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-status-critical text-[11px] font-semibold text-white transition-transform duration-300 ${bump ? 'scale-125' : 'scale-100'}`}
          >
            {items.length}
          </span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div
          className={`relative flex h-full w-full max-w-sm flex-col bg-surface shadow-xl transition-transform duration-200 dark:bg-surface-dark ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3 dark:border-hairline-dark">
            <p className="text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">Fix queue ({items.length})</p>
            <button
              onClick={() => setOpen(false)}
              className="text-ink-muted hover:text-ink-primary dark:hover:text-ink-primary-dark"
              aria-label="Close"
            >
              <XIcon size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No fixes queued yet. Expand a finding below and click "Add to fix queue".
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => {
                  const meta = SEVERITY_META[item.severity] || SEVERITY_META.info;
                  return (
                    <li
                      key={item.finding_id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-hairline p-3 dark:border-hairline-dark"
                    >
                      <div className="min-w-0">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                        <p className="mt-1 truncate text-sm text-ink-primary dark:text-ink-primary-dark">{item.title}</p>
                        <p className="truncate text-xs text-ink-muted">{item.file_path || 'no file path'}</p>
                      </div>
                      <button
                        onClick={() => onRemove(item.finding_id)}
                        className="shrink-0 text-ink-muted hover:text-status-critical"
                        aria-label="Remove from fix queue"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-hairline p-4 dark:border-hairline-dark">
            {result?.prUrl && (
              <a
                href={result.prUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex items-center gap-1.5 rounded-md bg-status-good/10 px-3 py-2 text-sm font-medium text-status-good"
              >
                <ExternalLinkIcon size={14} />
                Pull request opened - view on GitHub
              </a>
            )}
            {result?.error && <p className="mb-3 text-sm text-status-critical">{result.error}</p>}
            <button
              onClick={handleCreatePR}
              disabled={items.length === 0 || creating}
              className="w-full rounded-md bg-series-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-series-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creating pull request...' : 'Create Pull Request'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
