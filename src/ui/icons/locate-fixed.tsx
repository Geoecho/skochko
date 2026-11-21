// Web-only DOM component.

// Lucide "locate-fixed" (ISC) animated in the lucide-animated style; the library has no locate icon.

export function LocateFixedIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <line x1="2" x2="5" y1="12" y2="12" />
        <line x1="19" x2="22" y1="12" y2="12" />
        <line x1="12" x2="12" y1="2" y2="5" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </g>
      <circle cx="12" cy="12" r="7" />
      <circle
        cx="12"
        cy="12"
        fill="currentColor"
        r="3"
      />
    </svg>
  );
}
