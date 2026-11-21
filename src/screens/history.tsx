import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { useCrawlHistory } from '@/features/history/api';
import type { CrawlHistoryItem } from '@/features/history/types';

function fmtDistance(m: number | null) {
  if (!m) return '—';
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtDuration(s: number) {
  const min = Math.max(1, Math.round(s / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim();
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { requireAuth } = useRequireAuth();
  const history = useCrawlHistory();

  const renderItem = ({ item }: { item: CrawlHistoryItem }) => (
    <Glass style={styles.card}>
      <Text variant="caption" tone="secondary" weight="semibold">
        {new Date(item.started_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'mk-MK', {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Skopje',
        })}
      </Text>
      <Text variant="headline" weight="bold" numberOfLines={1}>{item.route_title ?? t('history.customCrawl')}</Text>
      <Text tone="secondary" numberOfLines={1}>{item.visited_venue_names.join(' → ') || '—'}</Text>
      <View style={styles.stats}>
        <Stat label={t('crawl.summary.stopsVisited', { count: item.stops_visited_count })} />
        <Stat label={fmtDistance(item.distance_m)} />
        <Stat label={fmtDuration(item.duration_s)} />
      </View>
    </Glass>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => (window.history.length > 1 ? router.back() : router.replace('/'))} style={styles.back}>
          <Text tone="secondary" weight="semibold">←</Text>
        </Pressable>
        <Text variant="title" weight="bold">{t('profile.history')}</Text>
      </View>

      {!session ? (
        <View style={styles.empty}>
          <Text variant="headline" weight="semibold">{t('history.signInTitle')}</Text>
          <Text tone="secondary" style={{ textAlign: 'center' }}>{t('history.signInBody')}</Text>
          <Button label={t('auth.signInButton')} onPress={() => requireAuth('save', () => void history.refetch())} />
        </View>
      ) : history.isLoading ? (
        <View style={styles.list}>{[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}</View>
      ) : (
        <FlatList
          data={history.data ?? []}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="headline" weight="semibold">{t('history.emptyTitle')}</Text>
              <Text tone="secondary" style={{ textAlign: 'center' }}>{t('history.emptyBody')}</Text>
              <Button label={t('route.createRoute')} onPress={() => router.replace('/')} />
            </View>
          }
        />
      )}
    </View>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" weight="semibold">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  back: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: space.xl, gap: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { padding: space.lg, gap: space.xs },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  stat: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  skeleton: { height: 120, borderRadius: radius.card, backgroundColor: 'rgba(255,255,255,0.06)' },
  empty: { alignItems: 'center', gap: space.md, paddingTop: 80, paddingHorizontal: space.xl },
});
