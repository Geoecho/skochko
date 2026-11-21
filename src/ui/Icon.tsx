import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { ArrowLeftIcon } from './icons/arrow-left';
import { ChevronLeftIcon } from './icons/chevron-left';
import { MapIcon } from './icons/map';
import { CompassIcon } from './icons/compass';
import { LocateFixedIcon } from './icons/locate-fixed';
import { MapPinCheckIcon } from './icons/map-pin-check';
import { MapPinPlusIcon } from './icons/map-pin-plus';
import { PlayIcon } from './icons/play';
import { RouteIcon } from './icons/route';
import { SearchIcon } from './icons/search';
import { SparklesIcon } from './icons/sparkles';
import { UserIcon } from './icons/user';
import { UserRoundPlusIcon } from './icons/user-round-plus';
import { XIcon } from './icons/x';

import { HeartIcon } from './icons/heart';

// An S-shaped walking route with a dot at each end.
function BrandIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 4H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7" />
    <circle cx="19" cy="4" r="2" />
    <circle cx="5" cy="20" r="2" />
  </svg>;
}

const ICONS = {
  brand: BrandIcon,
  heart: HeartIcon,
  arrowLeft: ArrowLeftIcon,
  back: ChevronLeftIcon,
  compass: CompassIcon,
  map: MapIcon,
  locate: LocateFixedIcon,
  pinCheck: MapPinCheckIcon,
  pinPlus: MapPinPlusIcon,
  play: PlayIcon,
  route: RouteIcon,
  search: SearchIcon,
  sparkles: SparklesIcon,
  user: UserIcon,
  userPlus: UserRoundPlusIcon,
  close: XIcon,
};

export type IconName = keyof typeof ICONS;

export type IconHandle = { play: () => void };

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  /** Repeat the animation while true (e.g. while locating). */
  loop?: boolean;
  /** Play once when mounted. */
  playOnMount?: boolean;
};

export const Icon = forwardRef<IconHandle, IconProps>(function Icon({ name, size = 22, color = 'currentColor', filled, loop, playOnMount }, ref) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const Shape = ICONS[name];

  const play = useCallback(() => {
    const element = elementRef.current?.querySelector(animationTarget[name] ?? 'svg');
    if (typeof element?.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animationRef.current?.cancel();
    animationRef.current = element.animate(
      [
        { transform: 'none', transformBox: 'fill-box', transformOrigin: 'center' },
        { transform: feedback[name] ?? 'scale(1.14)', transformBox: 'fill-box', transformOrigin: 'center' },
        { transform: 'none', transformBox: 'fill-box', transformOrigin: 'center' },
      ],
      { duration: 420, easing: 'ease-in-out' },
    );
  }, [name]);

  useImperativeHandle(ref, () => ({ play }), [play]);

  useEffect(() => {
    if (playOnMount || loop) play();
    const interval = loop ? setInterval(play, 900) : undefined;
    return () => {
      clearInterval(interval);
      animationRef.current?.cancel();
    };
  }, [loop, play, playOnMount]);

  return (
    <span ref={elementRef} aria-hidden style={{ color, display: 'inline-flex', lineHeight: 0, pointerEvents: 'none' }}>
      <Shape size={size} filled={filled} />
    </span>
  );
});

// Animate individual Lucide shapes when the icon has a distinct moving part.
const animationTarget: Partial<Record<IconName, string>> = {
  compass: 'polygon',
  locate: 'circle:last-child',
  play: 'polygon',
};

const feedback: Partial<Record<IconName, string>> = {
  arrowLeft: 'translateX(-3px)',
  back: 'translateX(-3px)',
  compass: 'rotate(18deg)',
  close: 'rotate(12deg)',
  heart: 'scale(1.16)',
  locate: 'scale(1.65)',
  play: 'scale(1.18)',
  search: 'translate(2px, -2px)',
  sparkles: 'rotate(-12deg) scale(1.12)',
};

