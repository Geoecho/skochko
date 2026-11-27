import OpeningHours from 'opening_hours';
function localClock(now: Date) {
 const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Skopje',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'}).formatToParts(now);
 const n=(key:string)=>Number(parts.find(p=>p.type===key)?.value);
 return new Date(n('year'),n('month')-1,n('day'),n('hour'),n('minute'),n('second'));
}
export function foodHours(hours:string|undefined, now = new Date()) {
 if (!hours || /sunrise|sunset|dawn|dusk|PH|SH/.test(hours)) return {status:'unknown' as const,late:false};
 try {
  const rule = new OpeningHours(hours, null, 0);
  const clock=localClock(now);
  const status=rule.getUnknown(clock)?'unknown':rule.getState(clock)?'open':'closed';
  const evening=new Date(clock); if(clock.getHours()<6) evening.setDate(evening.getDate()-1);
  evening.setHours(22,0,0,0);
  const late=[0,1,2,3,4,5].some(offset=>{const d=new Date(evening.getTime()+offset*3600000);return !rule.getUnknown(d)&&rule.getState(d);});
  return {status,late};
 } catch {return {status:'unknown' as const,late:false};}
}
