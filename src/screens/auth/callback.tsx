import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Text } from '@/ui';
import { colors, space } from '@/theme/tokens';

export default function AuthCallbackScreen({ code }: { code?: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [exchangeFailed, setError] = useState(false);
  const pending = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    let active = true;
    pending.current ??= (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return true;
      if (!code) return false;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return !error;
    })().catch(() => false);
    void pending.current.then((ok) => {
      if (!active) return;
      if (ok) router.replace('/');
      else setError(true);
    });
    return () => { active = false; };
  }, [code, router]);

  return (
    <View style={styles.root}>
      {exchangeFailed ? <Text tone="danger">{t('auth.callbackError')}</Text> : <><ActivityIndicator color={colors.accent} /><Text tone="secondary">{t('auth.callbackLoading')}</Text></>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: colors.bg, padding: space.xl },
});
