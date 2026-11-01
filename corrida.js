/*
  Trajeto Perfeito — página "Corrida".

  O mapa é um desenho feito aqui mesmo (não depende de internet, chave de API
  nem serviço de mapas). O trajeto é sempre o mesmo, como na fanfic:
    1. Casa da Eduarda  →  Prédio da Lorena   (pertinho: as duas moram perto da delegacia)
    2. Prédio da Lorena →  Faculdade          (o trecho mais longo)

  >>> PARA MUDAR NOMES, FRASES OU TEMPOS, edite só TRAJETO e TEMPOS abaixo. <<<
*/
var TRAJETO = {
  casaEduarda:  { nome: 'Casa da Eduarda',  detalhe: 'Apartamento perto da delegacia' },
  predioLorena: { nome: 'Prédio da Lorena', detalhe: 'Na mesma região, poucas quadras' },
  faculdade:    { nome: 'Faculdade',        detalhe: 'Campus · lago da Doutora' },
  delegacia:    { nome: 'Delegacia' },

  // Tempo e distância "de mentirinha" mostrados no painel
  etapa1: { minutos: 3,  km: 1.1 },
  etapa2: { minutos: 16, km: 6.4 }
};

// Duração da animação (ms): ~25 s no total
var TEMPOS = { etapa1: 9000, pausa: 3000, etapa2: 13000 };

