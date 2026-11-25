import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon, Text, type IconHandle } from '@/ui';
import { colors, radius, space } from '@/theme/tokens';
import { GlassSurfaceProvider } from '@/ui/Glass';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export type SheetSnap = 'peek' | 'half' | 'full';
export type BottomSheetHandle = { snapTo: (snap: SheetSnap) => void };

type Props = {
  children: ReactNode;
  onBrowsePress?: () => void;
  onSnapChange?: (snap: SheetSnap, visibleHeight: number) => void;
  footerInset?: number;
  docked?: boolean;
  footer?: ReactNode;
  contentKey?: string;
};

export const PEEK_BASE = 52 + space.lg * 2;

export const BottomSheet = forwardRef<BottomSheetHandle, Props>(function BottomSheet(
  { children, onBrowsePress, onSnapChange, footerInset = 0, docked = false, footer, contentKey },
  ref,
) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [dragTop, setDragTop] = useState<number | null>(null);
  const drag = useRef<{ id: number; y: number; top: number; moved: boolean } | null>(null);
  const ignoreClickUntil = useRef(0);
  const icon = useRef<IconHandle>(null);
  const full = Math.max(height * 0.13, insets.top + space.sm);
  const peek = Math.max(full, height - PEEK_BASE - insets.bottom - footerInset);
  const half = Math.max(full, Math.min(height * 0.38, peek));
  const positions = { full, half, peek };
  const collapsed = snap === 'peek';

  const snapTo = useCallback((next: SheetSnap) => {
    if (docked) return;
    if (next === 'peek') Keyboard.dismiss();
    setSnap(next);
  }, [docked]);
  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);
  const visibleHeight = docked ? 0 : Math.max(0, height - positions[snap]);
  useEffect(() => onSnapChange?.(snap, visibleHeight), [onSnapChange, snap, visibleHeight]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('.sheet-collapse')) return;
    ignoreClickUntil.current = 0;
    drag.current = { id: event.pointerId, y: event.clientY, top: positions[snap], moved: false };
    (event.target as Element).setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const delta = event.clientY - start.y;
    if (!start.moved && Math.abs(delta) < 5) return;
    start.moved = true;
    setDragTop(Math.min(peek, Math.max(full, start.top + delta)));
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    drag.current = null;
    setDragTop(null);
    if (!start.moved) return;
    ignoreClickUntil.current = Date.now() + 250;
    if (event.type !== 'pointerup') return;
    const releaseTop = start.top + event.clientY - start.y;
    const delta = releaseTop - start.top;
    if (Math.abs(delta) < 18) return;
    if (delta < 0) snapTo(snap === 'peek' && releaseTop > (full + half) / 2 ? 'half' : 'full');
    else snapTo(snap === 'full' && releaseTop < (half + peek) / 2 ? 'half' : 'peek');
  };

  const scrollContent = (
    <ScrollView
      key={contentKey}
      contentContainerStyle={{ paddingTop: docked ? space.lg : 0, paddingBottom: space.lg + (footer ? 0 : insets.bottom + footerInset) }}
      keyboardShouldPersistTaps="handled"
      style={[styles.scroll, browserScroll]}
    >
      <GlassSurfaceProvider>{children}</GlassSurfaceProvider>
    </ScrollView>
  );

  if (docked) {
    return <div style={dockedStyle}>{scrollContent}{footer ? <div style={{ paddingBottom: footerInset, flexShrink: 0 }}>{footer}</div> : null}</div>;
  }

  return (
    <section style={{
      ...sheetStyle,
      bottom: 0,
      height: Math.max(0, height - (dragTop ?? positions[snap])),
      transition: reduceMotion || dragTop !== null ? undefined : 'height 340ms cubic-bezier(0.22, 1, 0.36, 1)',
    }}>
      <div
        style={collapsed ? sheetHeader : expandedHeader}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
      >
        {collapsed ? <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: !collapsed }}
          onPress={() => {
            if (Date.now() < ignoreClickUntil.current) return;
            icon.current?.play();
            onBrowsePress?.();
            snapTo('half');
          }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? colors.accentFillPressed : colors.accentFill },
            !reduceMotion && buttonTransition,
            pressed && !reduceMotion && styles.pressed,
          ]}
        >
          <Icon ref={icon} name="compass" size={20} color={colors.onAccent} />
          <Text variant="headline" weight="semibold" tone="onAccent">{t('nav.browse')}</Text>
        </Pressable> : (<>
          <button
            type="button"
            className="sheet-grip"
            aria-label={t(snap === 'full' ? 'nav.shrinkSheet' : 'nav.expandSheet')}
            onClick={() => {
              if (Date.now() >= ignoreClickUntil.current) snapTo(snap === 'full' ? 'half' : 'full');
            }}
          ><span /></button>
          <button type="button" className="sheet-collapse" aria-label={t('nav.shrinkSheet')} onClick={() => snapTo('peek')}>
            <Icon name="back" size={20} />
          </button>
        </>)}
      </div>
      <div inert={collapsed} style={{ flex: 1, minHeight: 0, flexDirection: 'column', display: 'flex', visibility: collapsed ? 'hidden' : 'visible' }}>
        {scrollContent}
        {footer ? <div style={{ flexShrink: 0, paddingBottom: insets.bottom + footerInset }}>{footer}</div> : null}
      </div>
    </section>
  );
});

const sheetStyle = {
  position: 'absolute', left: 0, right: 0, zIndex: 20,
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
  borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
  background: colors.bgElevated, boxShadow: '0 -1px 0 rgba(255,255,255,0.10)',
} as const;
const sheetHeader = { padding: space.lg, touchAction: 'none', userSelect: 'none' } as const;
const expandedHeader = { position: 'relative', minHeight: 44, flexShrink: 0, touchAction: 'none', userSelect: 'none' } as const;
const dockedStyle = { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.bgElevated, borderRight: '1px solid rgba(255,255,255,0.10)' } as const;
const buttonTransition = { transition: 'transform 150ms ease-out, background-color 150ms ease-out' } as object;
const browserScroll = { scrollbarWidth: 'thin', scrollbarColor: '#73737e #212126', scrollbarGutter: 'stable', overscrollBehaviorY: 'contain' } as object;

const styles = StyleSheet.create({
  scroll: { flex: 1, minHeight: 0 },
  button: {
    minHeight: 52, width: '100%', paddingHorizontal: space.md, paddingVertical: space.sm,
    flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.sm,
  },
  pressed: { transform: [{ scale: 0.98 }] },
});
