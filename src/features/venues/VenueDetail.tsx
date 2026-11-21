import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Glass, IconButton, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import type { NearbyVenue, TonightEvent } from '@/types/domain';
import { MAX_STOPS, useRouteBuilder } from '@/state/routeBuilder';
import { useFavourites } from './favourites';

type Props = {
  venue: NearbyVenue;
  event?: TonightEvent;
  onBack: () => void;
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function todayHours(venue: NearbyVenue): string | null {
  if (!venue.hours) return null;
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Europe/Skopje',
  }).format(new Date()).toLowerCase();
  const key = DAY_KEYS.find((candidate) => weekday.startsWith(candidate));
  if (!key) return null;
  const intervals = venue.hours[key];
  if (!intervals?.length) return null;
  return intervals.map(([opens, closes]) => `${opens}–${closes}`).join(', ');
}

export function VenueDetail({ venue, event, onBack }: Props) {
  const { i18n, t } = useTranslation();
  const favourites = useFavourites();
  const saved = favourites.venues.some(item => item.id === venue.id);
  const hours = todayHours(venue);
  const hasHours = !!venue.hours && Object.keys(venue.hours).length > 0;
  const walkMinutes = Math.max(1, Math.ceil(venue.distance_m / 80));
  const eventTitle = event
    ? i18n.language.startsWith('en') && event.title_en
      ? event.title_en
      : event.title_mk
    : i18n.language.startsWith('en') && venue.tonight_event_title_en
      ? venue.tonight_event_title_en
      : venue.tonight_event_title_mk;

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <IconButton icon="back" showLabel label={t('common.back')} size={19} tone="plain" style={styles.backButton} onPress={onBack} />
        <IconButton
          icon="heart"
          label={saved ? t('venue.removeFavourite') : t('venue.favourite')}
          size={22}
          tone="plain"
          selected={saved}
          disabled={favourites.saving || favourites.loading || favourites.error}
          onPress={() => favourites.toggle(venue)}
        />
      </View>
      {favourites.saveError && <Text tone="danger" variant="caption" accessibilityRole="alert" style={styles.saveError}>{t('map.favouritesError')}</Text>}
      {venue.photos?.[0] && (
        <View style={styles.hero}>
          <Image accessibilityLabel={venue.name} source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="display" weight="bold">{venue.name}</Text>
          <Text tone="secondary">
            {t(`categories.${venue.category}`)}{venue.price_level ? ` · ${'€'.repeat(venue.price_level)}` : ''}
          </Text>
        </View>

        <View style={styles.factGrid}>
          <Glass style={styles.fact}>
            <Text variant="caption" tone="tertiary">{t('common.today')}</Text>
            {/* Unknown hours (common for OSM data) must not read as "Closed". */}
            <Text weight="semibold" style={{ color: venue.is_open_now ? colors.success : colors.text }}>
              {venue.is_open_now ? t('common.openNow') : hasHours ? t('common.closed') : '—'}
            </Text>
            <Text tone="secondary" variant="caption">{hours ?? t('venue.hoursUnknown')}</Text>
          </Glass>
          <Glass style={styles.fact}>
            <Text variant="caption" tone="tertiary">{t('venue.distance')}</Text>
            <Text weight="semibold">
              {venue.distance_m < 1000 ? `${Math.round(venue.distance_m)} m` : `${(venue.distance_m / 1000).toFixed(1)} km`}
            </Text>
            <Text tone="secondary" variant="caption">{t('map.venueCard.walkTime', { minutes: walkMinutes })}</Text>
          </Glass>
          {venue.rating_count ? (
            <Glass style={styles.fact}>
              <Text variant="caption" tone="tertiary">{t('venue.rating')}</Text>
              <Text weight="semibold">{venue.avg_rating == null ? '—' : `★ ${venue.avg_rating.toFixed(1)}`}</Text>
              <Text tone="secondary" variant="caption">
                {venue.rating_count ? t('venue.reviews', { count: venue.rating_count }) : '—'}
              </Text>
            </Glass>
          ) : null}
        </View>

        {eventTitle ? (
          <View style={styles.tonightCard}>
            <View style={styles.tonightIcon}><Text tone="accent">✦</Text></View>
            <View style={styles.eventText}>
              <Text tone="accent" variant="caption" weight="semibold">{t('venue.tonightEvent')}</Text>
              <Text variant="headline" weight="semibold">{eventTitle}</Text>
              {event ? <Text tone="secondary" variant="caption">{t('tonight.startsAt', { time: new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Skopje' }).format(new Date(event.starts_at)) })}</Text> : null}
            </View>
          </View>
        ) : null}

        {venue.address ? <Text tone="secondary">{venue.address}</Text> : null}

      </View>
    </View>
  );
}

export function VenueActions({ venue, onViewRoute }: { venue: NearbyVenue; onViewRoute: () => void }) {
  const { t } = useTranslation();
  const add = useRouteBuilder(state => state.add);
  const stops = useRouteBuilder(state => state.stops);
  const added = stops.some(stop => stop.venue.id === venue.id);
  const atLimit = stops.length >= MAX_STOPS;

  return (
    <div className="venue-action-dock">
      <Button
          full
          variant={added || atLimit ? "ghost" : "primary"}
          label={added || atLimit ? t('route.viewRouteCount', { count: stops.length }) : t('route.addStop')}
          onPress={() => added || atLimit ? onViewRoute() : add(venue)}
        />
    </div>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: space.xl },
  hero: { height: 210, marginHorizontal: space.lg, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.bgElevated },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingHorizontal: space.lg, marginBottom: space.md },
  backButton: { marginLeft: -space.lg },
  saveError: { marginHorizontal: space.lg, marginBottom: space.md },
  body: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.lg },
  titleBlock: { gap: space.xs },
  factGrid: { flexDirection: 'row', gap: space.sm },
  fact: { flex: 1, minHeight: 92, borderRadius: radius.card, padding: space.md, gap: 2 },
  tonightCard: { borderRadius: radius.card, padding: space.md, backgroundColor: 'rgba(181,171,255,0.09)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(181,171,255,0.25)', flexDirection: 'row', alignItems: 'center', gap: space.md },
  tonightIcon: { width: touch.min, height: touch.min, borderRadius: radius.pill, backgroundColor: 'rgba(181,171,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  eventText: { flex: 1, gap: 2 },
});
