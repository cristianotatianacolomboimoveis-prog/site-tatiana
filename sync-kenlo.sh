#!/bin/zsh
# Sincronização automática do portfólio Kenlo/inGaia -> site Tatiana Colombo
# Executado pelo LaunchAgent.

cd "/Users/cristianocolombo/Downloads/site-tatiana" || exit 1

echo "==================== $(date '+%Y-%m-%d %H:%M:%S') ===================="
/usr/local/bin/node import-kenlo.js

# Adiciona arquivos ao staging
git add imoveis-data.js vivareal.xml kenlo.xml

# Tenta fazer o commit se houver alterações
if ! git diff-index --quiet HEAD --; then
  git commit -m "chore: sync imóveis Kenlo $(date +%F)"
  git push origin main
  echo "Novas alterações publicadas com sucesso!"
else
  echo "Nenhuma alteração detectada no banco de dados."
fi

echo "Sync concluído."
echo ""
