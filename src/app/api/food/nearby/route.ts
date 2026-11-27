import { NextResponse } from 'next/server';
import { googleFood } from '@/lib/google-food';
import { foodHours } from '@/lib/food-hours';

export const maxDuration = 30;
const query = '[out:json][timeout:10];(nwr["amenity"~"^(fast_food|restaurant)$"]["name"](41.95,21.33,42.05,21.52);nwr["shop"="bakery"]["name"](41.95,21.33,42.05,21.52););out center tags;';
type Element = {type:string;id:number;lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>};
export async function GET() {
 try {
  const items=await googleFood();
  if(items.length)return NextResponse.json({items,source:'google',checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});
 } catch { /* Fall back to the independent open directory. */ }
 for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
  try {
   const response=await fetch(endpoint,{method:'POST',headers:{'User-Agent':'Skochko/1.0 (https://skochko.vercel.app; nearby food directory)','Accept':'application/json'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(5000),next:{revalidate:3600}});
   if(!response.ok)continue;
   const payload=await response.json() as {elements:Element[]};
   if(!Array.isArray(payload.elements))continue;
   const items=payload.elements.flatMap(element=>{
    const tags=element.tags??{}, lat=element.lat??element.center?.lat,lng=element.lon??element.center?.lon;
    if(!tags.name||lat==null||lng==null)return [];
    return [{id:element.type+'/'+element.id,name:tags.name,lat,lng,cuisine:tags.cuisine?.replaceAll(';',', ').replaceAll('_',' ')??'',kind:tags.shop==='bakery'?'bakery':'food',address:[tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(' '),hours:tags.opening_hours??'',...foodHours(tags.opening_hours),sourceUrl:'https://www.openstreetmap.org/'+element.type+'/'+element.id}];
   });
   return NextResponse.json({items,source:'osm',checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});
  } catch { /* Try the independent public mirror. */ }
 }
 return NextResponse.json({error:'Nearby food is temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
}
