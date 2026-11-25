import { useEffect, useRef, type PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  label: string;
  onDismiss: () => void;
}>;

export function SideDrawer({ label, onDismiss, children }: Props) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = document.activeElement;
    panel.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (Array.from(document.querySelectorAll('.side-drawer')).at(-1) !== panel) return;
      event.preventDefault();
      onDismiss();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (previous instanceof HTMLElement && previous.isConnected &&
          (panel.contains(document.activeElement) || document.activeElement === document.body)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [onDismiss]);

  return <aside ref={panelRef} tabIndex={-1} aria-label={label} className="side-drawer">{children}</aside>;
}
