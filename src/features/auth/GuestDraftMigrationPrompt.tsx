import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { useGuestDraftMigration } from './migrateGuestDraft';
import { Button, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { space } from '@/theme/tokens';

export function GuestDraftMigrationPrompt({ session }: { session: Session | null }) {
  const { t } = useTranslation();
  const migration = useGuestDraftMigration(session);

  return (
    <WebDialog visible={migration.visible} label={t('auth.guestDraftTitle')} fromBottom dismissOnBackdrop onDismiss={migration.dismiss}>
      <View style={styles.sheet}>
        <Text variant="title" weight="bold">{t('auth.guestDraftTitle')}</Text>
        <Text tone="secondary">{t('auth.guestDraftSubtitle')}</Text>
        {migration.error && <Text accessibilityRole="alert" tone="danger">{t('auth.guestDraftError')}</Text>}
        <Button label={t('auth.guestDraftSave')} loading={migration.saving} full onPress={migration.save} />
        <Button label={t('auth.guestDraftKeep')} variant="ghost" full disabled={migration.saving} onPress={migration.dismiss} />
      </View>
    </WebDialog>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space.md, padding: space.lg },
});
