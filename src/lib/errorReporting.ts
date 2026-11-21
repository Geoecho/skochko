import { Platform } from 'react-native';
import { supabase } from './supabase';

export const APP_VERSION = '0.3.0';

type Kind = 'render' | 'error' | 'rejection' | 'webgl' | 'diag';
const sent = new Set<string>();
let budget = 20; // per page load, so a crash loop can't flood the table

export function reportError(kind: Kind, error: unknown, extra?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = `${err.name}: ${err.message}${extra ? ` | ${extra}` : ''}`.slice(0, 2000);
  if (kind === 'diag') console.info('[skochko] diag', message);
  if (sent.has(message)) return;
  // React already reports errors caught by the route boundary.
  if (kind !== 'diag' && kind !== 'render') console.error('[skochko]', kind, err);
  if (budget <= 0) return;
  sent.add(message);
  budget--;
  void supabase
    .from('client_errors')
    .insert({
      kind,
      message,
      stack: err.stack?.slice(0, 8000) ?? null,
      path: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname.slice(0, 300) : null,
      user_agent: Platform.OS === 'web' && typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 400) : Platform.OS,
      app_version: APP_VERSION,
    })
    .then(() => {}, () => {});
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || Platform.OS !== 'web' || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    // Ignore cross-origin "Script error." noise and benign ResizeObserver warnings.
    if (!e.error && /^Script error|ResizeObserver/.test(e.message)) return;
    reportError('error', e.error ?? e.message);
  });
  window.addEventListener('unhandledrejection', (e) => reportError('rejection', e.reason));
}

/** Once per device+version: what the browser supports, to debug rendering differences (e.g. glass looks dark on a phone). */
export function reportDeviceOnce() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const key = `skochko.diag.${APP_VERSION}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    return;
  }
  setTimeout(() => {
    const sheet = document.querySelector('[aria-label="Bottom sheet handle"]')?.parentElement;
    const cs = sheet ? getComputedStyle(sheet) : null;
    const info = {
      backdrop: CSS.supports('backdrop-filter', 'blur(2px)'),
      webkitBackdrop: CSS.supports('-webkit-backdrop-filter', 'blur(2px)'),
      sheetFilter: cs ? (cs.backdropFilter || (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || 'none') : 'no-sheet',
      sheetBg: cs?.backgroundColor ?? '',
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      dpr: window.devicePixelRatio,
      vw: `${innerWidth}x${innerHeight}`,
      standalone: matchMedia('(display-mode: standalone)').matches,
      saveData: (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData ?? null,
    };
    budget++; // diagnostics don't consume the crash budget
    reportError('diag', new Error(JSON.stringify(info)));
  }, 6000);
}
