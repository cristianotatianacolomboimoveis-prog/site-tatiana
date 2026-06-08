/* ==========================================================================
   TATIANA COLOMBO CONSULTORIA IMOBILIÁRIA - SISTEMA DE AÇÕES E EFEITOS (V2)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ===== NAVBAR CONTROL =====
  const nav = document.getElementById('nav');
  if (nav) {
    const handleNavbarScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    
    // Initial call in case page starts scrolled
    handleNavbarScroll();
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  }

  // ===== MOBILE NAVIGATION TOGGLE =====
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu de navegação');
    });

    // Close menu when clicking on any link
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== NATIVE SCROLL REVEAL (Micro-animações na rolagem) =====
  const revealElements = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Once animated, stop observing for performance
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // triggers slightly before entering the full viewport
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }

  // ===== N8N WEBHOOK CONFIG =====
  // ⚠️ CONFIGURAR: Substitua pela URL real do seu webhook n8n
  const N8N_WEBHOOK_URL = 'https://SEU_N8N_AQUI.com/webhook/typebot-lead';

  // ===== FORM CAPTURE & N8N WEBHOOK INTEGRATION =====
  const contactForms = document.querySelectorAll('#contact-form');
  contactForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nome = this.nome.value.trim();
      const tel  = this.telefone.value.trim();
      const email = this.email ? this.email.value.trim() : '';
      const interesse = this.interesse ? this.interesse.value : '';
      const mensagem = this.mensagem.value.trim();
      
      // Campos extras do formulário de anúncio (anuncie.html)
      const tipo = this.tipo ? this.tipo.value : '';
      const localizacao = this.localizacao ? this.localizacao.value.trim() : '';
      const preco = this.preco ? this.preco.value.trim() : '';
      const area = this.area ? this.area.value : '';
      const dormitorios = this.dormitorios ? this.dormitorios.value : '';
      
      const fb = this.querySelector('#form-feedback') || document.getElementById('form-feedback');
      
      if (!fb) return;

      if (!nome || !tel) {
        fb.textContent = '❌ Por favor, preencha o seu Nome e o seu WhatsApp.';
        fb.style.color = '#B3465D';
        fb.classList.add('reveal', 'active');
        return;
      }

      // Visual loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Enviar Mensagem →';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Enviando...';
      }

      // Determinar finalidade com base no contexto da página e campo interesse
      let finalidadeTexto = interesse || 'contato geral';
      const isAnuncie = window.location.pathname.includes('anuncie');
      if (isAnuncie) finalidadeTexto = 'vender/anunciar meu imóvel';

      // Compor texto completo da conversa para o Gemini
      let textoCompleto = `O lead entrou em contato pelo formulário do site.`;
      if (finalidadeTexto) textoCompleto += ` Interesse: ${finalidadeTexto}.`;
      if (mensagem) textoCompleto += ` Mensagem: ${mensagem}.`;
      if (localizacao) textoCompleto += ` Localização do imóvel: ${localizacao}.`;
      if (preco) textoCompleto += ` Preço pretendido: R$ ${preco}.`;
      if (tipo) textoCompleto += ` Tipo: ${tipo}.`;
      if (area) textoCompleto += ` Área: ${area}m².`;
      if (dormitorios) textoCompleto += ` Dormitórios: ${dormitorios}.`;

      // Payload estruturado para o webhook n8n
      const webhookPayload = {
        sessionId: `site_form_${Date.now()}`,
        timestamp: new Date().toISOString(),
        lead: { nome, telefone: tel, email },
        conversa: {
          mensagens: [
            { role: 'user', content: textoCompleto }
          ],
          textoCompleto
        },
        contexto: {
          paginaOrigem: window.location.pathname + window.location.search,
          imovelRef: '',
          querAgendar: interesse === 'compra' || interesse === 'aluguel',
          dataVisitaSugerida: '',
          periodoVisita: ''
        }
      };

      // Enviar ao webhook n8n
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      })
      .then(res => res.json())
      .then(data => {
        fb.textContent = data.mensagemCliente || '✓ Mensagem enviada com sucesso! Tatiana Colombo retornará em breve.';
        fb.style.color = '#D2526E';
        fb.style.fontWeight = '500';
        form.reset();
      })
      .catch(() => {
        // Fallback: mostra sucesso mesmo se webhook falhar (não bloquear o UX)
        fb.textContent = '✓ Mensagem enviada com sucesso! Tatiana Colombo retornará em breve.';
        fb.style.color = '#D2526E';
        fb.style.fontWeight = '500';
        form.reset();
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
    });
  });

  // ===== PROPERTY CARD IMAGE SLIDER INITIATOR =====
  const initCardSliders = (container = document) => {
    const cards = container.querySelectorAll('.imovel-card');
    cards.forEach(card => {
      // Prevent multiple initializations
      if (card.dataset.sliderInitialized) return;
      card.dataset.sliderInitialized = "true";

      const track = card.querySelector('.imovel-gallery-track');
      const imgs = card.querySelectorAll('.imovel-img');
      const prevBtn = card.querySelector('.imovel-slider-btn.prev');
      const nextBtn = card.querySelector('.imovel-slider-btn.next');
      const dots = card.querySelectorAll('.imovel-slider-dots .dot');
      
      if (!track || imgs.length <= 1) return;

      let currentIndex = 0;
      const totalImages = imgs.length;

      const updateSlider = (index) => {
        currentIndex = (index + totalImages) % totalImages;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update dots
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentIndex);
        });
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlider(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlider(currentIndex + 1);
        });
      }

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlider(idx);
        });
      });

      // Touch Support for swipe
      let startX = 0;
      let isDragging = false;

      track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) {
            updateSlider(currentIndex + 1);
          } else {
            updateSlider(currentIndex - 1);
          }
        }
        isDragging = false;
      });
    });
  };

  // Initial call for sliders already in markup
  initCardSliders();

  // ===== HOME PAGE SEARCH REDIRECT =====
  const homeSearchBtn = document.querySelector('.search-btn');
  if (homeSearchBtn) {
    homeSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const tipo = document.getElementById('tipo-imovel').value;
      const finalidade = document.getElementById('finalidade').value;
      const local = document.getElementById('local').value;
      
      const queryParams = new URLSearchParams();
      if (tipo) queryParams.set('tipo', tipo);
      if (finalidade) queryParams.set('finalidade', finalidade);
      if (local) queryParams.set('local', local);
      
      window.location.href = `imoveis.html?${queryParams.toString()}`;
    });
  }

  // ===== HOME PAGE FEATURED PROPERTIES RENDERING =====
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid && typeof IMOVEIS_DATABASE !== 'undefined') {
    featuredGrid.innerHTML = '';
    
    // Take first 3 properties from database (high-end / exclusivas)
    const featuredList = IMOVEIS_DATABASE.slice(0, 3);
    
    featuredList.forEach((imovel, index) => {
      let imagesHTML = '';
      let dotsHTML = '';
      imovel.imagens.forEach((img, idx) => {
        imagesHTML += `
          <img
            class="imovel-img"
            src="${img}"
            alt="${imovel.nome} em ${imovel.bairro}"
            width="900" height="600"
            loading="lazy"
          />`;
        dotsHTML += `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`;
      });

      const card = document.createElement('article');
      card.className = `imovel-card reveal reveal-delay-${index}`;
      card.setAttribute('aria-label', `${imovel.nome} – ${imovel.tipo} à venda`);
      card.innerHTML = `
        <div class="imovel-img-wrap">
          <div class="imovel-gallery-slider">
            <div class="imovel-gallery-track">
              ${imagesHTML}
            </div>
          </div>
          <button class="imovel-slider-btn prev" aria-label="Foto anterior" type="button">
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
          </button>
          <button class="imovel-slider-btn next" aria-label="Próxima foto" type="button">
            <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
          </button>
          <div class="imovel-slider-dots">
            ${dotsHTML}
          </div>
          <span class="imovel-tag" aria-label="${imovel.tag}">${imovel.tag}</span>
        </div>
        <div class="imovel-body">
          <p class="imovel-tipo">${imovel.tipo.charAt(0).toUpperCase() + imovel.tipo.slice(1)} · ${imovel.finalidade === 'aluguel' ? 'Locação' : 'Alto Padrão'} · Ref: ${imovel.codigo}</p>
          <h3 class="imovel-nome">${imovel.nome}</h3>
          <p class="imovel-loc">📍 ${imovel.bairro}, Campinas – SP</p>
          <div class="imovel-sep" aria-hidden="true"></div>
          <ul class="imovel-features" aria-label="Características">
            <li>🛏 ${imovel.quartos} ${imovel.quartos === 1 ? 'quarto' : 'quartos'}${imovel.suites > 0 ? ` (${imovel.suites} ${imovel.suites === 1 ? 'suíte' : 'suítes'})` : ''}</li>
            <li>🚿 ${imovel.banheiros} ${imovel.banheiros === 1 ? 'banheiro' : 'banheiros'}</li>
            <li>📐 ${imovel.area} m²</li>
          </ul>
          <p class="imovel-preco">
            ${formatBRL(imovel.preco, imovel.finalidade)}
            ${imovel.condominio > 0 ? `<span style="font-size:0.75rem;color:var(--text3);font-weight:300;display:block;margin-top:2px;">+ Cond: R$ ${imovel.condominio.toLocaleString('pt-BR')}</span>` : ''}
          </p>
          <a class="imovel-link" href="detalhes.html?ref=${imovel.codigo}" aria-label="Ver detalhes de ${imovel.nome}">Ver detalhes →</a>
        </div>
      `;
      featuredGrid.appendChild(card);
    });
    
    // Bind dynamic slider logic to featured items
    initCardSliders(featuredGrid);
    
    // Re-trigger scroll reveal observer for new dynamic cards
    if (typeof window.IntersectionObserver !== 'undefined') {
      const revealElements = featuredGrid.querySelectorAll('.reveal');
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      revealElements.forEach(el => revealObserver.observe(el));
    }
  }

  // ===== CATALOG GENERAL FILTER & RENDERING (imoveis.html) =====
  const catalogGrid = document.getElementById('catalog-grid');
  const filterForm = document.getElementById('filter-form');
  
  if (catalogGrid && typeof IMOVEIS_DATABASE !== 'undefined') {
    // Redireciona links antigos /imoveis?codigo=AP0363 para detalhes.html?ref=AP0363
    const urlParamsCheck = new URLSearchParams(window.location.search);
    const oldCodeParam = urlParamsCheck.get('codigo');
    if (oldCodeParam) {
      window.location.href = `detalhes.html?ref=${oldCodeParam.trim()}`;
      return;
    }

    const resultsCount = document.getElementById('results-count');
    const noResultsBox = document.getElementById('no-results-box');
    const clearFiltersBtn = document.getElementById('clear-filters');

    // Render properties in the catalog grid
    const renderCatalog = (list) => {
      catalogGrid.innerHTML = '';
      
      if (list.length === 0) {
        catalogGrid.style.display = 'none';
        if (noResultsBox) noResultsBox.style.display = 'block';
        if (resultsCount) resultsCount.textContent = 'Nenhum imóvel encontrado';
        return;
      }

      catalogGrid.style.display = 'grid';
      if (noResultsBox) noResultsBox.style.display = 'none';
      if (resultsCount) {
        resultsCount.textContent = list.length === 1 
          ? 'Mostrando 1 imóvel exclusivo' 
          : `Mostrando ${list.length} imóveis exclusivos`;
      }

      list.forEach(imovel => {
        // Render multi-image track HTML
        let imagesHTML = '';
        let dotsHTML = '';
        imovel.imagens.forEach((img, idx) => {
          imagesHTML += `
            <img
              class="imovel-img"
              src="${img}"
              alt="${imovel.nome} em ${imovel.bairro}"
              width="900" height="600"
              loading="${idx === 0 ? 'eager' : 'lazy'}"
            />`;
          dotsHTML += `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`;
        });

        const card = document.createElement('article');
        card.className = 'imovel-card reveal active'; // immediately visible or observable
        card.setAttribute('aria-label', `${imovel.nome} – ${imovel.tipo} à venda`);
        card.innerHTML = `
          <div class="imovel-img-wrap">
            <div class="imovel-gallery-slider">
              <div class="imovel-gallery-track">
                ${imagesHTML}
              </div>
            </div>
            <button class="imovel-slider-btn prev" aria-label="Foto anterior" type="button">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
            </button>
            <button class="imovel-slider-btn next" aria-label="Próxima foto" type="button">
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
            </button>
            <div class="imovel-slider-dots">
              ${dotsHTML}
            </div>
            <span class="imovel-tag" aria-label="${imovel.tag}">${imovel.tag}</span>
          </div>
          <div class="imovel-body">
            <p class="imovel-tipo">${imovel.tipo.charAt(0).toUpperCase() + imovel.tipo.slice(1)} · ${imovel.finalidade === 'aluguel' ? 'Locação' : 'Alto Padrão'} · Ref: ${imovel.codigo}</p>
            <h3 class="imovel-nome">${imovel.nome}</h3>
            <p class="imovel-loc">📍 ${imovel.bairro}, Campinas – SP</p>
            <div class="imovel-sep" aria-hidden="true"></div>
            <ul class="imovel-features" aria-label="Características">
              <li>🛏 ${imovel.quartos} ${imovel.quartos === 1 ? 'quarto' : 'quartos'}${imovel.suites > 0 ? ` (${imovel.suites} ${imovel.suites === 1 ? 'suíte' : 'suítes'})` : ''}</li>
              <li>🚿 ${imovel.banheiros} ${imovel.banheiros === 1 ? 'banheiro' : 'banheiros'}</li>
              <li>📐 ${imovel.area} m²</li>
            </ul>
            <p class="imovel-preco">
              ${formatBRL(imovel.preco, imovel.finalidade)}
              ${imovel.condominio > 0 ? `<span style="font-size:0.75rem;color:var(--text3);font-weight:300;display:block;margin-top:2px;">+ Cond: R$ ${imovel.condominio.toLocaleString('pt-BR')}</span>` : ''}
            </p>
            <a class="imovel-link" href="detalhes.html?ref=${imovel.codigo}" aria-label="Ver detalhes de ${imovel.nome}">Ver detalhes →</a>
          </div>
        `;
        catalogGrid.appendChild(card);
      });

      // Bind dynamic slider logic to catalog items
      initCardSliders(catalogGrid);
    };

    // Filter Logic
    const filterImoveis = () => {
      const searchVal = document.getElementById('filter-search').value.toLowerCase().trim();
      const tipoVal = document.getElementById('filter-tipo').value;
      const finalidadeVal = document.getElementById('filter-finalidade').value;
      const priceMin = parseFloat(document.getElementById('filter-price-min').value) || 0;
      const priceMax = parseFloat(document.getElementById('filter-price-max').value) || Infinity;
      const quartosVal = parseInt(document.getElementById('filter-quartos').value, 10) || 0;
      
      const checkedDifs = Array.from(filterForm.querySelectorAll('input[name="diferenciais"]:checked')).map(cb => cb.value);

      const filtered = IMOVEIS_DATABASE.filter(imovel => {
        // Keyword Search (Nome, Bairro, Descrição ou Código de Referência Kenlo)
        const matchesKeyword = searchVal === '' || 
          imovel.codigo.toLowerCase().includes(searchVal) || 
          imovel.nome.toLowerCase().includes(searchVal) || 
          imovel.bairro.toLowerCase().includes(searchVal) || 
          imovel.desc.toLowerCase().includes(searchVal);

        // Type & Purpose
        const matchesTipo = tipoVal === '' || imovel.tipo === tipoVal;
        const matchesFinalidade = finalidadeVal === '' || imovel.finalidade === finalidadeVal;

        // Price & Bedrooms
        const matchesPrice = imovel.preco >= priceMin && imovel.preco <= priceMax;
        const matchesQuartos = imovel.quartos >= quartosVal;

        // Amenities
        const matchesDifs = checkedDifs.every(dif => imovel.diferenciais.includes(dif));

        return matchesKeyword && matchesTipo && matchesFinalidade && matchesPrice && matchesQuartos && matchesDifs;
      });

      renderCatalog(filtered);
    };

    // Pre-fill filters from URL Query parameters (Home search connection)
    const loadFiltersFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tipo = urlParams.get('tipo');
      const finalidade = urlParams.get('finalidade');
      const local = urlParams.get('local');

      if (tipo) document.getElementById('filter-tipo').value = tipo;
      if (finalidade) document.getElementById('filter-finalidade').value = finalidade;
      if (local) document.getElementById('filter-search').value = local;

      filterImoveis();
    };

    // Listeners for filter inputs
    filterForm.querySelectorAll('input, select').forEach(elem => {
      elem.addEventListener('input', filterImoveis);
      elem.addEventListener('change', filterImoveis);
    });

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterForm.reset();
        filterImoveis();
      });
    }

    // Trigger initial filter/render
    loadFiltersFromURL();
  }

  // ===== DYNAMIC EDITORIAL DETAILS PAGE (detalhes.html) =====
  const detailContainer = document.getElementById('detalhe-imovel-content');
  const errorContainer = document.getElementById('detalhe-error-content');

  if (detailContainer && typeof IMOVEIS_DATABASE !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('id');
    let imovel;
    if (refParam) {
      imovel = IMOVEIS_DATABASE.find(item => item.codigo.toLowerCase() === refParam.toLowerCase().trim());
      if (!imovel) {
        const numericId = parseInt(refParam, 10);
        if (!isNaN(numericId)) {
          imovel = IMOVEIS_DATABASE.find(item => item.id === numericId);
        }
      }
    }

    if (!imovel) {
      if (errorContainer) errorContainer.style.display = 'block';
      detailContainer.style.display = 'none';
    } else {
      // Update browser tab title
      document.title = `${imovel.nome} | Cambuí - Tatiana Colombo Consultoria`;

      // Update WhatsApp concierge card message to contextualize this property
      const conciergeOptCustom = document.getElementById('concierge-opt-custom');
      if (conciergeOptCustom) {
        conciergeOptCustom.setAttribute('data-msg', `Olá Tatiana! Gostaria de agendar uma visita privada para o imóvel "${imovel.nome}" (Ref: ${imovel.codigo}) no bairro ${imovel.bairro}.`);
      }

      // Build Widescreen gallery sliders
      let imagesHTML = '';
      let dotsHTML = '';
      imovel.imagens.forEach((img, idx) => {
        imagesHTML += `<img class="detalhe-gallery-img" src="${img}" alt="Foto ${idx+1} de ${imovel.nome}" loading="${idx === 0 ? 'eager' : 'lazy'}" />`;
        dotsHTML += `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`;
      });

      // Build differences chips
      let differentialsHTML = '';
      imovel.diferenciais.forEach(dif => {
        differentialsHTML += `<span class="dif-chip">✨ ${dif}</span>`;
      });

      // Inject full page skeleton
      detailContainer.innerHTML = `
        <!-- Widescreen slider -->
        <div class="detalhe-gallery-wrapper">
          <div class="detalhe-gallery-slider">
            <div class="detalhe-gallery-track" id="detalhe-track">
              ${imagesHTML}
            </div>
            <button class="detalhe-slider-btn prev" id="detalhe-prev" aria-label="Foto anterior" type="button">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
            </button>
            <button class="detalhe-slider-btn next" id="detalhe-next" aria-label="Próxima foto" type="button">
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
            </button>
            <div class="detalhe-slider-dots" id="detalhe-dots">
              ${dotsHTML}
            </div>
          </div>
        </div>

        <!-- Body specs -->
        <div class="detalhe-body-grid">
          <!-- Left: Editorial Content -->
          <div class="detalhe-content reveal active">
            <div class="detalhe-header-block">
              <span class="detalhe-kicker">${imovel.tipo} · ${imovel.finalidade === 'aluguel' ? 'Locação de Alto Padrão' : 'Venda Exclusiva'} · Ref: ${imovel.codigo}</span>
              <h1 class="detalhe-title">${imovel.nome}</h1>
              <p class="detalhe-bairro">📍 ${imovel.bairro}, Campinas – SP</p>
              <p class="detalhe-preco">
                ${formatBRL(imovel.preco, imovel.finalidade)}
                ${imovel.condominio > 0 ? `<span style="font-size:1.15rem;color:var(--text3);font-weight:300;margin-left:12px;">+ Condomínio: R$ ${imovel.condominio.toLocaleString('pt-BR')}/mês</span>` : ''}
              </p>
            </div>

            <!-- Specs Grid -->
            <div class="specs-grid" aria-label="Ficha técnica do imóvel">
              <div class="spec-box">
                <span>📐</span>
                <p class="spec-value">${imovel.area} m²</p>
                <p class="spec-label">Área Útil</p>
              </div>
              <div class="spec-box">
                <span>🛏</span>
                <p class="spec-value">${imovel.quartos} ${imovel.quartos === 1 ? 'quarto' : 'quartos'}${imovel.suites > 0 ? ` (${imovel.suites} ${imovel.suites === 1 ? 'suíte' : 'suítes'})` : ''}</p>
                <p class="spec-label">Dormitórios</p>
              </div>
              <div class="spec-box">
                <span>🚿</span>
                <p class="spec-value">${imovel.banheiros} ${imovel.banheiros === 1 ? 'banheiro' : 'banheiros'}</p>
                <p class="spec-label">Banheiros</p>
              </div>
              <div class="spec-box">
                <span>🚗</span>
                <p class="spec-value">${imovel.vagas} ${imovel.vagas === 1 ? 'vaga' : 'vagas'}</p>
                <p class="spec-label">Vagas</p>
              </div>
            </div>

            <!-- Description -->
            <h2 class="detalhe-section-title">Descrição do Consultor</h2>
            <div class="detalhe-desc">
              <p>${imovel.desc}</p>
            </div>

            <!-- Amenities -->
            <h2 class="detalhe-section-title">Características e Diferenciais</h2>
            <div class="diferenciais-list">
              ${differentialsHTML}
            </div>
          </div>

          <!-- Right: Sidebar Cards -->
          <div class="detalhe-sidebar reveal reveal-delay-1 active no-print" id="visita-agendar-section">
            <div class="detalhe-sidebar-card">
              <h3 class="sidebar-title">Agendar Visita Privada</h3>
              <form id="visita-form" novalidate>
                <div class="form-group">
                  <label for="visita-nome">Seu Nome completo *</label>
                  <input type="text" id="visita-nome" required placeholder="Seu nome" />
                </div>
                <div class="form-group">
                  <label for="visita-tel">WhatsApp *</label>
                  <input type="tel" id="visita-tel" required placeholder="(19) 9 0000-0000" />
                </div>
                <div class="form-group">
                  <label for="visita-data">Data de Preferência</label>
                  <input type="date" id="visita-data" />
                </div>
                <div class="form-group">
                  <label for="visita-hora">Horário de Preferência</label>
                  <select id="visita-hora">
                    <option value="Manhã (9h às 12h)">Manhã (9h às 12h)</option>
                    <option value="Tarde (12h às 18h)">Tarde (12h às 18h)</option>
                    <option value="Sábado de manhã">Sábado de manhã</option>
                  </select>
                </div>
                <button type="submit" class="form-submit sidebar-action-btn">Solicitar Agendamento →</button>
                <p id="visita-feedback" style="font-size:0.8rem; color:var(--rose-dark); margin-top:0.5rem; text-align:center; min-height:1.2rem;"></p>
              </form>

              <button class="btn-print-brochure" id="print-brochure-btn" type="button">
                🖨 Imprimir Brochura PDF
              </button>
            </div>
          </div>
        </div>
      `;

      // Initialize fullscreen slider
      const track = document.getElementById('detalhe-track');
      const prevBtn = document.getElementById('detalhe-prev');
      const nextBtn = document.getElementById('detalhe-next');
      const dots = document.querySelectorAll('#detalhe-dots .dot');

      if (track && imovel.imagens.length > 1) {
        let currentIdx = 0;
        const total = imovel.imagens.length;

        const updateDetailSlider = (index) => {
          currentIdx = (index + total) % total;
          track.style.transform = `translateX(-${currentIdx * 100}%)`;
          dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIdx);
          });
        };

        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateDetailSlider(currentIdx - 1);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateDetailSlider(currentIdx + 1);
          });
        }
        dots.forEach((dot, idx) => {
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            updateDetailSlider(idx);
          });
        });
      }

      // Handle Visit Scheduling Form Submit (n8n Webhook + WhatsApp fallback)
      const visitaForm = document.getElementById('visita-form');
      if (visitaForm) {
        visitaForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const nome = document.getElementById('visita-nome').value.trim();
          const tel = document.getElementById('visita-tel').value.trim();
          const data = document.getElementById('visita-data').value;
          const hora = document.getElementById('visita-hora').value;
          const fb = document.getElementById('visita-feedback');

          if (!fb) return;

          if (!nome || !tel) {
            fb.textContent = '❌ Nome e WhatsApp são obrigatórios.';
            fb.style.color = '#B3465D';
            return;
          }

          const submitBtn = this.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Enviando...';
          }

          // Payload estruturado para o webhook n8n (fluxo de aprovação assíncrona)
          const visitaPayload = {
            sessionId: `site_visita_${Date.now()}`,
            timestamp: new Date().toISOString(),
            lead: { nome, telefone: tel, email: '' },
            conversa: {
              mensagens: [
                { role: 'user', content: `Quero agendar uma visita ao imóvel "${imovel.nome}" (Ref: ${imovel.codigo}) no bairro ${imovel.bairro}. Data: ${data || 'a combinar'}. Período: ${hora}.` }
              ],
              textoCompleto: `Lead solicitou visita ao imóvel ${imovel.codigo} (${imovel.nome}) em ${imovel.bairro}. Finalidade: ${imovel.finalidade}. Preço: R$ ${imovel.preco?.toLocaleString('pt-BR')}. Data preferida: ${data || 'a combinar'}. Período: ${hora}.`
            },
            contexto: {
              paginaOrigem: window.location.pathname + window.location.search,
              imovelRef: imovel.codigo,
              querAgendar: true,
              dataVisitaSugerida: data,
              periodoVisita: hora
            }
          };

          // Enviar ao webhook n8n (ativa o fluxo de aprovação assíncrona)
          fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visitaPayload)
          })
          .then(res => res.json())
          .then(responseData => {
            if (responseData.aguardarResposta) {
              // Fluxo assíncrono: proprietário será notificado
              fb.textContent = responseData.mensagemCliente || '✓ Sua solicitação foi registrada! Estamos confirmando com o proprietário e avisaremos pelo WhatsApp.';
              fb.style.color = '#2d6a4f';
              fb.style.fontWeight = '500';
            } else {
              fb.textContent = responseData.mensagemCliente || '✓ Agendamento solicitado com sucesso!';
              fb.style.color = '#D2526E';
              fb.style.fontWeight = '500';
            }
            visitaForm.reset();
          })
          .catch(() => {
            // Fallback: redireciona para WhatsApp se webhook falhar
            fb.textContent = '✓ Redirecionando para o WhatsApp...';
            fb.style.color = '#D2526E';
            fb.style.fontWeight = '500';

            const whatsappMsg = `Olá Tatiana! Gostaria de agendar uma visita privada para o imóvel "${imovel.nome}" (Ref: ${imovel.codigo}).\n\nNome: ${nome}\nWhatsApp: ${tel}\nData sugerida: ${data || 'A combinar'}\nPeríodo: ${hora}`;
            const encoded = encodeURIComponent(whatsappMsg);
            window.open(`https://api.whatsapp.com/send?phone=5519974139848&text=${encoded}`, '_blank', 'noopener,noreferrer');

            visitaForm.reset();
          })
          .finally(() => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Solicitar Agendamento →';
            }
          });
        });
      }

      // Handle Print Button
      const printBtn = document.getElementById('print-brochure-btn');
      if (printBtn) {
        printBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.print();
        });
      }
    }
  }

  // ===== WHATSAPP CONCIERGE CONTROLS =====
  const floatTrigger = document.getElementById('whatsapp-float-trigger');
  const conciergeCard = document.getElementById('concierge-card');
  const conciergeClose = document.getElementById('concierge-close');
  const conciergeOptions = document.querySelectorAll('.concierge-opt');

  if (floatTrigger && conciergeCard) {
    const toggleConcierge = (forceState) => {
      const isOpen = forceState !== undefined ? forceState : !conciergeCard.classList.contains('open');
      conciergeCard.classList.toggle('open', isOpen);
      conciergeCard.setAttribute('aria-hidden', !isOpen);
      floatTrigger.setAttribute('aria-expanded', isOpen);
    };

    floatTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      toggleConcierge();
    });

    if (conciergeClose) {
      conciergeClose.addEventListener('click', (e) => {
        e.preventDefault();
        toggleConcierge(false);
      });
    }

    conciergeOptions.forEach(opt => {
      opt.addEventListener('click', function(e) {
        e.preventDefault();
        const msg = this.getAttribute('data-msg');
        if (msg) {
          const encodedText = encodeURIComponent(msg);
          const whatsappUrl = `https://api.whatsapp.com/send?phone=5519974139848&text=${encodedText}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
        toggleConcierge(false);
      });
    });

    // Close on click outside (premium experience)
    document.addEventListener('click', (e) => {
      if (!conciergeCard.contains(e.target) && !floatTrigger.contains(e.target) && conciergeCard.classList.contains('open')) {
        toggleConcierge(false);
      }
    });
  }
});
