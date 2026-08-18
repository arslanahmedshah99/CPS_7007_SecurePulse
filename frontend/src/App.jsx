import { useCallback, useEffect, useState } from 'react';
import SeverityCards from './components/SeverityCards.jsx';
import ScannerChart from './components/ScannerChart.jsx';
import ScanRunsList from './components/ScanRunsList.jsx';
import FindingsTable from './components/FindingsTable.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [summary, setSummary] = useState({ bySeverity: [], byScanner: [] });
  const [runs, setRuns] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [summaryRes, runsRes, findingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/scans/summary`),
        fetch(`${API_BASE}/api/scans/runs`),
        fetch(`${API_BASE}/api/scans/findings`),
      ]);
      if (!summaryRes.ok || !runsRes.ok || !findingsRes.ok) throw new Error('Request failed');
      setSummary(await summaryRes.json());
      setRuns(await runsRes.json());
      setFindings(await findingsRes.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">SecurePulse</h1>
            <p className="text-sm text-gray-500">AI-augmented DevSecOps dashboard</p>
          </div>
          <button
            onClick={loadData}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not reach the backend at {API_BASE}. Is it running?
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            <SeverityCards bySeverity={summary.bySeverity} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ScannerChart byScanner={summary.byScanner} />
              <ScanRunsList runs={runs} />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-medium text-gray-700">Findings</h2>
              <FindingsTable findings={findings} apiBase={API_BASE} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
