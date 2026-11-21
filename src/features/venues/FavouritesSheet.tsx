import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Text } from '@/ui';
import { colors, radius, space } from '@/theme/tokens';
import type { NearbyVenue } from '@/types/domain';
import { useFavourites } from './favourites';

export function FavouritesSheet({ onClose, onSelect }: { onClose: () => void; onSelect: (venue: NearbyVenue) => void }) {
  const { t } = useTranslation();
  const favourites = useFavourites();
  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text variant="title" weight="bold">{t('map.favourites')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={styles.close}>
          <Icon name="close" size={20} color={colors.text} />
        </Pressable>
      </View>
      {favourites.loading ? <Text tone="secondary">{t('map.favouritesLoading')}</Text>
        : favourites.error ? <Button variant="secondary" full label={t('map.favouritesRetry')} onPress={() => void favourites.retry()} />
        : !favourites.venues.length ? <Text tone="secondary">{t('map.favouritesEmpty')}</Text>
        : favourites.venues.map(venue => (
          <Pressable key={venue.id} accessibilityRole="button" onPress={() => onSelect(venue)} style={styles.row}>
            <View style={styles.details}>
              <Text weight="semibold">{venue.name}</Text>
              <Text tone="secondary" variant="caption">{t('categories.' + venue.category)}</Text>
            </View>
            <Icon name="heart" size={18} color={colors.accent} />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingHorizontal: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 64, borderRadius: radius.sm, backgroundColor: colors.glassInner },
  details: { flex: 1, minWidth: 0 },
});
