import 'server-only';
type Point = {day?:number;hour?:number;minute?:number;date?:{year:number;month:number;day:number}};
type Hours = {periods?:{open:Point;close?:Point}[];weekdayDescriptions?:string[]};
type Place = {id:string;displayName?:{text?:string};location?:{latitude:number;longitude:number};formattedAddress?:string;primaryType?:string;businessStatus?:string;currentOpeningHours?:Hours;googleMapsUri?:string};
function skopjeClock(now:Date) {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Skopje',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(now);
 const n=(key:string)=>Number(parts.find(p=>p.type===key)?.value);
 return new Date(n('year'),n('month')-1,n('day'),n('hour'),n('minute'));
}
export function googleFoodStatus(hours:Hours|undefined,now=new Date()) {
 const periods=hours?.periods;
 if(!periods?.length)return {status:'unknown' as const,late:false};
 const clock=skopjeClock(now);
 const dated=(point:Point)=>point.date?new Date(point.date.year,point.date.month-1,point.date.day,point.hour??0,point.minute??0).getTime():null;
 const intervals=periods.flatMap(p=>{
  if(!p.close&&p.open.day===0&&(p.open.hour??0)===0)return [{start:-Infinity,end:Infinity}];
  const start=dated(p.open),end=p.close?dated(p.close):null;
  return start!=null&&end!=null?[{start,end}]:[];
 });
 if(!intervals.length)return {status:'unknown' as const,late:false};
 const isOpen=(date:Date)=>intervals.some(p=>date.getTime()>=p.start&&date.getTime()<p.end);
 const evening=new Date(clock);if(clock.getHours()<6)evening.setDate(evening.getDate()-1);evening.setHours(22,0,0,0);
 return {status:isOpen(clock)?'open':'closed',late:[0,1,2,3,4,5].some(h=>isOpen(new Date(evening.getTime()+h*3600000)))};
}
export async function googleFood() {
 const key=process.env.GOOGLE_PLACES_API_KEY;if(!key)throw new Error('No food source available');
 const groups=await Promise.all(['fast food takeaway in Skopje','bakeries in Skopje'].map(async textQuery=>{
  const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.primaryType,places.businessStatus,places.currentOpeningHours,places.googleMapsUri'},body:JSON.stringify({textQuery,pageSize:20,languageCode:'en',locationBias:{circle:{center:{latitude:41.9981,longitude:21.4254},radius:6000}}}),next:{revalidate:86400},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error('Food source unavailable');
  const payload=await response.json() as {places?:Place[]};
  return payload.places??[];
 }));
 const places=[...new Map(groups.flat().map(p=>[p.id,p])).values()];
 return places.flatMap(place=>{
  if(!place.displayName?.text||!place.location||place.businessStatus!=='OPERATIONAL')return [];
  return [{id:'google/'+place.id,name:place.displayName.text,lat:place.location.latitude,lng:place.location.longitude,cuisine:'',kind:place.primaryType==='bakery'?'bakery':'food',address:place.formattedAddress??'',hours:place.currentOpeningHours?.weekdayDescriptions?.join(' · ')??'',...googleFoodStatus(place.currentOpeningHours),sourceUrl:place.googleMapsUri??'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place.displayName.text)+'&query_place_id='+place.id}];
 });
}
