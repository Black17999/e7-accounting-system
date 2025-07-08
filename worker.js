/**
 * Welcome to Cloudflare Workers!
 *
 * This is a worker script that acts as a simple REST API for your accounting app.
 * It uses Cloudflare KV to store data.
 *
 * - KV Namespace Binding: You need to create a KV namespace and bind it to this worker.
 *   In your wrangler.toml or in the Cloudflare dashboard, bind a KV namespace as `DB`.
 *
 * - Endpoints:
 *   - GET /api/data: Fetches all history and debts.
 *   - POST /api/data: Saves all history and debts.
 *
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Simple CORS preflight handling
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Routing
    if (url.pathname === '/api/data') {
      if (request.method === 'GET') {
        return handleGetData(request, env);
      }
      if (request.method === 'POST') {
        return handlePostData(request, env);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleGetData(request, env) {
  try {
    const history = await env.DB.get('history');
    const debts = await env.DB.get('debts');

    const data = {
      history: history ? JSON.parse(history) : {},
      debts: debts ? JSON.parse(debts) : null, // Keep null if not found to use defaults on client
    };

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}

async function handlePostData(request, env) {
  try {
    const { history, debts } = await request.json();

    if (history === undefined || debts === undefined) {
      return new Response('Missing history or debts in request body', { status: 400, headers: corsHeaders });
    }

    // Use Promise.all to save both concurrently
    await Promise.all([
      env.DB.put('history', JSON.stringify(history)),
      env.DB.put('debts', JSON.stringify(debts)),
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}


// CORS headers to allow requests from any origin
// For production, you might want to restrict this to your app's domain
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://17999.ggff.net', // 只允许您的前端域名
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'GET, POST, OPTIONS',
      },
    });
  }
}
