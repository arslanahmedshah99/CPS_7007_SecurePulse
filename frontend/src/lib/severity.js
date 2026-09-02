export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

export const SEVERITY_META = {
  critical: { label: 'Critical', hex: '#d03b3b', text: 'text-status-critical', bg: 'bg-status-critical/10', ring: 'ring-status-critical/25', icon: 'alert-triangle' },
  high: { label: 'High', hex: '#ec835a', text: 'text-status-serious', bg: 'bg-status-serious/10', ring: 'ring-status-serious/25', icon: 'alert-triangle' },
  medium: { label: 'Medium', hex: '#fab219', text: 'text-status-warning', bg: 'bg-status-warning/10', ring: 'ring-status-warning/25', icon: 'alert-circle' },
  low: { label: 'Low', hex: '#0ca30c', text: 'text-status-good', bg: 'bg-status-good/10', ring: 'ring-status-good/25', icon: 'check-circle' },
  info: { label: 'Info', hex: '#898781', text: 'text-ink-muted', bg: 'bg-ink-muted/10', ring: 'ring-ink-muted/25', icon: 'info-circle' },
};

export const SCANNER_META = {
  sast: { label: 'SAST', hex: '#2a78d6', hexDark: '#3987e5', text: 'text-series-blue', bg: 'bg-series-blue/10' },
  dast: { label: 'DAST', hex: '#eb6834', hexDark: '#d95926', text: 'text-series-orange', bg: 'bg-series-orange/10' },
  sca: { label: 'SCA', hex: '#1baf7a', hexDark: '#199e70', text: 'text-series-aqua', bg: 'bg-series-aqua/10' },
};
