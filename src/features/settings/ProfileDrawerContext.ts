import { createContext, useContext } from 'react';
export const ProfileDrawerContext = createContext<(() => void) | null>(null);
export function useOpenProfile() { const open = useContext(ProfileDrawerContext); if (!open) throw new Error('Profile provider missing'); return open; }
