import { NextResponse } from 'next/server';
import { getPlacePhotos, validVenueId } from '@/lib/server-place-photos';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validVenueId(id)) return NextResponse.json({ error: 'Invalid place' }, { status: 400 });
  try {
    const result = await getPlacePhotos(id);
    if (!result) return NextResponse.json({ photos: [] }, { status: 404 });
    return NextResponse.json({ photos: result.photos.map((p, index) => ({
      url: '/api/venues/' + id + '/photo?index=' + index,
      authors: (p.authorAttributions ?? []).map(a => ({ name: a.displayName ?? '', url: a.uri ?? null })),
    })), sourceUrl: result.url }, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  } catch { return NextResponse.json({ error: 'Photos unavailable' }, { status: 502 }); }
}
