// src/lib/rateLimiter.ts
const WINDOW_MS = 10_000;
const MAX_REQUESTS = 35;

const timestamps: number[] = [];

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
    // Calculate how long to wait until the oldest request falls out of window
    const waitMs = timestamps[0] + WINDOW_MS - now + 50; // +50ms buffer
    
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(resolve, waitMs);
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      }
    });
    
    return throttledFetch(url, options); // retry after wait
  }

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
