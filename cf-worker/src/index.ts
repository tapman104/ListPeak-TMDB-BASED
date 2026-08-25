export interface Env {
  STORE: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
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
