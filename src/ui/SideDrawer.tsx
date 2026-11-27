import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './IconButton';
import { Icon, type IconHandle } from './Icon';

type Props = {
  label: string;
  side?: 'left' | 'right';
  presentation?: 'drawer' | 'screen';
  onDismiss: () => void;
  children: ReactNode | ((dismiss: () => void) => ReactNode);
};

export function DrawerHeader({title,onClose,back=false}:{title:string;onClose:()=>void;back?:boolean}) {
 const {t}=useTranslation();
 const icon=useRef<IconHandle>(null);
 if(back)return <header className="side-drawer-header screen-header">
  <button type="button" className="screen-back" onClick={()=>{icon.current?.play();onClose();}}>
   <Icon ref={icon} name="back" size={20}/><span>{t('common.back')}</span>
  </button>
  <h2>{title}</h2><span className="screen-header-balance" aria-hidden="true"/>
 </header>;
 return <header className="side-drawer-header"><h2>{title}</h2><IconButton icon="close" size={20} label={t('common.close')} onPress={onClose}/></header>;
}

export function SideDrawer({ label, onDismiss, children, side = 'right', presentation = 'drawer' }: Props) {
  const {t}=useTranslation();
  const panelRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef(onDismiss);
  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  const [closing, setClosing] = useState(false);
  const dismiss = useCallback(() => {
    if (timerRef.current) return;
    setClosing(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = setTimeout(() => dismissRef.current(), reduced ? 0 : 240);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = document.activeElement;
    panel.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (Array.from(document.querySelectorAll('.side-drawer')).at(-1) !== panel) return;
      if (event.key === 'Escape') {
        event.preventDefault(); dismiss(); return;
      }
      if(event.key !== 'Tab')return;
      const targets=Array.from(panel.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex],[role="button"]'))
        .filter(element=>element.tabIndex>=0&&!element.hasAttribute('disabled')&&element.getClientRects().length>0);
      const first=targets[0],last=targets.at(-1);
      if(!first){event.preventDefault();panel.focus({preventScroll:true});return;}
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){
        event.preventDefault();last?.focus({preventScroll:true});
      }else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel)){
        event.preventDefault();first.focus({preventScroll:true});
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('keydown', handleKey);
      if (previous instanceof HTMLElement && previous.isConnected &&
          (panel.contains(document.activeElement) || document.activeElement === document.body)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [dismiss]);

  return <div className={['side-drawer-layer',presentation==='screen'&&'side-screen-layer',closing&&'is-closing'].filter(Boolean).join(' ')}>
    {presentation!=='screen'&&<button type="button" tabIndex={-1} className="side-drawer-backdrop" aria-label={t('common.close')} onClick={dismiss} disabled={closing}/>}
    <aside ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={label} className={['side-drawer', side === 'left' && 'side-drawer-left', closing && 'is-closing'].filter(Boolean).join(' ')} inert={closing}>
      {/* The render prop receives the deferred close handler. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {typeof children === 'function' ? children(dismiss) : children}
    </aside>
  </div>;
}
