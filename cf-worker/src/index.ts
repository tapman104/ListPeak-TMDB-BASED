export interface Env {
  STORE: KVNamespace;
  SECRET_TOKEN?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Token',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (env.SECRET_TOKEN) {
      const token = request.headers.get('X-Token');
      if (token !== env.SECRET_TOKEN) {
        return new Response('Forbidden', { status: 403, headers: CORS });
      }
    }

    const key = 'listpeak_data';

    if (request.method === 'GET') {
      const raw = await env.STORE.get(key);
      const data = raw ? JSON.parse(raw) : { settings: null, watchlist: null };
      return Response.json(data, { headers: CORS });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      await env.STORE.put(key, JSON.stringify(body));
      return Response.json({ ok: true }, { headers: CORS });
    }

    return new Response('Method not allowed', { status: 405, headers: CORS });
  }
};
