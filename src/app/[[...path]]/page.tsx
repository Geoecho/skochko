import { notFound } from 'next/navigation';
import { Screen, type ScreenName } from './screen';

const routes: Record<string, Exclude<ScreenName, 'route'>> = {
  '': 'home',
  crawl: 'crawl',
  history: 'history',
  profile: 'profile',
  settings: 'settings',
  admin: 'admin',
  'auth/callback': 'auth',
};

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ code?: string | string[] }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { path = [] } = await params;
  if (path[0] === 'route' && path.length === 2) return <Screen name="route" id={path[1]} />;

  const key = path.join('/');
  if (!Object.hasOwn(routes, key)) notFound();
  const name = routes[key];
  if (name === 'auth') {
    const { code } = await searchParams;
    return <Screen key={typeof code === 'string' ? code : undefined} name={name} code={typeof code === 'string' ? code : undefined} />;
  }
  return <Screen name={name} />;
}
