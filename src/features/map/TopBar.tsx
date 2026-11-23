import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/ui';
import { space } from '@/theme/tokens';

export function TopBar({ onProfilePress, onFavouritesPress, onSearchPress }: {
  onProfilePress: () => void;
  onFavouritesPress: () => void;
  onSearchPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View pointerEvents="box-none" style={[styles.bar, safeTop]}>
      <IconButton icon="search" label={t('common.search')} showLabel size={19} onPress={onSearchPress} />
      <View pointerEvents="box-none" style={styles.actions}>
        <IconButton icon="heart" label={t('map.favourites')} size={20} onPress={onFavouritesPress} />
        <IconButton icon="user" label={t('auth.openAccount')} size={20} onPress={onProfilePress} />
      </View>
    </View>
  );
}

const safeTop = { top: 'max(12px, env(safe-area-inset-top, 0px))' } as object;
const styles = StyleSheet.create({
  bar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, zIndex: 15 },
  actions: { flexDirection: 'row', gap: space.sm },
});
