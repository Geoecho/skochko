import { SoupIcon } from './icons/animated/soup';
import { CoffeeIcon } from './icons/animated/coffee';
import { Disc3Icon } from './icons/animated/disc-3';
import { categoryGlyphs } from '@/features/map/categoryIcons';
import type { VenueCategory } from '@/theme/tokens';
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
import { EyeIcon, EyeOffIcon } from './icons/eye';
import { FoodIcon, ShieldIcon, FinishIcon } from './icons/monochrome';
import { SettingsIcon } from './icons/settings';

// An S-shaped walking route with a dot at each end.
function BrandIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 4H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7" />
    <circle cx="19" cy="4" r="2" />
    <circle cx="5" cy="20" r="2" />
  </svg>;
}

function PlusIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M12 5v14" />
  </svg>;
}

function MinusIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>;
}

function CategoryGlyph({category,size=24}:{category:VenueCategory;size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={categoryGlyphs[category]} /></svg>;
}
const categoryShapes = {
  cafe: ({size}:{size?:number})=><CategoryGlyph category="cafe" size={size}/>,
  pub: ({size}:{size?:number})=><CategoryGlyph category="pub" size={size}/>,
  bar: ({size}:{size?:number})=><CategoryGlyph category="bar" size={size}/>,
  club: ({size}:{size?:number})=><CategoryGlyph category="club" size={size}/>,
  wine_bar: ({size}:{size?:number})=><CategoryGlyph category="wine_bar" size={size}/>,
  rakija_bar: ({size}:{size?:number})=><CategoryGlyph category="rakija_bar" size={size}/>,
  cocktail_bar: ({size}:{size?:number})=><CategoryGlyph category="cocktail_bar" size={size}/>,
  brewery: ({size}:{size?:number})=><CategoryGlyph category="brewery" size={size}/>,
};
const ICONS = {
  ...categoryShapes,
  food: FoodIcon,
  shield: ShieldIcon,
  finish: FinishIcon,
  settings: SettingsIcon,
  eye: EyeIcon,
  eyeOff: EyeOffIcon,
  brand: BrandIcon,
  heart: HeartIcon,
  arrowLeft: ArrowLeftIcon,
  back: ChevronLeftIcon,
  compass: CompassIcon,
  map: MapIcon,
  locate: LocateFixedIcon,
  plus: PlusIcon,
  minus: MinusIcon,
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
  const animationRef = useRef<Animation[]>([]);
  const Shape = ICONS[name];
  const animatedRef = useRef<{startAnimation:()=>void;stopAnimation:()=>void}>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AnimatedShape = name==='food'?SoupIcon:name==='cafe'?CoffeeIcon:name==='club'?Disc3Icon:null;

  const play = useCallback(() => {
    const root = elementRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (animatedRef.current) {
      if(stopTimer.current)clearTimeout(stopTimer.current);
      animatedRef.current.startAnimation();
      stopTimer.current=setTimeout(()=>animatedRef.current?.stopAnimation(),1400);
      return;
    }
    animationRef.current.forEach(animation => animation.cancel());
    const specs = animationSpecs[name] ?? [{selector:'svg',frames:[{transform:'translateY(0)'},{transform:'translateY(-1px)'},{transform:'translateY(0)'}]}];
    animationRef.current = specs.flatMap(spec => {
      const element = root.querySelector(spec.selector);
      if (typeof element?.animate !== 'function') return [];
      return [element.animate(spec.frames.map(frame => ({transformBox:'fill-box',transformOrigin:'center',...frame})), {
        duration:name === 'finish' ? 850 : 440, easing:'cubic-bezier(.22,.8,.3,1)',
      })];
    });
  }, [name]);

  useImperativeHandle(ref, () => ({ play }), [play]);

  useEffect(() => {
    if (playOnMount || loop) play();
    const interval = loop ? setInterval(play, 900) : undefined;
    return () => {
      clearInterval(interval);
      if(stopTimer.current)clearTimeout(stopTimer.current);
      animationRef.current.forEach(animation => animation.cancel());
    };
  }, [loop, play, playOnMount]);

  return (
    <span ref={elementRef} aria-hidden style={{ color, display: 'inline-flex', width:size, height:size, flexShrink:0, alignItems:'center', justifyContent:'center', lineHeight: 0, pointerEvents: 'none' }}>
      {AnimatedShape ? <AnimatedShape ref={animatedRef} size={size} /> : <Shape size={size} filled={filled} />}
    </span>
  );
});


type MotionSpec = {selector:string;frames:Keyframe[]};
const move = (selector:string, transform:string):MotionSpec => ({selector,frames:[{transform:'none'},{transform},{transform:'none'}]});
const draw = (selector:string):MotionSpec => ({selector,frames:[{strokeDasharray:'1',strokeDashoffset:1,opacity:0},{strokeDasharray:'1',strokeDashoffset:0,opacity:1,offset:.65},{strokeDasharray:'1',strokeDashoffset:0,opacity:1}]});
// Each symbol keeps a fixed footprint; only its meaningful parts move.
const animationSpecs: Partial<Record<IconName, MotionSpec[]>> = {
  settings:[move('[data-motion="knob-a"]','translateX(3px)'),move('[data-motion="knob-b"]','translateX(-3px)'),move('[data-motion="knob-c"]','translateX(2px)')],
  user:[move('[data-motion="portrait"]','translateY(-1px)')],
  food:[{selector:'[data-motion="steam"]',frames:[{opacity:.4,transform:'translateY(1px)'},{opacity:1,transform:'translateY(-1px)'},{opacity:.4,transform:'translateY(1px)'}]}],
  shield:[draw('[data-motion="check"]')],
  finish:[move('[data-motion="flag"]','rotate(-6deg)'),draw('[data-motion="check"]'),move('[data-motion="spark"]','rotate(90deg)')],
  eye:[move('svg','rotate(-6deg)')],eyeOff:[move('svg','rotate(6deg)')],
  compass:[move('polygon','rotate(24deg)')],locate:[move('g','rotate(45deg)')],
  heart:[move('path','rotate(-10deg)')],search:[move('path','translate(1px,1px)')],
  close:[move('svg','rotate(90deg)')],back:[move('svg','translateX(-2px)')],
  arrowLeft:[move('svg','translateX(-2px)')],sparkles:[move('svg','rotate(12deg)')],
  route:[move('svg','rotate(-5deg)')],play:[move('polygon','translateX(1px)')],
};
