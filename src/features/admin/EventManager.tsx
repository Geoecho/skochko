import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/ui';
import { colors, space } from '@/theme/tokens';
import { deleteEvent, fetchEvents, fetchVenues, removePublicFile, saveEvent, uploadPublicFile } from './api';
import { AdminPanel, ConfirmButton, EmptyState, Field, FilePicker, SectionHeading, SelectField, useAdminToast } from './AdminUi';
import type { AdminEvent, ContentStatus } from './types';
import { localDateTime, toIso } from './utils';

const defaultStarts = () => { const date = new Date(); date.setHours(20, 0, 0, 0); return date.toISOString(); };
const defaultEnds = () => { const date = new Date(); date.setHours(23, 0, 0, 0); return date.toISOString(); };

type EventDraft = Omit<AdminEvent, 'id' | 'venue_name' | 'created_at'>;
function makeDraft(event?: AdminEvent): EventDraft {
  return { venue_id: event?.venue_id ?? '', title_mk: event?.title_mk ?? '', title_en: event?.title_en ?? '', starts_at: event?.starts_at ?? defaultStarts(), ends_at: event?.ends_at ?? defaultEnds(), cover_url: event?.cover_url ?? null, price: event?.price ?? null, tags: event?.tags ?? [], status: event?.status ?? 'active' };
}

