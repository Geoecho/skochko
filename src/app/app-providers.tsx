'use client';

import dynamic from 'next/dynamic';

export const AppProviders = dynamic(() => import('@/lib/web-providers'), { ssr: false });
