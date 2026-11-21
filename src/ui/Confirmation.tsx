import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, space } from '@/theme/tokens';
import { Button } from './Button';
import { Glass } from './Glass';
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
          <Glass strong rounded={radius.sheet} style={[styles.sheet, bottomInset]}>
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
          </Glass>
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

const bottomInset = { paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' } as object;

const styles = StyleSheet.create({
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 480, gap: space.md, padding: space.xl },
  destructive: { backgroundColor: '#A32842' },
});
