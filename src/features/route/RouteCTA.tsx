import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass, Icon, Text, type IconHandle } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';

export const CTA_HEIGHT = 56;
/** Space the sheet must reserve at the bottom so its content is never hidden behind the CTA. */
export const CTA_INSET = CTA_HEIGHT + space.md * 2;

// Docked above the bottom sheet at every snap point: [route (edit)]  [ ▶ Start crawl · N stops ]
export function RouteCTA({ count, onStart, onEdit, editing = false }: { count: number; onStart: () => void; onEdit: () => void; editing?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const playRef = useRef<IconHandle>(null);
  const routeRef = useRef<IconHandle>(null);

  return (
    <View nativeID="route-cta" pointerEvents="box-none" style={[styles.wrap, { paddingBottom: space.md + insets.bottom }]}>
      <Glass rounded={radius.pill} strong style={styles.edit}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? t('nav.browse') : `${t('route.edit')}, ${t('route.stopsCount', { count })}`}
          onPress={() => {
            routeRef.current?.play();
            onEdit();
          }}
          style={({ pressed }) => [styles.editHit, pressed && styles.pressed]}
        >
          <Icon ref={routeRef} name={editing ? 'compass' : 'route'} size={22} color={colors.text} />
          <View style={styles.badge}>
            <Text variant="caption" weight="bold" tone="onAccent" style={styles.badgeText}>{count}</Text>
          </View>
        </Pressable>
      </Glass>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('route.startCrawlCount', { count })}
        onPress={() => {
          playRef.current?.play();
          onStart();
        }}
        style={({ pressed }) => [styles.start, startShadow, pressed && { backgroundColor: colors.accentFillPressed }]}
      >
        <Icon ref={playRef} name="play" size={20} color={colors.onAccent} playOnMount />
        <Text variant="headline" weight="bold" tone="onAccent" numberOfLines={1}>
          {t('route.startCrawlCount', { count })}
        </Text>
      </Pressable>
    </View>
  );
}

// Soft fade behind the bar so it reads over sheet content when the sheet is fully open.
const startShadow = Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } as object) : null;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
    flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.lg,
  },
  edit: { width: CTA_HEIGHT, height: CTA_HEIGHT, borderRadius:radius.pill },
  editHit: { flex: 1, borderRadius:radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 11, lineHeight: 14 },
  start: {
    flex: 1, height: CTA_HEIGHT, minHeight: touch.min, borderRadius: radius.pill, backgroundColor: colors.accentFill,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg,
  },
  pressed: { opacity: 0.72 },
});
