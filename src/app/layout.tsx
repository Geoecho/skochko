import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from './app-providers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Скочко',
  description: 'Бар-рути и настани вечерва околу тебе.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  appleWebApp: { capable: true, title: 'Скочко', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#0B0B0F',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mk">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
