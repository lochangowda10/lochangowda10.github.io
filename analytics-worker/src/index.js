const destination = 'https://lochangowda10.github.io/';
const allowedRef = /^[\p{L}\p{N} ._-]{1,80}$/u;
const linkPreviewAgent = /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|telegrambot|whatsapp/i;

function normalizeRef(value) {
  if (typeof value !== 'string') return null;
  const ref = value.trim();
  return ref.length <= 80 && allowedRef.test(ref) ? ref : null;
}

async function recordVisit(db, ref) {
  try {
    await db
      .prepare('INSERT INTO ref_visits (ref, visited_at) VALUES (?1, ?2)')
      .bind(ref, new Date().toISOString())
      .run();
  } catch (error) {
    console.error('Could not record referral visit', error);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response('ok', { headers: { 'cache-control': 'no-store' } });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { allow: 'GET, HEAD' },
      });
    }

    const ref = normalizeRef(url.searchParams.get('ref'));
    const userAgent = request.headers.get('user-agent') || '';
    if (request.method === 'GET' && ref && !linkPreviewAgent.test(userAgent) && env.ANALYTICS_DB) {
      await recordVisit(env.ANALYTICS_DB, ref);
    }

    const redirect = new URL(destination);
    if (ref) redirect.searchParams.set('ref', ref);
    return new Response(null, {
      status: 302,
      headers: {
        location: redirect.toString(),
        'cache-control': 'no-store, max-age=0',
      },
    });
  },
};
