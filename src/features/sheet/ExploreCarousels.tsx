import { memo, useMemo } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/ui';
import { colors, radius, space, type VenueCategory } from '@/theme/tokens';
import type { NearbyVenue, TonightEvent } from '@/types/domain';
import { getFeaturedVenues } from '@/features/venues/featured';
import { categoryIconUri } from '@/features/map/categoryIcons';

// Vertical list of category rows; each row is a horizontal, snapping carousel of picture cards.
// Rows with no venues are hidden. "See all" switches the sheet to the filtered list.

type Row = { key: string; titleKey: string; icon: VenueCategory; categories?: VenueCategory[]; openNow?: boolean };

const ROWS: Row[] = [
  { key: 'open', titleKey: 'sheet.rows.openNearby', icon: 'bar', openNow: true },
  { key: 'pubs', titleKey: 'sheet.rows.pubs', icon: 'pub', categories: ['pub', 'brewery'] },
  { key: 'bars', titleKey: 'sheet.rows.bars', icon: 'bar', categories: ['bar', 'cocktail_bar'] },
  { key: 'wine', titleKey: 'sheet.rows.wine', icon: 'wine_bar', categories: ['wine_bar'] },
  { key: 'rakija', titleKey: 'sheet.rows.rakija', icon: 'rakija_bar', categories: ['rakija_bar'] },
  { key: 'clubs', titleKey: 'sheet.rows.clubs', icon: 'club', categories: ['club'] },
  { key: 'cafes', titleKey: 'sheet.rows.cafes', icon: 'cafe', categories: ['cafe'] },
];

const PER_ROW = 12;

export function distanceLabel(distanceM: number): string {
  if (distanceM < 1000) return `${Math.max(10, Math.round(distanceM / 10) * 10)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function useCardWidth() {
  const { width } = useWindowDimensions();
  return Math.min(250, Math.round(Math.min(width, 520) * 0.6));
}

const VenueCard = memo(function VenueCard({ venue, width, onPress }: { venue: NearbyVenue; width?: number; onPress: () => void }) {
  const { t } = useTranslation();
  const photo = venue.photos?.[0];
  const tint = colors.category[venue.category];
  const walk = Math.max(1, Math.ceil(venue.distance_m / 80));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${t(`categories.${venue.category}`)}, ${distanceLabel(venue.distance_m)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.media}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          // No photo yet (most venues): category-tinted art with the venue's symbol.
          <View style={[StyleSheet.absoluteFill, styles.art, webArt(tint)]}>
            <Image source={{ uri: categoryIconUri(venue.category, 44) }} style={styles.artIcon} />
          </View>
        )}
        <View style={styles.badges}>
          {venue.is_promoted ? (
            <View style={[styles.badge, styles.badgeAccent]}>
              <Text variant="caption" weight="semibold" tone="onAccent">{t('common.promoted')}</Text>
            </View>
          ) : null}
          {venue.tonight_event_id ? (
            <View style={styles.badge}>
              <Text variant="caption" weight="semibold">✦ {t('common.tonight')}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text weight="semibold" variant="headline" numberOfLines={1}>{venue.name}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {t(`categories.${venue.category}`)} · {distanceLabel(venue.distance_m)} · {t('map.venueCard.walkTime', { minutes: walk })}
        </Text>
        <View style={styles.metaLine}>
          {venue.is_open_now ? <Text variant="caption" style={{ color: colors.success }}>{t('common.openNow')}</Text> : <View />}
          <Text variant="caption" tone="secondary">
            {venue.avg_rating != null ? `★ ${venue.avg_rating.toFixed(1)}  ` : ''}{'€'.repeat(venue.price_level ?? 1)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const EventCard = memo(function EventCard({ event, width, onPress }: { event: TonightEvent; width?: number; onPress: () => void }) {
  const { i18n } = useTranslation();
  const title = i18n.language.startsWith('en') && event.title_en ? event.title_en : event.title_mk;
  const time = new Intl.DateTimeFormat(i18n.language === 'mk' ? 'mk-MK' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Skopje' }).format(new Date(event.starts_at));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${event.venue_name}, ${time}`} onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={styles.media}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.art, webArt(colors.accent)]}>
            <Text style={styles.eventGlyph}>✦</Text>
          </View>
        )}
        <View style={styles.badges}>
          <View style={[styles.badge, styles.badgeAccent]}><Text variant="caption" weight="bold" tone="onAccent">{time}</Text></View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text weight="semibold" variant="headline" numberOfLines={1}>{title}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>{event.venue_name}</Text>
      </View>
    </Pressable>
  );
});

function CardCollection({ children, cardWidth, desktop }: { children: React.ReactNode; cardWidth: number; desktop: boolean }) {
  if (desktop) return <View style={[styles.grid, twoColumns]}>{children}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + space.md}
      snapToAlignment="start"
      contentContainerStyle={styles.carousel}
      style={styles.carouselScroll}
    >
      {children}
    </ScrollView>
  );
}

