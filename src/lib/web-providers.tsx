import '@/i18n';
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AgeGate } from '@/features/auth/AgeGate';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { installGlobalErrorHandlers, reportDeviceOnce } from '@/lib/errorReporting';
import { UserLocationProvider } from '@/features/map/useUserLocation';
import { ConfirmationProvider } from '@/ui/Confirmation';
import { queryClient } from '@/lib/queryClient';
import { SettingsDrawerContext } from '@/features/settings/SettingsDrawerContext';
import SettingsScreen from '@/screens/settings';
import ProfileScreen from '@/screens/profile';
import { ProfileDrawerContext } from '@/features/settings/ProfileDrawerContext';

export default function WebProviders({ children }: PropsWithChildren) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const openProfile = useCallback(() => setProfileOpen(true), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const confirmAge = useCallback(() => setAgeConfirmed(true), []);

  useEffect(() => {
    installGlobalErrorHandlers();
    reportDeviceOnce();
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.warn('Service worker registration failed', error);
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ProfileDrawerContext.Provider value={openProfile}>
        <SettingsDrawerContext.Provider value={openSettings}>
          <AuthProvider>
            <UserLocationProvider ageConfirmed={ageConfirmed}>
              <ConfirmationProvider>
                {children}
                {profileOpen && <ProfileScreen onDismiss={closeProfile} />}
                {settingsOpen && <SettingsScreen onDismiss={closeSettings} />}
              </ConfirmationProvider>
            </UserLocationProvider>
            <AgeGate onConfirmed={confirmAge} />
          </AuthProvider>
        </SettingsDrawerContext.Provider>
        </ProfileDrawerContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
