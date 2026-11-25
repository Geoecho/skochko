import { useCallback, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useOpenSettings } from '@/features/settings/SettingsDrawerContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { supabase } from '@/lib/supabase';
import { useUserStats } from '@/features/history/api';
import { SideDrawer } from '@/ui/SideDrawer';
import { Button, Glass, IconButton, Text } from '@/ui';
import { colors, radius, space } from '@/theme/tokens';

export default function ProfileScreen({ onDismiss }: { onDismiss?: () => void }) {
  const router = useRouter();
  const dismiss = useCallback(() => { if (onDismiss) onDismiss(); else router.replace('/'); }, [onDismiss, router]);
  const openSettings = useOpenSettings();
  const { t } = useTranslation();
  const stats = useUserStats();
  const crawls = stats.data?.crawls_count ?? 0;
  const routesCreated = stats.data?.routes_created_count ?? 0;
  const { session, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);


  const saveName = async () => {
    if (!session) return;
    const displayName = name.trim();
    if (!displayName) return;
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', session.user.id);
    setSavingName(false);
    if (!error) {
      await refreshProfile();
      setEditing(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!session) return;
    setUploading(true);
    const path = `${session.user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: `${data.publicUrl}?v=${Date.now()}` }).eq('user_id', session.user.id);
      await refreshProfile();
    }
    setUploading(false);
  };

  const pickAvatar = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      if (file) uploadAvatar(file);
    };
    input.click();
  };

  const initials = (profile?.display_name || session?.user.email || '?').slice(0, 1).toUpperCase();

  return (
    <SideDrawer label={t('profile.title')} onDismiss={dismiss}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Glass strong style={styles.header}>
        <Text variant="title" weight="bold">{t('profile.title')}</Text>
        <IconButton icon="close" label={t('common.close')} tone="plain" onPress={dismiss} />
      </Glass>

      {!session ? (
        <Glass style={styles.card}>
          <Text variant="title" weight="bold">{t('profile.guestUser')}</Text>
          <Text tone="secondary">{t('profile.guestSubtitle')}</Text>
          <Button label={t('auth.signInButton')} full onPress={() => requireAuth('account', () => {})} />
        </Glass>
      ) : (
        <>
          <Glass style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.changeAvatar')}
              disabled={uploading || Platform.OS !== 'web'}
              onPress={pickAvatar}
              style={styles.avatar}
            >
              {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Text variant="title" weight="bold">{initials}</Text>}
            </Pressable>
            <Text tone="tertiary">{uploading ? t('profile.uploadingAvatar') : t('profile.changeAvatar')}</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  accessibilityLabel={t('profile.displayName')}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={saveName}
                  style={styles.input}
                />
                <Button label={t('common.done')} loading={savingName} onPress={saveName} />
              </View>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.edit')} onPress={() => { setName(profile?.display_name ?? ''); setEditing(true); }} style={styles.name}>
                <Text variant="title" weight="bold">{profile?.display_name}</Text>
                <Text tone="accent">{t('common.edit')}</Text>
              </Pressable>
            )}
            <Text tone="secondary">{session.user.email}</Text>
          </Glass>

          <View style={styles.stats}>
            <Glass style={styles.stat}><Text variant="title" weight="bold">{crawls}</Text><Text tone="secondary">{t('profile.stats.crawls', { count: crawls })}</Text></Glass>
            <Glass style={styles.stat}><Text variant="title" weight="bold">{routesCreated}</Text><Text tone="secondary">{t('profile.stats.routesCreated', { count: routesCreated })}</Text></Glass>
          </View>

          <Glass style={styles.menu}>
            <MenuItem label={t('profile.history')} onPress={() => router.push('/history')} />
            <MenuItem label={t('profile.settings')} onPress={openSettings} />
            {isAdmin && <MenuItem label={t('profile.admin')} onPress={() => router.push('/admin')} />}
            <MenuItem label={t('profile.signOut')} danger onPress={() => signOut().then(dismiss)} />
          </Glass>
        </>
      )}
    </ScrollView>
    </SideDrawer>
  );
}

function MenuItem({ label, danger, onPress }: { label: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.menuItem}>
      <Text weight="semibold" tone={danger ? 'danger' : 'primary'}>{label}</Text>
      {!danger && <Text tone="tertiary">›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: space.lg, padding: space.lg, paddingBottom: space.xxl, backgroundColor: colors.bgElevated },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, backgroundColor: colors.bgElevated, borderWidth: 0 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', gap: space.md, padding: space.xl },
  avatar: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.hairline },
  avatarImage: { width: '100%', height: '100%' },
  name: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  editRow: { alignSelf: 'stretch', flexDirection: 'row', gap: space.sm },
  input: { flex: 1, minHeight: 48, color: colors.text, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.card, paddingHorizontal: space.md, fontSize: 16 },
  stats: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1, minHeight: 104, gap: space.sm, padding: space.lg, justifyContent: 'center' },
  menu: { overflow: 'hidden' },
  menuItem: { minHeight: 56, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
});
