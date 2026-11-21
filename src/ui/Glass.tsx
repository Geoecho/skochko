import { createContext, useContext } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { blur, colors, radius } from '@/theme/tokens';
import { supportsBackdrop } from '@/theme/glassSupport';

type GlassProps = ViewProps & {
  strong?: boolean;
  rounded?: number;
};

// Nested glass must not stack backdrop-filters: each one forces the GPU to re-sample everything
// underneath (including the WebGL map). On iOS Safari that exhausts GPU memory and blanks the page.
// Only the outermost Glass blurs; inner ones are a lighter translucent tint over it.
const InsideGlass = createContext(false);

/** Wrap a custom blurred surface's children so nested <Glass> renders as a light tint, not another blur. */
export const GlassSurfaceProvider = ({ children }: { children: React.ReactNode }) => (
  <InsideGlass.Provider value>{children}</InsideGlass.Provider>
);

export function Glass({ strong, rounded = radius.card, style, children, ...rest }: GlassProps) {
  const nested = useContext(InsideGlass);
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { borderRadius: rounded },
        nested
          ? { backgroundColor: strong ? colors.glassInnerStrong : colors.glassInner }
          : supportsBackdrop
            ? [{ backgroundColor: strong ? colors.glassStrong : colors.glass }, webGlass]
            : [{ backgroundColor: colors.glassNoBlur }, webEdge],
        style,
      ]}
    >
      <InsideGlass.Provider value>{children}</InsideGlass.Provider>
    </View>
  );
}

const webGlass =
  Platform.OS === 'web'
    ? ({
        backdropFilter: `blur(${blur.glass}px) saturate(${blur.saturate}%) brightness(${blur.brightness})`,
        WebkitBackdropFilter: `blur(${blur.glass}px) saturate(${blur.saturate}%) brightness(${blur.brightness})`,
        // Liquid-glass edge: bright top rim, faint inner glow, soft drop shadow.
        boxShadow: `inset 0 1px 0 ${colors.glassRim}, inset 0 0 0 1px ${colors.glassHighlight}, 0 10px 36px rgba(0,0,0,0.32)`,
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 38%, rgba(255,255,255,0) 100%)`,
      } as object)
    : null;

// Rim + shine only (no blur), for browsers without backdrop-filter.
const webEdge =
  Platform.OS === 'web'
    ? ({ boxShadow: `inset 0 1px 0 ${colors.glassRim}, 0 10px 36px rgba(0,0,0,0.32)` } as object)
    : null;

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
});
