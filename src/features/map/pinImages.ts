// Crisp monochrome location badges, with a fixed-size inverse selected state.
import type { Map as MapLibreMap } from 'maplibre-gl';
import { colors, type VenueCategory } from '@/theme/tokens';
import { drawCategoryIcon } from './categoryIcons';

export const PIN_W = 48;
export const PIN_H = 52;
const SCALE = 3;

function drawPin(category: VenueCategory, promoted: boolean, selected: boolean): ImageData {
 const canvas=document.createElement('canvas');canvas.width=PIN_W*SCALE;canvas.height=PIN_H*SCALE;
 const ctx=canvas.getContext('2d')!;ctx.scale(SCALE,SCALE);
 const ink='#191919',surface=selected?ink:colors.category[category],glyph=selected?'#FFFFFF':ink;
 // Three restrained pastel fills; the glyph and selected state stay monochrome.
 ctx.beginPath();ctx.roundRect(5,3,38,38,14);ctx.fillStyle=surface;ctx.fill();
 ctx.strokeStyle=selected? '#FFFFFF':'#DADCDC';ctx.lineWidth=1.2;ctx.stroke();
 ctx.beginPath();ctx.moveTo(20,40);ctx.lineTo(24,45);ctx.lineTo(28,40);ctx.closePath();ctx.fillStyle=surface;ctx.fill();
 drawCategoryIcon(ctx,category,24,22,24,glyph);
 ctx.beginPath();ctx.arc(24,49,2.5,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
 if(promoted){
  ctx.beginPath();ctx.arc(41,6,6,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(41,2.5);ctx.lineTo(42,5);ctx.lineTo(44.5,6);ctx.lineTo(42,7);ctx.lineTo(41,9.5);ctx.lineTo(40,7);ctx.lineTo(37.5,6);ctx.lineTo(40,5);ctx.closePath();ctx.fillStyle='#FFFFFF';ctx.fill();
 }
 return ctx.getImageData(0,0,canvas.width,canvas.height);
}
export const pinImageId=(category:string,promoted:boolean,selected=false)=>`pin-${category}${promoted?'-promo':''}${selected?'-selected':''}`;
export function addPinImages(map:MapLibreMap){
 for(const category of Object.keys(colors.category) as VenueCategory[]){
  for(const promoted of [false,true])for(const selected of [false,true]){
   const id=pinImageId(category,promoted,selected);
   if(!map.hasImage(id))map.addImage(id,drawPin(category,promoted,selected),{pixelRatio:SCALE});
  }
 }
 if(!map.hasImage('pin-default'))map.addImage('pin-default',drawPin('cafe',false,false),{pixelRatio:SCALE});
}
