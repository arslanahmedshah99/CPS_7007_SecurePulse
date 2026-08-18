const SEVERITIES = [
  { key: 'critical', label: 'Critical', classes: 'bg-red-50 border-red-200 text-red-700' },
  { key: 'high', label: 'High', classes: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'medium', label: 'Medium', classes: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'low', label: 'Low', classes: 'bg-blue-50 border-blue-200 text-blue-700' },
];

export default function SeverityCards({ bySeverity }) {
  const counts = Object.fromEntries((bySeverity || []).map((row) => [row.severity, row.count]));

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {SEVERITIES.map(({ key, label, classes }) => (
        <div key={key} className={`rounded-lg border p-4 ${classes}`}>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-3xl font-bold">{counts[key] || 0}</p>
        </div>
      ))}
    </div>
  );
}
