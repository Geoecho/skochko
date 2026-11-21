import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';

export function TopBar({ onProfilePress, onFavouritesPress }: { onProfilePress: () => void; onFavouritesPress: () => void }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  return (
    <View pointerEvents="box-none" style={[styles.bar, safeTop]}>
      <IconButton icon="brand" label={t('auth.openAccount')} size={24} tone="accent" onPress={onProfilePress} />
      <View style={styles.adSlot}>
        <Text variant="caption" tone="secondary">{t('map.adSpace')}</Text>
      </View>
      <IconButton icon="heart" label={t('map.favourites')} showLabel={width >= 450} size={20} onPress={onFavouritesPress} />
    </View>
  );
}

const safeTop = { top: 'max(12px, env(safe-area-inset-top, 0px))' } as object;
const styles = StyleSheet.create({
  bar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, zIndex: 15 },
  adSlot: {
    flex: 1, minWidth: 0, maxWidth: 420, minHeight: touch.min + 4, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.bgElevated,
  },
});
