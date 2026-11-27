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
import { Button, Glass, Icon, Text } from '@/ui';
import { SideDrawer, DrawerHeader } from '@/ui/SideDrawer';
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
    <SideDrawer presentation="screen" label={t('profile.settings')} onDismiss={dismiss}>{(closeDrawer) => (<>
        <DrawerHeader back title={t('profile.settings')} onClose={closeDrawer} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Glass style={styles.card}>
            <Text variant="headline" weight="bold">{t('profile.language')}</Text>
            <View style={styles.languageRow}>
              <LanguageButton locale="mk" label="Македонски" selected={i18n.language === 'mk'} onPress={changeLanguage} />
              <LanguageButton locale="en" label="English" selected={i18n.language === 'en'} onPress={changeLanguage} />
            </View>
          </Glass>

          <Glass style={styles.card}>
            <Text variant="headline" weight="bold">{t('intro.label')}</Text>
            <Text tone="secondary">{t('intro.replayDescription')}</Text>
            <Button label={t('intro.replay')} variant="secondary" full onPress={() => {
              closeDrawer();
              window.dispatchEvent(new Event('skochko:show-intro'));
            }} />
          </Glass>
          <View style={styles.privacySection}>
            <Text variant="headline" weight="bold" style={styles.sectionLabel}>{t('privacyPolicy.title')}</Text>
            <Glass style={styles.privacyMenu}>
              <Pressable accessibilityRole="button" onPress={openPrivacyPolicy} style={styles.privacyRow}>
                <View style={styles.privacyIcon}><Icon name="shield" size={20} color={colors.text} playOnMount /></View>
                <Text weight="semibold" style={styles.privacyLabel}>{t('settings.privacyPolicy')}</Text>
                <View style={styles.chevron}><Icon name="back" size={18} color={colors.textSecondary} /></View>
              </Pressable>
              <View style={styles.divider} />
              <Pressable accessibilityRole="button" onPress={openPrivacy} style={styles.privacyRow}>
                <View style={styles.privacyIcon}><Icon name="locate" size={20} color={colors.text} playOnMount /></View>
                <Text weight="semibold" style={styles.privacyLabel}>{t('settings.locationAccess')}</Text>
                <View style={styles.chevron}><Icon name="back" size={18} color={colors.textSecondary} /></View>
              </Pressable>
            </Glass>
          </View>

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
    </>)}
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
  privacySection: { gap:space.md, paddingVertical:space.xl, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:colors.hairline },
  sectionLabel: { paddingHorizontal: 0 },
  privacyMenu: { overflow: 'hidden', borderRadius:0, backgroundColor:'transparent' },
  privacyRow: { minHeight: 76, paddingHorizontal: 0, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  privacyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  privacyLabel: { flex: 1, fontSize: 15, lineHeight: 22 },
  chevron: { transform: [{ rotate: '180deg' }], flexShrink: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginLeft: 68 },
  scroll: { minHeight: 0, flex: 1 },
  content: { width:'100%', maxWidth:680, alignSelf:'center', gap:0, paddingHorizontal:space.xl, paddingTop:space.sm, paddingBottom:space.xxl },
  header: { minHeight: 72, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  card: { gap:space.md, paddingVertical:space.xl, borderRadius:0, backgroundColor:'transparent', borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:colors.hairline },
  languageRow: { flexDirection: 'row', gap: space.sm },
  languageButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.bgElevated },
  languageSelected: { backgroundColor: colors.accentFill },
});
