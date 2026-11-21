import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions, type TextInputProps, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useConfirmation } from '@/ui/Confirmation';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';

export type AdminTab = 'venues' | 'events' | 'promotions' | 'moderation';

type ToastState = { message: string; tone: 'success' | 'danger' } | null;
type ToastContextValue = { showToast: (message: string, tone?: 'success' | 'danger') => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useAdminToast must be rendered inside AdminShell');
  return context;
}

export function AdminShell({ tab, onTabChange, children }: PropsWithChildren<{ tab: AdminTab; onTabChange: (tab: AdminTab) => void }>) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [toast, setToast] = useState<ToastState>(null);
  const compact = width < 768;
  const showToast = (message: string, tone: 'success' | 'danger' = 'success') => setToast({ message, tone });

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const nav: { id: AdminTab; label: string }[] = [
    { id: 'venues', label: t('admin.nav.venues') },
    { id: 'events', label: t('admin.nav.events') },
    { id: 'promotions', label: t('admin.nav.promotions') },
    { id: 'moderation', label: t('admin.nav.moderation') },
  ];

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={[styles.root, compact && styles.rootCompact]}>
        {compact ? (
          <View style={styles.topNav}>
            <Text variant="headline" weight="bold" style={styles.compactTitle}>{t('admin.title')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
              {nav.map((item) => <NavItem key={item.id} active={tab === item.id} label={item.label} onPress={() => onTabChange(item.id)} compact />)}
            </ScrollView>
          </View>
        ) : (
          <Glass strong rounded={0} style={styles.sidebar}>
            <Text variant="title" weight="bold" style={styles.brand}>{t('admin.title')}</Text>
            <View style={styles.navList}>
              {nav.map((item) => <NavItem key={item.id} active={tab === item.id} label={item.label} onPress={() => onTabChange(item.id)} />)}
            </View>
          </Glass>
        )}
        <View style={styles.content}>{children}</View>
        {toast ? <View pointerEvents="none" style={[styles.toast, { backgroundColor: toast.tone === 'success' ? colors.success : colors.danger }]}><Text weight="semibold" tone="onAccent">{toast.message}</Text></View> : null}
      </View>
    </ToastContext.Provider>
  );
}

function NavItem({ active, label, onPress, compact }: { active: boolean; label: string; onPress: () => void; compact?: boolean }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navItem, compact && styles.navItemCompact, active && styles.navItemActive]}><Text weight="semibold" tone={active ? 'accent' : 'secondary'}>{label}</Text></Pressable>;
}

export function AdminPanel({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <Glass strong style={[styles.panel, style]}>{children}</Glass>;
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return <View style={styles.sectionHeading}><Text variant="title" weight="bold">{title}</Text>{action}</View>;
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string; style?: ViewStyle }) {
  return <View style={styles.fieldWrap}>
    <Text variant="caption" weight="semibold" tone="secondary">{label}</Text>
    <TextInput placeholderTextColor={colors.textTertiary} style={[styles.input, error ? styles.inputError : null, style]} {...props} />
    {error ? <Text variant="caption" tone="danger">{error}</Text> : null}
  </View>;
}

export function SelectField({ label, value, options, onChange, error }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; error?: string }) {
  return <View style={styles.fieldWrap}>
    <Text variant="caption" weight="semibold" tone="secondary">{label}</Text>
    <View style={[styles.options, error ? styles.inputError : null]}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} onPress={() => onChange(option.value)} style={[styles.option, value === option.value && styles.optionActive]}><Text variant="caption" weight="semibold" tone={value === option.value ? 'accent' : 'secondary'}>{option.label}</Text></Pressable>)}</View>
    {error ? <Text variant="caption" tone="danger">{error}</Text> : null}
  </View>;
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return <View style={styles.empty}><Text tone="secondary" style={styles.emptyText}>{message}</Text>{action}</View>;
}

export function ConfirmButton({ label, message, confirmLabel, tone = 'danger', onConfirm }: { label: string; message: string; confirmLabel: string; tone?: 'danger' | 'neutral'; onConfirm: () => void }) {
  const confirm = useConfirmation();
  const ask = () => confirm({ title: label, message, confirmLabel, destructive: tone === 'danger', onConfirm });
  return <Pressable accessibilityRole="button" onPress={ask} style={styles.textAction}><Text variant="caption" weight="semibold" tone={tone === 'danger' ? 'danger' : 'accent'}>{label}</Text></Pressable>;
}

export function FilePicker({ label, multiple = false, onFiles }: { label: string; multiple?: boolean; onFiles: (files: File[]) => void }) {
  const { t } = useTranslation();
  const open = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    input.onchange = () => onFiles(Array.from(input.files ?? []));
    input.click();
  };
  return <View style={styles.filePicker}><Text variant="caption" tone="secondary">{label}</Text><Button label={Platform.OS === 'web' ? t('admin.upload') : t('admin.uploadWebOnly')} variant="secondary" onPress={open} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  // Phones: nav on top, content below.
  rootCompact: { flexDirection: 'column' },
  tabsScroll: { flexGrow: 0 },
  sidebar: { width: 236, padding: space.lg, borderWidth: 0, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline },
  brand: { marginTop: space.md, marginBottom: space.xxl },
  navList: { gap: space.xs },
  navItem: { minHeight: touch.min, paddingHorizontal: space.md, borderRadius: radius.sm, justifyContent: 'center' },
  navItemActive: { backgroundColor: 'rgba(181,171,255,0.12)' },
  content: { flex: 1, minWidth: 0 },
  topNav: { paddingTop: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, backgroundColor: colors.bgElevated },
  compactTitle: { paddingHorizontal: space.lg, marginBottom: space.md },
  tabs: { paddingHorizontal: space.md, gap: space.xs, paddingBottom: space.sm },
  navItemCompact: { paddingHorizontal: space.md },
  toast: { position: 'absolute', bottom: space.xl, alignSelf: 'center', maxWidth: 480, paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.pill },
  panel: { padding: space.lg, gap: space.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  fieldWrap: { gap: space.xs, flexGrow: 1 },
  input: { minHeight: touch.min, paddingHorizontal: space.md, paddingVertical: space.sm, borderColor: colors.hairline, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.04)', color: colors.text, fontFamily: 'Manrope_500Medium', fontSize: 15 },
  inputError: { borderColor: colors.danger },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  option: { minHeight: 36, paddingHorizontal: space.sm, justifyContent: 'center', borderRadius: radius.sm, borderColor: colors.hairline, borderWidth: StyleSheet.hairlineWidth },
  optionActive: { borderColor: colors.accent, backgroundColor: 'rgba(181,171,255,0.1)' },
  empty: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  emptyText: { textAlign: 'center' },
  textAction: { minHeight: touch.min, justifyContent: 'center', paddingHorizontal: space.sm },
  filePicker: { gap: space.sm, alignItems: 'flex-start' },
});
