import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useOpenSettings } from '@/features/settings/SettingsDrawerContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Button, Icon, IconButton, Text } from '@/ui';
import { colors, radius, space } from '@/theme/tokens';
import { SideDrawer } from '@/ui/SideDrawer';

type AuthReason = 'save' | 'rate' | 'publish' | 'favourite' | 'account';
type PendingRequest = { reason: AuthReason; onSuccess: () => void };
type RequireAuthState = { requireAuth: (reason: AuthReason, onSuccess: () => void) => void };

const RequireAuthContext = createContext<RequireAuthState | null>(null);

export function RequireAuthProvider({ children, signedIn }: PropsWithChildren<{ signedIn: boolean }>) {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const dismiss = useCallback(() => setRequest(null), []);

  // Signed in while a request was pending: finish it on the next tick (after this render commits).
  useEffect(() => {
    if (!signedIn || !request) return;
    const id = setTimeout(() => {
      setRequest(null);
      request.onSuccess();
    }, 0);
    return () => clearTimeout(id);
  }, [request, signedIn]);

  const requireAuth = useCallback(
    (reason: AuthReason, onSuccess: () => void) => {
      if (signedIn) {
        onSuccess();
        return;
      }
      setRequest({ reason, onSuccess });
    },
    [signedIn],
  );

  return (
    <RequireAuthContext.Provider value={{ requireAuth }}>
      {children}
      {/* key: a fresh sheet (empty password, idle state) every time it opens */}
      <SignInSheet key={request ? `open-${request.reason}` : 'closed'} visible={!!request} reason={request?.reason} onDismiss={dismiss} />
    </RequireAuthContext.Provider>
  );
}

export function useRequireAuth() {
  const value = useContext(RequireAuthContext);
  if (!value) throw new Error('useRequireAuth must be used inside AuthProvider');
  return value;
}

