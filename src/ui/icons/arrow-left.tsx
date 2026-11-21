// From lucide-animated (MIT, https://lucide-animated.com). Web-only DOM component.

export function ArrowLeftIcon({ size = 28 }: { size?: number }) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
