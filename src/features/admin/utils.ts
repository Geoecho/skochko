import type { OpeningHours } from '@/types/domain';
import type { Coordinates } from './types';

const cyrillic: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ѓ: 'gj', е: 'e', ж: 'zh', з: 'z', ѕ: 'dz', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ќ: 'kj', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', џ: 'dj', ш: 'sh',
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .split('')
    .map((character) => cyrillic[character] ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseCoordinates(value: string): Coordinates | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(value);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export const weekDays: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function localDateTime(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Skopje', dateStyle: 'short', timeStyle: 'short' });
  return formatter.format(date).replace(' ', 'T');
}

export function toIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function newHours(): OpeningHours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}
