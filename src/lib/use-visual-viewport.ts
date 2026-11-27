import { useSyncExternalStore } from 'react';

type VisibleViewport = { height: number; offsetTop: number; keyboardOpen: boolean; keyboardInset: number };
const serverViewport: VisibleViewport = { height: 0, offsetTop: 0, keyboardOpen: false, keyboardInset: 0 };
let lastViewport = serverViewport;

function getSnapshot(): VisibleViewport {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const offsetTop = viewport?.offsetTop ?? 0;
  const element = document.activeElement;
  const editing = element instanceof HTMLElement &&
    (element.matches('input, textarea') || element.isContentEditable);
  const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
  const keyboardOpen = editing && layoutHeight - height > 120 && (viewport?.scale ?? 1) === 1;

  // iOS can paint its form-navigation accessory bar over the reported visible area.
  // Keep the final result clear of the arrows and Done control while editing.
  const ios = typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const keyboardInset = keyboardOpen && ios ? 48 : 0;
  if (lastViewport.height !== height || lastViewport.offsetTop !== offsetTop || lastViewport.keyboardOpen !== keyboardOpen || lastViewport.keyboardInset !== keyboardInset) {
    lastViewport = { height, offsetTop, keyboardOpen, keyboardInset };
  }
  return lastViewport;
}

function subscribe(notify: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', notify);
  viewport?.addEventListener('scroll', notify);
  window.addEventListener('resize', notify);
  window.addEventListener('focusin', notify);
  window.addEventListener('focusout', notify);
  return () => {
    viewport?.removeEventListener('resize', notify);
    viewport?.removeEventListener('scroll', notify);
    window.removeEventListener('resize', notify);
    window.removeEventListener('focusin', notify);
    window.removeEventListener('focusout', notify);
  };
}

/** Visible screen area, including mobile keyboard resizing and Safari viewport panning. */
export function useVisualViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverViewport);
}
