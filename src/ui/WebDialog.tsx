import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  visible: boolean;
  label: string;
  onDismiss: () => void;
  fromBottom?: boolean;
  dismissOnBackdrop?: boolean;
}>;

export function WebDialog({ visible, label, onDismiss, fromBottom, dismissOnBackdrop, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Preserve the last open content while its controlled visibility changes.
  const [snapshot, setSnapshot] = useState({ children, label });
  if (visible && (snapshot.children !== children || snapshot.label !== label)) {
    setSnapshot({ children, label });
  }

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (visible) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => dialog.close(), reduced ? 0 : 220);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <dialog
      ref={ref}
      aria-label={visible ? label : snapshot.label}
      className={['web-dialog', fromBottom && 'web-dialog-bottom', !visible && 'is-closing'].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (visible && dismissOnBackdrop && event.target === event.currentTarget) onDismiss();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (visible) onDismiss();
      }}
    >
      <div className={fromBottom ? 'web-dialog-sheet' : undefined} inert={!visible}>
        {visible ? children : snapshot.children}
      </div>
    </dialog>
  );
}
