function base(children, { size = 16, className = '' } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function AlertTriangleIcon(props) {
  return base(
    <>
      <path d="M8.68 3.5a1.5 1.5 0 0 1 2.64 0l6.1 11.2A1.5 1.5 0 0 1 16.1 17H3.9a1.5 1.5 0 0 1-1.32-2.3z" />
      <path d="M10 8v3.2" />
      <circle cx="10" cy="13.8" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function AlertCircleIcon(props) {
  return base(
    <>
      <circle cx="10" cy="10" r="7.3" />
      <path d="M10 6.8v3.6" />
      <circle cx="10" cy="13.4" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function CheckCircleIcon(props) {
  return base(
    <>
      <circle cx="10" cy="10" r="7.3" />
      <path d="M7 10.2l2 2 4-4.4" />
    </>,
    props
  );
}

export function InfoCircleIcon(props) {
  return base(
    <>
      <circle cx="10" cy="10" r="7.3" />
      <path d="M10 9.2v4" />
      <circle cx="10" cy="6.6" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function GitBranchIcon(props) {
  return base(
    <>
      <circle cx="6" cy="5" r="1.8" />
      <circle cx="6" cy="15" r="1.8" />
      <circle cx="14" cy="10" r="1.8" />
      <path d="M6 6.8v6.4" />
      <path d="M6 10.5c0-2.5 2-4 5-4h1.2" />
    </>,
    props
  );
}

export function PlusIcon(props) {
  return base(
    <>
      <path d="M10 4.5v11M4.5 10h11" />
    </>,
    props
  );
}

export function TrashIcon(props) {
  return base(
    <>
      <path d="M4 6h12M8 6V4.6c0-.55.45-1 1-1h2c.55 0 1 .45 1 1V6M6 6l.7 9.1c.05.6.55 1.1 1.15 1.1h4.3c.6 0 1.1-.5 1.15-1.1L14 6" />
    </>,
    props
  );
}

export function XIcon(props) {
  return base(
    <>
      <path d="M5 5l10 10M15 5L5 15" />
    </>,
    props
  );
}

export function ExternalLinkIcon(props) {
  return base(
    <>
      <path d="M8.3 4.5H4.8a1.3 1.3 0 0 0-1.3 1.3v9.4a1.3 1.3 0 0 0 1.3 1.3h9.4a1.3 1.3 0 0 0 1.3-1.3v-3.5" />
      <path d="M11.5 3.5H16.5V8.5" />
      <path d="M16.3 3.7L9.5 10.5" />
    </>,
    props
  );
}

export function CheckIcon(props) {
  return base(
    <>
      <path d="M4 10.5l3.5 3.5L16 5" />
    </>,
    props
  );
}

export function ChevronRightIcon(props) {
  return base(
    <>
      <path d="M7.5 4.5l6 5.5-6 5.5" />
    </>,
    props
  );
}

export function PulseIcon(props) {
  return base(
    <>
      <path d="M2.5 10h3l1.6-4.5L10 15l2.2-7.5L13.5 10h4" />
    </>,
    props
  );
}
