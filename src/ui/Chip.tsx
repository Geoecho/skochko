import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, space, touch } from '@/theme/tokens';
import { Text } from './Text';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: selected ? colors.text : 'rgba(255,255,255,0.08)', opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text variant="caption" weight="semibold" style={{ color: selected ? colors.bg : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min - 8,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
});
