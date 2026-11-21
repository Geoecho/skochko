// Teardrop location-pin images for MapLibre, drawn on a canvas at runtime (no image assets, crisp at any DPR).
// One image per category, plus a promoted variant with an accent ring.
import type { Map as MapLibreMap } from 'maplibre-gl';
import { colors, type VenueCategory } from '@/theme/tokens';
import { drawCategoryIcon } from './categoryIcons';

export const PIN_W = 34; // CSS px
export const PIN_H = 44;
const SCALE = 3; // drawn at 3x, registered with pixelRatio 3

function drawPin(category: VenueCategory, fill: string, promoted: boolean): ImageData {
  const w = PIN_W * SCALE;
  const h = PIN_H * SCALE;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const cx = PIN_W / 2;
  const r = 13; // head radius
  const cy = r + 3; // head centre
  const tipY = PIN_H - 3;

  // Ground shadow at the tip
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, tipY + 0.5, 4.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Teardrop: circle head that tapers into the tip with smooth tangents.
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.bezierCurveTo(cx - 3, tipY - 7, cx - r, cy + r * 0.62, cx - r, cy);
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.bezierCurveTo(cx + r, cy + r * 0.62, cx + 3, tipY - 7, cx, tipY);
    ctx.closePath();
  };

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  shape();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  // Glassy highlight on the upper half of the head
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, 'rgba(255,255,255,0.38)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  shape();
  ctx.fillStyle = grad;
  ctx.fill();

  // Rim: dark for contrast on light tiles, accent when promoted.
  shape();
  ctx.lineWidth = promoted ? 2.2 : 1.2;
  ctx.strokeStyle = promoted ? colors.accent : 'rgba(11,11,15,0.85)';
  ctx.stroke();

  // Category symbol inside the head (dark disc keeps it legible on light category colours).
  ctx.beginPath();
  ctx.arc(cx, cy, 9.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(11,11,15,0.82)';
  ctx.fill();
  drawCategoryIcon(ctx, category, cx, cy, 13.5, '#FFFFFF');

  return ctx.getImageData(0, 0, w, h);
}

export const pinImageId = (category: string, promoted: boolean) => `pin-${category}${promoted ? '-promo' : ''}`;

export function addPinImages(map: MapLibreMap) {
  const entries = Object.entries(colors.category) as [VenueCategory, string][];
  for (const [category, fill] of entries) {
    for (const promoted of [false, true]) {
      const id = pinImageId(category, promoted);
      if (!map.hasImage(id)) map.addImage(id, drawPin(category, fill, promoted), { pixelRatio: SCALE });
    }
  }
  if (!map.hasImage('pin-default')) map.addImage('pin-default', drawPin('bar', colors.textSecondary, false), { pixelRatio: SCALE });
}
