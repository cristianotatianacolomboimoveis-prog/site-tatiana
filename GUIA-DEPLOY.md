# Guia de Deploy — Tatiana Colombo Consultoria Imobiliária
## tatianacolomboimoveis.com.br

---

## ETAPA 1 — Registrar o domínio

**Onde registrar:** Registro.br (autoridade oficial para .com.br)
- Acesse: https://registro.br
- Pesquise `tatianacolomboimoveis.com.br`
- Custo: ~R$ 40/ano
- Crie uma conta com CPF da Tatiana (ou CNPJ da empresa)

---

## ETAPA 2 — Publicar no Netlify

1. Acesse https://netlify.com e crie uma conta gratuita
2. Na dashboard clique em **"Add new site" → "Deploy manually"**
3. Arraste o arquivo `site-tatiana-colombo.zip` para a área indicada
4. O site vai subir em ~30 segundos em uma URL provisória como:
   `https://tatiana-colombo-abc123.netlify.app`
5. **Teste tudo nessa URL** antes de conectar o domínio

---

## ETAPA 3 — Conectar o domínio ao Netlify

No painel Netlify:
1. Vá em **Site configuration → Domain management**
2. Clique em **"Add a domain"**
3. Digite: `tatianacolomboimoveis.com.br`
4. O Netlify vai exibir os **nameservers** — algo como:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

No painel do Registro.br:
1. Acesse sua conta em https://registro.br
2. Clique no domínio `tatianacolomboimoveis.com.br`
3. Vá em **"Editar servidores DNS"**
4. Substitua os nameservers pelos fornecidos pelo Netlify
5. Salve — a propagação leva de 1 a 24 horas

O Netlify ativa HTTPS (SSL gratuito via Let's Encrypt) automaticamente após a propagação.

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

Depois, refaça o zip e faça um novo deploy no Netlify (arrasta o novo zip).

---

## ETAPA 5 — Sincronização automática dos imóveis (cron)

O arquivo `sync-kenlo.sh` já está configurado para rodar no seu Mac e atualizar
o `imoveis-data.js` diariamente com os dados do Kenlo CRM.

Após cada sincronização, você precisará fazer um novo deploy no Netlify com o
`imoveis-data.js` atualizado. Para automatizar isso, instale o **Netlify CLI**:

```bash
npm install -g netlify-cli
netlify login
netlify link   # dentro da pasta do site
```

Adicione ao final do `sync-kenlo.sh`:
```bash
netlify deploy --prod --dir="/Users/cristianocolombo/Downloads/Site Tatiana Colombo"
```

Assim, toda vez que o cron rodar e atualizar os imóveis, o site já sobe automaticamente.

---

## Checklist final

- [ ] Domínio registrado no Registro.br
- [ ] Site publicado no Netlify (URL provisória testada)
- [ ] Nameservers do Registro.br apontando para o Netlify
- [ ] HTTPS ativo (cadeado verde no browser)
- [ ] URL do n8n configurada no script.js
- [ ] Sync automático do Kenlo conectado ao deploy Netlify
- [ ] Google Search Console configurado com o novo domínio
- [ ] Google Ads com a URL de destino atualizada

---

## Suporte

Qualquer dúvida em qualquer etapa, é só chamar!
