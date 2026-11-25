import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, IconButton, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { colors, space } from '@/theme/tokens';
import type { LocationIssue } from './useUserLocation';

type Props = {
  visible: boolean;
  allowed: boolean;
  issue: LocationIssue | null;
  locating: boolean;
  showPolicy: boolean;
  onShowPolicy: () => void;
  onBackToConsent: () => void;
  onAllow: () => void;
  onSkip: () => void;
  onRetry: () => void;
  onClose: () => void;
};

export function LocationPrivacy({
  visible, allowed, issue, locating, showPolicy, onShowPolicy, onBackToConsent, onAllow, onSkip, onRetry, onClose,
}: Props) {
  const { t } = useTranslation();
  const title = t(showPolicy ? 'privacyPolicy.title' : issue ? 'locationPrivacy.accessTitle' : 'locationPrivacy.title');
  const canRetry = issue === 'denied' || issue === 'unavailable';

  return (
    <WebDialog visible={visible} label={title} fromBottom dismissOnBackdrop onDismiss={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Icon name="locate" size={22} color={colors.accent} />
          <IconButton icon="close" label={t('common.close')} tone="plain" onPress={onClose} />
        </View>
        <Text variant="title" weight="bold">{title}</Text>
        {showPolicy ? (
          <>
            {(['location', 'account', 'choices'] as const).map(section => (
              <View key={section} style={styles.policy}>
                <Text weight="semibold">{t(`privacyPolicy.${section}Title`)}</Text>
                <Text tone="secondary">{t(`privacyPolicy.${section}Body`)}</Text>
              </View>
            ))}
            <Button label={t('locationPrivacy.manage')} variant="secondary" full onPress={onBackToConsent} />
          </>
        ) : (
          <>
            {issue ? (
              <>
                <Text accessibilityLiveRegion="polite" tone="secondary">{t(`map.locationIssue.${issue}`)}</Text>
                {canRetry && <Button label={t('common.retry')} full loading={locating} onPress={onRetry} />}
                {issue === 'embedded' && (
                  <Button label={t('locationPrivacy.openInBrowser')} full onPress={() => window.open(window.location.href, '_blank', 'noopener')} />
                )}
              </>
            ) : (
              <>
                <Text tone="secondary">{t('locationPrivacy.intro')}</Text>
                <Button label={t(allowed ? 'locationPrivacy.done' : 'locationPrivacy.allow')} full onPress={allowed ? onClose : onAllow} />
              </>
            )}
            <Button label={t(allowed ? 'locationPrivacy.revoke' : 'locationPrivacy.skip')} variant="secondary" full onPress={onSkip} />
            <Button label={t('privacyPolicy.read')} variant="ghost" full onPress={onShowPolicy} />
          </>
        )}
      </View>
    </WebDialog>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space.md, padding: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  policy: { gap: space.xs },
});
