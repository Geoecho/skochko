// Category symbols drawn as canvas line art: one source for map pins and in-app images (crisp at any size, no assets).
import type { VenueCategory } from '@/theme/tokens';

type Ctx = CanvasRenderingContext2D;

// All glyphs are drawn in a 24×24 box centred on (0,0) then scaled.
const glyphs: Record<VenueCategory, (c: Ctx) => void> = {
  // Coffee cup with handle, saucer and steam
  cafe: (c) => {
    c.beginPath();
    c.moveTo(-7, -2); c.lineTo(5, -2); c.lineTo(4, 5); c.quadraticCurveTo(3.5, 7, 1.5, 7);
    c.lineTo(-4.5, 7); c.quadraticCurveTo(-6.5, 7, -7, 5); c.closePath(); c.fill();
    c.beginPath(); c.arc(6.2, 1.6, 2.6, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.beginPath(); c.moveTo(-9, 9.3); c.lineTo(7, 9.3); c.stroke();
    c.beginPath(); c.moveTo(-3.5, -5); c.bezierCurveTo(-5, -7, -2, -8, -3.5, -10.5); c.stroke();
    c.beginPath(); c.moveTo(1, -5); c.bezierCurveTo(-0.5, -7, 2.5, -8, 1, -10.5); c.stroke();
  },
  // Beer mug with foam
  pub: (c) => {
    c.beginPath(); c.rect(-7, -4, 11, 13); c.fill();
    c.beginPath(); c.arc(-4.5, -5, 2.8, Math.PI, 0); c.arc(0, -6, 3.2, Math.PI, 0); c.arc(3.2, -4.6, 2.2, Math.PI, 0); c.lineTo(4, -3); c.lineTo(-7, -3); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(4, -1); c.lineTo(7.5, -1); c.quadraticCurveTo(9, -1, 9, 0.5); c.lineTo(9, 4.5); c.quadraticCurveTo(9, 6, 7.5, 6); c.lineTo(4, 6); c.stroke();
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3.5, 0); c.lineTo(-3.5, 6.5); c.moveTo(0.5, 0); c.lineTo(0.5, 6.5); c.stroke(); c.restore();
  },
  brewery: (c) => glyphs.pub(c),
  // Wine glass with wine
  wine_bar: (c) => {
    c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -10); c.bezierCurveTo(7, -2, 4, 2, 0, 2); c.bezierCurveTo(-4, 2, -7, -2, -6, -10); c.stroke();
    c.beginPath(); c.moveTo(-6.4, -5); c.lineTo(6.4, -5); c.bezierCurveTo(5.8, -0.5, 3.4, 1.4, 0, 1.4); c.bezierCurveTo(-3.4, 1.4, -5.8, -0.5, -6.4, -5); c.fill();
    c.beginPath(); c.moveTo(0, 2); c.lineTo(0, 9); c.moveTo(-4.5, 9.5); c.lineTo(4.5, 9.5); c.stroke();
  },
  // Rakija: small tulip "чашка" glass, filled, with a plum beside it
  rakija_bar: (c) => {
    c.beginPath(); c.moveTo(-5.5, -9); c.lineTo(1.5, -9); c.lineTo(0.6, 3); c.quadraticCurveTo(0.4, 5, -2, 5); c.quadraticCurveTo(-4.4, 5, -4.6, 3); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-5.1, -4); c.lineTo(1.1, -4); c.lineTo(0.5, 3); c.quadraticCurveTo(0.3, 4.4, -2, 4.4); c.quadraticCurveTo(-4.3, 4.4, -4.5, 3); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-2, 5); c.lineTo(-2, 8.5); c.moveTo(-5.5, 9.2); c.lineTo(1.5, 9.2); c.stroke();
    c.beginPath(); c.ellipse(6, 4.5, 3.4, 4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(6, 0.5); c.quadraticCurveTo(6.5, -2.5, 8.8, -3.5); c.stroke();
  },
  // Classic cocktail (martini) glass with olive
  bar: (c) => {
    c.beginPath(); c.moveTo(-9, -8); c.lineTo(9, -8); c.lineTo(0, 1.5); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-6.2, -5); c.lineTo(6.2, -5); c.lineTo(0, 1.5); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, 1.5); c.lineTo(0, 8.5); c.moveTo(-5, 9.2); c.lineTo(5, 9.2); c.stroke();
    c.beginPath(); c.moveTo(3, -11); c.lineTo(-1.5, -4); c.stroke();
  },
  // Tumbler with lime wheel and straw
  cocktail_bar: (c) => {
    c.beginPath(); c.moveTo(-6.5, -5); c.lineTo(6.5, -5); c.lineTo(5.3, 9); c.lineTo(-5.3, 9); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-6.1, -1); c.lineTo(6.1, -1); c.lineTo(5.2, 8.4); c.lineTo(-5.2, 8.4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(1.5, 3); c.lineTo(4.5, -11); c.lineTo(7.5, -11); c.stroke();
    c.beginPath(); c.arc(-5.5, -6, 3.6, 0, Math.PI * 2); c.stroke();
  },
  // Music note pair
  club: (c) => {
    c.beginPath(); c.moveTo(-3, 6); c.lineTo(-3, -8); c.lineTo(8, -10.5); c.lineTo(8, 3.5); c.stroke();
    c.beginPath(); c.moveTo(-3, -4.5); c.lineTo(8, -7); c.stroke();
    c.beginPath(); c.ellipse(-5.8, 6.5, 3.4, 2.6, -0.35, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(5.2, 4, 3.4, 2.6, -0.35, 0, Math.PI * 2); c.fill();
  },
};

/** Draws the category glyph centred at (cx, cy), fitting a square of `size` px. */
export function drawCategoryIcon(ctx: Ctx, category: VenueCategory, cx: number, cy: number, size: number, color: string) {
  const draw = glyphs[category] ?? glyphs.bar;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx);
  ctx.restore();
}

const uriCache = new Map<string, string>();

/** PNG data URL of a category glyph for <Image> (web only). */
export function categoryIconUri(category: VenueCategory, size = 24, color = '#FFFFFF'): string {
  const key = `${category}|${size}|${color}`;
  const hit = uriCache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  drawCategoryIcon(ctx, category, size / 2, size / 2, size * 0.92, color);
  const uri = canvas.toDataURL('image/png');
  uriCache.set(key, uri);
  return uri;
}
