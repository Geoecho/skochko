import { createContext, useContext } from 'react';

export const SettingsDrawerContext = createContext<(() => void) | null>(null);

export function useOpenSettings() {
  const open = useContext(SettingsDrawerContext);
  if (!open) throw new Error('Settings drawer provider is missing');
  return open;
}
