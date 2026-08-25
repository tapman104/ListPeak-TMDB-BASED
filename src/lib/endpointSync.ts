import { localAdapter } from './storage/localAdapter';
import { useKeyStore } from '../store/keyStore';

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

const TOKEN_KEY = 'listpeak_sync_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token.trim());
  else localStorage.removeItem(TOKEN_KEY);
}

export async function pushToEndpoint(data: any): Promise<boolean> {
  const url = getEndpoint();
  if (!url) return false;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['X-Token'] = token;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let _isPulling = false;

export async function pullFromEndpoint(): Promise<{ success: boolean; log: string[] }> {
  const url = getEndpoint();
  const log: string[] = [];
  if (!url) return { success: false, log: ['No endpoint configured'] };

  _isPulling = true;
  try {
    log.push('Connecting to endpoint...');
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['X-Token'] = token;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      log.push(`Failed: HTTP ${res.status}`);
      return { success: false, log };
    }

    log.push('Received data from cloud');
    const data = await res.json();

    if (!data || (!data.watchlist && !data.filters && !data.apiKey)) {
      log.push('Cloud is empty — nothing to apply');
      return { success: false, log };
    }

    log.push(`Applying watchlist (${data.watchlist?.length ?? 0} items)...`);
    await localAdapter.importAll(data);

    log.push('Done — all data applied');
    return { success: true, log };
  } catch (e) {
    log.push(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return { success: false, log };
  } finally {
    // Small delay so the store subscriptions fire BEFORE we re-enable sync
    setTimeout(() => { _isPulling = false; }, 500);
  }
}

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSync() {
  if (_isPulling) return;
  if (!getEndpoint()) return;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    const data = await localAdapter.exportAll();
    await pushToEndpoint({ ...data, apiKey: useKeyStore.getState().apiKey });
  }, 2000);
}
