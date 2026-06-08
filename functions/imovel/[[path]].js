/**
 * Cloudflare Pages Function — /imovel/*
 *
 * Suporta URLs antigas do Kenlo no formato:
 *   /imovel/<slug-do-imovel>/<CODIGO[-SUFIXO]>?from=<rent|sale>
 *
 * Exemplos:
 *   /imovel/apartamento-campinas-1-quarto-40-m/AP0744-TAUW?from=rent
 *   /imovel/apartamento-campinas-2-quartos-49-m/AP1244-TAUW?from=sale
 *
 * Serve o conteúdo de /detalhes.html sem mudar a URL no navegador.
 * O JS de detalhes localiza o imóvel extraindo o código da própria URL.
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const detalhesUrl = new URL('/detalhes.html', url.origin);
  const resp = await env.ASSETS.fetch(new Request(detalhesUrl, request));
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers,
  });
}
