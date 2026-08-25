import { localAdapter } from './storage/localAdapter';
import { useWatchlistStore } from '../store/watchlistStore';
import { useKeyStore } from '../store/keyStore';
import { useFilterStore } from '../store/filterStore';

const ENDPOINT_KEY = 'listpeak_sync_endpoint';

export function getEndpoint(): string | null {
  return localStorage.getItem(ENDPOINT_KEY);
}

export function setEndpoint(url: string) {
  localStorage.setItem(ENDPOINT_KEY, url.trim());
}

export function clearEndpoint() {
  localStorage.removeItem(ENDPOINT_KEY);
}

export async function pushToEndpoint(): Promise<boolean> {
  const url = getEndpoint();
  if (!url) return false;
  try {
    const data = await localAdapter.exportAll();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pullFromEndpoint(): Promise<boolean> {
  const url = getEndpoint();
  if (!url) return false;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    
    // Cloud endpoints might return { settings: null, watchlist: null } when empty
    // But localAdapter.importAll expects our ExportPayload format.
    // As long as it doesn't crash on invalid data, we're fine.
    // If we only have empty objects, we skip importing.
    if (data && (data.apiKey || data.watchlist || data.filters)) {
      await localAdapter.importAll(data);
    }
    return true;
  } catch {
    return false;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSync() {
  if (!getEndpoint()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => pushToEndpoint(), 2000);
}

// Auto-sync hooks
let isHydrating = true;
setTimeout(() => { isHydrating = false; }, 1000); // give it a sec to hydrate

const handleChange = () => {
  if (!isHydrating) {
    debouncedSync();
  }
};

useWatchlistStore.subscribe(handleChange);
useKeyStore.subscribe(handleChange);
useFilterStore.subscribe(handleChange);
