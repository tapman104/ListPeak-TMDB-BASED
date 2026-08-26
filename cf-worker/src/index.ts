import type { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  STORE: KVNamespace;
  AUTH_TOKEN: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { headers: CORS });

    const token = request.headers.get('X-Auth-Token');
    if (!token || token !== env.AUTH_TOKEN)
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const key = `listpeak_data_${token}`;

    if (request.method === 'GET') {
      const raw = await env.STORE.get(key);
      return Response.json(
        raw ? JSON.parse(raw) : { watchlist: null, apiKey: null, filters: null },
        { headers: CORS }
      );
    }

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      delete body['auth'];
      await env.STORE.put(key, JSON.stringify(body));
      return Response.json({ ok: true }, { headers: CORS });
    }

    return new Response('Method not allowed', { status: 405, headers: CORS });
  },
};
