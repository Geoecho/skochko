import {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton, Button, Chip, Text } from '@/ui';
import { RoutesTab } from '@/features/community/RoutesTab';
import { ExploreCarousels } from './ExploreCarousels';
import { LiveEventBanners } from '@/features/events/LiveEventBanners';
import { categoryIconUri } from '@/features/map/categoryIcons';
import { colors, radius, space, touch } from '@/theme/tokens';
import type { VenueCategory } from '@/theme/tokens';
import type { LatLng, NearbyVenue, TonightEvent } from '@/types/domain';
import { distanceMeters, type VenueFilters } from '@/features/venues/api';
import { matches, searchKey } from '@/lib/searchText';

export type HomeSheetHandle = {
  focusSearch: () => void;
};

type Tab = 'explore' | 'routes';

type Props = {
  desktop?: boolean;
  origin: LatLng;
  venues: NearbyVenue[];
  events: TonightEvent[];
  filters: VenueFilters;
  venuesLoading: boolean;
  eventsLoading: boolean;
  venuesError: boolean;
  eventsError: boolean;
  onFiltersChange: (filters: VenueFilters) => void;
  onVenuePress: (venue: NearbyVenue) => void;
  onRetryVenues: () => void;
  onRetryEvents: () => void;
  /** Ask the parent sheet to open to a snap point (search focus, filter taps). */
  onExpand?: (snap: 'half' | 'full') => void;
};

const CATEGORY_CHIPS: { category: VenueCategory; labelKey: string }[] = [
  { category: 'bar', labelKey: 'categories.bar' },
  { category: 'pub', labelKey: 'categories.pub' },
  { category: 'club', labelKey: 'categories.club' },
  { category: 'cafe', labelKey: 'categories.cafe' },
  { category: 'wine_bar', labelKey: 'categories.wine_bar' },
  { category: 'rakija_bar', labelKey: 'categories.rakija_bar' },
];

