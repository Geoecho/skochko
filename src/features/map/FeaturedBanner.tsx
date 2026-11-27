import { photoSource, photoSrcSet } from '@/features/venues/photoSources';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { LatLng, NearbyVenue } from '@/types/domain';
import { Icon } from '@/ui';
import { fetchAppSettings } from '@/features/admin/controlApi';
import { supabase } from '@/lib/supabase';
import { distanceMeters, normalizeVenue } from '@/features/venues/api';

export function FeaturedBanner({ venues, origin, onSelect }: { venues: NearbyVenue[]; origin: LatLng; onSelect: (venue: NearbyVenue) => void }) {
  const { t, i18n } = useTranslation();
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const settings = useQuery({queryKey:['app-settings'],queryFn:fetchAppSettings,staleTime:60000});
  const chosenId = settings.data?.featured_venue_id;
  const localVenue = venues.find(v=>v.id===chosenId);
  const chosen = useQuery({queryKey:['featured-venue',chosenId],enabled:!!chosenId&&!localVenue,staleTime:60000,queryFn:async()=>{
    const {data,error}=await supabase.from('venues').select('*').eq('id',chosenId!).eq('status','active').maybeSingle();
    if(error)throw error;
    if (!data || data.lat == null || data.lng == null) return null;
    const {data:nearby,error:hoursError}=await supabase.rpc('venues_nearby',{
      origin_lat:data.lat,origin_lng:data.lng,radius_m:100,open_now:false,
    });
    if(hoursError)throw hoursError;
    const current=(nearby??[]).find(v=>v.id===chosenId);
    if(!current)return null;
    const google = data.google_details as {rating?:number;count?:number}|null;
    return normalizeVenue({...current,photos:data.photos,avg_rating:google?.rating??current.avg_rating,rating_count:google?.count??current.rating_count});
  }});
  const fallback = venues.filter(v => v.category === 'cafe')
    .sort((a,b) => Number(b.is_open_now)-Number(a.is_open_now) || Number(b.is_promoted)-Number(a.is_promoted) || (b.avg_rating ?? 0)-(a.avg_rating ?? 0)).slice(0, 3);
  const chosenVenue = localVenue ?? chosen.data;
  const slides = chosenId && chosenVenue ? [chosenVenue, ...fallback.filter(v => v.id !== chosenId)].slice(0,3) : fallback;
  if (!slides.length || settings.data?.featured_enabled === false) return null;
  const go = (index: number) => track.current?.scrollTo({left:(track.current.children[index] as HTMLElement | undefined)?.offsetLeft ?? 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  const title = (i18n.language.startsWith('en')?settings.data?.featured_title_en:settings.data?.featured_title_mk)||t('map.featuredTitle');
  return <section className="featured-collection" aria-label={title}>
    <div className="featured-track" ref={track} onScroll={e => { const node=e.currentTarget; setPage(Math.round(node.scrollLeft / Math.max(1,(node.children[1] as HTMLElement | undefined)?.offsetLeft ?? node.clientWidth))); }}>
    {slides.map(venue => <button key={venue.id} type="button" className="map-featured-banner" onClick={() => onSelect({...venue,distance_m:distanceMeters(origin,venue)})}>
    {venue.photos?.[0] && <img src={photoSource(venue.photos[0],768)} srcSet={photoSrcSet(venue.photos[0])} sizes="(min-width:768px) 600px, calc(100vw - 32px)" decoding="async" alt="" loading="lazy" />}
    <span className="map-featured-shade" />
    <span className="map-featured-copy">
      <span className="map-featured-eyebrow">{title}</span><strong>{venue.name}</strong>
      <span>{venue.avg_rating != null ? '★ ' + venue.avg_rating.toFixed(1) + ' · ' : ''}{t(venue.is_open_now ? 'common.openNow' : 'common.closed')}</span>
    </span><span className="map-featured-arrow"><Icon name="back" size={21} /></span>
  </button>)}</div>
    {slides.length > 1 && <div className="featured-pagination">{slides.map((venue, index) => <button key={venue.id} type="button" aria-label={venue.name} aria-current={page === index ? 'true' : undefined} onClick={() => go(index)}><span /></button>)}</div>}
  </section>;
}