function SignInSheet({ visible, reason, onDismiss }: { visible: boolean; reason?: AuthReason; onDismiss: () => void }) {
  const { t } = useTranslation();
  const openSettings = useOpenSettings();
  const showSettings = reason === 'account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordMode, setPasswordMode] = useState(true);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [errorKey, setErrorKey] = useState('auth.signInError');

  const showError = (key: string) => {
    setErrorKey(key);
    setState('error');
  };

  const send = async (resendConfirmation = false) => {
    if (state === 'sending') return;
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showError('auth.invalidEmail');
      return;
    }
    if (!resendConfirmation && passwordMode && (!password || (creatingAccount && password.length < 6))) {
      showError(creatingAccount ? 'auth.shortPassword' : 'auth.missingPassword');
      return;
    }
    setState('sending');
    const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
      ? new URL('/auth/callback', window.location.origin).href
      : undefined;
    try {
      if (resendConfirmation) {
        const { error } = await supabase.auth.resend({ type: 'signup', email: cleanEmail, options: { emailRedirectTo } });
        if (error) { showError('auth.resendConfirmationError'); return; }
        setConfirmationSent(true);
        setState('sent');
        return;
      }
      const result = passwordMode
        ? creatingAccount
          ? await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo } })
          : await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: { emailRedirectTo, shouldCreateUser: false },
          });

      if (result.error) {
        const code = result.error.code;
        showError(code === 'email_not_confirmed' ? 'auth.emailNotConfirmed'
          : code === 'invalid_credentials' ? 'auth.invalidCredentials' : 'auth.signInError');
        return;
      }
      setConfirmationSent(creatingAccount && !result.data.session);
      setState(!passwordMode || (creatingAccount && !result.data.session) ? 'sent' : 'idle');
    } catch {
      showError('auth.connectionError');
    }
  };

  const submit = () => { void send(); };
  const resend = () => { void send(true); };

  const reasonKey: Record<AuthReason, string> = {
    save: 'auth.saveRoutePrompt',
    rate: 'auth.ratePrompt',
    publish: 'auth.publishPrompt',
    favourite: 'auth.favouritePrompt',
    account: 'auth.accountPrompt',
  };

  if (!visible) return null;

  return (
    <SideDrawer label={t('auth.signInTitle')} onDismiss={onDismiss}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.icon}><Icon name="user" size={24} color={colors.accent} playOnMount /></View>
          <IconButton icon="close" label={t('common.close')} tone="plain" onPress={onDismiss} />
        </View>
        <Text variant="title" weight="bold">{t(creatingAccount ? 'auth.signUpButton' : 'auth.signInTitle')}</Text>
        <Text tone="secondary">{reason ? t(reasonKey[reason]) : t('auth.signInSubtitle')}</Text>
        {state === 'sent' ? (
          <View accessibilityLiveRegion="polite" style={styles.status}>
            <Text variant="headline" weight="semibold">{t('auth.magicLinkSent')}</Text>
            <Text tone="secondary">{t('auth.emailSentDetail', { email: email.trim() })}</Text>
            {confirmationSent && <Button label={t('auth.resendConfirmation')} variant="secondary" full onPress={resend} />}
            <Button label={t('common.done')} full onPress={onDismiss} />
          </View>
        ) : (
          <View style={styles.form}>
            <Text weight="semibold">{t('auth.email')}</Text>
            <TextInput
              accessibilityLabel={t('auth.email')}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              editable={state !== 'sending'}
              value={email}
              onChangeText={(value) => { setEmail(value); if (state === 'error') setState('idle'); }}
              onSubmitEditing={passwordMode ? undefined : submit}
              style={styles.input}
            />
            {passwordMode && (
              <>
                <Text weight="semibold">{t('auth.password')}</Text>
                <TextInput
                  accessibilityLabel={t('auth.password')}
                  autoComplete={creatingAccount ? 'new-password' : 'current-password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  editable={state !== 'sending'}
                  value={password}
                  onChangeText={(value) => { setPassword(value); if (state === 'error') setState('idle'); }}
                  style={styles.input}
                />
              </>
            )}
            {state === 'error' && <Text accessibilityRole="alert" tone="danger">{t(errorKey)}</Text>}
            {state === 'error' && (errorKey === 'auth.emailNotConfirmed' || errorKey === 'auth.resendConfirmationError') && (
              <Button label={t('auth.resendConfirmation')} variant="secondary" full onPress={resend} />
            )}
            <Button
              label={passwordMode ? t(creatingAccount ? 'auth.signUpButton' : 'auth.signInButton') : t('auth.magicLink')}
              loading={state === 'sending'}
              full
              onPress={submit}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(passwordMode ? 'auth.useMagicLink' : 'auth.orPassword')}
              disabled={state === 'sending'}
              onPress={() => {
                setPasswordMode((value) => !value);
                setCreatingAccount(false);
                setState('idle');
              }}
              style={styles.link}
            >
              <Text tone="accent" weight="semibold">{t(passwordMode ? 'auth.useMagicLink' : 'auth.orPassword')}</Text>
            </Pressable>
            {passwordMode && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(creatingAccount ? 'auth.haveAccount' : 'auth.needAccount')}
                disabled={state === 'sending'}
                onPress={() => { setCreatingAccount((value) => !value); setState('idle'); }}
                style={styles.link}
              >
                <Text tone="secondary">{t(creatingAccount ? 'auth.haveAccount' : 'auth.needAccount')}</Text>
              </Pressable>
            )}
          </View>
        )}
        {showSettings && (
          <Button label={t('profile.settings')} variant="ghost" full onPress={() => {
            onDismiss();
            openSettings();
          }} />
        )}
      </ScrollView>
    </SideDrawer>
  );
}

const styles = StyleSheet.create({
  scroll: { minHeight: 0, flex: 1 },
  content: { gap: space.md, padding: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  form: { gap: space.md },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    color: colors.text,
    paddingHorizontal: space.lg,
    fontSize: 16,
  },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  status: { gap: space.lg, paddingTop: space.md },
});
