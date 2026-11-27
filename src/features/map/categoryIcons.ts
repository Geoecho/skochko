// One set of line icons for venue cards, category filters and map pins.
import type { VenueCategory } from '@/theme/tokens';

// Lucide artwork (ISC); see public/licenses/lucide.txt.
export const categoryGlyphs: Record<VenueCategory, string> = {
  "cafe": "M10 2v2 M14 2v2 M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1 M6 2v2",
  "club": "M22 12a10 10 0 1 0 -20 0a10 10 0 1 0 20 0 M6 12c0-1.7.7-3.2 1.8-4.2 M14 12a2 2 0 1 0 -4 0a2 2 0 1 0 4 0 M18 12c0 1.7-.7 3.2-1.8 4.2",
  "pub": "M17 11h1a3 3 0 0 1 0 6h-1 M9 12v6 M13 12v6 M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8",
  "wine_bar": "M8 22h8 M7 10h10 M12 15v7 M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z",
  "brewery": "M10.82 16.12c1.69.6 3.91.79 5.18.85.55.03 1-.42.97-.97-.06-1.27-.26-3.5-.85-5.18 M11.5 6.5c1.64 0 5-.38 6.71-1.07.52-.2.55-.82.12-1.17A10 10 0 0 0 4.26 18.33c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.88.88 0 0 0 .73-.74c.3-2.14-.15-3.5-.61-4.88 M15.62 16.95c.2.85.62 2.76.5 4.28a.77.77 0 0 1-.9.7 16.64 16.64 0 0 1-4.08-1.36 M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .96-.96 17.68 17.68 0 0 0-.9-4.87 M16.94 15.62c.86.2 2.77.62 4.29.5a.77.77 0 0 0 .7-.9 16.64 16.64 0 0 0-1.36-4.08 M17.99 5.52a20.82 20.82 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-2.33.2-5.3-.32-8.27-1.57 M4.93 4.93 3 3a.7.7 0 0 1 0-1 M9.58 12.18c1.24 2.98 1.77 5.95 1.57 8.28a.8.8 0 0 1-1.13.68 20.82 20.82 0 0 1-4.5-3.15",
  "cocktail_bar": "M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z M12 12v10 M7 22h10",
  "rakija_bar": "M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8 M10 5H8a2 2 0 0 0 0 4h.68 M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8 M14 5h2a2 2 0 0 1 0 4h-.68 M18 22H6 M9 2h6",
  "bar": "M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"
};
const glyphs = categoryGlyphs;

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
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

const uriCache = new Map<string, string>();

/** Vector category artwork remains sharp at every display density. */
export function categoryIconUri(category: VenueCategory, size = 24, color = '#FFFFFF'): string {
  const key = category + '|' + size + '|' + color;
  const cached = uriCache.get(key);
  if (cached) return cached;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (glyphs[category] ?? glyphs.cafe) + '"/></svg>';
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  uriCache.set(key, uri);
  return uri;
}
