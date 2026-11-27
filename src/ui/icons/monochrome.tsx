type Props = {size?:number};
export function FoodIcon({size=24}:Props) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 18h18M5 15a7 7 0 0 1 14 0H5ZM12 8V6m-1 0h2" />
  <path data-motion="steam" d="M8 4V2m8 2V2" />
 </svg>;
}
export function ShieldIcon({size=24}:Props) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 3 4.5 6v5.5c0 4.5 3 7.5 7.5 9.5 4.5-2 7.5-5 7.5-9.5V6L12 3Z" />
  <path data-motion="check" pathLength="1" d="m8.5 12 2.3 2.3 4.7-4.7" />
 </svg>;
}
export function FinishIcon({size=24}:Props) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
  <path d="M6 21V3m-3 18h6" />
  <path data-motion="flag" d="M6 4c4-3 7 3 12 0v10c-5 3-8-3-12 0" />
  <path data-motion="check" pathLength="1" d="m9 8 2 2 3-3" />
  <path data-motion="spark" d="M20 18v4m-2-2h4" />
 </svg>;
}
