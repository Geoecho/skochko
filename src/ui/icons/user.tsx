// From lucide-animated (MIT, https://lucide-animated.com). Web-only DOM component.

export function UserIcon({ size = 28 }: { size?: number }) {
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
      <circle
        cx="12"
        cy="8"
        r="5"
      />
    
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}
