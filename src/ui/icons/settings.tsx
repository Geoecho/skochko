export function SettingsIcon({size=24}:{size?:number}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 6h18M3 12h18M3 18h18"/>
  <circle data-motion="knob-a" cx="8" cy="6" r="2.2" fill="#fff"/><circle data-motion="knob-b" cx="16" cy="12" r="2.2" fill="#fff"/><circle data-motion="knob-c" cx="10" cy="18" r="2.2" fill="#fff"/>
 </svg>;
}
