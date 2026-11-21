import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { useGuestDraftMigration } from './migrateGuestDraft';
import { Button, Glass, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { radius, space } from '@/theme/tokens';

export function GuestDraftMigrationPrompt({ session }: { session: Session | null }) {
  const { t } = useTranslation();
  const migration = useGuestDraftMigration(session);

  return (
    <WebDialog visible={migration.visible} label={t('auth.guestDraftTitle')} fromBottom dismissOnBackdrop onDismiss={migration.dismiss}>
      <Glass strong rounded={radius.sheet} style={[styles.sheet, bottomInset]}>
        <Text variant="title" weight="bold">{t('auth.guestDraftTitle')}</Text>
        <Text tone="secondary">{t('auth.guestDraftSubtitle')}</Text>
        {migration.error && <Text accessibilityRole="alert" tone="danger">{t('auth.guestDraftError')}</Text>}
        <Button label={t('auth.guestDraftSave')} loading={migration.saving} full onPress={migration.save} />
        <Button label={t('auth.guestDraftKeep')} variant="ghost" full disabled={migration.saving} onPress={migration.dismiss} />
      </Glass>
    </WebDialog>
  );
}

const bottomInset = { paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' } as object;

const styles = StyleSheet.create({
  sheet: { gap: space.lg, padding: space.xl, paddingBottom: space.xxl, maxWidth: 560, width: '100%', alignSelf: 'center' },
});
