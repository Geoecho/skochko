'use client';

import dynamic from 'next/dynamic';

const Home = dynamic(() => import('@/screens/index'), { ssr: false });
const Crawl = dynamic(() => import('@/screens/crawl'), { ssr: false });
const History = dynamic(() => import('@/screens/history'), { ssr: false });
const Profile = dynamic(() => import('@/screens/profile'), { ssr: false });
const Settings = dynamic(() => import('@/screens/settings'), { ssr: false });
const Route = dynamic(() => import('@/screens/route/[id]'), { ssr: false });
const Auth = dynamic(() => import('@/screens/auth/callback'), { ssr: false });
const Admin = dynamic(() => import('@/screens/admin/guard'), { ssr: false });

type ScreenProps =
  | { name: 'home' | 'crawl' | 'history' | 'profile' | 'settings' | 'admin' }
  | { name: 'route'; id: string }
  | { name: 'auth'; code?: string };

export type ScreenName = ScreenProps['name'];

export function Screen(props: ScreenProps) {
  switch (props.name) {
    case 'home': return <Home />;
    case 'crawl': return <Crawl />;
    case 'history': return <History />;
    case 'profile': return <Profile />;
    case 'settings': return <Settings />;
    case 'route': return <Route key={props.id} id={props.id} />;
    case 'auth': return <Auth code={props.code} />;
    case 'admin': return <Admin />;
  }
}
