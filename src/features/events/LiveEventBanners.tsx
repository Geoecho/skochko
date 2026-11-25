import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/ui';
import { colors, radius, space } from '@/theme/tokens';
import { useLiveEventBanners } from './api';
import type { NearbyVenue } from '@/types/domain';

export function LiveEventBanners({ venuesById, onVenuePress }: {
  venuesById: ReadonlyMap<string, NearbyVenue>;
  onVenuePress: (venue: NearbyVenue) => void;
}) {
  const { i18n, t } = useTranslation();
  const { data: events } = useLiveEventBanners();
  if (!events?.length) return null;
  const clock = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Skopje' });

  return (
    <View style={styles.section}>
      <Text variant="headline" weight="bold" style={styles.heading}>{t('tonight.happeningNow')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {events.map(event => {
          const venue = venuesById.get(event.venue_id);
          const title = i18n.language.startsWith('en') && event.title_en ? event.title_en : event.title_mk;
          const content = (
            <>
              {event.cover_url ? <Image source={{ uri: event.cover_url }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
              <View style={styles.caption}>
                <Text weight="bold" numberOfLines={2}>{title}</Text>
                {event.ends_at && (
                  <Text tone="secondary" variant="caption">{t('tonight.endsAt', { time: clock.format(new Date(event.ends_at)) })}</Text>
                )}
              </View>
            </>
          );
          return venue ? (
            <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={title} style={styles.card} onPress={() => onVenuePress(venue)}>
              {content}
            </Pressable>
          ) : <View key={event.id} style={styles.card}>{content}</View>;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm, marginVertical: space.md },
  heading: { marginHorizontal: space.lg },
  cards: { paddingHorizontal: space.lg, gap: space.sm },
  card: { width: 258, minHeight: 128, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: radius.card, backgroundColor: colors.bgElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  caption: { padding: space.md, gap: space.xs, backgroundColor: 'rgba(11,11,15,0.86)' },
});
