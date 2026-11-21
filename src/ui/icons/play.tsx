// From lucide-animated (MIT, https://lucide-animated.com). Web-only DOM component.

export function PlayIcon({ size = 28 }: { size?: number }) {
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
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