(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';
  var LUGARES = ['casaEduarda', 'predioLorena', 'faculdade'];

  // Caminho pelas ruas do desenho (ruas a cada 100 unidades)
  var CAMINHOS = [
    [[200, 700], [200, 600], [400, 600]],                         // casa → prédio
    [[400, 600], [400, 200], [900, 200]]                          // prédio → faculdade
  ];
  var PONTOS = { casaEduarda: [200, 700], predioLorena: [400, 600], faculdade: [900, 200], delegacia: [560, 600] };

  var CAPIVARA =
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
    '<circle cx="45" cy="38" r="6.2" fill="#161616"/><circle cx="45" cy="38" r="2.3" fill="#c9c9c9"/>';

  var svg, camada, capivaraEl, rotulos = {}, linhas = [], pinos = [];
  var escala = 1, angulo = null, posCapivara = PONTOS.casaEduarda;
  var etapas = CAMINHOS.map(function (pts) { return { pts: pts, acc: acumulado(pts) }; });
  var fase = 'parado', inicioFase = 0, raf = null, avaliacao = 5;

  var folha = $('#folha'), estadoEl = $('#folha-estado'), acoesEl = $('#folha-acoes');

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function el(nome, attrs, pai) {
    var e = document.createElementNS(NS, nome);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }

  /* ---------- Geometria ---------- */

  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }

  function acumulado(pts) {
    var c = [0];
    for (var i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i - 1], pts[i]));
    return c;
  }

  function pontoEm(etapa, t) {
    var pts = etapa.pts, acc = etapa.acc;
    var alvo = acc[acc.length - 1] * Math.min(1, Math.max(0, t));
    for (var i = 1; i < pts.length; i++) {
      if (acc[i] >= alvo) {
        var f = (alvo - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1);
        return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f], i: i };
      }
    }
    return { p: pts[pts.length - 1], i: pts.length - 1 };
  }

  var suavizar = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
  var lista = function (pts) { return pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); };

  /* ---------- Desenho da cidade ---------- */

  function desenharCidade() {
    var mapaEl = $('#mapa');
    mapaEl.innerHTML = '';
    svg = el('svg', { 'class': 'mapa-svg', 'aria-hidden': 'true', focusable: 'false' }, mapaEl);
    var cidade = el('g', { 'class': 'mapa-cidade' }, svg);
    el('rect', { x: -3000, y: -3000, width: 7000, height: 7000, 'class': 'm-fundo' }, cidade);

    // Parques, campus e lago
    el('rect', { x: 820, y: -120, width: 460, height: 380, rx: 18, 'class': 'm-parque' }, cidade);
    el('rect', { x: 20, y: 820, width: 160, height: 160, rx: 14, 'class': 'm-parque' }, cidade);
    el('rect', { x: 520, y: 620, width: 160, height: 160, rx: 14, 'class': 'm-parque' }, cidade);
    el('ellipse', { cx: 1060, cy: 90, rx: 120, ry: 62, 'class': 'm-agua' }, cidade);
    [[840, 220, 50, 30], [1150, 160, 60, 44], [1130, -60, 70, 40]].forEach(function (r) {
      el('rect', { x: r[0], y: r[1], width: r[2], height: r[3], rx: 6, 'class': 'm-predio' }, cidade);
    });
    el('text', { x: 1060, y: 96, 'class': 'm-texto-agua', 'text-anchor': 'middle' }, cidade).textContent = 'lago da Doutora';

    // Ruas (a cada 100) e avenidas (a cada 400)
    var ruas = '', avenidas = '';
    for (var v = -2000; v <= 3000; v += 100) {
      var linha = 'M' + v + ' -2000V3000M-2000 ' + v + 'H3000';
      if (v % 400 === 0) avenidas += linha; else ruas += linha;
    }
    el('path', { d: ruas, 'class': 'm-rua' }, cidade);
    el('path', { d: avenidas, 'class': 'm-avenida' }, cidade);
    el('path', { d: 'M-600 1300L1500 -800', 'class': 'm-avenida' }, cidade);

    camada = el('g', { 'class': 'mapa-camada' }, svg);
  }

  function desenharTrajeto() {
    camada.innerHTML = '';
    linhas = etapas.map(function (e) {
      return {
        borda: el('polyline', { points: lista(e.pts), 'class': 'm-rota-borda' }, camada),
        feita: el('polyline', { points: lista(e.pts), 'class': 'm-rota-feita' }, camada),
        resta: el('polyline', { points: lista(e.pts), 'class': 'm-rota' }, camada)
      };
    });

    var d = PONTOS.delegacia;
    var refEl = el('g', { 'class': 'm-ref' }, camada);
    el('circle', { r: 11 }, refEl);
    el('text', { y: 4, 'text-anchor': 'middle' }, refEl).textContent = '★';

    // Pinos desenhados em tamanho de tela e posicionados com transform (ver enquadrar)
    pinos = [
      { p: PONTOS.casaEduarda, g: pino('<circle r="9" class="m-pino"/>') },
      { p: PONTOS.predioLorena, g: pino('<circle r="9" class="m-pino m-pino-parada"/>') },
      { p: PONTOS.faculdade, g: pino('<rect x="-9" y="-9" width="18" height="18" rx="3" class="m-pino"/>') },
      { p: PONTOS.delegacia, g: refEl }
    ];

    rotulos = {};
    // Alinhamento das etiquetas (sempre abaixo do ponto): casa cresce para a esquerda,
    // prédio para a direita e faculdade para a esquerda, para não se encostarem
    var ALINHA = { casaEduarda: 'fim', predioLorena: 'inicio', faculdade: 'fim' };
    LUGARES.forEach(function (k) { rotulos[k] = rotulo(PONTOS[k], TRAJETO[k].nome, 'escuro', ALINHA[k]); });
    rotulos.delegacia = rotulo(d, TRAJETO.delegacia.nome, 'claro');

    capivaraEl = el('g', { 'class': 'm-capivara' }, camada);
    // rodinhas apoiadas no ponto/linha, corpo acima: não cobre as etiquetas de baixo
    var corpo = el('g', { transform: 'translate(-34 -41)' }, capivaraEl);
    corpo.innerHTML = CAPIVARA;
  }

  function pino(html) {
    var g = el('g', {}, camada);
    g.innerHTML = html;
    return g;
  }

  function rotulo(p, texto, tipo, alinha) {
    var g = el('g', { 'class': 'm-rotulo m-rotulo-' + tipo }, camada);
    var r = el('rect', { rx: 6 }, g);
    var t = el('text', { 'text-anchor': 'middle' }, g);
    var obj = { g: g, r: r, t: t, p: p, texto: texto, alinha: alinha || 'centro' };
    trocarTexto(obj, texto);
    return obj;
  }

  function trocarTexto(obj, texto) {
    obj.texto = texto;
    obj.t.textContent = texto;
    posicionarRotulo(obj);
  }

  // Etiquetas, pinos e capivara mantêm o mesmo tamanho na tela, com qualquer zoom
  // Etiquetas ficam ABAIXO dos pontos (a delegacia, ao lado), para não cobrir a capivara
  function posicionarRotulo(obj) {
    var k = 1 / escala, larg = obj.texto.length * 7.4 + 18, alt = 26;
    var lateral = obj.g.classList.contains('m-rotulo-claro');
    var x = lateral ? obj.p[0] + 16 * k : obj.p[0];
    var y = lateral ? obj.p[1] - (alt / 2) * k : obj.p[1] + 15 * k;
    // posição da caixa em relação ao ponto (em pixels)
    var rx = lateral ? 0 : obj.alinha === 'fim' ? -larg + 14 : obj.alinha === 'inicio' ? -14 : -larg / 2;
    obj.g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + k + ')');
    obj.r.setAttribute('x', rx); obj.r.setAttribute('y', 0);
    obj.r.setAttribute('width', larg); obj.r.setAttribute('height', alt);
    obj.t.setAttribute('x', rx + larg / 2); obj.t.setAttribute('y', 17.5);
  }

  /* ---------- Enquadramento (como o "zoom" do app) ---------- */

  function enquadrar() {
    if (!svg) return;
    var mapaEl = $('#mapa'), W = mapaEl.clientWidth, H = mapaEl.clientHeight;
    if (!W || !H) return;
    var largo = window.innerWidth >= 760, area;
    if (largo) {
      var fw = folha.offsetWidth + 48;
      area = { x: fw, y: 24, w: Math.max(240, W - fw - 24), h: H - 48 };
    } else {
      var fh = folha.classList.contains('recolhida') ? 92 : folha.offsetHeight;
      area = { x: 12, y: 8, w: W - 24, h: Math.max(170, H - fh - 16) };
    }
    // Espaço em pixels para as etiquetas não ficarem cortadas
    area = { x: area.x + 120, y: area.y + 36, w: area.w - 120 - 24, h: area.h - 36 - 48 };
    var caixa = { x: 200, y: 200, w: 700, h: 500 }; // da casa (embaixo) até a faculdade (em cima)
    escala = Math.min(Math.max(area.w, 80) / caixa.w, Math.max(area.h, 80) / caixa.h, 1.4);
    var cx = caixa.x + caixa.w / 2, cy = caixa.y + caixa.h / 2;
    var vx = cx - (area.x + area.w / 2) / escala, vy = cy - (area.y + area.h / 2) / escala;
    svg.setAttribute('viewBox', vx + ' ' + vy + ' ' + (W / escala) + ' ' + (H / escala));
    svg.style.setProperty('--k', 1 / escala);
    pinos.forEach(function (o) {
      o.g.setAttribute('transform', 'translate(' + o.p[0] + ' ' + o.p[1] + ') scale(' + (1 / escala) + ')');
    });
    Object.keys(rotulos).forEach(function (k) { posicionarRotulo(rotulos[k]); });
    moverCapivara(posCapivara, null, true);
  }

  function moverCapivara(p, frente, imediato) {
    posCapivara = p;
    if (frente && (Math.abs(frente[0] - p[0]) + Math.abs(frente[1] - p[1]) > 0.01)) {
      var alvo = Math.atan2(frente[1] - p[1], frente[0] - p[0]) * 180 / Math.PI;
      if (angulo === null || imediato) angulo = alvo;
      else angulo += (((alvo - angulo + 540) % 360) - 180) * 0.15;
    }
    if (angulo === null) angulo = 0;
    var a = ((angulo + 540) % 360) - 180, k = 1 / escala;
    // Virando para a esquerda: espelha para a capivara não ficar de cabeça para baixo
    var sy = Math.abs(a) > 90 ? -k : k;
    capivaraEl.setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ') rotate(' + a.toFixed(1) + ') scale(' + k + ' ' + sy + ')');
  }

  function andar(i, t) {
    var e = etapas[i], atual = pontoEm(e, t), frente = pontoEm(e, Math.min(1, t + 0.02)).p;
    moverCapivara(atual.p, t < 0.995 ? frente : null);
    linhas[i].resta.setAttribute('points', t >= 1 ? '' : lista([atual.p].concat(e.pts.slice(atual.i))));
  }

  function reiniciarLinhas() {
    etapas.forEach(function (e, i) { linhas[i].resta.setAttribute('points', lista(e.pts)); });
    angulo = 0; // parada, virada para a direita
    moverCapivara(etapas[0].pts[0], null, true);
    LUGARES.forEach(function (k) { trocarTexto(rotulos[k], TRAJETO[k].nome); });
  }

  /* ---------- Painel ---------- */

  function horaChegada(min) {
    return new Date(Date.now() + min * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function kmBR(n) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }); }
  function desenharEstado(html) { estadoEl.innerHTML = html; }
  function barraHTML() { return '<div class="corrida-barra"><span id="corrida-barra"></span></div>'; }

  function botao(texto, aoClicar) {
    acoesEl.innerHTML = '<button type="button" class="corrida-botao" id="botao-principal">' + texto + '</button>';
    $('#botao-principal').addEventListener('click', aoClicar);
  }

  function telaParado() {
    fase = 'parado';
    folha.setAttribute('data-fase', fase);
    var e1 = TRAJETO.etapa1, e2 = TRAJETO.etapa2;
    desenharEstado(
      '<p class="folha-rotulo">Carona de hoje</p>' +
      '<h2 class="folha-titulo">Pronta para a carona?</h2>' +
      '<ol class="folha-paradas">' +
        LUGARES.map(function (k, i) {
          return '<li><span class="ponto ' + ['ponto-inicio', 'ponto-parada', 'ponto-fim'][i] + '"></span>' +
            '<span class="parada-texto"><strong>' + escapar(TRAJETO[k].nome) + '</strong>' +
            '<small>' + escapar(TRAJETO[k].detalhe || '') + '</small></span></li>';
        }).join('') +
      '</ol>' +
      '<p class="folha-resumo"><strong>≈ ' + (e1.minutos + e2.minutos) + ' min</strong> · ' + kmBR(e1.km + e2.km) + ' km</p>'
    );
    botao('Iniciar corrida', iniciar);
  }

  function telaEtapa(titulo, rotuloTxt) {
    folha.setAttribute('data-fase', fase);
    desenharEstado(
      '<p class="folha-rotulo">' + rotuloTxt + '</p>' +
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
    botao('Fazer de novo', iniciar);
  }

  function atualizarEta(t, minutos, destino) {
    var resta = Math.max(1, Math.ceil((1 - t) * minutos));
    var m = $('#corrida-min'), h = $('#corrida-hora'), b = $('#corrida-barra');
    if (m) m.textContent = t >= 1 ? 'Chegando' : 'Chega em ' + resta + ' min';
    if (h) h.textContent = t >= 1 ? '' : '· ' + horaChegada(resta);
    if (b) b.style.transform = 'scaleX(' + t + ')';
    var texto = TRAJETO[destino].nome + (t >= 1 ? '' : ' · ' + resta + ' min');
    if (rotulos[destino].texto !== texto) trocarTexto(rotulos[destino], texto);
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
    cancelAnimationFrame(raf);
    reiniciarLinhas();
    capivaraEl.classList.add('andando');
    expandir(true);
    mudarFase('etapa1', performance.now());
    raf = requestAnimationFrame(passo);
  }

  function passo(agora) {
    var dec = agora - inicioFase, t, b;
    if (fase === 'etapa1') {
      t = Math.min(1, dec / TEMPOS.etapa1);
      andar(0, suavizar(t));
      atualizarEta(t, TRAJETO.etapa1.minutos, 'predioLorena');
      if (t >= 1) { capivaraEl.classList.remove('andando'); mudarFase('chegou', agora); }
    } else if (fase === 'chegou') {
      t = Math.min(1, dec / TEMPOS.pausa);
      b = $('#corrida-barra'); if (b) b.style.transform = 'scaleX(' + t + ')';
      if (t >= 1) { capivaraEl.classList.add('andando'); mudarFase('etapa2', agora); }
    } else if (fase === 'etapa2') {
      t = Math.min(1, dec / TEMPOS.etapa2);
      andar(1, suavizar(t));
      atualizarEta(t, TRAJETO.etapa2.minutos, 'faculdade');
      if (t >= 1) { capivaraEl.classList.remove('andando'); telaFim(); return; }
    } else return;
    raf = requestAnimationFrame(passo);
  }

  /* ---------- Painel recolhível e botões ---------- */

  function expandir(sim) {
    folha.classList.toggle('recolhida', !sim);
    $('#folha-alca').setAttribute('aria-expanded', String(sim));
    $('#folha-alca').setAttribute('aria-label', sim ? 'Recolher painel' : 'Expandir painel');
    setTimeout(enquadrar, 380);
  }
  $('#folha-alca').addEventListener('click', function () { expandir(folha.classList.contains('recolhida')); });

  $('#botao-playlist').addEventListener('click', function () {
    if (window.TP) window.TP.toast('Eduarda não aprovou a mudança');
  });

  function montarMotorista() {
    var alvo = $('#motorista-avatar');
    var pessoas = (window.TP && window.TP.personagens) || [];
    var eduarda = pessoas.find(function (p) { return p.id === 'eduarda'; }) || { nome: 'Eduarda' };
    alvo.innerHTML = '';
    if (window.TP) alvo.appendChild(window.TP.criarFoto(eduarda, 'motorista-foto'));
  }

  window.addEventListener('resize', function () {
    if (document.body.getAttribute('data-pagina') === 'corrida') enquadrar();
  });

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
        desenharCidade();
        desenharTrajeto();
        telaParado();
        reiniciarLinhas();
      }
      requestAnimationFrame(enquadrar);
      setTimeout(enquadrar, 600); // depois que o painel termina de subir
    },
    sair: function () {}
  };
})();
