import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const API_BASE = 'https://api.luxuryhost.cc';
const API_KEY = Deno.env.get('LUXURYHOST_API_KEY') ?? '';

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, payload } = await req.json() as { action: string; payload?: Record<string, unknown> };
    const p = payload ?? {};

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'LUXURYHOST_API_KEY nicht konfiguriert' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;
    switch (action) {
      case 'getBalance':
        result = await call('/public/api/users/me', { method: 'GET' });
        break;
      case 'bulkSearch': {
        const domains = Array.isArray(p.domains) ? p.domains : [];
        result = await call('/public/api/domains/search/bulk', {
          method: 'POST',
          body: JSON.stringify({ domains }),
        });
        break;
      }
      case 'purchase': {
        const domain = String(p.domain ?? '');
        const contactId = p.contactId ? String(p.contactId) : undefined;
        const body: Record<string, unknown> = { domain };
        if (contactId) body.contactId = contactId;
        result = await call('/public/api/domains/purchase', {
          method: 'POST',
          body: JSON.stringify({ domains: [body] }),
        });
        break;
      }
      case 'list':
        result = await call('/public/api/domains/list?limit=100&sort_by=createdAt&sort_direction=desc', { method: 'GET' });
        break;
      case 'getDomain': {
        const id = String(p.id ?? '');
        result = await call(`/public/api/domains/${encodeURIComponent(id)}`, { method: 'GET' });
        break;
      }
      case 'addRecord': {
        const id = String(p.id ?? '');
        const domain = String(p.domain ?? '');
        result = await call(`/public/api/domains/${encodeURIComponent(id)}/records`, {
          method: 'PUT',
          body: JSON.stringify({
            name: domain || '@',
            type: 'A',
            value: String(p.ip ?? ''),
            ttl: 3600,
          }),
        });
        break;
      }
      case 'listContacts':
        result = await call('/public/api/domains/contacts', { method: 'GET' });
        break;
      default:
        return new Response(JSON.stringify({ error: `unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('luxuryhost-proxy error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
