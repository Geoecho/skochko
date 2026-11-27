import { NextResponse } from 'next/server';
import { getPlacePhotos, validVenueId } from '@/lib/server-place-photos';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const indexValue = new URL(request.url).searchParams.get('index') ?? '0';
  if (!validVenueId(id) || !/^[0-2]$/.test(indexValue)) return new NextResponse(null, { status: 400 });
  const width = new URL(request.url).searchParams.get('w') ?? '1280';
  if (!['192','384','768','1280'].includes(width)) return new NextResponse(null,{status:400});
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return new NextResponse(null, { status: 503 });
  try {
    const details = await getPlacePhotos(id);
    const photo = details?.photos[Number(indexValue)];
    if (!photo) return new NextResponse(null, { status: 404 });
    const media = await fetch('https://places.googleapis.com/v1/' + photo.name + '/media?maxWidthPx='+width+'&skipHttpRedirect=true', {
      headers: { 'X-Goog-Api-Key': key }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000),
    });
    if (!media.ok) return new NextResponse(null, { status: 502 });
    const photoUri = (await media.json()).photoUri;
    const target = typeof photoUri === 'string' ? new URL(photoUri) : null;
    if (!target || target.protocol !== 'https:' || !(target.hostname === 'googleusercontent.com' || target.hostname.endsWith('.googleusercontent.com'))) {
      return new NextResponse(null, { status: 502 });
    }
    return NextResponse.redirect(target, { status: 307, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  } catch { return new NextResponse(null, { status: 502 }); }
}
