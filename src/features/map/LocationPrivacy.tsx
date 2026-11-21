import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Glass, Icon, Text } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';
import { colors, radius, space } from '@/theme/tokens';
import type { LocationIssue } from './useUserLocation';

type Props = {
  visible: boolean;
  allowed: boolean;
  issue: LocationIssue | null;
  locating: boolean;
  onAllow: () => void;
  onSkip: () => void;
  onRetry: () => void;
  onClose: () => void;
};

export function LocationPrivacy({ visible, allowed, issue, locating, onAllow, onSkip, onRetry, onClose }: Props) {
  const { t } = useTranslation();
  const title = t(issue ? 'locationPrivacy.accessTitle' : 'locationPrivacy.title');
  const canRetry = issue === 'denied' || issue === 'unavailable';

  return (
    <WebDialog visible={visible} label={title} fromBottom onDismiss={onClose}>
      <Glass strong rounded={radius.sheet} style={[styles.sheet, bottomInset]}>
        <Icon name="locate" size={26} color={colors.accent} playOnMount />
        <Text variant="title" weight="bold">{title}</Text>
        {issue ? (
          <>
            <Text accessibilityLiveRegion="polite" tone="secondary">{t('map.locationIssue.' + issue)}</Text>
            {canRetry && <Button label={t('common.retry')} full loading={locating} onPress={onRetry} />}
            {issue === 'embedded' && (
              <Button label={t('locationPrivacy.openInBrowser')} full onPress={() => window.open(window.location.href, '_blank', 'noopener')} />
            )}
          </>
        ) : (
          <>
            <Text tone="secondary">{t('locationPrivacy.intro')}</Text>
            <View style={styles.policy}>
              <Text weight="semibold">{t('locationPrivacy.policyTitle')}</Text>
              <Text variant="caption" tone="secondary">{t('locationPrivacy.sharing')}</Text>
              <Text variant="caption" tone="secondary">{t('locationPrivacy.control')}</Text>
            </View>
            <Button label={t(allowed ? 'locationPrivacy.done' : 'locationPrivacy.allow')} full onPress={allowed ? onClose : onAllow} />
          </>
        )}
        <Button label={t(allowed && !issue ? 'locationPrivacy.revoke' : 'locationPrivacy.skip')} variant="ghost" full onPress={onSkip} />
      </Glass>
    </WebDialog>
  );
}

const bottomInset = { paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' } as object;

const styles = StyleSheet.create({
  sheet: { gap: space.md, padding: space.xl, alignSelf: 'center', width: '100%', maxWidth: 520 },
  policy: { gap: space.sm, marginVertical: space.xs },
});
