import type { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  STORE: KVNamespace;
  SECRET_TOKEN?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Token',
};

async function hashPassword(password: string) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS });
      }

      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: CORS });
      }

      if (env.SECRET_TOKEN) {
        const token = request.headers.get('X-Token');
        if (token !== env.SECRET_TOKEN) {
          return new Response('Forbidden', { status: 403, headers: CORS });
        }
      }

      const key = 'listpeak_data';

      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        // ignore
      }

      if (!body.username || !body.password) {
        return Response.json({ error: 'missing credentials' }, { status: 400, headers: CORS });
      }

      const { action, username, password, oldPassword, newPassword, ...rest } = body;

      const authRaw = await env.STORE.get('auth');
      const auth = authRaw ? JSON.parse(authRaw) : null;
      let isNewlyInitialized = false;

      if (!auth) {
        if (username && password) {
          const passwordHash = await hashPassword(password);
          await env.STORE.put('auth', JSON.stringify({ username, passwordHash }));
          isNewlyInitialized = true;
        }
      } else {
        if (action !== 'change-password') {
          if (username !== auth.username) {
            return Response.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
          }
          const hash = await hashPassword(password || '');
          if (hash !== auth.passwordHash) {
            return Response.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
          }
        }
      }

      if (action === 'change-password') {
        if (!auth || username !== auth.username || (await hashPassword(oldPassword || '')) !== auth.passwordHash) {
          return Response.json({ error: 'wrong credentials' }, { status: 401, headers: CORS });
        }
        const newPasswordHash = await hashPassword(newPassword || '');
        await env.STORE.put('auth', JSON.stringify({ username, passwordHash: newPasswordHash }));
        return Response.json({ success: true }, { headers: CORS });
      }

      if (action === 'pull') {
        const raw = await env.STORE.get(key);
        const data = raw ? JSON.parse(raw) : { settings: null, watchlist: null };
        if (isNewlyInitialized) data.initialized = true;
        return Response.json(data, { headers: CORS });
      }

      await env.STORE.put(key, JSON.stringify(rest));
      return Response.json({ ok: true, initialized: isNewlyInitialized }, { headers: CORS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS
        }
      });
    }
  }
};
