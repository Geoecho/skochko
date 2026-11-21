// Search normalisation: Macedonian Cyrillic -> Latin, strip diacritics, lowercase.
// Lets "kolektiv", "Колектив" and "kolektív" all match each other.
const MK: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ѓ: 'gj', е: 'e', ж: 'zh', з: 'z', ѕ: 'dz', и: 'i', ј: 'j', к: 'k', л: 'l',
  љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ќ: 'kj', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', џ: 'dzh', ш: 'sh',
};

export function searchKey(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((c) => MK[c] ?? c)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Latin digraph variants people type: č/ch, š/sh, ž/zh already handled by NFKD -> c/s/z; align digraphs too.
    .replace(/ch/g, 'c').replace(/sh/g, 's').replace(/zh/g, 'z').replace(/dzh/g, 'dz')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matches(haystack: string, needleKey: string): boolean {
  return !needleKey || searchKey(haystack).includes(needleKey);
}
