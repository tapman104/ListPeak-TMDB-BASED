// src/lib/rateLimiter.ts
import { useApiStatsStore } from '../store/apiStatsStore';
const WINDOW_MS = 10_000;
const MAX_REQUESTS = 35;

const timestamps: number[] = [];
let queueCount = 0;

export function getRateLimitStatus(): { used: number; max: number; windowMs: number } {
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  return { used: recent.length, max: MAX_REQUESTS, windowMs: WINDOW_MS };
}

export async function throttledFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();

  // Remove timestamps older than the window
  while (timestamps.length > 0 && timestamps[0] < now - WINDOW_MS) {
    timestamps.shift();
  }

  if (options?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (timestamps.length >= MAX_REQUESTS) {
    const position = queueCount++;
    // Calculate how long to wait until the oldest request falls out of window
    const waitMs = timestamps[0] + WINDOW_MS - now + 50 + (position * 60); // +50ms buffer + stagger
    
    if (waitMs > 0) {
      useApiStatsStore.getState().incrementRateLimitHits();
    }

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(resolve, waitMs);
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      }
    });
    
    queueCount = Math.max(0, queueCount - 1);
    return throttledFetch(url, options); // retry after wait
  }

  // reset queue when under limit
  queueCount = 0;

  timestamps.push(Date.now());
  
  let response = await fetch(url, options);
  
  if (response.status === 429) {
    window.dispatchEvent(new Event('tmdb-rate-limit'));
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = (parseInt(retryAfter || '5') * 1000) + 200;
    await new Promise(r => setTimeout(r, waitMs));
    response = await fetch(url, options);
    
    if (response.status === 429) {
      throw new Error('TMDB rate limit exceeded');
    }
  }
  
  return response;
}
