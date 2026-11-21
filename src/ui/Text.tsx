import { Text as RNText, type TextProps } from 'react-native';
import { colors, font, type as typeScale } from '@/theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'danger';
type Weight = 'regular' | 'semibold' | 'bold';

const toneColor: Record<Tone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.accent,
  onAccent: colors.onAccent,
  danger: colors.danger,
};

export function Text({
  variant = 'body',
  tone = 'primary',
  weight = 'regular',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone; weight?: Weight }) {
  return (
    <RNText
      {...rest}
      style={[typeScale[variant], { color: toneColor[tone], fontFamily: font[weight] }, style]}
    />
  );
}
