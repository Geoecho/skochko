'use client';

import { CrashScreen } from '@/ui/CrashScreen';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <CrashScreen error={error} retry={reset} />;
}
