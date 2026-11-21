import { useTranslation } from 'react-i18next';
import { Icon } from '@/ui';
import type { LatLng } from '@/types/domain';

export function DirectionsLink({ destination }: { destination: LatLng }) {
  const { t } = useTranslation();
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'walking',
    dir_action: 'navigate',
  });

  return (
    <a className="walking-directions" href={`https://www.google.com/maps/dir/?${params}`} target="_blank" rel="noopener noreferrer">
      <Icon name="map" size={18} />
      {t('venue.directions')}
    </a>
  );
}