function RowHeader({ icon, title, count, onSeeAll }: { icon?: VenueCategory; title: string; count?: number; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.rowHeader}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: colors.category[icon] }]}>
          <Image source={{ uri: categoryIconUri(icon, 16, '#0B0B0F') }} style={styles.rowIconImg} />
        </View>
      ) : (
        <View style={[styles.rowIcon, { backgroundColor: colors.accentFill }]}><Text variant="caption" weight="bold" tone="onAccent">✦</Text></View>
      )}
      <Text variant="headline" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
        {title}{count != null ? <Text tone="tertiary" variant="headline">  {count}</Text> : null}
      </Text>
      {onSeeAll ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll} hitSlop={10} style={styles.seeAll}>
          <Text variant="caption" weight="semibold" tone="accent">{t('sheet.seeAll')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ExploreCarousels({
  venues,
  events,
  onVenuePress,
  onEventPress,
  onSeeAll,
  desktop = false,
}: {
  desktop?: boolean;
  venues: NearbyVenue[];
  events: TonightEvent[];
  onVenuePress: (venue: NearbyVenue) => void;
  onEventPress: (event: TonightEvent) => void;
  onSeeAll: (row: { categories?: VenueCategory[]; openNow?: boolean }) => void;
}) {
  const { t } = useTranslation();
  const cardWidth = useCardWidth();

  const featured = useMemo(() => getFeaturedVenues(venues), [venues]);

  const rows = useMemo(
    () =>
      ROWS.map((row) => {
        const all = venues.filter(
          (v) => (!row.categories || row.categories.includes(v.category)) && (!row.openNow || v.is_open_now),
        );
        // Promoted first, then photos, then distance (venues arrive distance-sorted).
        const items = [...all]
          .sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted) || Number(!!b.photos?.length) - Number(!!a.photos?.length))
          .slice(0, PER_ROW);
        return { row, items, total: all.length };
      }).filter((r) => r.items.length > 0),
    [venues],
  );

  return (
    <View style={styles.root}>
      {featured.length > 0 && (
        <View style={styles.section}>
          <RowHeader title={t('sheet.rows.featured')} />
          <CardCollection cardWidth={cardWidth} desktop={desktop}>
            {featured.map(venue => <VenueCard key={venue.id} venue={venue} width={desktop ? undefined : cardWidth} onPress={() => onVenuePress(venue)} />)}
          </CardCollection>
        </View>
      )}
      {events.length ? (
        <View style={styles.section}>
          <RowHeader title={t('sheet.rows.tonight')} count={events.length} />
          <CardCollection cardWidth={cardWidth} desktop={desktop}>
            {events.map((e) => <EventCard key={e.id} event={e} width={desktop ? undefined : cardWidth} onPress={() => onEventPress(e)} />)}
          </CardCollection>
        </View>
      ) : null}
      {rows.map(({ row, items, total }) => (
        <View key={row.key} style={styles.section}>
          <RowHeader
            icon={row.icon}
            title={t(row.titleKey)}
            count={total}
            onSeeAll={total > (desktop ? 4 : items.length) || row.categories ? () => onSeeAll({ categories: row.categories, openNow: row.openNow }) : undefined}
          />
          <CardCollection cardWidth={cardWidth} desktop={desktop}>
            {(desktop ? items.slice(0, 4) : items).map((v) => <VenueCard key={v.id} venue={v} width={desktop ? undefined : cardWidth} onPress={() => onVenuePress(v)} />)}
          </CardCollection>
        </View>
      ))}
    </View>
  );
}

function webArt(tint: string): object | null {
  return Platform.OS === 'web'
    ? { backgroundImage: `radial-gradient(120% 90% at 20% 10%, ${tint}cc 0%, ${tint}55 38%, rgba(20,20,26,0.9) 100%)` }
    : { backgroundColor: tint };
}

const twoColumns = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } as object;

const styles = StyleSheet.create({
  grid: { paddingHorizontal: space.lg, gap: space.md },
  root: { gap: space.xl, paddingTop: space.md },
  section: { gap: space.sm },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  rowIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowIconImg: { width: 16, height: 16 },
  seeAll: { minHeight: 32, justifyContent: 'center', paddingHorizontal: space.xs },
  carouselScroll: { flexGrow: 0 },
  carousel: { paddingHorizontal: space.lg, gap: space.md },
  card: {
    minWidth: 0,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  media: { height: 112, backgroundColor: 'rgba(255,255,255,0.05)' },
  art: { alignItems: 'center', justifyContent: 'center' },
  artIcon: { width: 44, height: 44, opacity: 0.92 },
  eventGlyph: { fontSize: 44, color: colors.text, opacity: 0.9 },
  badges: { position: 'absolute', top: space.sm, left: space.sm, right: space.sm, flexDirection: 'row', gap: space.xs },
  badge: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3, backgroundColor: 'rgba(11,11,15,0.62)' },
  badgeAccent: { backgroundColor: colors.accentFill },
  cardBody: { padding: space.md, gap: 2 },
  metaLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  pressed: { opacity: 0.75 },
});
