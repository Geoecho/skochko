import { ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Text } from '@/ui';
import { colors, space } from '@/theme/tokens';
import { fetchReports, fetchRoutes, resolveReport, updateRoute } from './api';
import { AdminPanel, ConfirmButton, EmptyState, SectionHeading, useAdminToast } from './AdminUi';
import type { AdminReport, AdminRoute } from './types';

export function ModerationManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();
  const { data: routes = [], isLoading: routesLoading } = useQuery({ queryKey: ['admin', 'routes'], queryFn: fetchRoutes });
  const { data: reports = [], isLoading: reportsLoading } = useQuery({ queryKey: ['admin', 'reports'], queryFn: fetchReports });
  const routeMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: Pick<AdminRoute, 'is_featured' | 'status'> }) => updateRoute(id, update),
    onMutate: async ({ id, update }) => { await queryClient.cancelQueries({ queryKey: ['admin', 'routes'] }); const previous = queryClient.getQueryData<AdminRoute[]>(['admin', 'routes']); queryClient.setQueryData<AdminRoute[]>(['admin', 'routes'], (items = []) => items.map((route) => route.id === id ? { ...route, ...update } : route)); return { previous }; },
    onError: (error, _value, context) => { queryClient.setQueryData(['admin', 'routes'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => showToast(t('admin.saved')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] }),
  });
  const reportMutation = useMutation({
    mutationFn: resolveReport,
    onMutate: async (id) => { await queryClient.cancelQueries({ queryKey: ['admin', 'reports'] }); const previous = queryClient.getQueryData<AdminReport[]>(['admin', 'reports']); queryClient.setQueryData<AdminReport[]>(['admin', 'reports'], (items = []) => items.filter((report) => report.id !== id)); return { previous }; },
    onError: (error, _id, context) => { queryClient.setQueryData(['admin', 'reports'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => showToast(t('admin.reportResolved')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
  return <ScrollView contentContainerStyle={styles.scroll}><SectionHeading title={t('admin.nav.moderation')} /><View style={styles.columns}><AdminPanel style={styles.column}><Text variant="headline" weight="bold">{t('admin.publicRoutes')}</Text>{routesLoading ? <Text tone="secondary">{t('common.loading')}</Text> : routes.length ? routes.map((route) => <RouteRow key={route.id} route={route} onFeature={() => routeMutation.mutate({ id: route.id, update: { is_featured: !route.is_featured, status: route.status } })} onHide={() => routeMutation.mutate({ id: route.id, update: { is_featured: false, status: 'hidden' } })} />) : <EmptyState message={t('admin.noPublicRoutes')} />}</AdminPanel><AdminPanel style={styles.column}><Text variant="headline" weight="bold">{t('admin.moderationList.reportedRoutes')}</Text>{reportsLoading ? <Text tone="secondary">{t('common.loading')}</Text> : reports.length ? reports.map((report) => <ReportRow key={report.id} report={report} onResolve={() => reportMutation.mutate(report.id)} />) : <EmptyState message={t('admin.noReports')} />}</AdminPanel></View></ScrollView>;
}

function RouteRow({ route, onFeature, onHide }: { route: AdminRoute; onFeature: () => void; onHide: () => void }) { const { t } = useTranslation(); return <View style={styles.row}><View style={styles.main}><Text weight="bold">{route.title}</Text><Text variant="caption" tone="secondary">{route.status === 'hidden' ? t('admin.hidden') : route.is_featured ? t('admin.featured') : t('admin.notFeatured')}</Text></View>{route.status !== 'hidden' ? <View style={styles.actions}><ConfirmButton label={route.is_featured ? t('admin.moderationList.unfeatureRoute') : t('admin.moderationList.featureRoute')} message={t('admin.confirmModeration', { title: route.title })} confirmLabel={t('common.confirm')} tone="neutral" onConfirm={onFeature} /><ConfirmButton label={t('admin.moderationList.hideRoute')} message={t('admin.confirmHideRoute', { title: route.title })} confirmLabel={t('admin.moderationList.hideRoute')} onConfirm={onHide} /></View> : null}</View>; }
function ReportRow({ report, onResolve }: { report: AdminReport; onResolve: () => void }) { const { t } = useTranslation(); return <View style={styles.row}><View style={styles.main}><Text weight="bold">{report.target_type}</Text><Text variant="caption" tone="secondary">{t('admin.moderationList.reportReason', { reason: report.reason })}</Text></View><ConfirmButton label={t('admin.resolveReport')} message={t('admin.confirmResolveReport')} confirmLabel={t('admin.resolveReport')} tone="neutral" onConfirm={onResolve} /></View>; }

const styles = StyleSheet.create({ scroll: { padding: space.xl, gap: space.lg, maxWidth: 1200, width: '100%', alignSelf: 'center' }, columns: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }, column: { flex: 1, minWidth: 300 }, row: { flexDirection: 'row', gap: space.md, alignItems: 'center', paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, main: { flex: 1, gap: space.xs }, actions: { alignItems: 'flex-end' } });
