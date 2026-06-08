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
