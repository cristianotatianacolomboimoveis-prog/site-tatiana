/**
 * Cloudflare Pages Function — /imoveis
 *
 * Suporta URLs antigas no formato /imoveis?codigo=AP0123 sem mudar a URL.
 * - Se ?codigo= estiver presente, serve o conteúdo de /detalhes.html
 *   internamente. O JS de detalhes localiza o imóvel pelo ?codigo= no
 *   IMOVEIS_DATABASE. A URL no navegador continua /imoveis?codigo=...,
 *   preservando integrações externas (Google Ads, Meta Ads, Kenlo, portais).
 * - Sem ?codigo=, serve o catálogo normal (/imoveis.html).
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const codigo = (url.searchParams.get('codigo') || '').trim();

  if (codigo) {
    const detalhesUrl = new URL('/detalhes.html', url.origin);
    const resp = await env.ASSETS.fetch(new Request(detalhesUrl, request));
    // Mantém todos os headers do detalhes.html (Content-Type, cache, etc.)
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  }

  // Sem código: serve o catálogo /imoveis.html normalmente
  const imoveisUrl = new URL('/imoveis.html', url.origin);
  return env.ASSETS.fetch(new Request(imoveisUrl, request));
}
