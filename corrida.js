/*
  Trajeto Perfeito — página "Corrida".

  >>> PARA MUDAR O TRAJETO, edite só o objeto TRAJETO logo abaixo. <<<

  Como na fanfic: a Eduarda e a Lorena moram perto da MESMA delegacia
  (o trecho até a Lorena é curto) e depois seguem até a faculdade (trecho longo).
  A fanfic não diz os endereços, então os pontos abaixo são uma sugestão em
  São Paulo (Pinheiros → Cidade Universitária). Troque à vontade.

  "detalhe" é a frase pequena que aparece embaixo do nome no painel.

  Cada lugar pode ser preenchido de três jeitos (o primeiro que existir vale):
    1. coord:    coordenadas exatas [latitude, longitude], ex.: [-23.5613, -46.6565]
                 (no Google Maps: botão direito no ponto e clique nos números).
    2. endereco: o endereço escrito, ex.: 'Avenida Paulista, 1578, São Paulo'.
                 O site procura o endereço sozinho no mapa.
    3. vazio:    deixe endereco: '' e coord: null para o site SORTEAR um ponto
                 aleatório em São Paulo a cada visita.

  O caminho entre os pontos segue as ruas de verdade, calculado na hora.
  Se o serviço de ruas estiver fora do ar, o site desenha um caminho alternativo.
*/
var TRAJETO = {
  casaEduarda:  { nome: 'Casa da Eduarda',  detalhe: 'Apartamento perto da delegacia',  endereco: '', coord: [-23.5679, -46.6941] },
  predioLorena: { nome: 'Prédio da Lorena', detalhe: 'Na mesma região, poucas quadras', endereco: '', coord: [-23.5652, -46.6893] },
  faculdade:    { nome: 'Faculdade',        detalhe: 'Campus · lago da Doutora',        endereco: '', coord: [-23.5596, -46.7307] },

  // Ponto de referência (só aparece no mapa, a capivara não para aqui).
  // Para esconder, troque coord por null.
  delegacia:    { nome: 'Delegacia',        coord: [-23.5664, -46.6915] },

  // Região usada para sortear pontos que estiverem vazios (centro e raio em km)
  sorteio: { centro: [-23.5630, -46.7080], raioKm: 4.5 }
};

// Duração da animação (ms): ~25 s no total
var TEMPOS = { etapa1: 10000, pausa: 3000, etapa2: 12000 };

