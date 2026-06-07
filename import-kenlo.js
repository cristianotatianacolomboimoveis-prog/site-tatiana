const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurações
const FEED_URL = 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=Creci&p=Fw1lwAV1u3lkEWnbXPCo5ITFXDqt8QSYIhDqFO2urMnoI2L3TV2Qg5Snk8RoDysDZBFp21zwqOSExVw6rfEEmCIQ6hTtrqzJ6CNi901dkIPZs3HOq7XavA%3d%3d';
const LOCAL_XML_FILE = path.join(__dirname, 'kenlo.xml');
const TARGET_JS_FILE = path.join(__dirname, 'imoveis-data.js');

// Função para baixar a URL remota de forma nativa (sem pacotes adicionais)
function downloadFeed(url) {
  return new Promise((resolve, reject) => {
    console.log(`Tentando baixar o feed remoto da Kenlo/inGaia:\n--> ${url}\n`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode === 401) {
        reject(new Error('401 (Unauthorized) - Acesso negado. O feed pode requerer autenticação ou estar bloqueado para servidores de desenvolvimento.'));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Erro HTTP: Código ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Helper para extrair valores de tags XML usando regex simples e segura
function getTagValue(xml, tagName, defaultValue = '') {
  const regex = new RegExp(`<${tagName}(?:\\s+[^>]*)*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (!match) return defaultValue;
  let val = match[1].trim();
  // Remove marcações CDATA se existirem
  if (val.startsWith('<![CDATA[')) {
    val = val.substring(9, val.length - 3);
  }
  return val;
}

// Helper para extrair múltiplos valores de tags repetidas (ex: imagens)
function getMultipleTags(xml, tagName) {
  const results = [];
  const regex = new RegExp(`<${tagName}(?:\\s+[^>]*)*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    let val = match[1].trim();
    if (val.startsWith('<![CDATA[')) {
      val = val.substring(9, val.length - 3);
    }
    results.push(val);
  }
  return results;
}

// Mapeia SubTipo ou Tipo para o formato do site
function mapPropertyType(subTipo, tipo) {
  const s = (subTipo || '').toLowerCase();
  const t = (tipo || '').toLowerCase();
  
  if (s.includes('casa') || s.includes('sobrado') || t.includes('casa')) {
    return 'casa';
  }
  if (s.includes('cobertura')) {
    return 'cobertura';
  }
  return 'apartamento';
}

// Determina a tag de destaque do imóvel
function getPropertyTag(preco, finalidade, tipo, codigo) {
  if (preco >= 2000000) return 'Exclusivo';
  if (preco >= 12000 && finalidade === 'aluguel') return 'Boutique';
  if (codigo.startsWith('SA') || tipo === 'comercial') return 'Oportunidade';
  if (preco >= 1000000) return 'Destaque';
  return 'Oportunidade';
}

// Extrai e formata os diferenciais do imóvel
function extractDifferentials(imovelXML, desc) {
  const difs = [];
  
  // From XML tags
  if (getTagValue(imovelXML, 'ArCondicionado') === '1') difs.push('Ar Condicionado');
  if (getTagValue(imovelXML, 'Churrasqueira') === '1') difs.push('Espaço Gourmet');
  if (getTagValue(imovelXML, 'Piscina') === '1') difs.push('Piscina Privativa');
  if (getTagValue(imovelXML, 'SalaoJogos') === '1') difs.push('Segurança / Lazer');
  
  // From Description keywords
  const descLower = (desc || '').toLowerCase();
  if (descLower.includes('sauna')) difs.push('Sauna');
  if (descLower.includes('armário') || descLower.includes('planejado')) difs.push('Armários Planejados');
  if (descLower.includes('serviço') || descLower.includes('lavanderia')) difs.push('Área de Serviço');
  if (descLower.includes('permuta')) difs.push('Aceita Permuta');
  if (descLower.includes('varanda') || descLower.includes('sacada')) {
    if (!difs.includes('Varanda')) difs.push('Varanda');
  }
  if (descLower.includes('academia') || descLower.includes('fitness') || descLower.includes('ginástica')) {
    if (!difs.includes('Academia / Fitness')) difs.push('Academia / Fitness');
  }
  if (descLower.includes('quadra')) difs.push('Quadra Esportiva');
  if (descLower.includes('quintal') || descLower.includes('jardim')) difs.push('Quintal Integrado');
  if (descLower.includes('acabamento diferenciado') || descLower.includes('alto padrão') || descLower.includes('premium')) {
    if (!difs.includes('Acabamento Premium')) difs.push('Acabamento Premium');
  }
  
  // Default fallbacks if empty
  if (difs.length === 0) {
    difs.push('Excelente Localização');
    difs.push('Acabamento Premium');
  }
  
  return difs.slice(0, 5);
}

// Função de parse principal
function parseXMLFeed(xmlData) {
  const imoveisXML = [];
  const regex = /<Imovel>([\s\S]*?)<\/Imovel>/gi;
  let match;
  while ((match = regex.exec(xmlData)) !== null) {
    imoveisXML.push(match[1]);
  }

  if (imoveisXML.length === 0) {
    throw new Error('Nenhum imóvel (<Imovel>) foi encontrado no XML.');
  }

  console.log(`Encontrados ${imoveisXML.length} imóveis no XML. Convertendo dados para o portal...`);

  const imoveis = imoveisXML.map((imovelXML, index) => {
    const id = index + 1;
    const codigo = getTagValue(imovelXML, 'CodigoImovel', `REF${id}`);
    
    // Bairro
    const bairro = getTagValue(imovelXML, 'Bairro', 'Campinas');
    
    // Tipo
    const subTipo = getTagValue(imovelXML, 'SubTipoImovel', 'Apartamento');
    const tipoImovel = getTagValue(imovelXML, 'TipoImovel', 'Residencial');
    const tipo = mapPropertyType(subTipo, tipoImovel);
    
    // Nome do imóvel premium (SubTipo + Bairro)
    let nome = `${subTipo} no ${bairro}`;
    nome = nome.replace('Apartamento Padrão', 'Apartamento')
               .replace('Casa em Condomínio', 'Casa em Condomínio')
               .replace('Conjunto Comercial/Sala', 'Sala Comercial');
               
    // Descrição
    let desc = getTagValue(imovelXML, 'Observacao', 'Imóvel exclusivo em Campinas. Entre em contato para agendar uma visita.');
    desc = desc.replace(/\s+/g, ' ').trim();
    
    // Preço e Finalidade
    let preco = parseFloat(getTagValue(imovelXML, 'PrecoVenda', '0'));
    let finalidade = 'compra';
    
    if (preco === 0 || isNaN(preco)) {
      preco = parseFloat(getTagValue(imovelXML, 'PrecoLocacao', '0'));
      finalidade = 'aluguel';
    }
    
    if (preco === 0 || isNaN(preco)) {
      preco = 0; // Sob consulta
    }
    
    // Especificações
    const area = parseInt(getTagValue(imovelXML, 'AreaUtil', '0'), 10) || parseInt(getTagValue(imovelXML, 'AreaTotal', '0'), 10) || 0;
    const quartos = parseInt(getTagValue(imovelXML, 'QtdDormitorios', '0'), 10);
    const banheiros = parseInt(getTagValue(imovelXML, 'QtdBanheiros', '0'), 10) || 1;
    const vagas = parseInt(getTagValue(imovelXML, 'QtdVagas', '0'), 10);
    
    // Tag
    const tag = getPropertyTag(preco, finalidade, tipo, codigo);
    
    // Diferenciais
    const diferenciais = extractDifferentials(imovelXML, desc);
    
    // Imagens (URLArquivo)
    const rawFotos = getMultipleTags(imovelXML, 'Fotos');
    let rawUrls = [];
    if (rawFotos.length > 0) {
      rawUrls = getMultipleTags(rawFotos[0], 'URLArquivo');
    }
    
    let imagens = rawUrls.map(url => {
      // Converte http para https para evitar mixed content
      return url.replace('http://', 'https://');
    }).filter(url => url.length > 0);
    
    // Fallback de imagens se vazio
    if (imagens.length === 0) {
      imagens.push('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80');
    }
    
    return {
      id,
      codigo,
      nome,
      bairro,
      tipo,
      finalidade,
      preco,
      quartos,
      banheiros,
      vagas,
      area,
      tag,
      desc,
      diferenciais,
      imagens
    };
  });
  
  return imoveis;
}

// Salva o banco de dados no formato de arquivo esperado pelo frontend
function saveDatabaseToJS(imoveis) {
  const header = `/* ==========================================================================\n   TATIANA COLOMBO CONSULTORIA IMOBILIÁRIA - BANCO DE DADOS DE IMÓVEIS (JS)\n   Sincronizado automaticamente via Kenlo / inGaia CRM (ValueGaia Feed)\n   Data de Atualização: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n   ========================================================================== */\n\nconst IMOVEIS_DATABASE = `;

  const footer = `;\n\n// Helper para formatar moeda em BRL\nfunction formatBRL(valor, finalidade = "compra") {\n  const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });\n  return finalidade === "aluguel" ? \`\${formatado} <small>/ mês</small>\` : formatado;\n}\n`;

  const fileContent = header + JSON.stringify(imoveis, null, 2) + footer;
  fs.writeFileSync(TARGET_JS_FILE, fileContent, 'utf8');
  console.log(`\n💎 SUCESSO! ${imoveis.length} imóveis importados da Kenlo e salvos em:\n--> ${TARGET_JS_FILE}\n`);
}

// Execução Principal
async function main() {
  console.log("=== Sincronizador de Portfólio Kenlo -> Novo Site ===");
  
  let xmlData = '';
  
  // Tenta carregar a URL fornecida de forma remota
  try {
    xmlData = await downloadFeed(FEED_URL);
    console.log("Feed XML da ValueGaia baixado com sucesso!");
    // Grava backup local do XML
    fs.writeFileSync(LOCAL_XML_FILE, xmlData, 'utf8');
  } catch (error) {
    console.warn(`\n⚠️ Não foi possível baixar diretamente da URL devido a: ${error.message}`);
    
    // Fallback: Tenta carregar do arquivo local se ele existir
    if (fs.existsSync(LOCAL_XML_FILE)) {
      console.log(`Usando arquivo XML local de backup: ${LOCAL_XML_FILE}`);
      xmlData = fs.readFileSync(LOCAL_XML_FILE, 'utf8');
    } else {
      console.error("\n❌ Erro crítico: Sem dados para processamento.");
      process.exit(1);
    }
  }
  
  // Processa o XML
  try {
    const imoveis = parseXMLFeed(xmlData);
    saveDatabaseToJS(imoveis);
    
    // Atualiza também o feed de exportação local do site
    console.log("Sincronizando feed de exportação local (vivareal.xml)...");
    try {
      require('./export-xml.js');
    } catch (e) {
      console.log("Aviso: export-xml.js não rodou na mesma execução.");
    }
  } catch (err) {
    console.error("❌ Ocorreu um erro ao processar o XML:", err.message);
    process.exit(1);
  }
}

main();
