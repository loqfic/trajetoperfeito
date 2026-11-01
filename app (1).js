/*
  Trajeto Perfeito — lógica do site.
  O conteúdo vem de capitulos.js e personagens.js; este arquivo só monta as páginas.
*/
(function () {
  'use strict';

  var PALAVRAS_POR_MINUTO = 200;
  var FONTE_MIN = 14, FONTE_MAX = 26, FONTE_PASSO = 2, FONTE_PADRAO = 18;
  var CHAVES = { tema: 'tp-tema', fonte: 'tp-fonte', idade: 'tp-maior-18', progresso: 'tp-progresso' };

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var guardar = {
    ler: function (k, padrao) {
      try { var v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; }
    },
    salvar: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- Dados ---------- */

  var capitulos = (typeof CAPITULOS !== 'undefined' && Array.isArray(CAPITULOS) ? CAPITULOS : [])
    .filter(function (c) { return c && c.texto != null; })
    .map(function (c) {
      var palavras = contarPalavras(c.texto);
      return {
        numero: Number(c.numero),
        titulo: String(c.titulo || ('Capítulo ' + c.numero)),
        texto: String(c.texto),
        palavras: palavras,
        minutos: Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO))
      };
    })
    .sort(function (a, b) { return a.numero - b.numero; });

  var personagens = (typeof PERSONAGENS !== 'undefined' && Array.isArray(PERSONAGENS) ? PERSONAGENS : [])
    .filter(Boolean);

  /* ---------- Texto ---------- */

  function contarPalavras(texto) {
    var m = String(texto).match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
    return m ? m.length : 0;
  }

  function numeroBR(n) { return Number(n).toLocaleString('pt-BR'); }

  function metaCapitulo(c) {
    return '≈ ' + c.minutos + ' min de leitura · ' + numeroBR(c.palavras) + (c.palavras === 1 ? ' palavra' : ' palavras');
  }

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatarLinha(s) {
    return escapar(s)
      .replace(/\*\*(?=\S)([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(?=\S)([^*\n]+?)\*/g, '<em>$1</em>');
  }

  var ehDivisor = function (l) { return /^(\*\s*){3,}$/.test(l) || /^\[(\.{3}|…)\]$/.test(l); };
  var ehFala = function (l) { return /^[—–]/.test(l) || /^-\s/.test(l); };

  // Linha em branco = novo parágrafo; cada fala com travessão também vira parágrafo.
  function textoParaHTML(texto) {
    var linhas = String(texto).replace(/\r\n?/g, '\n').split('\n');
    var html = [], atual = [], anteriorFala = false;
    function fechar() {
      if (atual.length) html.push('<p>' + atual.map(formatarLinha).join('<br>') + '</p>');
      atual = [];
    }
    linhas.forEach(function (bruta) {
      var l = bruta.trim();
      if (!l) { fechar(); anteriorFala = false; return; }
      if (ehDivisor(l)) {
        fechar();
        html.push('<div class="divisor" role="separator"><span aria-hidden="true">✦</span></div>');
        anteriorFala = false;
        return;
      }
      var fala = ehFala(l);
      if (atual.length && (fala || anteriorFala)) fechar();
      atual.push(l);
      anteriorFala = fala;
    });
    fechar();
    return html.join('\n');
  }

  /* ---------- Fotos (com inicial quando não há imagem) ---------- */

  function criarFoto(p, classe) {
    var caixa = document.createElement('div');
    caixa.className = 'foto' + (classe ? ' ' + classe : '');
    var inicial = document.createElement('span');
    inicial.className = 'foto-inicial';
    inicial.setAttribute('aria-hidden', 'true');
    inicial.textContent = String(p.nome || '?').trim().charAt(0).toUpperCase();
    caixa.appendChild(inicial);
    if (p.foto) {
      var img = new Image();
      img.alt = p.nome || '';
      img.decoding = 'async';
      img.onload = function () { caixa.classList.add('tem-foto'); };
      img.onerror = function () { img.remove(); };
      img.src = p.foto;
      caixa.appendChild(img);
    }
    return caixa;
  }

  /* ---------- Aviso rápido ---------- */

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('visivel'); }, 2600);
  }

  /* ---------- Tema ---------- */

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-tema', t);
    $('#botao-tema').setAttribute('aria-label', t === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro');
  }
  aplicarTema(document.documentElement.getAttribute('data-tema') || 'claro');
  $('#botao-tema').addEventListener('click', function () {
    var novo = document.documentElement.getAttribute('data-tema') === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    guardar.salvar(CHAVES.tema, novo);
  });

  /* ---------- Menu hambúrguer ---------- */

  var botaoMenu = $('#botao-menu'), menu = $('#menu');
  function abrirMenu(abrir) {
    menu.classList.toggle('aberto', abrir);
    document.body.classList.toggle('menu-aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    botaoMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!menu.classList.contains('aberto')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });

  /* ---------- Início ---------- */

  function montarInicio() {
    var arte = $('#arte-svg');
    if (arte && arte.pauseAnimations && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) arte.pauseAnimations();

    var total = capitulos.reduce(function (s, c) { return s + c.palavras; }, 0);
    var min = Math.max(1, Math.ceil(total / PALAVRAS_POR_MINUTO));
    $('#inicio-numeros').textContent = capitulos.length
      ? capitulos.length + (capitulos.length === 1 ? ' capítulo' : ' capítulos') + ' · ' + numeroBR(total) + ' palavras · ≈ ' + min + ' min'
      : 'Nenhum capítulo publicado ainda';
    if (capitulos.length) $('#botao-comecar').setAttribute('href', '#capitulo-' + capitulos[0].numero);

    var p = guardar.ler(CHAVES.progresso, null);
    var cap = p && capitulos.find(function (c) { return c.numero === p.numero; });
    var botao = $('#botao-continuar');
    botao.disabled = !cap;
    $('#continuar-detalhe').textContent = cap
      ? 'Capítulo ' + cap.numero + (cap.titulo !== 'Capítulo ' + cap.numero ? ' · ' + cap.titulo : '') + ' · ' + Math.round((p.posicao || 0) * 100) + '%'
      : 'Nenhuma leitura salva ainda';

    montarDestinos(cap);
  }

  // Cada capítulo aparece como um "destino salvo", igual aos lugares favoritos do app
  var ICONE_DESTINO = '<svg viewBox="0 0 24 24"><path d="M12 3.5 14.6 8.8l5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor"/></svg>';
  var ICONE_LENDO = '<svg viewBox="0 0 24 24"><path d="M12 2.5a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>';

  function montarDestinos(lendo) {
    var lista = $('#destinos');
    if (!capitulos.length) {
      lista.innerHTML = '<li class="vazio">Nenhum destino salvo ainda. Adicione capítulos em <code>capitulos.js</code>.</li>';
      return;
    }
    lista.innerHTML = capitulos.map(function (c) {
      var atual = lendo && lendo.numero === c.numero;
      var mostrarTitulo = c.titulo !== 'Capítulo ' + c.numero;
      return '<li><a class="linha-recente destino' + (atual ? ' lendo' : '') + '" href="#capitulo-' + c.numero + '">' +
        '<span class="linha-icone" aria-hidden="true">' + (atual ? ICONE_LENDO : ICONE_DESTINO) + '</span>' +
        '<span class="linha-corpo">' +
          '<span>' + escapar(mostrarTitulo ? c.titulo : 'Capítulo ' + c.numero) + (atual ? ' <span class="selo">lendo agora</span>' : '') + '</span>' +
          '<small>' + (mostrarTitulo ? 'Capítulo ' + c.numero + ' · ' : '') + metaCapitulo(c) + '</small>' +
        '</span>' +
        '<span class="linha-seta" aria-hidden="true">›</span>' +
      '</a></li>';
    }).join('');
  }

  $('#botao-continuar').addEventListener('click', function () {
    var p = guardar.ler(CHAVES.progresso, null);
    if (!p) return;
    retomar = p.posicao || 0;
    navegar('#capitulo-' + p.numero);
  });

  /* ---------- Índice ---------- */

  function montarIndice() {
    var lista = $('#lista-capitulos');
    var total = capitulos.reduce(function (s, c) { return s + c.palavras; }, 0);
    $('#indice-resumo').textContent = capitulos.length
      ? capitulos.length + (capitulos.length === 1 ? ' capítulo' : ' capítulos') + ' · ' + numeroBR(total) + ' palavras no total'
      : '';
    var p = guardar.ler(CHAVES.progresso, null);
    if (!capitulos.length) {
      lista.innerHTML = '<li class="vazio">Ainda não há capítulos. Adicione o primeiro em <code>capitulos.js</code>.</li>';
      return;
    }
    lista.innerHTML = capitulos.map(function (c) {
      var lendo = p && p.numero === c.numero;
      var mostrarTitulo = c.titulo !== 'Capítulo ' + c.numero;
      return '<li><a class="item-capitulo' + (lendo ? ' lendo' : '') + '" href="#capitulo-' + c.numero + '">' +
        '<span class="item-numero">' + c.numero + '</span>' +
        '<span class="item-corpo">' +
          '<span class="item-titulo">' + escapar(mostrarTitulo ? c.titulo : 'Capítulo ' + c.numero) + '</span>' +
          '<span class="item-meta">' + metaCapitulo(c) + (lendo ? ' <span class="selo">lendo agora</span>' : '') + '</span>' +
        '</span>' +
        '<span class="item-seta" aria-hidden="true">›</span>' +
      '</a></li>';
    }).join('');
  }

  /* ---------- Leitura ---------- */

  var retomar = null;        // posição (0–1) a restaurar ao abrir capítulo
  var capituloAtual = null;
  var salvarTimer;

  function fonteAtual() { return guardar.ler(CHAVES.fonte, FONTE_PADRAO); }

  function aplicarFonte(px) {
    document.documentElement.style.setProperty('--fonte-leitura', px + 'px');
    var menos = $('#fonte-menos'), mais = $('#fonte-mais');
    if (menos) menos.disabled = px <= FONTE_MIN;
    if (mais) mais.disabled = px >= FONTE_MAX;
  }

  function posicaoLeitura() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function irPara(posicao) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * posicao));
  }

  function mostrarCapitulo(numero) {
    var alvo = $('#leitura');
    var i = capitulos.findIndex(function (c) { return c.numero === numero; });
    var c = capitulos[i];
    capituloAtual = null;

    if (!c) {
      alvo.innerHTML = '<div class="largura nao-encontrado"><h1>Capítulo não encontrado</h1>' +
        '<p>Esse capítulo ainda não existe.</p><a class="botao botao-primario" href="#capitulos">Ver índice</a></div>';
      return;
    }

    if (!guardar.ler(CHAVES.idade, false)) {
      alvo.innerHTML =
        '<div class="aviso-idade" role="alertdialog" aria-labelledby="aviso-titulo" aria-describedby="aviso-texto">' +
          '<span class="aviso-selo" aria-hidden="true">+18</span>' +
          '<h1 id="aviso-titulo">Aviso de conteúdo</h1>' +
          '<p id="aviso-texto">Esta história contém conteúdo adulto e é indicada apenas para maiores de 18 anos.</p>' +
          '<button class="botao botao-primario" id="aceitar-idade" type="button">Tenho 18 anos ou mais, continuar</button>' +
          '<a class="botao botao-texto" href="#inicio">Voltar ao início</a>' +
        '</div>';
      $('#aceitar-idade').addEventListener('click', function () {
        guardar.salvar(CHAVES.idade, true);
        mostrarCapitulo(numero);
        window.scrollTo(0, 0);
      });
      $('#aceitar-idade').focus({ preventScroll: true });
      return;
    }

    var ant = capitulos[i - 1], prox = capitulos[i + 1];
    var mostrarTitulo = c.titulo !== 'Capítulo ' + c.numero;

    var corpoHTML = textoParaHTML(c.texto);
    var paragrafos = (corpoHTML.match(/<p>/g) || []).length;
    var nomeDestino = mostrarTitulo ? c.titulo : 'Capítulo ' + c.numero;
    var partida = ant
      ? { rotulo: 'Partida', texto: 'Capítulo ' + ant.numero + (ant.titulo !== 'Capítulo ' + ant.numero ? ' · ' + ant.titulo : '') }
      : { rotulo: 'Partida', texto: 'Início da história' };
    var placa = 'CAP-' + (c.numero < 10 ? '0' : '') + c.numero;

    alvo.innerHTML =
      '<article class="capitulo">' +
        // Cabeçalho no formato de "corrida em andamento"
        '<header class="capitulo-cabecalho viagem" id="viagem">' +
          '<nav class="viagem-nav" aria-label="Navegação do capítulo">' +
            '<a class="viagem-voltar" href="#capitulos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Capítulos</a>' +
            (prox ? '<a class="viagem-proximo" href="#capitulo-' + prox.numero + '" aria-label="Próximo capítulo: ' + escapar(prox.titulo) + '">Próximo<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'
                  : '<span class="viagem-proximo desativado" aria-disabled="true">Último</span>') +
          '</nav>' +
          '<div class="viagem-topo">' +
            '<span class="viagem-status"><span class="viagem-ponto" aria-hidden="true"></span>Em viagem · Capítulo ' + c.numero + ' de ' + capitulos.length + '</span>' +
          '</div>' +
          '<h1 class="capitulo-titulo">' + escapar(nomeDestino) + '</h1>' +
          '<p class="viagem-eta"><strong id="viagem-restante">Chega em ' + c.minutos + ' min</strong> <span id="viagem-hora"></span></p>' +
          '<div class="viagem-barra" aria-hidden="true"><span id="viagem-barra"></span></div>' +
          '<ol class="viagem-rota">' +
            '<li><span class="viagem-marca viagem-marca-inicio" aria-hidden="true"></span><span><small>' + partida.rotulo + '</small>' + escapar(partida.texto) + '</span></li>' +
            '<li><span class="viagem-marca viagem-marca-fim" aria-hidden="true"></span><span><small>Destino</small>' + escapar(nomeDestino) + '</span></li>' +
          '</ol>' +
          '<ul class="viagem-dados">' +
            '<li><strong>≈ ' + c.minutos + ' min</strong><small>de leitura</small></li>' +
            '<li><strong>' + numeroBR(c.palavras) + '</strong><small>' + (c.palavras === 1 ? 'palavra' : 'palavras') + '</small></li>' +
            '<li><strong>' + numeroBR(paragrafos) + '</strong><small>parágrafos</small></li>' +
          '</ul>' +
          '<div class="viagem-motorista">' +
            '<span class="viagem-avatar" id="viagem-avatar"></span>' +
            '<span class="viagem-motorista-info"><strong>Eduarda Fragoso</strong><small>★ 5,0 · Carro-capivara</small></span>' +
            '<span class="viagem-placa">' + placa + '</span>' +
          '</div>' +
        '</header>' +
        // Tamanho da letra: logo abaixo do cartão, no canto direito
        '<div class="capitulo-ferramentas">' +
          '<div class="ajuste-fonte" role="group" aria-label="Tamanho da letra">' +
            '<span class="ajuste-fonte-rotulo" aria-hidden="true">Tamanho da letra</span>' +
            '<button type="button" id="fonte-menos" aria-label="Diminuir letra">A−</button>' +
            '<button type="button" id="fonte-mais" aria-label="Aumentar letra">A+</button>' +
          '</div>' +
        '</div>' +
        '<div class="texto">' + corpoHTML + '</div>' +
        '<p class="capitulo-fim" aria-hidden="true">❦</p>' +
        '<nav class="capitulo-nav" aria-label="Navegação entre capítulos">' +
          (ant ? '<a class="botao botao-secundario" href="#capitulo-' + ant.numero + '">‹ Anterior</a>'
               : '<span class="botao botao-secundario desativado" aria-disabled="true">‹ Anterior</span>') +
          '<a class="botao botao-secundario" href="#capitulos">Índice</a>' +
          (prox ? '<a class="botao botao-primario" href="#capitulo-' + prox.numero + '">Próximo ›</a>'
                : '<span class="botao botao-primario desativado" aria-disabled="true">Próximo ›</span>') +
        '</nav>' +
      '</article>';

    aplicarFonte(fonteAtual());
    $('#fonte-menos').addEventListener('click', function () { mudarFonte(-FONTE_PASSO); });
    $('#fonte-mais').addEventListener('click', function () { mudarFonte(FONTE_PASSO); });

    var eduarda = personagens.find(function (p) { return p.id === 'eduarda'; }) || { nome: 'Eduarda' };
    $('#viagem-avatar').appendChild(criarFoto(eduarda, 'viagem-foto'));
    $('#viagem-mini').innerHTML =
      '<span class="viagem-ponto"></span><span class="viagem-mini-texto">Cap. ' + c.numero + ' · <strong id="viagem-mini-restante">' + c.minutos + ' min</strong></span>' +
      '<span class="viagem-mini-barra"><span id="viagem-mini-barra"></span></span>';
    $('#viagem-mini').classList.remove('visivel');
    vigiarCabecalho();

    capituloAtual = c;
    atualizarViagem(0);
    var pos = retomar;
    retomar = null;
    if (pos != null) {
      requestAnimationFrame(function () { irPara(pos); atualizarProgresso(); });
    } else {
      guardar.salvar(CHAVES.progresso, { numero: c.numero, posicao: 0 });
    }
  }


  /* ---------- Cabeçalho "em viagem" ---------- */

  function horaBR(min) {
    return new Date(Date.now() + min * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Atualiza o tempo que falta, a hora prevista de chegada e as barrinhas
  function atualizarViagem(pos) {
    if (!capituloAtual) return;
    var falta = Math.ceil((1 - pos) * capituloAtual.minutos);
    var chegou = pos >= 0.985;
    var r = $('#viagem-restante'), h = $('#viagem-hora'), b = $('#viagem-barra');
    var mr = $('#viagem-mini-restante'), mb = $('#viagem-mini-barra');
    if (r) r.textContent = chegou ? 'Você chegou ao fim do capítulo' : 'Chega em ' + Math.max(1, falta) + ' min';
    if (h) h.textContent = chegou ? '' : '· previsão ' + horaBR(Math.max(1, falta));
    if (b) b.style.transform = 'scaleX(' + Math.max(0.02, pos) + ')';
    if (mr) mr.textContent = chegou ? 'chegou' : 'faltam ' + Math.max(1, falta) + ' min';
    if (mb) mb.style.transform = 'scaleX(' + pos + ')';
  }

  // Mostra a barrinha fixa quando o cabeçalho sai da tela
  var observadorViagem = null;
  function vigiarCabecalho() {
    if (observadorViagem) observadorViagem.disconnect();
    var cab = $('#viagem'), mini = $('#viagem-mini');
    if (!cab || !mini || typeof IntersectionObserver === 'undefined') return;
    observadorViagem = new IntersectionObserver(function (itens) {
      mini.classList.toggle('visivel', !itens[0].isIntersecting && itens[0].boundingClientRect.top < 0);
    });
    observadorViagem.observe(cab);
  }

  // A previsão de chegada acompanha o relógio
  setInterval(function () { if (capituloAtual) atualizarViagem(posicaoLeitura()); }, 30000);

  function mudarFonte(delta) {
    var pos = posicaoLeitura();
    var px = Math.min(FONTE_MAX, Math.max(FONTE_MIN, fonteAtual() + delta));
    guardar.salvar(CHAVES.fonte, px);
    aplicarFonte(px);
    irPara(pos);
  }

  var barra = $('#progresso-leitura span');
  var agendado = false;
  function atualizarProgresso() {
    agendado = false;
    if (!capituloAtual) return;
    var pos = posicaoLeitura();
    barra.style.transform = 'scaleX(' + pos + ')';
    atualizarViagem(pos);
    clearTimeout(salvarTimer);
    var numero = capituloAtual.numero;
    salvarTimer = setTimeout(function () {
      guardar.salvar(CHAVES.progresso, { numero: numero, posicao: Math.round(pos * 1000) / 1000 });
    }, 250);
  }
  window.addEventListener('scroll', function () {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizarProgresso); }
  }, { passive: true });
  window.addEventListener('resize', function () { if (capituloAtual) atualizarProgresso(); });

  /* ---------- Personagens ---------- */

  function montarPersonagens() {
    var grade = $('#grade-personagens');
    grade.innerHTML = '';
    personagens.forEach(function (p, i) {
      var cartao = document.createElement('div');
      cartao.className = 'cartao';
      cartao.style.setProperty('--atraso', (i * 50) + 'ms');

      var giro = document.createElement('div');
      giro.className = 'cartao-giro';
      giro.setAttribute('role', 'button');
      giro.setAttribute('tabindex', '0');
      giro.setAttribute('aria-pressed', 'false');
      giro.setAttribute('aria-label', (p.nome || '') + ' — virar cartão');

      var frente = document.createElement('div');
      frente.className = 'cartao-face cartao-frente';
      frente.appendChild(criarFoto(p, 'cartao-foto'));
      frente.insertAdjacentHTML('beforeend',
        '<div class="cartao-legenda">' +
          (p.apelido ? '<span class="cartao-apelido">' + escapar(p.apelido) + '</span>' : '') +
          '<strong class="cartao-nome">' + escapar(p.nome || '') + '</strong>' +
          '<span class="cartao-papel">' + escapar(p.papel || '') + '</span>' +
        '</div>');

      var verso = document.createElement('div');
      verso.className = 'cartao-face cartao-verso';
      verso.innerHTML =
        '<strong class="cartao-nome">' + escapar(p.nome || '') + '</strong>' +
        '<span class="cartao-papel">' + escapar(p.papel || '') + '</span>' +
        '<p class="cartao-curta">' + formatarLinha(p.descricaoCurta || '') + '</p>' +
        (p.descricaoLonga ? '<button type="button" class="botao botao-primario botao-pequeno">Ver mais</button>' : '');

      giro.appendChild(frente);
      giro.appendChild(verso);
      cartao.appendChild(giro);
      grade.appendChild(cartao);

      function virar() {
        var virado = giro.classList.toggle('virado');
        giro.setAttribute('aria-pressed', String(virado));
      }
      giro.addEventListener('click', virar);
      giro.addEventListener('keydown', function (e) {
        if (e.target === giro && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); virar(); }
      });
      var verMais = $('button', verso);
      if (verMais) {
        verMais.addEventListener('click', function (e) {
          e.stopPropagation();
          abrirModal(p, giro);
        });
        verMais.addEventListener('keydown', function (e) { e.stopPropagation(); });
      }
    });
  }

  /* ---------- Modal ---------- */

  var modal = $('#modal'), origemModal = null;

  function abrirModal(p, origem) {
    origemModal = origem;
    var foto = $('#modal-foto');
    foto.innerHTML = '';
    foto.appendChild(criarFoto(p, 'modal-imagem'));
    $('#modal-apelido').textContent = p.apelido || '';
    $('#modal-nome').textContent = p.nome || '';
    $('#modal-papel').textContent = p.papel || '';
    $('#modal-texto').innerHTML = textoParaHTML(p.descricaoLonga || '');
    modal.hidden = false;
    document.body.classList.add('sem-rolagem');
    requestAnimationFrame(function () { modal.classList.add('aberto'); $('.modal-x', modal).focus(); });
  }

  function fecharModal() {
    if (modal.hidden) return;
    modal.classList.remove('aberto');
    document.body.classList.remove('sem-rolagem');
    setTimeout(function () { modal.hidden = true; }, 220);
    if (origemModal) origemModal.focus({ preventScroll: true });
  }

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-fechar]')) fecharModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) fecharModal();
      else if (menu.classList.contains('aberto')) abrirMenu(false);
    }
  });

  /* ---------- Rotas (#inicio, #capitulos, #capitulo-3, #personagens, #corrida) ---------- */

  var paginaAtual = null;

  function navegar(hash) {
    if (location.hash === hash) rota();
    else location.hash = hash;
  }

  function mostrarPagina(nome, menuAtivo) {
    $$('.pagina').forEach(function (s) { s.classList.toggle('ativa', s.getAttribute('data-pagina') === nome); });
    $$('[data-rota]', menu).forEach(function (a) {
      if (a.getAttribute('data-rota') === menuAtivo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-pagina', nome);
    if (paginaAtual === 'corrida' && nome !== 'corrida' && window.TPCorrida) window.TPCorrida.sair();
    paginaAtual = nome;
  }

  function rota() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'inicio';
    var m = h.match(/^capitulo-(\d+)$/);
    capituloAtual = null;
    barra.style.transform = 'scaleX(0)';

    if (m) {
      mostrarPagina('leitura', 'capitulos');
      var temRetomada = retomar != null;
      mostrarCapitulo(Number(m[1]));
      if (!temRetomada) window.scrollTo(0, 0);
      document.title = (capituloAtual ? 'Capítulo ' + capituloAtual.numero + ' · ' : '') + 'Trajeto Perfeito';
      return;
    }

    window.scrollTo(0, 0);
    if (h === 'capitulos') { montarIndice(); mostrarPagina('capitulos', 'capitulos'); document.title = 'Capítulos · Trajeto Perfeito'; }
    else if (h === 'personagens') { mostrarPagina('personagens', 'personagens'); document.title = 'Personagens · Trajeto Perfeito'; }
    else if (h === 'corrida') {
      mostrarPagina('corrida', 'corrida');
      document.title = 'Corrida · Trajeto Perfeito';
      if (window.TPCorrida) window.TPCorrida.entrar();
    }
    else { montarInicio(); mostrarPagina('inicio', 'inicio'); document.title = 'Trajeto Perfeito'; }
  }

  // Ferramentas compartilhadas com corrida.js
  window.TP = { personagens: personagens, criarFoto: criarFoto, toast: toast };

  montarPersonagens();
  window.addEventListener('hashchange', rota);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  // Scripts "defer" rodam antes do DOMContentLoaded: espera corrida.js registrar-se
  if (document.readyState === 'complete') rota();
  else document.addEventListener('DOMContentLoaded', rota);
})();
