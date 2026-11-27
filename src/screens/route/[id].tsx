import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { useRateRoute, useReportRoute, useRouteDetail, useRouteRatings } from '@/features/community/api';
import { useRouteBuilder } from '@/state/routeBuilder';

function km(m: number | null) {
  if (!m) return null;
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function RouteDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { requireAuth } = useRequireAuth();
  const route = useRouteDetail(id);
  const ratings = useRouteRatings(id);
  const rate = useRateRoute();
  const report = useReportRoute();
  const setStops = useRouteBuilder((s) => s.setStops);
  const setSavedRoute = useRouteBuilder((s) => s.setSavedRoute);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [rateOpen, setRateOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const data = route.data;

  const applyRoute = () => {
    if (!data?.stops?.length) return;
    setStops(
      [...data.stops]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({
          venue: { id: s.venue.id, name: s.venue.name, category: s.venue.category, lat: s.venue.lat, lng: s.venue.lng },
          plannedMinutes: s.planned_minutes,
        })),
    );
    setSavedRoute(data.id, data.title);
    router.replace('/');
  };

  const doReport = () => {
    const reason = Platform.OS === 'web' ? window.prompt(t('errors.reportReason')) : 'inappropriate';
    if (!reason?.trim()) return;
    report.mutate({ routeId: id, reason: reason.trim() }, { onSuccess: () => setReported(true) });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.lg, paddingBottom: 140 + insets.bottom }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => (window.history.length > 1 ? router.back() : router.replace('/'))} style={styles.back}>
          <Text tone="secondary" weight="semibold">← {t('common.back')}</Text>
        </Pressable>

        {route.isLoading ? (
          <View style={{ gap: space.md }}>
            <View style={[styles.skeleton, { height: 34, width: '70%' }]} />
            <View style={[styles.skeleton, { height: 18, width: '45%' }]} />
            <View style={[styles.skeleton, { height: 220 }]} />
          </View>
        ) : !data ? (
          <View style={styles.empty}>
            <Text variant="headline" weight="semibold">{t('errors.routeNotFound')}</Text>
            <Button label={t('common.back')} variant="secondary" onPress={() => router.replace('/')} />
          </View>
        ) : (
          <>
            <View style={{ gap: space.xs }}>
              {data.is_featured || data.is_curated ? (
                <Text variant="caption" tone="accent" weight="bold">{data.is_curated ? t('community.curated') : t('community.featured')}</Text>
              ) : null}
              <Text variant="display" weight="bold">{data.title}</Text>
              <Text tone="secondary">
                {[t('community.stops', { count: data.stops_count }), km(data.total_distance_m), t('community.byAuthor', { name: data.author_name })]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {data.avg_stars ? (
                <Text weight="semibold">★ {data.avg_stars.toFixed(1)} <Text tone="tertiary">({data.rating_count})</Text></Text>
              ) : null}
              {data.description ? <Text tone="secondary" style={{ marginTop: space.sm }}>{data.description}</Text> : null}
            </View>

            <Glass style={styles.card}>
              {(data.stops ?? []).sort((a, b) => a.position - b.position).map((s, i) => (
                <View key={s.id} style={[styles.stop, i > 0 && styles.stopBorder]}>
                  <View style={styles.badge}><Text variant="caption" weight="bold" tone="onAccent">{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold" numberOfLines={1}>{s.venue.name}</Text>
                    <Text variant="caption" tone="secondary">{t(`categories.${s.venue.category}`)} · {s.planned_minutes} min</Text>
                  </View>
                </View>
              ))}
            </Glass>

            <View style={{ gap: space.md }}>
              <View style={styles.rowBetween}>
                <Text variant="headline" weight="bold">{t('community.rating')}</Text>
                {!rateOpen ? (
                  <Pressable onPress={() => requireAuth('rate', () => setRateOpen(true))} style={styles.link}>
                    <Text tone="accent" weight="semibold">{t('community.leaveReview')}</Text>
                  </Pressable>
                ) : null}
              </View>

              {rateOpen && session ? (
                <Glass style={[styles.card, { gap: space.md }]}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} ★`} onPress={() => setRating(n)} style={styles.star}>
                        <Text variant="title" style={{ color: n <= rating ? colors.accent : colors.textTertiary }}>★</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder={t('community.reviewPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={280}
                    style={styles.input}
                  />
                  <Button
                    label={t('community.submitRating')}
                    disabled={!rating}
                    loading={rate.isPending}
                    onPress={() => rate.mutate({ routeId: id, stars: rating, comment }, { onSuccess: () => { setRateOpen(false); void ratings.refetch(); void route.refetch(); } })}
                  />
                </Glass>
              ) : null}

              {(ratings.data ?? []).slice(0, 10).map((r) => (
                <View key={r.id} style={styles.review}>
                  <Text weight="semibold">{'★'.repeat(r.stars)}<Text tone="tertiary">{'★'.repeat(5 - r.stars)}</Text>  <Text variant="caption" tone="secondary">{r.user_display_name}</Text></Text>
                  {r.comment ? <Text tone="secondary">{r.comment}</Text> : null}
                </View>
              ))}
            </View>

            {session && data.owner_id !== session.user.id ? (
              <Pressable onPress={doReport} disabled={reported} style={styles.link}>
                <Text variant="caption" tone="tertiary">{reported ? '✓' : t('common.report')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      {data?.stops?.length ? (
        <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>
          <Button style={{borderRadius:radius.pill,minHeight:56}} label={t('community.useRoute')} full onPress={applyRoute} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.xl, gap: space.xl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  back: { minHeight: touch.min, justifyContent: 'center', alignSelf: 'flex-start' },
  skeleton: { borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.06)' },
  empty: { gap: space.lg, alignItems: 'flex-start' },
  card: { padding: space.lg },
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  stopBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: touch.min, justifyContent: 'center' },
  stars: { flexDirection: 'row', gap: space.xs },
  star: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 80, borderRadius: radius.sm, padding: space.md, color: colors.text, fontFamily: 'Manrope_500Medium',
    fontSize: 15, backgroundColor: 'rgba(255,255,255,0.06)', textAlignVertical: 'top',
  },
  review: { gap: space.xs, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: 'rgba(11,11,15,0.92)' },
});
