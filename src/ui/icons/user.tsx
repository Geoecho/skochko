// A quiet, recognisable account outline; the circular button supplies its frame.
export function UserIcon({size=24}:{size?:number}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <g data-motion="portrait"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></g>
 </svg>;
}
