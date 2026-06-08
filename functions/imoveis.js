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
    let resp = await env.ASSETS.fetch(new Request(detalhesUrl, request));
    
    // Se a resposta for um redirecionamento (por causa de regras do Cloudflare clean URLs),
    // busca diretamente o arquivo estático detalhes.html sem herdar os headers da requisição original
    if (resp.status >= 300 && resp.status < 400) {
      resp = await env.ASSETS.fetch(detalhesUrl);
    }
    
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  }

  // Sem código: deixa o Cloudflare Pages servir o catálogo /imoveis.html normalmente
  return context.next();
}
