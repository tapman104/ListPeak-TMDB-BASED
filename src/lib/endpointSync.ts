import { localAdapter } from './storage/localAdapter';
import { useKeyStore } from '../store/keyStore';

const ENDPOINT_KEY = 'listpeak_sync_endpoint';
const USERNAME_KEY = 'listpeak_sync_username';
const PASSWORD_KEY = 'listpeak_sync_password';

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

export async function pushToEndpoint(data: any): Promise<boolean> {
  const url = getEndpoint();
  if (!url) return false;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const username = localStorage.getItem(USERNAME_KEY) || '';
    const password = localStorage.getItem(PASSWORD_KEY) || '';

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, username, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let _isPulling = false;

export async function pullFromEndpoint(): Promise<{ success: boolean; log: string[]; data?: any }> {
  const url = getEndpoint();
  const log: string[] = [];
  if (!url) return { success: false, log: ['No endpoint configured'] };

  _isPulling = true;
  try {
    log.push('Connecting to endpoint...');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const username = localStorage.getItem(USERNAME_KEY) || '';
    const password = localStorage.getItem(PASSWORD_KEY) || '';

    const res = await fetch(url, { 
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'pull', username, password })
    });
    if (!res.ok) {
      log.push(`Failed: HTTP ${res.status}`);
      return { success: false, log, data: null };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON but got ${contentType}: ${text.slice(0, 200)}`);
    }

    log.push('Received data from cloud');
    const data = await res.json();

    if (!data || (!data.watchlist && !data.filters && !data.apiKey)) {
      log.push('Cloud is empty — nothing to apply');
      return { success: false, log, data };
    }

    log.push(`Applying watchlist (${data.watchlist?.length ?? 0} items)...`);
    await localAdapter.importAll(data);

    log.push('Done — all data applied');
    return { success: true, log, data };
  } catch (e) {
    log.push(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return { success: false, log, data: null };
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
    await pushToEndpoint(data);
  }, 2000);
}

export async function changeCredentials(
  endpoint: string,
  username: string, 
  oldPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change-password', username, oldPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem(PASSWORD_KEY, newPassword);
      return { success: true };
    }
    return { success: false, error: data.error || 'Failed to update credentials' };
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
}
