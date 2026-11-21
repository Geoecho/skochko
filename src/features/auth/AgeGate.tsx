import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@/lib/browser-storage';
import { useTranslation } from 'react-i18next';
import { Button, Glass, Icon, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { colors, radius, space } from '@/theme/tokens';

const AGE_CONFIRMED_KEY = 'skochko.age-confirmed';

export function AgeGate({ onConfirmed }: { onConfirmed: () => void }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [underage, setUnderage] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AGE_CONFIRMED_KEY)
      .then((value) => setConfirmed(value === 'true'))
      .catch(() => setError(true))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (confirmed) onConfirmed();
  }, [confirmed, onConfirmed]);

  const confirm = async () => {
    setSaving(true);
    setError(false);
    try {
      await AsyncStorage.setItem(AGE_CONFIRMED_KEY, 'true');
      setConfirmed(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!ready || confirmed) return null;

  return (
    <WebDialog visible label={t('ageGate.title')} fromBottom onDismiss={() => {}}>
      <Glass strong rounded={radius.sheet} style={[styles.card, bottomInset]}>
        <View style={styles.icon}><Icon name="compass" size={24} color={colors.accent} playOnMount /></View>
        <Text variant="title" weight="bold">{t('ageGate.title')}</Text>
        <Text tone="secondary">{underage ? t('ageGate.underageNotice') : t('ageGate.subtitle')}</Text>
        {error && <Text accessibilityRole="alert" tone="danger">{t('ageGate.storageError')}</Text>}
        {!underage && (
          <View style={styles.actions}>
            <Button label={t('ageGate.confirm')} full loading={saving} onPress={confirm} />
            <Button label={t('ageGate.exit')} variant="ghost" full disabled={saving} onPress={() => setUnderage(true)} />
          </View>
        )}
        {underage && <Button label={t('common.back')} variant="secondary" full onPress={() => setUnderage(false)} />}
      </Glass>
    </WebDialog>
  );
}

const bottomInset = { paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))' } as object;

const styles = StyleSheet.create({
  card: { gap: space.lg, padding: space.xl, width: '100%', maxWidth: 480, alignSelf: 'center' },
  icon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: space.md, marginTop: space.md },
});
