import { useRef } from 'react';
import { Icon, type IconName, type IconHandle } from './Icon';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, space, touch } from '@/theme/tokens';
import { Text } from './Text';

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  const animation = useRef<IconHandle>(null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => { animation.current?.play(); onPress?.(); }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: selected ? colors.text : '#FFFFFF', opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {icon && <Icon ref={animation} name={icon} size={18} color={selected ? colors.bg : colors.text} />}
      <Text variant="caption" weight="semibold" style={{ color: selected ? colors.bg : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    justifyContent: 'center',
    flexDirection: 'row', alignItems:'center', gap:space.sm,
  },
});
