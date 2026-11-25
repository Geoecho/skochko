// One set of line icons for venue cards, category filters and map pins.
import type { VenueCategory } from '@/theme/tokens';

const glyphs: Record<VenueCategory, string> = {
  cafe: 'M4 8h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z M16 9h2a2.5 2.5 0 0 1 0 5h-2 M3 21h16 M8 3v2 M12 3v2',
  pub: 'M5 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9 M17 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2 M8 13v4 M13 13v4 M5 8c-2-1-1-5 2-4a3 3 0 0 1 5-1 3 3 0 0 1 5 2c3 1 2 5-1 5h-3l-2-1-2 1H7Z',
  brewery: 'M12 3c4 3 7 7 7 11a7 7 0 1 1-14 0c0-4 3-8 7-11Z M8 9l4 3 4-3 M6 13l6 4 6-4 M12 12v9',
  bar: 'M5 5h14l-1.5 13a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 5Z M6 11h5 M17 11h1 M10 14l3-4 4 3-3 4Z',
  wine_bar: 'M7 3h10l1 5a6 6 0 1 1-12 0l1-5Z M6 8h12 M12 15v6 M8 21h8',
  rakija_bar: 'M7 10h10l-1 9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2l-1-9Z M8 15h8 M12 3c1.3 1.7 2 2.5 2 3.5a2 2 0 1 1-4 0c0-1 .7-1.8 2-3.5Z',
  cocktail_bar: 'M3 8h18l-9 8-9-8Z M12 16v5 M8 21h8 M15 8l4-5 M7 12h10',
  club: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0Z M7 10a5 5 0 0 1 3-3 M17 14a5 5 0 0 1-3 3',
};

const paths = new Map<VenueCategory, Path2D>();

export function drawCategoryIcon(ctx: CanvasRenderingContext2D, category: VenueCategory, cx: number, cy: number, size: number, color: string) {
  let path = paths.get(category);
  if (!path) {
    path = new Path2D(glyphs[category] ?? glyphs.bar);
    paths.set(category, path);
  }
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
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
