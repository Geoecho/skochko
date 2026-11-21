const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK ?? process.env.EXPO_PUBLIC_USE_MOCK ?? '',
};

/** @type {import('next').NextConfig} */
const config = {
  env: publicEnv,
  allowedDevOrigins: process.env.SKOCHKO_DEV_HOST ? [process.env.SKOCHKO_DEV_HOST] : [],
  webpack(config) {
    config.resolve.alias['react-native$'] = 'react-native-web';
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', ...config.resolve.extensions];
    return config;
  },
  async headers() {
    return [{
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    }];
  },
};

export default config;
