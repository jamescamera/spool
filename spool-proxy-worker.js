// Spool download proxy — only needed if the browser blocks Google Photos downloads.
// Deploy: Cloudflare dashboard > Workers & Pages > Create Worker > paste this > Deploy.
// Then paste the worker's address (e.g. https://spool-proxy.yourname.workers.dev) into Spool's Google setup.

const ALLOWED_ORIGIN = '*'; // Tighten to your site, e.g. 'https://jamescamera.github.io'

export default {
  async fetch(req) {
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors });

    const raw = new URL(req.url).searchParams.get('url');
    if (!raw) return new Response('Missing url', { status: 400, headers: cors });

    let target;
    try { target = new URL(raw); } catch { return new Response('Bad url', { status: 400, headers: cors }); }
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.googleusercontent.com')) {
      return new Response('Host not allowed', { status: 403, headers: cors });
    }

    const upstream = await fetch(target.toString(), {
      headers: { Authorization: req.headers.get('Authorization') || '' }
    });
    const headers = new Headers(upstream.headers);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
