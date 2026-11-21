import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Button, Glass, Icon, IconButton, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { colors, radius, space } from '@/theme/tokens';

type AuthReason = 'save' | 'rate' | 'publish' | 'favourite' | 'account';
type PendingRequest = { reason: AuthReason; onSuccess: () => void };
type RequireAuthState = { requireAuth: (reason: AuthReason, onSuccess: () => void) => void };

const RequireAuthContext = createContext<RequireAuthState | null>(null);

export function RequireAuthProvider({ children, signedIn }: PropsWithChildren<{ signedIn: boolean }>) {
  const [request, setRequest] = useState<PendingRequest | null>(null);

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
      <SignInSheet key={request ? `open-${request.reason}` : 'closed'} visible={!!request} reason={request?.reason} onDismiss={() => setRequest(null)} />
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
  const router = useRouter();
  const drawer = reason === 'account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordMode, setPasswordMode] = useState(true);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [errorKey, setErrorKey] = useState('auth.signInError');

  const showError = (key: string) => {
    setErrorKey(key);
    setState('error');
  };

  const submit = async () => {
    if (state === 'sending') return;
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showError('auth.invalidEmail');
      return;
    }
    if (passwordMode && (!password || (creatingAccount && password.length < 6))) {
      showError(creatingAccount ? 'auth.shortPassword' : 'auth.missingPassword');
      return;
    }
    setState('sending');
    try {
      const result = passwordMode
        ? creatingAccount
          ? await supabase.auth.signUp({ email: cleanEmail, password })
          : await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              emailRedirectTo:
                Platform.OS === 'web' && typeof window !== 'undefined'
                  ? `${window.location.origin}/auth/callback`
                  : undefined,
            },
          });

      if (result.error) {
        showError(result.error.code === 'invalid_credentials' ? 'auth.invalidCredentials' : 'auth.signInError');
        return;
      }
      setState(!passwordMode || (creatingAccount && !result.data.session) ? 'sent' : 'idle');
    } catch {
      showError('auth.connectionError');
    }
  };

  const reasonKey: Record<AuthReason, string> = {
    save: 'auth.saveRoutePrompt',
    rate: 'auth.ratePrompt',
    publish: 'auth.publishPrompt',
    favourite: 'auth.favouritePrompt',
    account: 'auth.accountPrompt',
  };

  const form = (
    <Glass strong rounded={radius.sheet} style={[styles.sheet, drawer && styles.drawer]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, drawer && drawerInsets]}>
        <View style={styles.header}>
          <View style={styles.icon}><Icon name="user" size={24} color={colors.accent} playOnMount /></View>
          <IconButton icon="close" label={t('common.close')} tone="plain" onPress={onDismiss} />
        </View>
        <Text variant="title" weight="bold">{t(creatingAccount ? 'auth.signUpButton' : 'auth.signInTitle')}</Text>
        <Text tone="secondary">{reason ? t(reasonKey[reason]) : t('auth.signInSubtitle')}</Text>
        {state === 'sent' ? (
          <View style={styles.status}>
            <Text variant="headline" weight="semibold">{t('auth.magicLinkSent')}</Text>
            <Text tone="secondary">{t('auth.emailSentDetail', { email: email.trim() })}</Text>
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
                  value={password}
                  onChangeText={(value) => { setPassword(value); if (state === 'error') setState('idle'); }}
                  style={styles.input}
                />
              </>
            )}
            {state === 'error' && <Text accessibilityRole="alert" tone="danger">{t(errorKey)}</Text>}
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
        {drawer && (
          <Button label={t('profile.settings')} variant="ghost" full onPress={() => {
            onDismiss();
            router.push('/settings');
          }} />
        )}
      </ScrollView>
    </Glass>
  );

  return (
    <WebDialog visible={visible} label={t('auth.signInTitle')} fromBottom={!drawer} dismissOnBackdrop onDismiss={onDismiss}>
      {drawer ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <Pressable accessible={false} onPress={onDismiss} style={StyleSheet.absoluteFill} />
          <div className="sign-in-drawer">{form}</div>
        </KeyboardAvoidingView>
      ) : form}
    </WebDialog>
  );
}

const drawerInsets = {
  paddingTop: 'max(28px, env(safe-area-inset-top, 0px))',
  paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))',
  paddingLeft: 'max(28px, env(safe-area-inset-left, 0px))',
} as object;

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: { maxWidth: 520, width: '100%', alignSelf: 'center', backgroundColor: colors.bgElevated },
  drawer: { maxHeight: '100%', flex: 1 },
  content: { gap: space.md, padding: space.xl, paddingBottom: space.xxl },
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