(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var LUGARES = ['casaEduarda', 'predioLorena', 'faculdade'];
  var CHAVE_ENDERECOS = 'tp-enderecos';
  var KM_POR_GRAU = 111.32;

  var CAPIVARA_SVG =
    '<svg viewBox="0 0 72 48" width="64" height="43" aria-hidden="true">' +
      '<ellipse cx="36" cy="45" rx="27" ry="2.6" fill="rgba(0,0,0,.18)"/>' +
      '<path d="M8 28C8 15 20 10 34 10c9 0 15 2 19 5v19c0 3-2 4-5 4H14c-4 0-6-4-6-10z" fill="#9A6634"/>' +
      '<path d="M14 21c4-4 9-6 14-6M18 27c3-2 7-3 11-3" stroke="#B5814D" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M43 15c2-7 8-9 14-8 6 1 9 5 10 9v10c0 4-3 6-7 6h-9c-5 0-8-4-8-8z" fill="#8A5A2E"/>' +
      '<path d="M57 13c6-1 11 2 11 7v6c0 4-3 6-7 6h-4z" fill="#6E4522"/>' +
      '<ellipse cx="49.5" cy="7.8" rx="3.2" ry="2.6" fill="#6E4522"/>' +
      '<ellipse cx="49.5" cy="8.3" rx="1.5" ry="1.1" fill="#C98F86"/>' +
      '<circle cx="55.5" cy="14.5" r="2" fill="#1a1a1a"/><circle cx="56.2" cy="13.8" r=".7" fill="#fff"/>' +
      '<ellipse cx="65.6" cy="18.6" rx="1.1" ry="1.5" fill="#2a1a0e"/>' +
      '<ellipse cx="55.5" cy="22" rx="3.2" ry="1.9" fill="#E8998D" opacity=".65"/>' +
      '<path d="M61.5 27.2q2 1.6 4.2 0" stroke="#2a1a0e" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
      '<circle cx="21" cy="38" r="6.2" fill="#161616"/><circle cx="21" cy="38" r="2.3" fill="#c9c9c9"/>' +
      '<circle cx="45" cy="38" r="6.2" fill="#161616"/><circle cx="45" cy="38" r="2.3" fill="#c9c9c9"/>' +
    '</svg>';

  var TILES = {
    claro: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    escuro: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  var TILE_RESERVA = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var usandoReserva = false;

  var mapa, tiles, camadaRota, capivara, giroEl;
  var rota = null;   // { lugares: { casaEduarda: {coord, detalhe}, ... }, etapas: [{ pts, acc, minutos, km, linhas }], sorteada }
  var fase = 'carregando', inicioFase = 0, raf = null, anguloAtual = null, avaliacao = 5, pedido = 0;
  var rotuloAtual = '';

  var folha = $('#folha'), estadoEl = $('#folha-estado'), acoesEl = $('#folha-acoes');

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function temaAtual() { return document.documentElement.getAttribute('data-tema') === 'escuro' ? 'escuro' : 'claro'; }

  /* ---------- Geometria ---------- */

  function distancia(a, b) {
    var lat = (a[0] + b[0]) / 2 * Math.PI / 180;
    var dx = (b[1] - a[1]) * Math.cos(lat), dy = b[0] - a[0];
    return Math.sqrt(dx * dx + dy * dy);
  }

  var km = function (a, b) { return distancia(a, b) * KM_POR_GRAU; };

  function acumulado(pts) {
    var c = [0];
    for (var i = 1; i < pts.length; i++) c.push(c[i - 1] + distancia(pts[i - 1], pts[i]));
    return c;
  }

  // Ponto na fração t do caminho, e o índice do próximo vértice
  function pontoEm(pts, acc, t) {
    var alvo = acc[acc.length - 1] * Math.min(1, Math.max(0, t));
    for (var i = 1; i < pts.length; i++) {
      if (acc[i] >= alvo) {
        var seg = acc[i] - acc[i - 1] || 1, f = (alvo - acc[i - 1]) / seg;
        return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f], i: i };
      }
    }
    return { p: pts[pts.length - 1], i: pts.length - 1 };
  }

  var suavizar = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };

  /* ---------- Sorteio e busca dos pontos ---------- */

  function pontoAleatorio() {
    var c = TRAJETO.sorteio.centro, r = TRAJETO.sorteio.raioKm * Math.sqrt(Math.random());
    var ang = Math.random() * Math.PI * 2;
    return [
      c[0] + (r * Math.cos(ang)) / KM_POR_GRAU,
      c[1] + (r * Math.sin(ang)) / (KM_POR_GRAU * Math.cos(c[0] * Math.PI / 180))
    ];
  }

  // Sorteia só os pontos que faltam, com distâncias que parecem uma carona de verdade
  function completarPontos(fixos) {
    var melhor = null;
    for (var tentativa = 0; tentativa < 40; tentativa++) {
      var p = LUGARES.map(function (k) { return fixos[k] || pontoAleatorio(); });
      var d1 = km(p[0], p[1]), d2 = km(p[1], p[2]);
      melhor = p;
      // Casa da Eduarda e prédio da Lorena ficam perto (mesma delegacia); a faculdade é mais longe
      if (d1 >= 0.4 && d1 <= 1.2 && d2 >= 2.5 && d2 <= 6) break;
    }
    return melhor;
  }

  function lerCache() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENDERECOS)) || {}; } catch (e) { return {}; }
  }

  function geocodificar(endereco) {
    var cache = lerCache();
    if (cache[endereco]) return Promise.resolve({ coord: cache[endereco], rede: false });
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q=' +
      encodeURIComponent(endereco);
    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (lista) {
        var coord = lista && lista[0] ? [Number(lista[0].lat), Number(lista[0].lon)] : null;
        if (coord) {
          cache[endereco] = coord;
          try { localStorage.setItem(CHAVE_ENDERECOS, JSON.stringify(cache)); } catch (e) {}
        }
        return { coord: coord, rede: true };
      })
      .catch(function () { return { coord: null, rede: true }; });
  }

  var esperar = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };

  // Procura os endereços um de cada vez (o serviço gratuito pede no máximo 1 por segundo)
  function resolverLugares() {
    var fixos = {}, detalhes = {}, cadeia = Promise.resolve(), usouRede = false;
    LUGARES.forEach(function (k) {
      var l = TRAJETO[k];
      if (Array.isArray(l.coord) && l.coord.length === 2) {
        fixos[k] = l.coord;
        detalhes[k] = l.detalhe || l.endereco || 'Ponto marcado no mapa';
      } else if (l.endereco) {
        cadeia = cadeia
          .then(function () { return usouRede ? esperar(1100) : null; })
          .then(function () { return geocodificar(l.endereco); })
          .then(function (res) {
            usouRede = usouRede || res.rede;
            if (res.coord) { fixos[k] = res.coord; detalhes[k] = l.detalhe || l.endereco; }
            else if (window.TP) window.TP.toast('Não achei "' + l.endereco + '". Sorteei um ponto no lugar.');
          });
      }
    });
    return cadeia.then(function () {
      var pontos = completarPontos(fixos), lugares = {}, sorteada = false;
      LUGARES.forEach(function (k, i) {
        if (!fixos[k]) sorteada = true;
        lugares[k] = { coord: pontos[i], detalhe: detalhes[k] || 'Ponto sorteado no mapa' };
      });
      return { lugares: lugares, sorteada: sorteada };
    });
  }

  /* ---------- Caminho pelas ruas ---------- */

  function buscarRuas(pontos) {
    var coords = pontos.map(function (p) { return p[1].toFixed(6) + ',' + p[0].toFixed(6); }).join(';');
    var url = 'https://router.project-osrm.org/route/v1/driving/' + coords + '?overview=false&steps=true&geometries=geojson';
    var controle = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var limite = setTimeout(function () { if (controle) controle.abort(); }, 9000);
    return fetch(url, controle ? { signal: controle.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        clearTimeout(limite);
        if (dados.code !== 'Ok' || !dados.routes || !dados.routes[0]) throw new Error('sem rota');
        return dados.routes[0].legs.map(function (perna) {
          var pts = [];
          perna.steps.forEach(function (passo) {
            passo.geometry.coordinates.forEach(function (c) {
              var p = [c[1], c[0]], u = pts[pts.length - 1];
              if (!u || u[0] !== p[0] || u[1] !== p[1]) pts.push(p);
            });
          });
          return { pts: pts, minutos: Math.max(1, Math.round(perna.duration / 60)) };
        });
      })
      .catch(function () { clearTimeout(limite); return null; });
  }

  // Sem internet para calcular as ruas: inventa um caminho "em quarteirões"
  function caminhoInventado(a, b) {
    var pts = [a], atual = a, n = 5 + Math.floor(Math.random() * 4);
    for (var i = 1; i <= n; i++) {
      var t = i === n ? 1 : i / n + (Math.random() - 0.5) * 0.12;
      var alvo = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      pts.push(i % 2 ? [atual[0], alvo[1]] : [alvo[0], atual[1]]);
      pts.push(alvo);
      atual = alvo;
    }
    return { pts: pts, minutos: Math.max(1, Math.round(km(a, b) * 2.6)) };
  }

  function prepararRota() {
    var meu = ++pedido;
    cancelAnimationFrame(raf);
    if (giroEl) giroEl.classList.remove('andando');
    telaCarregando();
    resolverLugares().then(function (base) {
      var pontos = LUGARES.map(function (k) { return base.lugares[k].coord; });
      return buscarRuas(pontos).then(function (pernas) {
        if (!pernas || pernas.length !== 2) pernas = [caminhoInventado(pontos[0], pontos[1]), caminhoInventado(pontos[1], pontos[2])];
        // Os pinos ficam exatamente onde o caminho começa e termina (na rua)
        base.lugares.casaEduarda.coord = pernas[0].pts[0];
        base.lugares.predioLorena.coord = pernas[1].pts[0];
        base.lugares.faculdade.coord = pernas[1].pts[pernas[1].pts.length - 1];
        pernas[0].pts[pernas[0].pts.length - 1] = pernas[1].pts[0];
        base.etapas = pernas.map(function (p) {
          var acc = acumulado(p.pts);
          return { pts: p.pts, acc: acc, minutos: p.minutos, km: acc[acc.length - 1] * KM_POR_GRAU };
        });
        return base;
      });
    }).then(function (nova) {
      if (meu !== pedido) return;
      rota = nova;
      desenharRota();
      telaParado();
    });
  }

  /* ---------- Mapa ---------- */

  function coresRota() {
    return temaAtual() === 'escuro'
      ? { linha: '#FFFFFF', borda: '#000000', feita: '#5A5A5A' }
      : { linha: '#000000', borda: '#FFFFFF', feita: '#BDBDBD' };
  }

  function iniciarMapa() {
    if (typeof L === 'undefined') {
      $('#mapa').innerHTML = '<p class="mapa-erro">Não foi possível carregar o mapa. Verifique sua conexão.</p>';
      return false;
    }
    $('#mapa').innerHTML = '';
    mapa = L.map('mapa', { zoomControl: false, attributionControl: false });
    mapa.setView(TRAJETO.sorteio.centro, 13);
    tiles = L.tileLayer(TILES[temaAtual()], {
      subdomains: 'abcd', maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(mapa);

    // Se o mapa do CARTO não carregar, troca sozinho pelo mapa padrão do OpenStreetMap
    var erros = 0, carregou = false;
    tiles.on('tileload', function () { carregou = true; });
    tiles.on('tileerror', function () {
      if (carregou || usandoReserva || ++erros < 4) return;
      usandoReserva = true;
      tiles.setUrl(TILE_RESERVA);
    });

    // O mapa precisa saber o tamanho certo da tela (evita mapa cinza ou cortado)
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { mapa.invalidateSize(); }).observe($('#mapa'));
    }
    setTimeout(function () { mapa.invalidateSize(); }, 400);
    L.control.attribution({ position: 'topright', prefix: false }).addTo(mapa);
    L.control.zoom({ position: 'topright' }).addTo(mapa);
    camadaRota = L.layerGroup().addTo(mapa);

    capivara = L.marker(TRAJETO.sorteio.centro, {
      icon: L.divIcon({
        className: 'capivara-icone',
        html: '<div class="capivara-giro"><div class="capivara-pulo">' + CAPIVARA_SVG + '</div></div>',
        iconSize: [64, 43], iconAnchor: [32, 30]
      }),
      zIndexOffset: 1000, keyboard: false, interactive: false, opacity: 0
    }).addTo(mapa);
    giroEl = capivara.getElement().querySelector('.capivara-giro');

    // Modo escuro: mapa escuro e linha branca
    new MutationObserver(function () {
      if (!usandoReserva) tiles.setUrl(TILES[temaAtual()]);
      if (rota) pintarLinhas();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });

    window.addEventListener('resize', function () {
      if (document.body.getAttribute('data-pagina') === 'corrida' && (fase === 'parado' || fase === 'fim')) enquadrar();
    });
    return true;
  }

  function pintarLinhas() {
    var c = coresRota();
    rota.etapas.forEach(function (e) {
      e.linhas.borda.setStyle({ color: c.borda });
      e.linhas.feita.setStyle({ color: c.feita });
      e.linhas.restante.setStyle({ color: c.linha });
    });
  }

  function desenharRota() {
    if (!mapa) return;
    camadaRota.clearLayers();
    var c = coresRota(), estilo = { opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false };
    rota.etapas.forEach(function (e) {
      e.linhas = {
        borda: L.polyline(e.pts, L.extend({ color: c.borda, weight: 11 }, estilo)).addTo(camadaRota),
        feita: L.polyline(e.pts, L.extend({ color: c.feita, weight: 6 }, estilo)).addTo(camadaRota),
        restante: L.polyline(e.pts, L.extend({ color: c.linha, weight: 6 }, estilo)).addTo(camadaRota)
      };
    });
    rota.pinos = {
      casaEduarda: pino('casaEduarda', 'pino-inicio'),
      predioLorena: pino('predioLorena', 'pino-parada'),
      faculdade: pino('faculdade', 'pino-fim')
    };
    var d = TRAJETO.delegacia;
    if (d && Array.isArray(d.coord) && !rota.sorteada) {
      L.marker(d.coord, {
        icon: L.divIcon({ className: 'pino-referencia', html: '<span>★</span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        keyboard: false, interactive: false
      }).addTo(camadaRota).bindTooltip(escapar(d.nome), {
        permanent: true, direction: 'bottom', offset: [0, 8], className: 'pino-rotulo pino-rotulo-ref'
      });
    }
    var inicio = rota.etapas[0].pts;
    anguloAtual = null;
    capivara.setLatLng(inicio[0]).setOpacity(1);
    girarPara(inicio[0], inicio[Math.min(1, inicio.length - 1)], true);
    enquadrar();
  }

  function pino(chave, classe) {
    return L.marker(rota.lugares[chave].coord, {
      icon: L.divIcon({ className: 'pino ' + classe, html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      keyboard: false
    }).addTo(camadaRota).bindTooltip(escapar(TRAJETO[chave].nome), {
      permanent: true, direction: 'top', offset: [0, -10], className: 'pino-rotulo'
    });
  }

  function enquadrar() {
    if (!mapa || !rota) return;
    var largo = window.innerWidth >= 760;
    var alturaFolha = folha.classList.contains('recolhida') ? 90 : folha.offsetHeight;
    var pontos = rota.etapas[0].pts.concat(rota.etapas[1].pts);
    mapa.fitBounds(L.latLngBounds(pontos), largo
      ? { paddingTopLeft: [folha.offsetWidth + 64, 56], paddingBottomRight: [72, 40], maxZoom: 16 }
      : { paddingTopLeft: [28, 56], paddingBottomRight: [28, Math.min(alturaFolha + 24, window.innerHeight * 0.6)], maxZoom: 16 });
  }

  function girarPara(a, b, imediato) {
    var pa = mapa.latLngToLayerPoint(a), pb = mapa.latLngToLayerPoint(b);
    if (Math.abs(pb.x - pa.x) + Math.abs(pb.y - pa.y) < 0.01) return;
    var alvo = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI;
    if (anguloAtual === null || imediato) anguloAtual = alvo;
    else {
      var d = ((alvo - anguloAtual + 540) % 360) - 180; // caminho mais curto
      anguloAtual += d * 0.15;
    }
    var norm = ((anguloAtual + 540) % 360) - 180;
    // Virada para a esquerda: espelha para a capivara não ficar de cabeça para baixo
    var espelho = Math.abs(norm) > 90 ? ' scaleY(-1)' : '';
    giroEl.style.transform = 'rotate(' + norm.toFixed(1) + 'deg)' + espelho;
  }

  function mover(etapa, t) {
    var atual = pontoEm(etapa.pts, etapa.acc, t);
    var frente = pontoEm(etapa.pts, etapa.acc, Math.min(1, t + 0.01)).p;
    capivara.setLatLng(atual.p);
    etapa.linhas.restante.setLatLngs(t >= 1 ? [] : [atual.p].concat(etapa.pts.slice(atual.i)));
    if (t < 0.995) girarPara(atual.p, frente);
  }

  function rotuloDestino(chave, minutos) {
    var texto = escapar(TRAJETO[chave].nome) + (minutos ? ' · <strong>' + minutos + ' min</strong>' : '');
    if (texto === rotuloAtual) return;
    rotuloAtual = texto;
    rota.pinos[chave].setTooltipContent(texto);
  }

  /* ---------- Painel ---------- */

  function horaChegada(min) {
    var d = new Date(Date.now() + min * 60000);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function kmBR(n) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }); }

  function desenharEstado(html) {
    estadoEl.innerHTML = html;
  }

  function barraHTML() {
    return '<div class="corrida-barra"><span id="corrida-barra"></span></div>';
  }

  function botoesFinais(principal, aoClicar) {
    acoesEl.innerHTML =
      '<button type="button" class="corrida-botao" id="botao-principal">' + principal + '</button>' +
      (rota && rota.sorteada
        ? '<button type="button" class="corrida-botao corrida-botao-secundario" id="botao-sortear">Sortear outro trajeto</button>'
        : '');
    $('#botao-principal').addEventListener('click', aoClicar);
    if ($('#botao-sortear')) $('#botao-sortear').addEventListener('click', prepararRota);
  }

  function telaCarregando() {
    fase = 'carregando';
    folha.setAttribute('data-fase', fase);
    desenharEstado(
      '<p class="folha-rotulo">Carona de hoje</p>' +
      '<h2 class="folha-titulo">Procurando o melhor trajeto…</h2>' +
      '<div class="corrida-barra corrida-barra-busca"><span></span></div>'
    );
    acoesEl.innerHTML = '<button type="button" class="corrida-botao" disabled>Iniciar corrida</button>';
  }

  function telaParado() {
    fase = 'parado';
    folha.setAttribute('data-fase', fase);
    var e = rota.etapas, total = e[0].minutos + e[1].minutos;
    desenharEstado(
      '<p class="folha-rotulo">Carona de hoje</p>' +
      '<h2 class="folha-titulo">Pronta para a carona?</h2>' +
      '<ol class="folha-paradas">' +
        LUGARES.map(function (k, i) {
          return '<li><span class="ponto ' + ['ponto-inicio', 'ponto-parada', 'ponto-fim'][i] + '"></span>' +
            '<span class="parada-texto"><strong>' + escapar(TRAJETO[k].nome) + '</strong>' +
            '<small>' + escapar(rota.lugares[k].detalhe) + '</small></span></li>';
        }).join('') +
      '</ol>' +
      '<p class="folha-resumo"><strong>≈ ' + total + ' min</strong> · ' + kmBR(e[0].km + e[1].km) + ' km</p>'
    );
    botoesFinais('Iniciar corrida', iniciar);
  }

  function telaEtapa(titulo, rotulo) {
    folha.setAttribute('data-fase', fase);
    desenharEstado(
      '<p class="folha-rotulo">' + rotulo + '</p>' +
      '<h2 class="folha-titulo">' + titulo + '</h2>' +
      '<p class="folha-eta"><strong id="corrida-min"></strong> <span id="corrida-hora"></span></p>' +
      barraHTML()
    );
    acoesEl.innerHTML = '';
  }

  function telaChegou() {
    folha.setAttribute('data-fase', fase);
    desenharEstado(
      '<p class="folha-rotulo">Etapa 1 concluída</p>' +
      '<h2 class="folha-titulo">Eduarda chegou! Ela está estacionada em frente ao seu prédio</h2>' +
      '<p class="balao">desce logo, Lorena! 🙄</p>' +
      barraHTML()
    );
  }

  function telaFim() {
    fase = 'fim';
    folha.setAttribute('data-fase', fase);
    avaliacao = 5;
    var estrelas = '';
    for (var i = 1; i <= 5; i++) {
      estrelas += '<button type="button" class="estrela cheia" data-nota="' + i + '" aria-label="' + i + (i === 1 ? ' estrela' : ' estrelas') + '">★</button>';
    }
    desenharEstado(
      '<p class="folha-rotulo">Corrida finalizada</p>' +
      '<h2 class="folha-titulo">Vocês chegaram à faculdade 💚</h2>' +
      '<p class="folha-pergunta">Como foi a carona com a Eduarda?</p>' +
      '<div class="estrelas" role="group" aria-label="Avaliação">' + estrelas + '</div>' +
      '<p class="folha-obrigado" id="folha-obrigado"></p>'
    );
    estadoEl.querySelectorAll('.estrela').forEach(function (b) {
      b.addEventListener('click', function () {
        avaliacao = Number(b.getAttribute('data-nota'));
        estadoEl.querySelectorAll('.estrela').forEach(function (e) {
          e.classList.toggle('cheia', Number(e.getAttribute('data-nota')) <= avaliacao);
        });
        $('#folha-obrigado').textContent = avaliacao === 5
          ? 'Obrigada! A Eduarda também te deu 5 estrelas.'
          : 'Anotado. A Eduarda vai fingir que não viu.';
      });
    });
    botoesFinais('Fazer de novo', iniciar);
  }

  function atualizarEta(t, minutos, destino) {
    var restante = Math.max(1, Math.ceil((1 - t) * minutos));
    var m = $('#corrida-min'), h = $('#corrida-hora');
    if (m) m.textContent = t >= 1 ? 'Chegando' : 'Chega em ' + restante + ' min';
    if (h) h.textContent = t >= 1 ? '' : '· ' + horaChegada(restante);
    rotuloDestino(destino, t >= 1 ? 0 : restante);
  }

  function atualizarBarra(t) {
    var b = $('#corrida-barra');
    if (b) b.style.transform = 'scaleX(' + t + ')';
  }

  /* ---------- Animação ---------- */

  function mudarFase(nova, agora) {
    fase = nova;
    inicioFase = agora;
    if (nova === 'etapa1') telaEtapa('Eduarda está indo até Lorena', 'Etapa 1 de 2');
    if (nova === 'chegou') telaChegou();
    if (nova === 'etapa2') telaEtapa('A caminho da faculdade', 'Etapa 2 de 2');
  }

  function iniciar() {
    if (!mapa || !rota) return;
    cancelAnimationFrame(raf);
    var inicio = rota.etapas[0].pts;
    rota.etapas.forEach(function (e) { e.linhas.restante.setLatLngs(e.pts); });
    anguloAtual = null;
    capivara.setLatLng(inicio[0]);
    girarPara(inicio[0], inicio[Math.min(1, inicio.length - 1)], true);
    giroEl.classList.add('andando');
    expandir(true);
    mudarFase('etapa1', performance.now());
    raf = requestAnimationFrame(passo);
  }

  function passo(agora) {
    var dec = agora - inicioFase, t, e = rota.etapas;
    if (fase === 'etapa1') {
      t = Math.min(1, dec / TEMPOS.etapa1);
      mover(e[0], suavizar(t));
      atualizarEta(t, e[0].minutos, 'predioLorena');
      atualizarBarra(t);
      if (t >= 1) { giroEl.classList.remove('andando'); mudarFase('chegou', agora); }
    } else if (fase === 'chegou') {
      t = Math.min(1, dec / TEMPOS.pausa);
      atualizarBarra(t);
      if (t >= 1) { giroEl.classList.add('andando'); mudarFase('etapa2', agora); }
    } else if (fase === 'etapa2') {
      t = Math.min(1, dec / TEMPOS.etapa2);
      mover(e[1], suavizar(t));
      atualizarEta(t, e[1].minutos, 'faculdade');
      atualizarBarra(t);
      if (t >= 1) { giroEl.classList.remove('andando'); telaFim(); return; }
    } else return;
    raf = requestAnimationFrame(passo);
  }

  /* ---------- Painel recolhível ---------- */

  function expandir(sim) {
    folha.classList.toggle('recolhida', !sim);
    $('#folha-alca').setAttribute('aria-expanded', String(sim));
    $('#folha-alca').setAttribute('aria-label', sim ? 'Recolher painel' : 'Expandir painel');
  }
  $('#folha-alca').addEventListener('click', function () { expandir(folha.classList.contains('recolhida')); });

  $('#botao-playlist').addEventListener('click', function () {
    if (window.TP) window.TP.toast('Eduarda não aprovou a mudança');
  });

  function montarMotorista() {
    var alvo = $('#motorista-avatar');
    var lista = (window.TP && window.TP.personagens) || [];
    var eduarda = lista.find(function (p) { return p.id === 'eduarda'; }) ||
      lista.find(function (p) { return /eduarda/i.test(p.nome || ''); }) || { nome: 'Eduarda' };
    alvo.innerHTML = '';
    if (window.TP) alvo.appendChild(window.TP.criarFoto(eduarda, 'motorista-foto'));
  }

  /* ---------- Entrada/saída da página ---------- */

  var montado = false;
  window.TPCorrida = {
    entrar: function () {
      folha.classList.remove('subindo');
      void folha.offsetWidth;
      folha.classList.add('subindo');
      if (!montado) {
        montado = true;
        montarMotorista();
        telaCarregando();
        // Espera a biblioteca do mapa chegar (até ~10 s em internet lenta)
        var tentativas = 0;
        (function tentar() {
          if (typeof L === 'undefined' && tentativas++ < 50) { setTimeout(tentar, 200); return; }
          requestAnimationFrame(function () {
            if (iniciarMapa()) prepararRota();
            else {
              desenharEstado('<p class="folha-rotulo">Carona de hoje</p><h2 class="folha-titulo">O mapa não carregou</h2>' +
                '<p class="folha-pergunta">Confira sua conexão e recarregue a página.</p>');
              acoesEl.innerHTML = '<button type="button" class="corrida-botao" onclick="location.reload()">Recarregar</button>';
            }
          });
        })();
      } else if (mapa) {
        requestAnimationFrame(function () { mapa.invalidateSize(); if (fase === 'parado' || fase === 'fim') enquadrar(); });
      }
    },
    sair: function () {}
  };
})();
