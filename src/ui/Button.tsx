import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, radius, space, touch } from '@/theme/tokens';
import { Text } from './Text';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  full?: boolean;
};

export function Button({ label, variant = 'primary', loading, full, disabled, onPress, style, ...rest }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={(e) => {
        onPress?.(e);
      }}
      style={(state) => [
        styles.base,
        full && styles.full,
        variant === 'primary' && { backgroundColor: state.pressed ? colors.accentFillPressed : colors.accentFill },
        variant === 'secondary' && { backgroundColor: state.pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)' },
        variant === 'ghost' && { opacity: state.pressed ? 0.6 : 1 },
        (disabled || loading) && { opacity: 0.5 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.text} />
      ) : (
        <Text variant="headline" weight="semibold" tone={isPrimary ? 'onAccent' : 'primary'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min + 8,
    paddingHorizontal: space.xl,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
});
