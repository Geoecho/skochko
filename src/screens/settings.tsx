import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@/lib/browser-storage';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18n, { type Locale } from '@/i18n';
import { useUserLocation } from '@/features/map/useUserLocation';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useConfirmation } from '@/ui/Confirmation';
import { Button, Glass, IconButton, Text } from '@/ui';
import { SideDrawer } from '@/ui/SideDrawer';
import { colors, space } from '@/theme/tokens';

type DeferredInstallPrompt = Event & { prompt: () => Promise<void> };

export default function SettingsScreen({ onDismiss }: { onDismiss?: () => void }) {
  const router = useRouter();
  const dismiss = useCallback(() => {
    if (onDismiss) onDismiss();
    else router.replace('/profile');
  }, [onDismiss, router]);
  const confirm = useConfirmation();
  const { t } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const { openPrivacy, openPrivacyPolicy } = useUserLocation();
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const promptRef = useRef<DeferredInstallPrompt | null>(null);
  const isIos = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as DeferredInstallPrompt;
      setInstallPromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc('delete_my_account');
    setDeleting(false);
    if (error) {
      if (Platform.OS === 'web') window.alert(error.message);
      return;
    }
    await supabase.auth.signOut({ scope: 'local' });
    router.replace('/');
  };

  const changeLanguage = async (locale: Locale) => {
    await AsyncStorage.setItem('skochko.locale', locale);
    await i18n.changeLanguage(locale);
    if (session) {
      const { error } = await supabase.from('profiles').update({ locale }).eq('user_id', session.user.id);
      if (!error) await refreshProfile();
    }
  };

  const install = async () => {
    const prompt = promptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    promptRef.current = null;
    setInstallPromptAvailable(false);
  };

  return (
    <SideDrawer label={t('profile.settings')} onDismiss={dismiss}>
        <View style={styles.header}>
          <Text variant="title" weight="bold">{t('profile.settings')}</Text>
          <IconButton icon="close" label={t('common.close')} tone="plain" onPress={dismiss} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Glass style={styles.card}>
            <Text variant="headline" weight="bold">{t('profile.language')}</Text>
            <View style={styles.languageRow}>
              <LanguageButton locale="mk" label="Македонски" selected={i18n.language === 'mk'} onPress={changeLanguage} />
              <LanguageButton locale="en" label="English" selected={i18n.language === 'en'} onPress={changeLanguage} />
            </View>
          </Glass>

          <Glass style={styles.card}>
            <Text variant="headline" weight="bold">{t('privacyPolicy.title')}</Text>
            <Button label={t('privacyPolicy.read')} variant="secondary" full onPress={openPrivacyPolicy} />
            <Button label={t('locationPrivacy.manage')} variant="ghost" full onPress={openPrivacy} />
          </Glass>

          {Platform.OS === 'web' && (isIos || installPromptAvailable) && (
            <Glass style={styles.card}>
              <Text variant="headline" weight="bold">{t('install.title')}</Text>
              {isIos ? (
                <>
                  <Text tone="secondary">{t('install.iosStep1')}</Text>
                  <Text tone="secondary">{t('install.iosStep2')}</Text>
                </>
              ) : (
                <Button label={t('install.androidButton')} full onPress={install} />
              )}
            </Glass>
          )}

          <Glass style={styles.card}>
            <Text variant="headline" weight="bold" tone="danger">{t('profile.deleteAccount')}</Text>
            <Text tone="secondary">{t('profile.deleteAccountConfirm')}</Text>
            <Button label={t('profile.deleteAccount')} variant="secondary" full loading={deleting} disabled={!session} onPress={() => confirm({
              title: t('profile.deleteAccount'),
              message: t('profile.deleteAccountConfirm'),
              confirmLabel: t('common.delete'),
              destructive: true,
              onConfirm: deleteAccount,
            })} />
          </Glass>
        </ScrollView>
    </SideDrawer>
  );
}

function LanguageButton({ locale, label, selected, onPress }: { locale: Locale; label: string; selected: boolean; onPress: (locale: Locale) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => onPress(locale)}
      style={[styles.languageButton, selected && styles.languageSelected]}
    >
      <Text weight="semibold" tone={selected ? 'onAccent' : 'primary'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { minHeight: 0, flex: 1 },
  content: { gap: space.md, padding: space.lg, paddingTop: 0 },
  header: { minHeight: 60, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  card: { gap: space.md, padding: space.lg },
  languageRow: { flexDirection: 'row', gap: space.sm },
  languageButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  languageSelected: { backgroundColor: colors.accentFill },
});
