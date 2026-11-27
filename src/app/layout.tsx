import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from './app-providers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Скочко',
  description: 'Бар-рути и настани вечерва околу тебе.',
  other: { google: 'notranslate', 'apple-mobile-web-app-capable': 'yes', 'apple-mobile-web-app-title': 'Скочко' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'only light',
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mk" translate="no">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
