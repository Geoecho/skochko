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

export default function WebProviders({ children }: PropsWithChildren) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
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
        <AuthProvider>
          <UserLocationProvider ageConfirmed={ageConfirmed}>
            <ConfirmationProvider>{children}</ConfirmationProvider>
          </UserLocationProvider>
          <AgeGate onConfirmed={confirmAge} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
