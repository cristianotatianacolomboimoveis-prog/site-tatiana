# Guia de Deploy — Tatiana Colombo Consultoria Imobiliária
## tatianacolomboimoveis.com.br

Deploy via **Cloudflare Pages** conectado ao repositório GitHub
`cristianotatianacolomboimoveis-prog/site-tatiana`.

---

## ETAPA 1 — Registrar o domínio

**Onde registrar:** Registro.br (autoridade oficial para .com.br)
- Acesse: https://registro.br
- Pesquise `tatianacolomboimoveis.com.br`
- Custo: ~R$ 40/ano
- Crie uma conta com CPF da Tatiana (ou CNPJ da empresa)

---

## ETAPA 2 — Publicar no Cloudflare Pages

1. Acesse https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Autorize o GitHub e selecione o repositório `site-tatiana`
3. Configurações do build:
   - **Framework preset:** None
   - **Build command:** (deixar em branco — site estático puro)
   - **Build output directory:** `/`
   - **Root directory:** `/`
4. Clique em **Save and Deploy**. O site sobe em ~1 minuto em uma URL provisória como:
   `https://site-tatiana.pages.dev`
5. **Teste tudo nessa URL** antes de conectar o domínio.

A cada `git push` na branch `main` o Cloudflare refaz o deploy automaticamente.

---

## ETAPA 3 — Conectar o domínio ao Cloudflare

No painel Cloudflare Pages do projeto:
1. Aba **Custom domains** → **Set up a custom domain**
2. Digite: `tatianacolomboimoveis.com.br`
3. O Cloudflare vai exibir 2 **nameservers**, algo como:
   ```
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```

No painel do Registro.br:
1. Acesse sua conta em https://registro.br
2. Clique no domínio `tatianacolomboimoveis.com.br`
3. Vá em **"Editar servidores DNS"**
4. Substitua os nameservers pelos fornecidos pelo Cloudflare
5. Salve — a propagação leva de 1 a 24 horas

Repita o passo 1–2 para `www.tatianacolomboimoveis.com.br` (o redirect www → sem-www
já está configurado no arquivo `_redirects`).

HTTPS é ativado automaticamente (SSL gratuito).

---

## ETAPA 4 — Configurar o webhook do n8n (formulários)

No arquivo `script.js`, linha 65, substitua:
```
https://SEU_N8N_AQUI.com/webhook/typebot-lead
```
pela URL real do seu n8n, ex:
```
https://n8n.suaurl.com/webhook/typebot-lead
```

Faça commit e push — o Cloudflare faz redeploy sozinho.

---

## ETAPA 5 — Sincronização automática dos imóveis (cron)

O arquivo `sync-kenlo.sh` roda no seu Mac e atualiza o `imoveis-data.js`
diariamente com os dados do Kenlo CRM.

Como o deploy está conectado ao GitHub, basta o script commitar e fazer push.
Adicione ao final do `sync-kenlo.sh`:

```bash
cd "/Users/cristianocolombo/Downloads/Site Tatiana Colombo"
git add imoveis-data.js
git commit -m "chore: sync imóveis Kenlo $(date +%F)" || exit 0
git push origin main
```

O Cloudflare detecta o push e republica o site em ~1 minuto.

---

## Arquivos de configuração

- `_headers` — headers de segurança e cache (formato Cloudflare Pages)
- `_redirects` — redirect www → sem-www e fallback 404 → index.html

---

## Checklist final

- [ ] Domínio registrado no Registro.br
- [ ] Repositório conectado ao Cloudflare Pages
- [ ] URL provisória `*.pages.dev` testada
- [ ] Nameservers do Registro.br apontando para o Cloudflare
- [ ] Domínio custom ativo no Cloudflare Pages (com e sem www)
- [ ] HTTPS ativo (cadeado verde no browser)
- [ ] URL do n8n configurada no script.js
- [ ] Sync automático do Kenlo fazendo push no GitHub
- [ ] Google Search Console configurado com o novo domínio
- [ ] Google Ads com a URL de destino atualizada
