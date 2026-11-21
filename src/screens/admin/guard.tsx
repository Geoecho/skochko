import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import AdminHome from './index';

export default function AdminScreen() {
  const { ready, session, profile, isAdmin } = useAuth();
  const router = useRouter();
  const pending = !ready || (!!session && !profile);
  useEffect(() => {
    if (!pending && !isAdmin) router.replace('/');
  }, [isAdmin, pending, router]);
  return !pending && isAdmin ? <AdminHome /> : null;
}
