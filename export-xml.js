const fs = require('fs');
const path = require('path');

// Read imoveis-data.js
const dataFilePath = path.join(__dirname, 'imoveis-data.js');
let fileContent = fs.readFileSync(dataFilePath, 'utf8');

// Extract the array contents
const startIdx = fileContent.indexOf('[');
const endIdx = fileContent.lastIndexOf('];');
if (startIdx === -1 || endIdx === -1) {
  console.error("Erro: Não foi possível localizar a estrutura do banco de dados no arquivo imoveis-data.js");
  process.exit(1);
}

const arrayText = fileContent.substring(startIdx, endIdx + 1);

// Safely evaluate the array content
let database;
try {
  database = eval(arrayText);
} catch (e) {
  console.error("Erro ao ler dados:", e);
  process.exit(1);
}

// Build XML according to ZAP / VivaReal standard schemas
let xml = `<?xml version="1.0" encoding="utf-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/flow" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/flow http://www.vivareal.com/schemas/1.0/flow/flow-1.0.xsd">
  <Header>
    <Provider>Tatiana Colombo Consultoria Imobiliária</Provider>
    <Email>contato@tatianacolomboimoveis.com.br</Email>
    <ContactName>Tatiana Colombo</ContactName>
    <Telephone>(19) 97413-9848</Telephone>
  </Header>
  <Listings>
`;

database.forEach(imovel => {
  const transaction = imovel.finalidade === 'aluguel' ? 'For Rent' : 'For Sale';
  
  // Map types and usage
  const usage = imovel.tipo === 'comercial' || imovel.nome.toLowerCase().includes('comercial') ? 'Commercial' : 'Residential';
  let propType = 'Apartment';
  if (imovel.tipo === 'casa') {
    propType = 'Home';
  } else if (imovel.tipo === 'cobertura') {
    propType = 'Penthouse';
  }

  // Sanitize description
  const cleanDesc = imovel.desc.replace(/]]>/g, ']]&gt;');

  // Media (Images list formatting)
  let mediaXML = '      <Media>\n';
  imovel.imagens.forEach((img, idx) => {
    const cleanImg = img.replace(/&/g, '&amp;');
    mediaXML += `        <Item medium="image" caption="Foto ${idx + 1}">${cleanImg}</Item>\n`;
  });
  mediaXML += '      </Media>';

  // Features mapping
  let featuresXML = '        <Features>\n';
  imovel.diferenciais.forEach(dif => {
    featuresXML += `          <Feature>${dif}</Feature>\n`;
  });
  featuresXML += '        </Features>';

  xml += `    <Listing>
      <ListingID>${imovel.id}</ListingID>
      <Title><![CDATA[${imovel.nome} - Alto Padrão no ${imovel.bairro}]]></Title>
      <TransactionType>${transaction}</TransactionType>
      <DetailViewUrl>https://www.tatianacolomboimoveis.com.br/detalhes.html?ref=${imovel.codigo}</DetailViewUrl>
      ${mediaXML}
      <Details>
        <UsageType>${usage}</UsageType>
        <PropertyType>${propType}</PropertyType>
        <ListPrice>${imovel.preco}</ListPrice>
        <LivingArea unit="square metres">${imovel.area}</LivingArea>
        <Bedrooms>${imovel.quartos}</Bedrooms>
        <Bathrooms>${imovel.banheiros}</Bathrooms>
        <Suites>${imovel.quartos}</Suites>
        <Garage>${imovel.vagas}</Garage>
        <Description><![CDATA[${cleanDesc}]]></Description>
        ${featuresXML}
      </Details>
      <Location>
        <Country>Brasil</Country>
        <State>São Paulo</State>
        <City>Campinas</City>
        <Neighborhood>${imovel.bairro}</Neighborhood>
      </Location>
    </Listing>
`;
});

xml += `  </Listings>
</ListingDataFeed>
`;

fs.writeFileSync(path.join(__dirname, 'vivareal.xml'), xml, 'utf8');
console.log("Sucesso: vivareal.xml gerado e sincronizado com o banco imoveis-data.js!");
