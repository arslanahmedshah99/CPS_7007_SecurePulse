import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SCANNER_META } from '../lib/severity.js';

const SCANNER_KEYS = ['sast', 'dast', 'sca'];
const GRID_COLOR = '#2c2c2a';
const AXIS_COLOR = '#383835';
const TICK_COLOR = '#898781';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, count } = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{ background: '#1a1a19', borderColor: '#2c2c2a', color: '#ffffff' }}
    >
      <span className="font-medium">{name}</span>: {count} finding{count === 1 ? '' : 's'}
    </div>
  );
}

export default function ScannerChart({ byScanner }) {
  const counts = Object.fromEntries((byScanner || []).map((row) => [row.scanner_type, row.count]));
  const data = SCANNER_KEYS.map((key) => ({
    key,
    name: SCANNER_META[key].label,
    count: counts[key] || 0,
    color: SCANNER_META[key].hexDark,
  }));

  return (
    <div className="rounded-xl border border-hairline-dark bg-surface-dark p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="mb-3 text-sm font-medium text-ink-secondary-dark">Findings by scanner</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="32%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: TICK_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: TICK_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0d' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4">
        {SCANNER_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-ink-secondary-dark">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCANNER_META[key].hexDark }} />
            {SCANNER_META[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}
