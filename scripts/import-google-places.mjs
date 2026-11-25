import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cityId = '00000000-0000-0000-0000-000000000001';
const externalIdPrefix = 'google-places:';
const categories = { night_club: 'club', brewery: 'brewery', pub: 'pub', bar: 'bar', cafe: 'cafe' };
const queries = { night_club: 'Nightclubs', brewery: 'Breweries', pub: 'Pubs', bar: 'Bars', cafe: 'Cafes' };
const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const prices = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 3 };
const bounds = {
  low: { latitude: 41.95, longitude: 21.33 },
  high: { latitude: 42.05, longitude: 21.52 },
};
const fieldMask = [
  'id', 'displayName', 'primaryType', 'types', 'formattedAddress', 'location', 'businessStatus',
  'regularOpeningHours', 'internationalPhoneNumber', 'websiteUri', 'priceLevel',
  'rating', 'userRatingCount', 'reviews', 'googleMapsUri',
].map((field) => `places.${field}`).concat('nextPageToken').join(',');

function openingHours(periods) {
  if (!periods?.length) return null;
  const hours = Object.fromEntries(days.map((day) => [day, []]));
  const minutes = ({ hour = 0, minute = 0 }) => hour * 60 + minute;
  const clock = (time) => `${String(Math.floor(time / 60) % 24).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    return Object.fromEntries(days.map((day) => [day, [['00:00', '00:00']]]));
  }
  for (const { open, close } of periods) {
    if (!open || !close) continue;
    const openDay = open.day ?? 0;
    const closeDay = close.day ?? 0;
    const start = minutes(open);
    let end = ((closeDay - openDay + 7) % 7) * 1440 + minutes(close);
    if (end < start) end += 7 * 1440;
    for (let offset = 0, from = start; from < end; offset++, from = offset * 1440) {
      const boundary = (offset + 1) * 1440;
      hours[days[(openDay + offset) % 7]].push([clock(from), clock(Math.min(end, boundary))]);
    }
  }
  return hours;
}

function toVenue(place, searchType) {
  const name = place.displayName?.text?.trim();
  const { latitude: lat, longitude: lng } = place.location ?? {};
  if (!place.id || !name || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < bounds.low.latitude || lat > bounds.high.latitude || lng < bounds.low.longitude || lng > bounds.high.longitude ||
      place.businessStatus?.startsWith('CLOSED_')) return null;

  const type = [place.primaryType, ...Object.keys(categories).filter((item) => place.types?.includes(item)), searchType]
    .find((item) => Object.hasOwn(categories, item));
  const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'venue';
  const idHash = createHash('sha256').update(place.id).digest('hex').slice(0, 16);
  return {
    id: place.id, name, slug: `${slug}-google-${idHash}`, category: categories[type], lat, lng,
    address: place.formattedAddress, hours: openingHours(place.regularOpeningHours?.periods),
    phone: place.internationalPhoneNumber, website: place.websiteUri, price: prices[place.priceLevel],
    googleDetails: {
      rating: place.rating ?? null,
      count: place.userRatingCount ?? null,
      url: place.googleMapsUri ?? null,
      reviews: (place.reviews ?? []).flatMap((review) => {
        const text = review.text?.text?.trim();
        const author = review.authorAttribution?.displayName;
        if (!review.name || !text || !author) return [];
        return [{ id: review.name, author, text, rating: review.rating ?? null, url: review.googleMapsUri ?? null }];
      }),
    },
  };
}

async function searchPlaces(key, type, query, pageToken) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify({
      textQuery: `${query} in Skopje`, includedType: type, strictTypeFiltering: true,
      locationRestriction: { rectangle: bounds }, languageCode: 'mk', regionCode: 'MK', pageSize: 20, pageToken,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Google Places Text Search failed (${response.status} ${data.error?.status ?? response.statusText}).`);
  return data;
}

function coordinates(location) {
  if (location?.type === 'Point') return location.coordinates;
  if (typeof location !== 'string') return [];
  const bytes = Buffer.from(location, 'hex');
  if (bytes.length !== 21 && bytes.length !== 25) return [];
  const read = bytes[0] === 1 ? 'readDoubleLE' : 'readDoubleBE';
  return [bytes[read](bytes.length - 16), bytes[read](bytes.length - 8)];
}