export function EventManager() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: events = [], isLoading } = useQuery({ queryKey: ['admin', 'events'], queryFn: fetchEvents });
  const removeMutation = useMutation({
    mutationFn: deleteEvent,
    onMutate: async (id) => { await queryClient.cancelQueries({ queryKey: ['admin', 'events'] }); const previous = queryClient.getQueryData<AdminEvent[]>(['admin', 'events']); queryClient.setQueryData<AdminEvent[]>(['admin', 'events'], (items = []) => items.filter((event) => event.id !== id)); return { previous }; },
    onError: (error, _id, context) => { queryClient.setQueryData(['admin', 'events'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => showToast(t('admin.deleted')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
  });
  const groups = useMemo(() => events.reduce<Record<string, AdminEvent[]>>((all, event) => { const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Skopje', dateStyle: 'full' }).format(new Date(event.starts_at)); (all[key] ??= []).push(event); return all; }, {}), [events]);

  return <View style={styles.page}><ScrollView contentContainerStyle={styles.scroll}><SectionHeading title={t('admin.nav.events')} action={<Button label={t('admin.eventsList.createEvent')} onPress={() => { setEditing(null); setCreating(true); }} />} /><AdminPanel>{isLoading ? <Text tone="secondary">{t('common.loading')}</Text> : events.length === 0 ? <EmptyState message={t('admin.noEvents')} action={<Button label={t('admin.eventsList.createEvent')} onPress={() => setCreating(true)} />} /> : Object.entries(groups).map(([date, dayEvents]) => <View key={date} style={styles.group}><Text variant="headline" weight="bold">{date}</Text>{dayEvents.map((event) => <EventRow key={event.id} event={event} onEdit={() => { setCreating(false); setEditing(event); }} onDuplicate={() => { setEditing({ ...event, id: '', title_mk: `${event.title_mk} (${t('admin.copy')})` }); setCreating(true); }} onDelete={() => removeMutation.mutate(event.id)} />)}</View>)}</AdminPanel></ScrollView>{creating || editing ? <EventForm key={editing?.id || 'new'} event={editing?.id ? editing : undefined} duplicate={editing?.id === '' ? editing : undefined} wide={width >= 768} onClose={() => { setCreating(false); setEditing(null); }} /> : null}</View>;
}

function EventRow({ event, onEdit, onDuplicate, onDelete }: { event: AdminEvent; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return <View style={styles.row}><View style={styles.rowMain}><Text weight="bold">{event.title_mk}</Text><Text variant="caption" tone="secondary">{event.venue_name} · {new Intl.DateTimeFormat(undefined, { timeZone: 'Europe/Skopje', hour: '2-digit', minute: '2-digit' }).format(new Date(event.starts_at))}</Text></View><View style={styles.actions}><Pressable onPress={onEdit} style={styles.action}><Text variant="caption" weight="semibold" tone="accent">{t('common.edit')}</Text></Pressable><Pressable onPress={onDuplicate} style={styles.action}><Text variant="caption" weight="semibold" tone="accent">{t('admin.duplicate')}</Text></Pressable><ConfirmButton label={t('admin.eventsList.deleteEvent')} message={t('admin.confirmDeleteEvent', { title: event.title_mk })} confirmLabel={t('common.delete')} onConfirm={onDelete} /></View></View>;
}

function EventForm({ event, duplicate, wide, onClose }: { event?: AdminEvent; duplicate?: AdminEvent; wide: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();
  const { data: venues = [] } = useQuery({ queryKey: ['admin', 'venues'], queryFn: fetchVenues });
  const [draft, setDraft] = useState(() => makeDraft(event ?? duplicate));
  const [venueSearch, setVenueSearch] = useState('');
  const [startInput, setStartInput] = useState(localDateTime(draft.starts_at));
  const [endInput, setEndInput] = useState(localDateTime(draft.ends_at));
  const [tagsInput, setTagsInput] = useState(draft.tags.join(', '));
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const visibleVenues = venues.filter((venue) => venue.status === 'active' && venue.name.toLowerCase().includes(venueSearch.toLowerCase()));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const starts_at = toIso(startInput);
      const ends_at = toIso(endInput);
      const nextErrors: Record<string, string> = {};
      if (!draft.venue_id) nextErrors.venue = t('admin.required');
      if (!draft.title_mk.trim()) nextErrors.title_mk = t('admin.required');
      if (!draft.title_en.trim()) nextErrors.title_en = t('admin.required');
      if (!starts_at || !ends_at || ends_at <= starts_at) nextErrors.time = t('admin.timeInvalid');
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length || !starts_at || !ends_at) throw new Error(t('admin.fixErrors'));
      const tags = tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean);
      const saved = await saveEvent({ ...draft, starts_at, ends_at, tags }, event?.id);
      if (!file) return saved;
      const cover_url = await uploadPublicFile('event-covers', saved.id, file);
      const finalEvent = await saveEvent({ ...draft, starts_at, ends_at, tags, cover_url }, saved.id);
      if (event?.cover_url) await removePublicFile('event-covers', event.cover_url);
      return finalEvent;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'events'] });
      const previous = queryClient.getQueryData<AdminEvent[]>(['admin', 'events']);
      if (event) queryClient.setQueryData<AdminEvent[]>(['admin', 'events'], (items = []) => items.map((item) => item.id === event.id ? { ...item, ...draft, venue_name: venues.find((venue) => venue.id === draft.venue_id)?.name ?? item.venue_name } : item));
      return { previous };
    },
    onError: (error, _value, context) => { queryClient.setQueryData(['admin', 'events'], context?.previous); showToast(error.message, 'danger'); },
    onSuccess: () => { showToast(t('admin.saved')); onClose(); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
  });
  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return <View style={[styles.overlay, wide && styles.overlayWide]}><ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled"><AdminPanel style={styles.form}><SectionHeading title={event ? t('admin.eventsList.editEvent') : t('admin.eventsList.createEvent')} action={<Pressable onPress={onClose} style={styles.close}><Text tone="secondary">×</Text></Pressable>} />
    <Field label={t('admin.eventsList.venueSelect')} value={venueSearch} error={errors.venue} placeholder={t('admin.searchVenues')} onChangeText={setVenueSearch} />
    <View style={styles.venueChoices}>{visibleVenues.slice(0, 8).map((venue) => <Pressable key={venue.id} onPress={() => set('venue_id', venue.id)} style={[styles.venueChoice, draft.venue_id === venue.id && styles.venueChoiceActive]}><Text variant="caption" weight="semibold" tone={draft.venue_id === venue.id ? 'accent' : 'secondary'}>{venue.name}</Text></Pressable>)}</View>
    <Field label={t('admin.eventsList.eventTitleMk')} value={draft.title_mk} error={errors.title_mk} onChangeText={(value) => set('title_mk', value)} />
    <Field label={t('admin.eventsList.eventTitleEn')} value={draft.title_en} error={errors.title_en} onChangeText={(value) => set('title_en', value)} />
    <Field label={t('admin.eventsList.startsAt')} value={startInput} error={errors.time} placeholder="2026-11-08T20:00" autoCapitalize="none" onChangeText={setStartInput} />
    <Field label={t('admin.eventsList.endsAt')} value={endInput} placeholder="2026-11-08T23:00" autoCapitalize="none" onChangeText={setEndInput} />
    <Field label={t('admin.eventsList.price')} value={draft.price == null ? '' : String(draft.price)} keyboardType="decimal-pad" onChangeText={(value) => set('price', value ? Number(value) : null)} />
    <Field label={t('admin.eventsList.tags')} value={tagsInput} onChangeText={setTagsInput} />
    <FilePicker label={t('admin.eventCoverUpload')} onFiles={(files) => setFile(files[0] ?? null)} />{file ? <Text variant="caption" tone="secondary">{file.name}</Text> : null}
    <SelectField label={t('admin.venuesList.status')} value={draft.status} onChange={(value) => set('status', value as ContentStatus)} options={[{ value: 'active', label: t('admin.venuesList.statusActive') }, { value: 'archived', label: t('admin.venuesList.statusArchived') }]} />
    <Button label={t('common.save')} full loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
  </AdminPanel></ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, scroll: { padding: space.xl, gap: space.lg, maxWidth: 1200, width: '100%', alignSelf: 'center' }, group: { gap: space.sm }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, rowMain: { flex: 1, gap: space.xs }, actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm }, action: { minHeight: 44, paddingHorizontal: space.sm, justifyContent: 'center' }, overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' }, overlayWide: { alignItems: 'flex-end' }, formScroll: { minHeight: '100%', padding: space.md, justifyContent: 'flex-end' }, form: { width: '100%', maxWidth: 620 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, venueChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }, venueChoice: { minHeight: 36, paddingHorizontal: space.sm, justifyContent: 'center', borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline }, venueChoiceActive: { borderColor: colors.accent, backgroundColor: 'rgba(181,171,255,0.1)' },
});
