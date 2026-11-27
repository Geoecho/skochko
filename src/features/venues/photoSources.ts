type PhotoWidth = 192 | 384 | 768 | 1280;
const localPhoto = (url:string)=>/^\/api\/venues\/[0-9a-f-]+\/photo(?:\?|$)/i.test(url);
/** Only our bounded photo endpoint accepts width hints; custom uploads remain unchanged. */
export function photoSource(url:string,width:PhotoWidth) {
 if(!localPhoto(url))return url;
 const source=new URL(url,'https://local.invalid');source.searchParams.set('w',String(width));
 return source.pathname+source.search;
}
export function photoSrcSet(url:string,widths:PhotoWidth[]=[384,768,1280]) {
 return localPhoto(url)?widths.map(width=>photoSource(url,width)+' '+width+'w').join(', '):undefined;
}
