import { Platform } from 'react-native';

// Some mobile browsers (e.g. Samsung Internet in power-saving mode, older WebViews) ignore backdrop-filter.
// Without blur a low-alpha dark tint over a dark map reads as near-black, so those get a lighter, denser fill.
export const supportsBackdrop: boolean =
  Platform.OS !== 'web' ||
  (typeof CSS !== 'undefined' &&
    (CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)')));
