import { useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space, touch } from '@/theme/tokens';
import { Glass } from './Glass';
import { Icon, type IconHandle, type IconName } from './Icon';
import { Text } from './Text';

type Props = {
  icon: IconName;
  label: string; // accessibility label (and visible text when showLabel)
  onPress: () => void;
  showLabel?: boolean;
  loop?: boolean;
  size?: number;
  tone?: 'glass' | 'accent' | 'plain';
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Glass button with an animated icon that plays on press.
export function IconButton({ icon, label, onPress, showLabel, loop, size = 22, tone = 'glass', selected, disabled, style }: Props) {
  const iconRef = useRef<IconHandle>(null);
  const body = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={6}
      onHoverIn={() => iconRef.current?.play()}
      onPress={() => {
        iconRef.current?.play();
        onPress();
      }}
      style={({ pressed }) => [styles.hit, showLabel && styles.hitLabelled, pressed && styles.pressed]}
    >
      <Icon ref={iconRef} name={icon} size={size} filled={selected} color={tone === 'accent' ? colors.onAccent : selected ? colors.accent : colors.text} loop={loop} />
      {showLabel ? (
        <Text weight="semibold" tone={tone === 'accent' ? 'onAccent' : 'primary'} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );

  if (tone === 'plain') return <View style={[showLabel ? null : styles.round, style]}>{body}</View>;
  if (tone === 'accent') {
    return <View style={[styles.accent, showLabel ? null : styles.round, style]}>{body}</View>;
  }
  return (
    <Glass rounded={radius.pill} style={[showLabel ? null : styles.round, style]}>
      {body}
    </Glass>
  );
}

const styles = StyleSheet.create({
  round: { width: touch.min + 8, height: touch.min + 8 },
  hit: { flex: 1, minHeight: touch.min + 4, minWidth: touch.min + 4, alignItems: 'center', justifyContent: 'center' },
  hitLabelled: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg },
  accent: { borderRadius: radius.pill, backgroundColor: colors.accentFill, overflow: 'hidden' },
  pressed: { opacity: 0.72 },
});
