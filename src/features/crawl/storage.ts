import AsyncStorage from '@/lib/browser-storage';
import type { ActiveCrawl } from './types';

export const ACTIVE_CRAWL_STORAGE_KEY = '@skochko.active-crawl';

export async function loadActiveCrawl(): Promise<ActiveCrawl | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_CRAWL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveCrawl;
  } catch {
    return null;
  }
}

export async function saveActiveCrawl(crawl: ActiveCrawl): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_CRAWL_STORAGE_KEY, JSON.stringify(crawl));
  } catch {
    // Ignore persistence failures (e.g. storage full)
  }
}

export async function clearActiveCrawl(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_CRAWL_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
