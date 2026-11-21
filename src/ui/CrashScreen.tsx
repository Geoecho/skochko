import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import i18n from '@/i18n';
import { reportError } from '@/lib/errorReporting';
import { colors, space } from '@/theme/tokens';
import { Button } from './Button';
import { Glass } from './Glass';
import { Text } from './Text';

// Shown instead of a blank page when a screen throws. Reports the error once.
export function CrashScreen({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    reportError('render', error);
  }, [error]);

  const reload = () => {
    if (Platform.OS === 'web') window.location.assign('/');
    else void retry();
  };

  return (
    <View style={styles.root}>
      <Glass strong style={styles.card}>
        <Text variant="title" weight="bold">{i18n.t('errors.crashTitle')}</Text>
        <Text tone="secondary">{i18n.t('errors.crashBody')}</Text>
        <Button label={i18n.t('errors.tryAgain')} full onPress={() => void retry()} />
        <Button label={i18n.t('errors.reloadApp')} variant="ghost" full onPress={reload} />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: space.xl },
  card: { padding: space.xl, gap: space.md, maxWidth: 440, width: '100%', alignSelf: 'center' },
});
