import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';
import { WebDialog } from './WebDialog';

type Confirmation = {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

const ConfirmationContext = createContext<((request: Confirmation) => void) | null>(null);

export function ConfirmationProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [request, setRequest] = useState<Confirmation | null>(null);
  const dismiss = () => setRequest(null);

  return (
    <ConfirmationContext.Provider value={setRequest}>
      {children}
      {request && (
        <WebDialog visible label={request.title} fromBottom dismissOnBackdrop onDismiss={dismiss}>
          <View style={styles.sheet}>
            <Text variant="title" weight="bold">{request.title}</Text>
            {request.message && <Text tone="secondary">{request.message}</Text>}
            <Button label={t('common.cancel')} variant="ghost" full onPress={dismiss} />
            <Button
              label={request.confirmLabel}
              full
              style={request.destructive ? styles.destructive : undefined}
              onPress={() => {
                dismiss();
                request.onConfirm();
              }}
            />
          </View>
        </WebDialog>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error('useConfirmation requires ConfirmationProvider');
  return confirm;
}

const styles = StyleSheet.create({
  sheet: { gap: space.md, padding: space.lg },
  destructive: { backgroundColor: '#A32842' },
});
