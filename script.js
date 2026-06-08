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

  // ===== WHATSAPP CONFIG =====
  const WHATSAPP_PHONE = '5519974139848';

  // ===== FORM CAPTURE → WHATSAPP =====
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

      // Determinar finalidade
      const isAnuncie = window.location.pathname.includes('anuncie');
      const finalidadeTexto = isAnuncie
        ? 'vender/anunciar meu imóvel'
        : (interesse || 'contato geral');

      // Compor mensagem para o WhatsApp
      let msg = `Olá Tatiana! Acabei de enviar uma mensagem pelo seu site.\n\n`;
      msg += `*Nome:* ${nome}\n`;
      msg += `*WhatsApp:* ${tel}\n`;
      if (email) msg += `*E-mail:* ${email}\n`;
      msg += `*Interesse:* ${finalidadeTexto}\n`;
      if (mensagem) msg += `\n*Mensagem:* ${mensagem}\n`;
      if (isAnuncie) {
        msg += `\n*Detalhes do imóvel para anunciar:*\n`;
        if (tipo) msg += `• Tipo: ${tipo}\n`;
        if (localizacao) msg += `• Localização: ${localizacao}\n`;
        if (preco) msg += `• Preço pretendido: R$ ${preco}\n`;
        if (area) msg += `• Área: ${area} m²\n`;
        if (dormitorios) msg += `• Dormitórios: ${dormitorios}\n`;
      }

      const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      fb.textContent = '✓ Abrindo o WhatsApp para finalizar o envio…';
      fb.style.color = '#D2526E';
      fb.style.fontWeight = '500';
      fb.classList.add('reveal', 'active');
      form.reset();
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
            <li>🛏 ${imovel.quartos} quartos</li>
            <li>🚿 ${imovel.banheiros} banheiros</li>
            <li>📐 ${imovel.area} m²</li>
          </ul>
          <p class="imovel-preco">${formatBRL(imovel.preco, imovel.finalidade)}</p>
          <a class="imovel-link" href="detalhes.html?id=${imovel.id}" aria-label="Ver detalhes de ${imovel.nome}">Ver detalhes →</a>
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
              <li>🛏 ${imovel.quartos} quartos</li>
              <li>🚿 ${imovel.banheiros} banheiros</li>
              <li>📐 ${imovel.area} m²</li>
            </ul>
            <p class="imovel-preco">${formatBRL(imovel.preco, imovel.finalidade)}</p>
            <a class="imovel-link" href="detalhes.html?id=${imovel.id}" aria-label="Ver detalhes de ${imovel.nome}">Ver detalhes →</a>
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
        // Keyword Search
        const matchesKeyword = searchVal === '' || 
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
    // Suporta ?id=N (formato novo) e ?codigo=AP0123 (formato legado Kenlo/Ads)
    const codigoParam = urlParams.get('codigo');
    let imovel;
    if (codigoParam) {
      imovel = IMOVEIS_DATABASE.find(item =>
        item.codigo && item.codigo.toLowerCase() === codigoParam.toLowerCase()
      );
    } else {
      const imovelId = parseInt(urlParams.get('id'), 10);
      imovel = IMOVEIS_DATABASE.find(item => item.id === imovelId);
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
              <p class="detalhe-preco">${formatBRL(imovel.preco, imovel.finalidade)}</p>
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
                <p class="spec-value">${imovel.quartos} suítes</p>
                <p class="spec-label">Dormitórios</p>
              </div>
              <div class="spec-box">
                <span>🚿</span>
                <p class="spec-value">${imovel.banheiros} banheiros</p>
                <p class="spec-label">Banheiros</p>
              </div>
              <div class="spec-box">
                <span>🚗</span>
                <p class="spec-value">${imovel.vagas} vagas</p>
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

      // Handle Visit Scheduling Form Submit → WhatsApp
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

          const whatsappMsg = `Olá Tatiana! Gostaria de agendar uma visita privada ao imóvel "${imovel.nome}" (Ref: ${imovel.codigo}) no bairro ${imovel.bairro}.\n\n*Nome:* ${nome}\n*WhatsApp:* ${tel}\n*Data sugerida:* ${data || 'A combinar'}\n*Período:* ${hora}`;
          const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(whatsappMsg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');

          fb.textContent = '✓ Abrindo o WhatsApp para finalizar o agendamento…';
          fb.style.color = '#D2526E';
          fb.style.fontWeight = '500';
          visitaForm.reset();
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
