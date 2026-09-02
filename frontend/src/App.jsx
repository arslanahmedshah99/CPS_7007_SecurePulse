import { useCallback, useEffect, useMemo, useState } from 'react';
import SeverityCards from './components/SeverityCards.jsx';
import ScannerChart from './components/ScannerChart.jsx';
import ScanRunsList from './components/ScanRunsList.jsx';
import FindingsTable from './components/FindingsTable.jsx';
import FindingsFilters from './components/FindingsFilters.jsx';
import FixQueue from './components/FixQueue.jsx';
import { PulseIcon } from './components/Icons.jsx';
import { DashboardSkeleton } from './components/Skeleton.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [summary, setSummary] = useState({ bySeverity: [], byScanner: [] });
  const [runs, setRuns] = useState([]);
  const [findings, setFindings] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [scannerFilter, setScannerFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [summaryRes, runsRes, findingsRes, queueRes] = await Promise.all([
        fetch(`${API_BASE}/api/scans/summary`),
        fetch(`${API_BASE}/api/scans/runs`),
        fetch(`${API_BASE}/api/scans/findings`),
        fetch(`${API_BASE}/api/fixes`),
      ]);
      if (!summaryRes.ok || !runsRes.ok || !findingsRes.ok || !queueRes.ok) throw new Error('Request failed');
      setSummary(await summaryRes.json());
      setRuns(await runsRes.json());
      setFindings(await findingsRes.json());
      setQueue(await queueRes.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function refreshQueue() {
    const res = await fetch(`${API_BASE}/api/fixes`);
    if (res.ok) setQueue(await res.json());
  }

  async function addToQueue(finding) {
    await fetch(`${API_BASE}/api/fixes/${finding.id}`, { method: 'POST' });
    await refreshQueue();
  }

  async function removeFromQueue(findingId) {
    await fetch(`${API_BASE}/api/fixes/${findingId}`, { method: 'DELETE' });
    await refreshQueue();
  }

  async function createPR() {
    const res = await fetch(`${API_BASE}/api/fixes/pr`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create pull request');
    await refreshQueue();
    return data.prUrl;
  }

  const queuedIds = new Set(queue.map((item) => item.finding_id));

  const filteredFindings = useMemo(
    () =>
      findings.filter(
        (f) => (severityFilter === 'all' || f.severity === severityFilter) && (scannerFilter === 'all' || f.scanner_type === scannerFilter)
      ),
    [findings, severityFilter, scannerFilter]
  );

  return (
    <div className="min-h-screen bg-plane dark:bg-plane-dark">
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/80 backdrop-blur dark:border-hairline-dark dark:bg-surface-dark/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-series-blue text-white">
              <PulseIcon size={18} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-ink-primary dark:text-ink-primary-dark">SecurePulse</h1>
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">AI-augmented DevSecOps dashboard</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="rounded-md bg-series-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-series-blue-dark"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {error && (
          <div className="rounded-xl border border-status-critical/25 bg-status-critical/10 p-4 text-sm text-status-critical">
            Could not reach the backend at {API_BASE}. Is it running?
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <SeverityCards bySeverity={summary.bySeverity} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ScannerChart byScanner={summary.byScanner} />
              <ScanRunsList runs={runs} />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">Findings</h2>
              <FindingsFilters
                severity={severityFilter}
                scanner={scannerFilter}
                onSeverityChange={setSeverityFilter}
                onScannerChange={setScannerFilter}
                count={filteredFindings.length}
                total={findings.length}
              />
              <FindingsTable
                findings={filteredFindings}
                apiBase={API_BASE}
                queuedIds={queuedIds}
                onAddToQueue={addToQueue}
                onRemoveFromQueue={removeFromQueue}
              />
            </div>
          </>
        )}
      </main>

      <FixQueue items={queue} onRemove={removeFromQueue} onCreatePR={createPR} />
    </div>
  );
}
