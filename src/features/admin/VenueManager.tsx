import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/ui';
import { colors, space, radius, type VenueCategory } from '@/theme/tokens';
import type { OpeningHours } from '@/types/domain';
import { archiveVenue, fetchVenues, removePublicFile, saveVenue, setVenuePhotos, uploadPublicFile } from './api';
import { AdminPanel, EmptyState, Field, FilePicker, SectionHeading, SelectField, useAdminToast } from './AdminUi';
import { LocationPicker } from './LocationPicker.web';
import type { AdminVenue, ContentStatus, Coordinates, VenueDraft } from './types';
import { newHours, parseCoordinates, slugify, weekDays } from './utils';

const categories: VenueCategory[] = ['bar', 'pub', 'cafe', 'club', 'rakija_bar', 'wine_bar', 'cocktail_bar', 'brewery'];
const defaultCoordinates: Coordinates = { lat: 41.9973, lng: 21.428 };

function defaultDraft(venue?: AdminVenue): VenueDraft {
  return {
    name: venue?.name ?? '', slug: venue?.slug ?? '', category: venue?.category ?? 'bar', coordinates: venue?.coordinates ?? defaultCoordinates,
    address: venue?.address ?? '', priceLevel: venue?.price_level ?? 2, hours: venue?.hours ?? newHours(), phone: venue?.phone ?? '', instagram: venue?.instagram ?? '', website: venue?.website ?? '', status: venue?.status ?? 'active',
  };
}

export function VenueManager() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<AdminVenue | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: venues = [], isLoading } = useQuery({ queryKey: ['admin', 'venues'], queryFn: fetchVenues });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) => archiveVenue(id, archive),
    onMutate: async ({ id, archive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'venues'] });
      const previous = queryClient.getQueryData<AdminVenue[]>(['admin', 'venues']);
      queryClient.setQueryData<AdminVenue[]>(['admin', 'venues'], (items = []) => items.map((venue) => venue.id === id ? { ...venue, status: archive ? 'archived' : 'active' } : venue));
      return { previous };
    },
    onError: (error, _value, context) => { queryClient.setQueryData(['admin', 'venues'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => showToast(t('admin.saved')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'venues'] }),
  });

  const filtered = useMemo(() => venues.filter((venue) => (
    venue.name.toLowerCase().includes(search.toLowerCase()) && (category === 'all' || venue.category === category) && (status === 'all' || venue.status === status)
  )), [venues, search, category, status]);
  const panelOpen = creating || editing !== null;

  return <View style={styles.page}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <SectionHeading title={t('admin.nav.venues')} action={<Button label={t('admin.venuesList.createVenue')} onPress={() => { setEditing(null); setCreating(true); }} />} />
      <AdminPanel>
        <View style={styles.filters}>
          <Field label={t('common.search')} placeholder={t('admin.searchVenues')} value={search} onChangeText={setSearch} style={styles.search} />
          <SelectField label={t('admin.venuesList.category')} value={category} onChange={setCategory} options={[{ value: 'all', label: t('admin.allCategories') }, ...categories.map((item) => ({ value: item, label: t(`categories.${item}`) }))]} />
          <SelectField label={t('admin.venuesList.status')} value={status} onChange={setStatus} options={[{ value: 'all', label: t('admin.allStatuses') }, { value: 'active', label: t('admin.venuesList.statusActive') }, { value: 'archived', label: t('admin.venuesList.statusArchived') }]} />
        </View>
        {isLoading ? <Text tone="secondary">{t('common.loading')}</Text> : filtered.length === 0 ? <EmptyState message={t('admin.noVenues')} action={<Button label={t('admin.venuesList.createVenue')} onPress={() => setCreating(true)} />} /> : <View style={styles.list}>{filtered.map((venue) => <VenueRow key={venue.id} venue={venue} onEdit={() => { setCreating(false); setEditing(venue); }} onArchive={() => archiveMutation.mutate({ id: venue.id, archive: venue.status !== 'archived' })} />)}</View>}
      </AdminPanel>
    </ScrollView>
    {panelOpen ? <VenueForm key={editing?.id ?? 'new'} venue={editing ?? undefined} wide={width >= 768} onClose={() => { setCreating(false); setEditing(null); }} /> : null}
  </View>;
}

