import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import type { ActiveCrawl } from './types';
import { rateDBRoute } from './api';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { supabase } from '@/lib/supabase';

type Props = {
  crawl: ActiveCrawl;
};

export function CrawlSummary({ crawl }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const { requireAuth } = useRequireAuth();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const totalStops = crawl.stops.length;
  const visitedCount = crawl.checkedInVenueIds.length;

  const [openedAt] = useState(() => Date.now());
  const durationMinutes = (() => {
    const start = new Date(crawl.startedAt).getTime();
    const end = crawl.endedAt ? new Date(crawl.endedAt).getTime() : openedAt;
    const diffMs = Math.max(0, end - start);
    return Math.max(1, Math.round(diffMs / (1000 * 60)));
  })();

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  };

  const handleRate = (stars: number) => {
    setSelectedRating(stars);

    if (!crawl.routeId) {
      setRatingSubmitted(true);
      return;
    }

    if (session) {
      setSubmittingRating(true);
      rateDBRoute(crawl.routeId, session.user.id, stars).then((ok) => {
        setSubmittingRating(false);
        if (ok) setRatingSubmitted(true);
      });
    } else {
      requireAuth('rate', async () => {
        // Read the fresh session: the `session` captured by this closure is from before sign-in.
        const { data } = await supabase.auth.getUser();
        if (!data.user || !crawl.routeId) return;
        setSubmittingRating(true);
        const ok = await rateDBRoute(crawl.routeId, data.user.id, stars);
        setSubmittingRating(false);
        if (ok) setRatingSubmitted(true);
      });
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.trophyWrap}>
          <Text style={styles.trophyIcon}>🍻</Text>
        </View>
        <Text variant="display" weight="bold" style={styles.title}>
          {t('crawl.summary.title')}
        </Text>
        <Text tone="secondary" variant="body" style={styles.subtitle}>
          {t('crawl.summary.subtitle')}
        </Text>
      </View>

      {/* Stats Glass Surface */}
      <Glass rounded={radius.card} strong style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text tone="secondary" variant="caption">
            {t('route.stops', 'Stops')}
          </Text>
          <Text variant="headline" weight="bold">
            {visitedCount} / {totalStops}
          </Text>
          <Text tone="tertiary" variant="caption">
            {t('crawl.checkedIn')}
          </Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statItem}>
          <Text tone="secondary" variant="caption">
            {t('crawl.summary.distanceWalked')}
          </Text>
          <Text variant="headline" weight="bold">
            {formatDistance(crawl.totalDistanceMeters)}
          </Text>
          <Text tone="tertiary" variant="caption">
            {t('route.walkTime', 'Walk')}
          </Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statItem}>
          <Text tone="secondary" variant="caption">
            {t('crawl.summary.totalTime')}
          </Text>
          <Text variant="headline" weight="bold">
            {formatDuration(durationMinutes)}
          </Text>
          <Text tone="tertiary" variant="caption">
            {t('common.done')}
          </Text>
        </View>
      </Glass>

      {/* Stops Visited List */}
      <View style={styles.stopsSection}>
        <Text variant="headline" weight="semibold" style={styles.sectionTitle}>
          {t('route.stops')}
        </Text>
        <View style={styles.stopsList}>
          {crawl.stops.map((stop, idx) => {
            const isCheckedIn = crawl.checkedInVenueIds.includes(stop.venue.id);
            return (
              <Glass key={stop.venue.id} rounded={radius.card} style={styles.stopCard}>
                <View style={[styles.stopNumber, isCheckedIn && styles.stopNumberChecked]}>
                  <Text
                    tone={isCheckedIn ? 'onAccent' : 'tertiary'}
                    variant="caption"
                    weight="bold"
                  >
                    {isCheckedIn ? '✓' : String(idx + 1)}
                  </Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text numberOfLines={1} variant="body" weight="semibold">
                    {stop.venue.name}
                  </Text>
                  <Text tone="secondary" variant="caption">
                    {t(`categories.${stop.venue.category}`)}
                  </Text>
                </View>
                {isCheckedIn ? (
                  <View style={styles.checkedBadge}>
                    <Text tone="accent" variant="caption" weight="semibold">
                      {t('crawl.checkedIn')}
                    </Text>
                  </View>
                ) : null}
              </Glass>
            );
          })}
        </View>
      </View>

      {/* Rating Prompt (if route was saved or public, or prompt for any crawl) */}
      <Glass rounded={radius.card} strong style={styles.ratingCard}>
        <Text variant="headline" weight="semibold" style={styles.ratingTitle}>
          {ratingSubmitted
            ? `✓ ${t('common.done')}`
            : t('crawl.summary.ratePrompt')}
        </Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = selectedRating !== null && star <= selectedRating;
            return (
              <Pressable
                key={star}
                accessibilityLabel={`${star} stars`}
                accessibilityRole="button"
                disabled={submittingRating || ratingSubmitted}
                hitSlop={6}
                onPress={() => handleRate(star)}
                style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}
              >
                <Text
                  style={[
                    styles.starIcon,
                    isFilled ? styles.starFilled : styles.starEmpty,
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>

      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Math.max(space.md, insets.bottom) }]}>
        <Button
          full
          label={t('crawl.summary.backHome')}
          onPress={() => router.replace('/')}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  hero: {
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
  },
  trophyWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(181,171,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  trophyIcon: {
    fontSize: 32,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statsDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.hairline,
  },
  stopsSection: {
    gap: space.sm,
  },
  sectionTitle: {
    paddingHorizontal: space.xs,
  },
  stopsList: {
    gap: space.xs,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 56,
    gap: space.md,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberChecked: {
    backgroundColor: colors.accentFill,
  },
  stopInfo: {
    flex: 1,
    gap: 2,
  },
  checkedBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(181,171,255,0.12)',
  },
  ratingCard: {
    padding: space.lg,
    alignItems: 'center',
    gap: space.md,
  },
  ratingTitle: {
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  starBtn: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 32,
  },
  starFilled: {
    color: colors.accent,
  },
  starEmpty: {
    color: colors.textTertiary,
  },
  actions: {
    width: '100%', maxWidth: 620, alignSelf: 'center', flexShrink: 0,
    paddingTop: space.md, paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  pressed: {
    opacity: 0.72,
  },
});
