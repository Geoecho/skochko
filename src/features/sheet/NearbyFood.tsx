import {useEffect,useMemo,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Icon,type IconHandle} from '@/ui';
import {searchKey} from '@/lib/searchText';
import {distanceMeters} from '@/features/venues/api';
import type {LatLng} from '@/types/domain';
type Food = {id:string;name:string;lat:number;lng:number;cuisine:string;kind:string;address:string;hours:string;status:'open'|'closed'|'unknown';late:boolean;sourceUrl:string};
type Mode = 'open'|'late'|'all';
function FoodResult({item}:{item:Food&{distance:number}}) {
 const {t}=useTranslation();const icon=useRef<IconHandle>(null);
 const distance=item.distance<1000?Math.max(10,Math.round(item.distance/10)*10)+' m':(item.distance/1000).toFixed(1)+' km';
 return <article className="food-result" onMouseEnter={()=>icon.current?.play()} onFocusCapture={()=>icon.current?.play()}>
  <div className="food-result-top">
   <span className="food-result-icon"><Icon ref={icon} name="food" size={29} color="#191919" /></span>
   <div className="food-result-heading">
    <span className="food-result-kind">{item.cuisine||t('food.'+item.kind)}</span>
    <h3><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.name}</a></h3>
   </div>
   <span className="food-result-distance">{distance}</span>
  </div>
  {item.address&&<p className="food-result-address">{item.address}</p>}
  <div className="food-result-bottom">
   <div className="food-result-meta">
    <span className={'food-result-status '+item.status}><i aria-hidden="true"/>{t('food.status.'+item.status)}</span>
    {item.hours&&<details className="food-result-hours"><summary>{t('food.hours')}</summary><p>{item.hours}</p></details>}
   </div>
   <a className="food-result-directions" href={'https://www.google.com/maps/dir/?api=1&destination='+item.lat+','+item.lng+'&travelmode=walking'} target="_blank" rel="noopener noreferrer" aria-label={t('food.directions',{name:item.name})}>{t('food.go')}<Icon name="arrowLeft" size={17}/></a>
  </div>
 </article>;
}
export function NearbyFood({origin,search='',filter,radiusM=3000,onFilterChange}:{origin:LatLng;search?:string;filter?:Mode;radiusM?:number;onFilterChange?:(mode:Mode)=>void}) {
 const {t}=useTranslation();const section=useRef<HTMLElement>(null);const [visible,setVisible]=useState(false);
 const [localMode,setMode]=useState<Mode>('open');const mode=filter??localMode;
 const [expanded,setExpanded]=useState(false);
 const changeMode=(next:Mode)=>{setMode(next);onFilterChange?.(next);setExpanded(false);};
 useEffect(()=>{
  const node=section.current;if(!node)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'100px'});
  observer.observe(node);return ()=>observer.disconnect();
 },[]);
 const data=useQuery({queryKey:['nearby-food'],enabled:visible,staleTime:60000,refetchInterval:visible?60000:false,retry:1,queryFn:async()=>{
  const response=await fetch('/api/food/nearby');if(!response.ok)throw new Error('Food unavailable');
  return await response.json() as {items:Food[];source:'google'|'osm'};
 }});
 const nearby=useMemo(()=>(data.data?.items??[]).map(item=>({...item,distance:distanceMeters(origin,item)})).filter(item=>item.distance<=radiusM).sort((a,b)=>a.distance-b.distance),[data.data,origin,radiusM]);
 const needle=searchKey(search);
 const results=nearby.filter(item=>(mode==='open'?item.status==='open':mode==='late'?item.late:true)&&(!needle||searchKey(item.name+' '+item.cuisine+' '+item.address).includes(needle)));
 return <section ref={section} className="nearby-food food-category-results" aria-busy={data.isFetching}>
  <header className="food-category-heading"><div><p>{t('food.eyebrow')}</p><h2>{t('food.title')}</h2></div><span className="food-category-emblem"><Icon name="food" size={31} color="#191919" playOnMount/></span></header>
  <p className="food-category-caption">{t('food.around',{distance:(radiusM/1000).toFixed(0)})}{!data.isPending&&!data.isError&&' · '+t('food.results',{count:results.length})}</p>
  {!filter&&<div className="food-filters">{(['open','late','all'] as const).map(key=><button type="button" key={key} aria-pressed={mode===key} onClick={()=>changeMode(key)}>{t('food.'+key)}</button>)}</div>}
  {data.isError?<div className="food-category-empty"><Icon name="food" size={30}/><p>{t('food.error')}</p><button type="button" onClick={()=>void data.refetch()}>{t('food.retry')}</button></div>
  :data.isPending?<div className="food-result-list food-skeleton" aria-label={t('common.loading')}>{[0,1,2].map(n=><div key={n}><span/><span/><span/></div>)}</div>
  :!results.length?<div className="food-category-empty"><Icon name="food" size={30}/><p>{t(mode==='open'?'food.noOpen':'food.noResults')}</p>{mode!=='all'&&<button type="button" onClick={()=>changeMode('all')}>{t('food.all')}</button>}</div>
  :<div className="food-result-list">{results.slice(0,expanded?40:6).map(item=><FoodResult key={item.id} item={item}/>)}{results.length>6&&<button className="food-more" type="button" onClick={()=>setExpanded(!expanded)}>{t(expanded?'food.less':'food.more')}</button>}</div>}
  <a className="food-attribution" href={data.data?.source==='google'?'https://maps.google.com':'https://www.openstreetmap.org/copyright'} target="_blank" rel="noopener noreferrer">{data.data?.source==='google'?'Google Maps':'© OpenStreetMap'} · {t('food.verify')}</a>
 </section>;
}