function normalizeName(name) {
  return name.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function isNearby(venue, [lng, lat]) {
  const north = (lat - venue.lat) * 111_320;
  const east = (lng - venue.lng) * 111_320 * Math.cos(venue.lat * Math.PI / 180);
  return Math.hypot(north, east) <= 40;
}

async function publish(venues) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set the Supabase URL and SUPABASE_SERVICE_ROLE_KEY in the local environment.');

  async function request(query, options = {}) {
    const response = await fetch(new URL(`/rest/v1/venues?${query}`, url), {
      ...options,
      headers: { apikey: key, Authorization: `Bearer ${key}`, ...options.headers },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Supabase venue request failed (${response.status}${error.code ? ` ${error.code}` : ''}).`);
    }
    return response;
  }

  const cached = new Map();
  const existingByName = new Map();
  for (let offset = 0; ; offset += 200) {
    const result = await request(new URLSearchParams({
      select: 'name,name_en,slug,location,source,external_id,address,hours,phone,website,price_level,google_details',
      city_id: `eq.${cityId}`, order: 'id.asc', limit: '200', offset: String(offset),
    }));
    const rows = await result.json();
    for (const row of rows) {
      if (row.source === 'manual' && row.external_id?.startsWith(externalIdPrefix)) {
        cached.set(row.external_id, row);
        continue;
      }
      for (const name of new Set([row.name, row.name_en].filter(Boolean).map(normalizeName))) {
        const matches = existingByName.get(name) ?? [];
        matches.push(coordinates(row.location));
        existingByName.set(name, matches);
      }
    }
    if (rows.length < 200) break;
  }

  const updates = [];
  for (const venue of venues) {
    const externalId = externalIdPrefix + venue.id;
    const previous = cached.get(externalId);
    const name = normalizeName(venue.name);
    const matches = existingByName.get(name) ?? [];
    if (!previous && matches.some((point) => isNearby(venue, point))) continue;
    matches.push([venue.lng, venue.lat]);
    existingByName.set(name, matches);
    updates.push({
      city_id: cityId, source: 'manual', external_id: externalId, slug: previous?.slug ?? venue.slug,
      name: venue.name, category: venue.category, location: `SRID=4326;POINT(${venue.lng} ${venue.lat})`,
      address: venue.address ?? previous?.address ?? null, hours: venue.hours ?? previous?.hours ?? {},
      phone: venue.phone ?? previous?.phone ?? null, website: venue.website ?? previous?.website ?? null,
      price_level: venue.price ?? previous?.price_level ?? 2,
      google_details: venue.googleDetails ?? previous?.google_details ?? null,
    });
  }

  if (!updates.length) return 0;
  const result = await request('on_conflict=slug&select=external_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation,missing=default' },
    body: JSON.stringify(updates),
  });
  return (await result.json()).length;
}

async function fetchVenues() {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error('Set GOOGLE_PLACES_API_KEY in app/.env.local or the process environment.');

  const venues = new Map();
  for (const [type, query] of Object.entries(queries)) {
    let pageToken;
    for (let page = 0; page < 3; page++) {
      const result = await searchPlaces(key, type, query, pageToken);
      for (const place of result.places ?? []) {
        const venue = toVenue(place, type);
        if (venue && !venues.has(venue.id)) venues.set(venue.id, venue);
      }
      pageToken = result.nextPageToken;
      if (!pageToken) break;
    }
  }
  return [...venues.values()];
}

async function main() {
  for (const filename of ['.env.local', '.env']) {
    const envFile = resolve(root, filename);
    if (existsSync(envFile)) process.loadEnvFile(envFile);
  }
  const output = resolve(root, process.env.SKOCHKO_GOOGLE_PLACES_CACHE ?? '.tmp/google-places.json');
  const fromCache = process.argv.includes('--publish-cache');
  const records = fromCache ? JSON.parse(readFileSync(output, 'utf8')) : await fetchVenues();
  if (!records.length) throw new Error('Google Places returned no usable venues in the Skopje search area.');
  if (!fromCache) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(records, null, 2) + '\n', 'utf8');
    console.log(`Fetched ${records.length} venues and saved the local cache.`);
  }
  const saved = await publish(records);
  console.log(`Cached ${saved} Google venues in Supabase. Skipped ${records.length - saved} matching venues.`);
}

main().catch((error) => {
  console.error(error.cause?.code ? `${error.message} (${error.cause.code})` : error.message);
  process.exitCode = 1;
});
