import { createContext, useContext } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius } from '@/theme/tokens';

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
          : { backgroundColor: strong ? '#22212B' : '#1B1B23' },
        style,
      ]}
    >
      <InsideGlass.Provider value>{children}</InsideGlass.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
});
