import { memo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'next/navigation';
import { useConfirmation } from '@/ui/Confirmation';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import type { LatLng } from '@/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import {
  useCommunityRoutes,
  useDeleteRoute,
  useDuplicateRoute,
  useFeaturedRoutes,
  useMyRoutes,
  useToggleRouteVisibility,
} from './api';
import type { CommunityRoute, CommunitySort } from './types';

function formatDistance(distanceM: number | null): string | null {
  if (distanceM == null || distanceM <= 0) return null;
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function formatDuration(durationS: number | null): string | null {
  if (durationS == null || durationS <= 0) return null;
  const mins = Math.round(durationS / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function RouteSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { width: '65%', height: 18 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
      <View style={[styles.skeletonLine, { width: '80%', height: 14 }]} />
    </View>
  );
}

function RouteSkeletons() {
  return (
    <View style={styles.skeletonContainer}>
      <RouteSkeleton />
      <RouteSkeleton />
      <RouteSkeleton />
    </View>
  );
}

const FeaturedRouteCard = memo(function FeaturedRouteCard({
  route,
  onPress,
}: {
  route: CommunityRoute;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const dist = formatDistance(route.total_distance_m);
  const dur = formatDuration(route.total_duration_s);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={route.title}
      onPress={onPress}
      style={({ pressed }) => [styles.featuredCardWrap, pressed && styles.pressed]}
    >
      <Glass style={styles.featuredCard}>
        <View style={styles.featuredBadges}>
          {route.is_curated ? (
            <View style={styles.badgeCurated}>
              <Text variant="caption" weight="bold" style={styles.badgeCuratedText}>
                {t('community.curated')}
              </Text>
            </View>
          ) : route.is_featured ? (
            <View style={styles.badgeFeatured}>
              <Text variant="caption" weight="bold" style={styles.badgeFeaturedText}>
                {t('community.featured')}
              </Text>
            </View>
          ) : null}

          {route.avg_stars != null ? (
            <View style={styles.ratingBadge}>
              <Text variant="caption" weight="bold" tone="accent">
                ★ {route.avg_stars.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text variant="headline" weight="bold" numberOfLines={2}>
          {route.title}
        </Text>

        {route.description ? (
          <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.featuredDesc}>
            {route.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text variant="caption" tone="secondary">
            {t('route.stopsCount', { count: route.stops_count })}
            {dist ? ` · ${dist}` : ''}
            {dur ? ` · ${dur}` : ''}
          </Text>
        </View>

        <View style={styles.authorRow}>
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {t('community.byAuthor', { name: route.author_name })}
          </Text>
        </View>
      </Glass>
    </Pressable>
  );
});

const CommunityRouteRow = memo(function CommunityRouteRow({
  route,
  onPress,
}: {
  route: CommunityRoute;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const dist = formatDistance(route.total_distance_m);
  const dur = formatDuration(route.total_duration_s);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={route.title}
      onPress={onPress}
      style={({ pressed }) => [styles.routeRow, pressed && styles.pressed]}
    >
      <View style={styles.routeRowLeft}>
        <View style={styles.titleLine}>
          <Text variant="body" weight="bold" numberOfLines={1} style={styles.routeTitle}>
            {route.title}
          </Text>
          {route.is_curated ? (
            <View style={styles.miniBadgeCurated}>
              <Text variant="caption" weight="semibold" style={styles.miniBadgeCuratedText}>
                {t('community.curated')}
              </Text>
            </View>
          ) : null}
        </View>

        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {t('route.stopsCount', { count: route.stops_count })}
          {dist ? ` · ${dist}` : ''}
          {dur ? ` · ${dur}` : ''}
        </Text>

        <View style={styles.routeRowFooter}>
          <Text variant="caption" tone="tertiary">
            {t('community.byAuthor', { name: route.author_name })}
          </Text>
          {route.completed_count > 0 ? (
            <Text variant="caption" tone="tertiary">
              · {t('community.completedTimes', { count: route.completed_count })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.routeRowRight}>
        {route.avg_stars != null ? (
          <View style={styles.ratingBox}>
            <Text weight="bold" tone="accent" variant="caption">
              ★ {route.avg_stars.toFixed(1)}
            </Text>
            <Text variant="caption" tone="tertiary" style={styles.ratingCountText}>
              ({route.rating_count})
            </Text>
          </View>
        ) : (
          <Text variant="caption" tone="tertiary">—</Text>
        )}
        <Text tone="tertiary" style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
});

const MyRouteCard = memo(function MyRouteCard({
  route,
  onPress,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  route: CommunityRoute;
  onPress: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const { t } = useTranslation();
  const isPublic = route.visibility === 'public';
  const dist = formatDistance(route.total_distance_m);
  const dur = formatDuration(route.total_duration_s);

  const confirm = useConfirmation();
  const confirmDelete = () => confirm({
    title: t('route.deleteRoute'),
    message: t('route.deleteConfirm'),
    confirmLabel: t('common.delete'),
    destructive: true,
    onConfirm: onDelete,
  });

  return (
    <Glass style={styles.myRouteCard}>
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.myRouteHeader}>
          <Text variant="headline" weight="bold" numberOfLines={1} style={styles.myRouteTitle}>
            {route.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPublic ? t('route.isPublic') : t('route.isPrivate')}
            onPress={onToggleVisibility}
            style={[styles.visibilityPill, isPublic ? styles.pillPublic : styles.pillPrivate]}
          >
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: isPublic ? colors.success : colors.textTertiary }}
            >
              {isPublic ? t('community.visibilityPublic') : t('community.visibilityPrivate')}
            </Text>
          </Pressable>
        </View>

        <Text variant="caption" tone="secondary" style={styles.myRouteMeta}>
          {t('route.stopsCount', { count: route.stops_count })}
          {dist ? ` · ${dist}` : ''}
          {dur ? ` · ${dur}` : ''}
          {route.avg_stars != null ? ` · ★ ${route.avg_stars.toFixed(1)}` : ''}
        </Text>
      </Pressable>

      <View style={styles.myRouteActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('community.duplicate')}
          disabled={duplicating}
          onPress={onDuplicate}
          style={({ pressed }) => [styles.myRouteActionButton, pressed && styles.pressed]}
        >
          <Text variant="caption" weight="semibold" tone="accent">
            {t('community.duplicate')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
          onPress={confirmDelete}
          style={({ pressed }) => [styles.myRouteActionButton, pressed && styles.pressed]}
        >
          <Text variant="caption" weight="semibold" tone="danger">
            {t('common.delete')}
          </Text>
        </Pressable>
      </View>
    </Glass>
  );
});

export function RoutesTab({ origin }: { origin: LatLng }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [activeSection, setActiveSection] = useState<'community' | 'mine'>('community');
  const [sort, setSort] = useState<CommunitySort>('topRated');

  // Queries
  const { data: featured = [], isLoading: featuredLoading } = useFeaturedRoutes();
  const {
    data: communityRoutes = [],
    isLoading: communityLoading,
    refetch: refetchCommunity,
  } = useCommunityRoutes(sort, origin);
  const { data: myRoutes = [], isLoading: myLoading, refetch: refetchMine } = useMyRoutes();

  // Mutations
  const toggleVisibility = useToggleRouteVisibility();
  const deleteRoute = useDeleteRoute();
  const duplicateRoute = useDuplicateRoute();

  const handleOpenRoute = (routeId: string) => {
    router.push(`/route/${routeId}`);
  };

  const handleDuplicate = (routeId: string) => {
    duplicateRoute.mutate(
      { routeId, copySuffix: `(${t('common.copy', 'Copy')})` },
      {
        onSuccess: () => {
          refetchMine();
        },
      },
    );
  };

  const handleDelete = (routeId: string) => {
    deleteRoute.mutate(routeId, {
      onSuccess: () => {
        refetchMine();
      },
    });
  };

  const handleToggle = (route: CommunityRoute) => {
    const nextVisibility = route.visibility === 'public' ? 'private' : 'public';
    toggleVisibility.mutate({ routeId: route.id, visibility: nextVisibility });
  };

  return (
    <View style={styles.container}>
      {/* Sub-segmented control: Community vs Mine */}
      <View accessibilityRole="tablist" style={styles.subSegmented}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'community' }}
          onPress={() => setActiveSection('community')}
          style={[styles.subSegment, activeSection === 'community' && styles.subSegmentSelected]}
        >
          <Text
            tone={activeSection === 'community' ? 'primary' : 'secondary'}
            variant="caption"
            weight="semibold"
          >
            {t('community.title')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSection === 'mine' }}
          onPress={() => setActiveSection('mine')}
          style={[styles.subSegment, activeSection === 'mine' && styles.subSegmentSelected]}
        >
          <Text
            tone={activeSection === 'mine' ? 'primary' : 'secondary'}
            variant="caption"
            weight="semibold"
          >
            {t('profile.myRoutes')}
          </Text>
        </Pressable>
      </View>

      {/* Community Section */}
      {activeSection === 'community' ? (
        <View style={styles.sectionContent}>
          {/* Featured routes */}
          {featured.length > 0 ? (
            <View style={styles.carouselWrap}>
              <View style={styles.sectionHeader}>
                <Text variant="headline" weight="bold">
                  {t('community.featured')}
                </Text>
                <Text tone="tertiary" variant="caption">
                  {t('community.subtitle')}
                </Text>
              </View>

              <View style={styles.list}>
                {featured.map((item) => (
                  <FeaturedRouteCard
                    key={item.id}
                    route={item}
                    onPress={() => handleOpenRoute(item.id)}
                  />
                ))}
              </View>
            </View>
          ) : featuredLoading ? (
            <View style={styles.carouselLoading}>
              <RouteSkeleton />
            </View>
          ) : null}

          {/* Sort Chips */}
          <View style={styles.sortChips}>
            {(['topRated', 'trending', 'nearMe'] as const).map((s) => (
              <Chip
                key={s}
                label={t(`community.sort.${s}`)}
                selected={sort === s}
                onPress={() => setSort(s)}
              />
            ))}
          </View>

          {/* Community Route List */}
          {communityLoading ? (
            <RouteSkeletons />
          ) : communityRoutes.length > 0 ? (
            <View style={styles.list}>
              {communityRoutes.map((route) => (
                <CommunityRouteRow
                  key={route.id}
                  route={route}
                  onPress={() => handleOpenRoute(route.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text tone="secondary" style={styles.emptyText}>
                {t('empty.community.message')}
              </Text>
              <Button
                variant="secondary"
                label={t('empty.community.action')}
                onPress={() => router.push('/')}
              />
            </View>
          )}
        </View>
      ) : null}

      {/* Mine Section */}
      {activeSection === 'mine' ? (
        <View style={styles.sectionContent}>
          {!session && process.env.NEXT_PUBLIC_USE_MOCK !== '1' ? (
            <Glass style={styles.guestCard}>
              <View style={styles.guestIcon}>
                <Text tone="accent" variant="title">🔒</Text>
              </View>
              <Text variant="headline" weight="bold" style={styles.guestTitle}>
                {t('community.mineGuestTitle')}
              </Text>
              <Text tone="secondary" style={styles.guestSubtitle}>
                {t('community.mineGuestSubtitle')}
              </Text>
              <Button
                full
                label={t('auth.signInButton')}
                onPress={() => requireAuth('save', () => refetchMine())}
              />
            </Glass>
          ) : myLoading ? (
            <RouteSkeletons />
          ) : myRoutes.length > 0 ? (
            <View style={styles.list}>
              {myRoutes.map((route) => (
                <MyRouteCard
                  key={route.id}
                  route={route}
                  onPress={() => handleOpenRoute(route.id)}
                  onToggleVisibility={() => handleToggle(route)}
                  onDuplicate={() => handleDuplicate(route.id)}
                  onDelete={() => handleDelete(route.id)}
                  duplicating={duplicateRoute.isPending}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.routeGlyph}>
                <Text tone="accent" variant="title">↝</Text>
              </View>
              <Text variant="headline" weight="semibold">
                {t('empty.routes.message')}
              </Text>
              <Button
                label={t('empty.routes.action')}
                onPress={() => router.push('/')}
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.md,
  },
  subSegmented: {
    flexDirection: 'row',
    marginHorizontal: space.lg,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  subSegment: {
    flex: 1,
    minHeight: touch.min - 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  subSegmentSelected: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionContent: {
    gap: space.md,
  },
  sectionHeader: {
    paddingHorizontal: space.lg,
    gap: space.xs,
    marginBottom: space.xs,
  },
  carouselWrap: {
    gap: space.xs,
  },
  carouselLoading: {
    paddingHorizontal: space.lg,
  },
  featuredCardWrap: {
    width: '100%',
  },
  featuredCard: {
    padding: space.lg,
    gap: space.sm,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  featuredBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeCurated: {
    backgroundColor: 'rgba(181,171,255,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeCuratedText: {
    color: colors.accent,
    fontSize: 11,
  },
  badgeFeatured: {
    backgroundColor: 'rgba(167,139,250,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeFeaturedText: {
    color: '#C4B5FD',
    fontSize: 11,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  featuredDesc: {
    marginTop: -space.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space.sm,
  },
  sortChips: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  list: {
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  routeRow: {
    minHeight: 68,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeRowLeft: {
    flex: 1,
    gap: space.xs,
    paddingRight: space.sm,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  routeTitle: {
    flexShrink: 1,
  },
  miniBadgeCurated: {
    backgroundColor: 'rgba(181,171,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  miniBadgeCuratedText: {
    color: colors.accent,
    fontSize: 10,
  },
  routeRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  routeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  ratingBox: {
    alignItems: 'flex-end',
  },
  ratingCountText: {
    fontSize: 10,
  },
  chevron: {
    fontSize: 18,
    lineHeight: 18,
  },
  myRouteCard: {
    padding: space.md,
    gap: space.sm,
  },
  myRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  myRouteTitle: {
    flex: 1,
  },
  visibilityPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  pillPublic: {
    borderColor: 'rgba(52,211,153,0.35)',
    backgroundColor: 'rgba(52,211,153,0.1)',
  },
  pillPrivate: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  myRouteMeta: {
    marginTop: space.xs,
  },
  myRouteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space.sm,
    marginTop: space.xs,
  },
  myRouteActionButton: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  guestCard: {
    marginHorizontal: space.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  guestIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(181,171,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    textAlign: 'center',
  },
  guestSubtitle: {
    textAlign: 'center',
    marginBottom: space.sm,
  },
  emptyState: {
    marginHorizontal: space.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  routeGlyph: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(181,171,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  skeletonCard: {
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
    justifyContent: 'center',
  },
  skeletonLine: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.72,
  },
});
