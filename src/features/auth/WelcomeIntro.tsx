import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/ui';
import { WebDialog } from '@/ui/WebDialog';

const INTRO_KEY = 'skochko.intro.v1';
const icons: IconName[] = ['compass', 'route', 'heart'];

export function WelcomeIntro({ enabled, onReady }: { enabled: boolean; onReady: () => void }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finish = useCallback(() => {
    if (finishTimer.current) return;
    try { localStorage.setItem(INTRO_KEY, 'done'); } catch { /* Session still continues. */ }
    setVisible(false);
    finishTimer.current = setTimeout(() => {
      finishTimer.current = null;
      onReady();
    }, 240);
  }, [onReady]);

  useEffect(() => () => { if (finishTimer.current) clearTimeout(finishTimer.current); }, []);
  useEffect(() => {
    if (!enabled) return;
    let completed = false;
    try { completed = localStorage.getItem(INTRO_KEY) === 'done'; } catch { /* Show the tour this session. */ }
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      if (completed) onReady();
      else setVisible(true);
    });
    const replay = () => { setStep(0); setDirection('forward'); setVisible(true); };
    window.addEventListener('skochko:show-intro', replay);
    return () => { active = false; window.removeEventListener('skochko:show-intro', replay); };
  }, [enabled, onReady]);

  const goTo = (target: number) => {
    const next = Math.max(0, Math.min(icons.length - 1, target));
    if (next === step) return;
    setDirection(next > step ? 'forward' : 'backward');
    setStep(next);
  };
  const endSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(step + (dx < 0 ? 1 : -1));
  };

  return <WebDialog visible={visible} label={t('intro.label')} fromBottom dismissOnBackdrop onDismiss={finish}>
    <section className="welcome-intro" onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(step + (event.key === 'ArrowRight' ? 1 : -1));
      }
    }}>
      <header className="intro-toolbar">
        <button type="button" onClick={finish}>{t('intro.skip')}</button>
      </header>
      <div className="intro-swipe" onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }}>
        <div key={step} className={'intro-slide intro-slide-' + direction} aria-live="polite" aria-atomic="true">
          <div className="intro-art" aria-hidden="true">
            <span className="intro-orbit intro-orbit-one" />
            <span className="intro-orbit intro-orbit-two" />
            <div className="intro-art-icon"><Icon name={icons[step]} size={68} playOnMount={visible} /></div>
            <span className="intro-art-spark"><Icon name="sparkles" size={24} /></span>
          </div>
          <p className="intro-eyebrow">{t('intro.progress', { current: step + 1, total: 3 })}</p>
          <h1>{t('intro.title' + step)}</h1>
          <p className="intro-description">{t('intro.body' + step)}</p>
        </div>
      </div>
      <nav className="intro-dots" aria-label={t('intro.steps')}>
        {icons.map((_, index) => <button type="button" key={index} aria-current={step === index ? 'step' : undefined}
          aria-label={t('intro.progress', { current: index + 1, total: 3 })} onClick={() => goTo(index)}>
          <span />
        </button>)}
      </nav>
      <div className={'intro-actions' + (step > 0 ? ' has-back' : '')}>
        <div className="intro-back-slot" aria-hidden={step === 0}>
          <button type="button" className="intro-back" tabIndex={step === 0 ? -1 : 0} disabled={step === 0}
            onClick={() => goTo(step - 1)}>{t('common.back')}</button>
        </div>
        <button type="button" className="intro-next" onClick={() => step === 2 ? finish() : goTo(step + 1)}>
          <span className="intro-next-label" key={step === 2 ? 'start' : 'next'}>{t(step === 2 ? 'intro.start' : 'intro.next')}</span>
          <span className="intro-next-arrow"><Icon name="back" size={20} /></span>
        </button>
      </div>
      <p className="intro-footnote">{t('intro.footnote')}</p>
    </section>
  </WebDialog>;
}
