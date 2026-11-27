import { photoSource, photoSrcSet } from '@/features/venues/photoSources';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/ui';

type Photo = { url: string; authors: { name: string; url: string | null }[] };
export function VenueGallery({ venueId, name, photos }: { venueId: string; name: string; photos: string[] | null }) {
  const { t } = useTranslation();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const customPhotos = (photos ?? []).filter(url => !url.startsWith('/api/venues/')).map(url => ({ url, authors: [] }));
  const googlePhoto = customPhotos.length < 3 && !!photos?.some(url => url.startsWith('/api/venues/'));
  const gallery = useQuery<{ photos: Photo[]; sourceUrl: string | null }>({
    queryKey: ['venue-gallery', venueId], enabled: googlePhoto, staleTime: 30 * 60 * 1000, retry: false,
    queryFn: async () => {
      const response = await fetch('/api/venues/' + venueId + '/gallery');
      if (!response.ok) throw new Error('Photos unavailable');
      return response.json();
    },
  });
  const sourcePhotos: Photo[] = gallery.data?.photos.length ? gallery.data.photos : (photos ?? []).filter(url => url.startsWith('/api/venues/')).map(url => ({ url, authors: [] }));
  const images: Photo[] = [...customPhotos, ...sourcePhotos].slice(0, 3);
  if (!images.length) return null;
  const active = Math.min(index, images.length - 1);
  const move = (next: number) => {
    const node = track.current;
    if (!node) return;
    node.scrollTo({ left: Math.max(0, Math.min(images.length - 1, next)) * node.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <section className="venue-gallery" aria-label={t('venue.photos')}>
    <div className="venue-gallery-frame">
      <div ref={track} className="venue-gallery-track" onScroll={event => {
        const node = event.currentTarget;
        if (node.clientWidth) setIndex(Math.round(node.scrollLeft / node.clientWidth));
      }} onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); move(active + (event.key === 'ArrowRight' ? 1 : -1));
        }
      }} tabIndex={0}>
        {images.map((photo, n) => <figure className="venue-gallery-slide" key={photo.url}>
          <img src={photoSource(photo.url,768)} srcSet={photoSrcSet(photo.url)} sizes="(min-width:768px) 600px, calc(100vw - 32px)" alt={t('venue.photoNumber', { name, number: n + 1 })} loading={n === 0 ? 'eager' : 'lazy'} decoding="async" />
        </figure>)}
      </div>
      {images.length > 1 && <>
        <span className="venue-gallery-counter" aria-live="polite">{active + 1} / {images.length}</span>
        <button type="button" className="venue-gallery-prev" disabled={active === 0} aria-label={t('venue.previousPhoto')} onClick={() => move(active - 1)}><Icon name="back" size={18} /></button>
        <button type="button" className="venue-gallery-next" disabled={active === images.length - 1} aria-label={t('venue.nextPhoto')} onClick={() => move(active + 1)}><Icon name="back" size={18} /></button>
      </>}
    </div>
    <div className="venue-gallery-bottom">
      <div className="venue-gallery-dots">
        {images.length > 1 && images.map((photo, n) => <button type="button" key={photo.url} aria-label={t('venue.goToPhoto', { number: n + 1 })}
          aria-current={active === n ? 'true' : undefined} onClick={() => move(n)}><span /></button>)}
      </div>
      {images[active]?.url.startsWith('/api/venues/') && gallery.data?.sourceUrl && <a href={gallery.data.sourceUrl} target="_blank" rel="noopener noreferrer">{t('venue.photoCredit')}</a>}
    </div>
    {!!images[active]?.authors.length && <div className="venue-gallery-credit">
      {images[active].authors.map((author, n) => author.url?.startsWith('https://')
        ? <a key={n} href={author.url} target="_blank" rel="noopener noreferrer">{author.name}</a>
        : <span key={n}>{author.name}</span>)}
    </div>}
  </section>;
}
