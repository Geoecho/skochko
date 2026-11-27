// Lucide Animated eye geometry (MIT, lucide-animated.com); blink driven by the shared WAAPI controller.
export function EyeIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>;
}
export function EyeOffIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 2 20 20M10.58 10.58a2 2 0 0 0 2.84 2.84M9.88 5.09A10.94 10.94 0 0 1 12 5c4.48 0 8.27 2.94 10 7a12.8 12.8 0 0 1-4.17 5.12M6.61 6.61A13.53 13.53 0 0 0 2 12c1.73 4.06 5.52 7 10 7a10.94 10.94 0 0 0 5.39-1.39" />
  </svg>;
}
