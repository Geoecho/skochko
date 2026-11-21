import { useLayoutEffect, useRef, type PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  visible: boolean;
  label: string;
  onDismiss: () => void;
  fromBottom?: boolean;
  dismissOnBackdrop?: boolean;
}>;

export function WebDialog({ visible, label, onDismiss, fromBottom, dismissOnBackdrop, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!visible || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [visible]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={fromBottom ? 'web-dialog web-dialog-bottom' : 'web-dialog'}
      onClick={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onDismiss();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      {visible && (fromBottom ? <div className="web-dialog-sheet">{children}</div> : children)}
    </dialog>
  );
}
