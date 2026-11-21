import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { MapScreen } from '@/features/map/MapScreen';

// Home = map. Everything else lives in the bottom sheet (WORKSHEET section 5).
export default function Home() {
  return (
    <View style={styles.root}>
      <MapScreen />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