function distanceLabel(distanceM: number): string {
  if (distanceM < 1000) return `${Math.max(10, Math.round(distanceM / 10) * 10)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function timeLabel(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'mk' ? 'mk-MK' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Skopje',
  }).format(new Date(value));
}

const VenueRow = memo(function VenueRow({ venue, onPress }: { venue: NearbyVenue; onPress: () => void }) {
  const { t } = useTranslation();
  const walkMinutes = Math.max(1, Math.ceil(venue.distance_m / 80));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${t(`categories.${venue.category}`)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.venueRow, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.category[venue.category] }]}>
        <Image source={{ uri: categoryIconUri(venue.category, 18, '#0B0B0F') }} style={styles.rowIconImg} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} variant="headline" weight="semibold" style={styles.rowTitle}>
            {venue.name}
          </Text>
          <Text tone="secondary">{'€'.repeat(venue.price_level ?? 1)}</Text>
        </View>
        <Text numberOfLines={1} tone="secondary" variant="caption">
          {t(`categories.${venue.category}`)} · {distanceLabel(venue.distance_m)} · {t('map.venueCard.walkTime', { minutes: walkMinutes })}
        </Text>
        <View style={styles.rowMeta}>
          <Text variant="caption" style={{ color: venue.is_open_now ? colors.success : colors.textTertiary }}>
            {venue.is_open_now ? t('common.openNow') : venue.hours && Object.keys(venue.hours).length ? t('common.closed') : ''}
          </Text>
          {venue.avg_rating != null ? (
            <Text tone="secondary" variant="caption">★ {venue.avg_rating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>
      <Text tone="tertiary" style={styles.chevron}>›</Text>
    </Pressable>
  );
});

const EventCard = memo(function EventCard({
  event,
  origin,
  onPress,
}: {
  event: TonightEvent;
  origin: LatLng;
  onPress: () => void;
}) {
  const { i18n, t } = useTranslation();
  const title = i18n.language.startsWith('en') && event.title_en ? event.title_en : event.title_mk;
  const distance = distanceMeters(origin, event);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${event.venue_name}, ${timeLabel(event.starts_at, i18n.language)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}
    >
      {event.cover_url ? (
        <Image accessibilityIgnoresInvertColors source={{ uri: event.cover_url }} style={styles.eventCover} />
      ) : (
        <View style={styles.eventFallback}>
          <Text tone="accent" variant="title">✦</Text>
        </View>
      )}
      <View style={styles.eventBody}>
        <Text numberOfLines={2} variant="headline" weight="semibold">{title}</Text>
        <Text numberOfLines={1} tone="secondary" variant="caption">{event.venue_name}</Text>
        <Text tone="secondary" variant="caption">
          {timeLabel(event.starts_at, i18n.language)} · {distanceLabel(distance)}
        </Text>
        {event.price == null ? (
          <Text tone="accent" variant="caption">{t('tonight.freeEntry')}</Text>
        ) : null}
      </View>
    </Pressable>
  );
});

function SkeletonList() {
  return (
    <View accessibilityLabel="Loading" style={styles.skeletonList}>
      {[0, 1, 2].map((item) => <View key={item} style={styles.skeleton} />)}
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.state}>
      <Text tone="secondary" style={styles.stateText}>{t('errors.loadFailed')}</Text>
      <Button label={t('common.retry')} onPress={onRetry} variant="secondary" />
    </View>
  );
}

export const HomeSheet = forwardRef<HomeSheetHandle, Props>(function HomeSheet(
  {
    origin,
    venues,
    events,
    filters,
    venuesLoading,
    eventsLoading,
    venuesError,
    eventsError,
    onFiltersChange,
    onVenuePress,
    onRetryVenues,
    onRetryEvents,
    onExpand,
    desktop,
  },
  ref,
) {
  const { i18n, t } = useTranslation();
  const inputRef = useRef<TextInputInstance>(null);
  const [tab, setTab] = useState<Tab>('explore');
  const [search, setSearch] = useState('');
  const activeCategory = filters.categories?.length === 1 ? filters.categories[0] : undefined;
  const searchNeedle = searchKey(search);
  // Carousels when browsing; a flat results list once the user searches or filters.
  const browsing = !searchNeedle && !filters.categories?.length && !filters.openNow;

  useImperativeHandle(ref, () => ({ focusSearch: () => { setTab('explore'); inputRef.current?.focus(); } }), []);

  const filteredVenues = useMemo(() => {
    if (!searchNeedle) return venues;
    const terms = searchNeedle.split(' ');
    return venues.map((venue) => {
      const name = searchKey(venue.name);
      const searchable = searchKey([venue.name, venue.address, t(`categories.${venue.category}`)].filter(Boolean).join(' '));
      const rank = name === searchNeedle ? 3 : name.startsWith(searchNeedle) ? 2 : name.includes(searchNeedle) ? 1 : 0;
      return { venue, rank, matches: terms.every((term) => searchable.includes(term)) };
    }).filter((item) => item.matches)
      .sort((a, b) => b.rank - a.rank || a.venue.distance_m - b.venue.distance_m)
      .map((item) => item.venue);
  }, [searchNeedle, t, venues]);
  const filteredEvents = useMemo(
    () => (searchNeedle ? events.filter((event) => matches(`${event.title_mk} ${event.title_en ?? ''} ${event.venue_name}`, searchNeedle)) : []),
    [events, searchNeedle],
  );
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const openEvent = (event: TonightEvent) => {
    const venue = venuesById.get(event.venue_id);
    if (venue) onVenuePress(venue);
  };

  const showResults = (snap: 'half' | 'full' = 'half') => {
    if (tab !== 'explore') setTab('explore');
    onExpand?.(snap);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (!searchNeedle && searchKey(value)) showResults('full');
  };

  const setCategory = (category: VenueCategory) => {
    onFiltersChange({ ...filters, categories: activeCategory === category ? undefined : [category] });
    showResults();
  };

  const clearAll = () => {
    setSearch('');
    onFiltersChange({});
  };

  const filterControls = (
    <>
      <Chip
        label={t('common.openNow')}
        onPress={() => {
          onFiltersChange({ ...filters, openNow: !filters.openNow });
          showResults();
        }}
        selected={filters.openNow}
      />
      {CATEGORY_CHIPS.map((chip) => (
        <Chip
          key={chip.category}
          label={t(chip.labelKey)}
          onPress={() => setCategory(chip.category)}
          selected={activeCategory === chip.category}
        />
      ))}
    </>
  );

  return (
    <View>
      <View style={styles.searchWrap}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          ref={inputRef}
          accessibilityLabel={t('common.search')}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onSearchChange}
          onFocus={() => setTab('explore')}
          onSubmitEditing={() => { if (searchNeedle) showResults('full'); }}
          placeholder={t('common.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          selectionColor={colors.accent}
          style={styles.searchInput}
          value={search}
        />
        {search.length > 0 && <IconButton icon="close" tone="plain" size={17} label={t('sheet.clearSearch')} onPress={() => { setSearch(''); inputRef.current?.focus(); }} />}
      </View>

      {desktop ? (
        <View style={[styles.chips, styles.desktopChips]}>{filterControls}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.chips} horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
          {filterControls}
        </ScrollView>
      )}

      <View accessibilityRole="tablist" style={styles.segmented}>
        {(['explore', 'routes'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            onPress={() => setTab(item)}
            style={[styles.segment, tab === item && styles.segmentSelected]}
          >
            <Text tone={tab === item ? 'primary' : 'secondary'} variant="caption" weight="semibold">
              {t(`sheet.tabs.${item}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'explore' && !searchNeedle ? <LiveEventBanners venuesById={venuesById} onVenuePress={onVenuePress} /> : null}

      {tab === 'explore' ? (
        venuesLoading ? (
          <View style={styles.listContent}><SkeletonList /></View>
        ) : venuesError ? (
          <View style={styles.listContent}><ErrorState onRetry={onRetryVenues} /></View>
        ) : browsing ? (
          <>
            {eventsError ? <View style={styles.listContent}><ErrorState onRetry={onRetryEvents} /></View> : null}
            <ExploreCarousels
              desktop={desktop}
              venues={venues}
              events={eventsLoading ? [] : events}
              onVenuePress={onVenuePress}
              onEventPress={openEvent}
              onSeeAll={(row) => { onFiltersChange({ ...filters, ...row }); onExpand?.('full'); }}
            />
          </>
        ) : (
          <View style={styles.listContent}>
            <View style={styles.resultsHeader}>
              <Text variant="caption" tone="secondary" weight="semibold">
                {t('sheet.results')} · {filteredVenues.length + filteredEvents.length}
              </Text>
              <Pressable accessibilityRole="button" onPress={clearAll} hitSlop={10}>
                <Text variant="caption" tone="accent" weight="semibold">{t('sheet.clearFilters')}</Text>
              </Pressable>
            </View>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} origin={origin} onPress={() => openEvent(event)} />
            ))}
            {filteredVenues.length ? (
              filteredVenues.map((venue) => <VenueRow key={venue.id} onPress={() => onVenuePress(venue)} venue={venue} />)
            ) : (
              <View style={styles.state}><Text tone="secondary" style={styles.stateText}>{t('empty.venues.message')}</Text></View>
            )}
          </View>
        )
      ) : (
        <View style={styles.routesContent}><RoutesTab origin={origin} /></View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  searchWrap: {
    height: 54,
    marginHorizontal: space.lg,
    borderRadius: radius.sm,
    backgroundColor: '#202029',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    outlineStyle: 'none',
  } as never,
  desktopChips: { flexDirection: 'row', flexWrap: 'wrap' },
  chips: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  segmented: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: 3,
    minHeight: touch.min,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
  },
  segment: { flex: 1, minHeight: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: '#33313F' },
  routesContent: { paddingTop: space.md, alignSelf: 'stretch' },
  listContent: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  venueRow: {
    minHeight: 82,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  rowIconImg: { width: 23, height: 23 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBody: { flex: 1, minWidth: 0, gap: 5 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowTitle: { flex: 1 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevron: { fontSize: 26, marginLeft: space.sm },
  eventCard: {
    minHeight: 112,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: space.sm,
    flexDirection: 'row',
    gap: space.md,
  },
  eventCover: { width: 96, minHeight: 96, borderRadius: radius.sm, backgroundColor: colors.bgElevated },
  eventFallback: { width: 96, minHeight: 96, borderRadius: radius.sm, backgroundColor: '#201A12', alignItems: 'center', justifyContent: 'center' },
  eventBody: { flex: 1, justifyContent: 'center', gap: 3 },
  skeletonList: { gap: space.md },
  skeleton: { height: 94, borderRadius: radius.card, backgroundColor: 'rgba(255,255,255,0.07)' },
  state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  stateText: { textAlign: 'center' },
  routeGlyph: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(181,171,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
