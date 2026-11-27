import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/ui';
import { space } from '@/theme/tokens';

export function TopBar({ onProfilePress, onFavouritesPress, onSettingsPress }: {
 onProfilePress: () => void; onFavouritesPress: () => void; onSettingsPress: () => void;
}) {
 const {t}=useTranslation();
 return <View pointerEvents="box-none" style={[styles.bar,safeTop]}>
  <IconButton icon="user" label={t('auth.openAccount')} size={21} onPress={onProfilePress} />
  <View pointerEvents="box-none" style={styles.actions}>
   <IconButton icon="heart" label={t('map.favourites')} size={21} onPress={onFavouritesPress} />
   <IconButton icon="settings" label={t('profile.settings')} size={21} onPress={onSettingsPress} />
  </View>
 </View>;
}
const safeTop={top:'max(12px, env(safe-area-inset-top, 0px))'} as object;
const styles=StyleSheet.create({
 bar:{position:'absolute',left:space.lg,right:space.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',zIndex:15},
 actions:{flexDirection:'row',gap:space.sm},
});