function VenueRow({ venue, onEdit, onArchive }: { venue: AdminVenue; onEdit: () => void; onArchive: () => void }) {
  const { t } = useTranslation();
  // Whole row opens the editor (archive/restore lives in the form's status field). Status shown only when not active.
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t('common.edit')} ${venue.name}`} onPress={onEdit} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowMain}>
        <Text weight="bold" numberOfLines={1}>{venue.name}</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {t(`categories.${venue.category}`)} · {venue.address || t('admin.noAddress')}
          {venue.status !== 'active' ? ` · ${t('admin.venuesList.statusArchived')}` : ''}
        </Text>
      </View>
      <Text tone="tertiary" variant="title">›</Text>
    </Pressable>
  );
}

function VenueForm({ venue, wide, onClose }: { venue?: AdminVenue; wide: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();
  const [draft, setDraft] = useState(() => defaultDraft(venue));
  const [photos, setPhotos] = useState<string[]>(venue?.photos ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [coordinateText, setCoordinateText] = useState(`${draft.coordinates.lat}, ${draft.coordinates.lng}`);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextErrors: Record<string, string> = {};
      if (!draft.name.trim()) nextErrors.name = t('admin.required');
      if (!draft.slug.trim()) nextErrors.slug = t('admin.required');
      if (!draft.coordinates) nextErrors.coordinates = t('admin.coordinatesInvalid');
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) throw new Error(t('admin.fixErrors'));
      const saved = await saveVenue(draft, venue?.id);
      const uploaded = await Promise.all(pendingFiles.map((file) => uploadPublicFile('venue-photos', saved.id, file)));
      const nextPhotos = [...photos, ...uploaded];
      if (pendingFiles.length || removedPhotos.length) await setVenuePhotos(saved.id, nextPhotos);
      await Promise.all(removedPhotos.map((url) => removePublicFile('venue-photos', url)));
      return saved;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'venues'] });
      const previous = queryClient.getQueryData<AdminVenue[]>(['admin', 'venues']);
      if (venue) queryClient.setQueryData<AdminVenue[]>(['admin', 'venues'], (items = []) => items.map((item) => item.id === venue.id ? { ...item, ...draft, price_level: draft.priceLevel, coordinates: draft.coordinates } : item));
      return { previous };
    },
    onError: (error, _value, context) => { queryClient.setQueryData(['admin', 'venues'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => { showToast(t('admin.saved')); onClose(); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'venues'] }),
  });

  const set = <K extends keyof VenueDraft>(key: K, value: VenueDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const applyCoordinates = () => {
    const coordinates = parseCoordinates(coordinateText);
    if (!coordinates) { setErrors((current) => ({ ...current, coordinates: t('admin.coordinatesInvalid') })); return; }
    set('coordinates', coordinates); setErrors((current) => ({ ...current, coordinates: '' }));
  };
  const updateHours = (day: keyof OpeningHours, ranges: [string, string][]) => set('hours', { ...draft.hours, [day]: ranges });

  return <View style={[styles.overlay, wide && styles.overlayWide]}><ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled"><AdminPanel style={styles.formPanel}><SectionHeading title={venue ? t('admin.venuesList.editVenue') : t('admin.venuesList.createVenue')} action={<Pressable onPress={onClose} style={styles.close}><Text tone="secondary">×</Text></Pressable>} />
    <Field label={t('admin.venuesList.venueName')} value={draft.name} error={errors.name} onChangeText={(name) => { set('name', name); if (!venue) set('slug', slugify(name)); }} />
    <Field label={t('admin.slug')} value={draft.slug} error={errors.slug} autoCapitalize="none" onChangeText={(slug) => set('slug', slugify(slug))} />
    <SelectField label={t('admin.venuesList.category')} value={draft.category} error={errors.category} onChange={(value) => set('category', value as VenueCategory)} options={categories.map((item) => ({ value: item, label: t(`categories.${item}`) }))} />
    <SelectField label={t('admin.venuesList.priceLevel')} value={String(draft.priceLevel)} onChange={(value) => set('priceLevel', Number(value) as 1 | 2 | 3)} options={[1, 2, 3].map((price) => ({ value: String(price), label: '€'.repeat(price) }))} />
    <Field label={t('admin.venuesList.address')} value={draft.address} onChangeText={(value) => set('address', value)} />
    <View style={styles.twoColumns}><Field label={t('admin.venuesList.phone')} value={draft.phone} keyboardType="phone-pad" onChangeText={(value) => set('phone', value)} style={styles.half} /><Field label={t('admin.venuesList.instagram')} value={draft.instagram} autoCapitalize="none" onChangeText={(value) => set('instagram', value)} style={styles.half} /></View>
    <Field label={t('admin.venuesList.website')} value={draft.website} autoCapitalize="none" keyboardType="url" onChangeText={(value) => set('website', value)} />
    <HoursEditor hours={draft.hours} onChange={updateHours} />
    <View style={styles.locationSection}><Text variant="headline" weight="bold">{t('admin.venuesList.location')}</Text><LocationPicker value={draft.coordinates} onChange={(coordinates) => { set('coordinates', coordinates); setCoordinateText(`${coordinates.lat}, ${coordinates.lng}`); }} /><View style={styles.coordinates}><Field label={t('admin.pasteCoordinates')} value={coordinateText} error={errors.coordinates} onChangeText={setCoordinateText} /><Button label={t('admin.applyCoordinates')} variant="secondary" onPress={applyCoordinates} /></View></View>
    <PhotoEditor photos={photos} pending={pendingFiles} onFiles={(files) => setPendingFiles((current) => [...current, ...files])} onRemove={(url) => { setPhotos((current) => current.filter((item) => item !== url)); setRemovedPhotos((current) => [...current, url]); }} onMove={(url, direction) => setPhotos((current) => { const index = current.indexOf(url); const target = index + direction; if (target < 0 || target >= current.length) return current; const copy = [...current]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; })} />
    <SelectField label={t('admin.venuesList.status')} value={draft.status} onChange={(value) => set('status', value as ContentStatus)} options={[{ value: 'active', label: t('admin.venuesList.statusActive') }, { value: 'archived', label: t('admin.venuesList.statusArchived') }]} />
    <Button label={t('common.save')} full loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
  </AdminPanel></ScrollView></View>;
}

function HoursEditor({ hours, onChange }: { hours: OpeningHours; onChange: (day: keyof OpeningHours, ranges: [string, string][]) => void }) {
  const { t } = useTranslation();
  return <View style={styles.hours}><Text variant="headline" weight="bold">{t('admin.hours')}</Text>{weekDays.map((day) => { const ranges = hours[day] ?? []; return <View key={day} style={styles.day}><Text variant="caption" weight="semibold" style={styles.dayName}>{t(`admin.days.${day}`)}</Text><View style={styles.ranges}>{ranges.map((range, index) => <View key={`${day}-${index}`} style={styles.range}><Field label={t('admin.opens')} value={range[0]} placeholder="18:00" onChangeText={(value) => { const next = [...ranges]; next[index] = [value, range[1]]; onChange(day, next); }} style={styles.timeInput} /><Field label={t('admin.closes')} value={range[1]} placeholder="02:00" onChangeText={(value) => { const next = [...ranges]; next[index] = [range[0], value]; onChange(day, next); }} style={styles.timeInput} /><Pressable onPress={() => onChange(day, ranges.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeRange}><Text tone="danger">×</Text></Pressable></View>)}</View><Pressable onPress={() => onChange(day, [...ranges, ['18:00', '02:00']])} style={styles.addRange}><Text variant="caption" weight="semibold" tone="accent">{t('admin.addRange')}</Text></Pressable></View>; })}<Text variant="caption" tone="tertiary">{t('admin.overnightHint')}</Text></View>;
}

function PhotoEditor({ photos, pending, onFiles, onRemove, onMove }: { photos: string[]; pending: File[]; onFiles: (files: File[]) => void; onRemove: (url: string) => void; onMove: (url: string, direction: -1 | 1) => void }) {
  const { t } = useTranslation();
  return <View style={styles.photos}><Text variant="headline" weight="bold">{t('admin.photos')}</Text><FilePicker label={t('admin.venuePhotoUpload')} multiple onFiles={onFiles} />{photos.map((url, index) => <View key={url} style={styles.photoRow}><Text numberOfLines={1} variant="caption" tone="secondary" style={styles.photoUrl}>{url}</Text><Pressable disabled={index === 0} onPress={() => onMove(url, -1)}><Text tone="accent">↑</Text></Pressable><Pressable disabled={index === photos.length - 1} onPress={() => onMove(url, 1)}><Text tone="accent">↓</Text></Pressable><Pressable onPress={() => onRemove(url)}><Text tone="danger">×</Text></Pressable></View>)}{pending.map((file) => <Text key={file.name} variant="caption" tone="secondary">{t('admin.pendingUpload', { name: file.name })}</Text>)}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, scroll: { padding: space.xl, gap: space.lg, maxWidth: 1200, width: '100%', alignSelf: 'center' }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'flex-end' }, search: { minWidth: 200 }, list: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, rowMain: { flex: 1, gap: space.xs }, rowActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm }, link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm }, overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' }, overlayWide: { alignItems: 'flex-end' }, formScroll: { minHeight: '100%', padding: space.md, justifyContent: 'flex-end' }, formPanel: { width: '100%', maxWidth: 620, padding: space.lg }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, twoColumns: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' }, half: { minWidth: 160 }, locationSection: { gap: space.md }, coordinates: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: space.sm }, hours: { gap: space.md }, day: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingBottom: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, dayName: { width: 34, paddingTop: 14, textTransform: 'uppercase' }, ranges: { flex: 1, gap: space.sm }, range: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end', flexWrap: 'wrap' }, timeInput: { width: 90 }, removeRange: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, addRange: { minHeight: 32, justifyContent: 'center' }, photos: { gap: space.sm }, photoRow: { flexDirection: 'row', gap: space.md, alignItems: 'center', minHeight: 36 }, photoUrl: { flex: 1 },
});
