import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const SCANNER_LABELS = { sast: 'SAST', dast: 'DAST', sca: 'SCA' };

export default function ScannerChart({ byScanner }) {
  const counts = Object.fromEntries((byScanner || []).map((row) => [row.scanner_type, row.count]));
  const data = Object.entries(SCANNER_LABELS).map(([key, name]) => ({ name, count: counts[key] || 0 }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-gray-700">Findings by scanner</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
