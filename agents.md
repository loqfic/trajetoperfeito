# AGENTS.md

Static fan site (pt-BR) for reading the fanfic "Trajeto Perfeito". **Plain HTML/CSS/JS — no framework, no build step, no backend, no database.** The owner explicitly asked for this; do not introduce a bundler, framework or server code.

## Structure

- `index.html` — single page with all page shells (`section.pagina[data-pagina=...]`), header/menu, modal, footer. Contains no chapter or character text (only the home synopsis).
- `capitulos.js` — `const CAPITULOS = [{ numero, titulo, texto }]`. Hand-edited by the owner; keep its format and the Portuguese instructions comment intact.
- `personagens.js` — `const PERSONAGENS = [{ id, nome, apelido, papel, descricaoCurta, descricaoLonga, foto }]`. `id: "eduarda"` is used by the Corrida page for the driver avatar.
- `img/` — character photos, named as in `foto`. Missing photos fall back to an initial circle (`criarFoto` in `js/app.js`).
- `js/app.js` — home "Destinos salvos" list (one row per chapter, built in `montarDestinos`), hash router (`#inicio`, `#capitulos`, `#capitulo-N`, `#personagens`, `#corrida`), text parser (blank line = paragraph, dash lines = own paragraph, `*x*` = italic, `***` = divider), word count/reading time (200 wpm, ceil), reader prefs, characters grid + modal. Exposes `window.TP` (personagens, criarFoto, toast).
- `js/corrida.js` — Leaflet map + capybara animation. `TRAJETO` (each place: `coord` > `endereco` > random point inside `sorteio`) and `TEMPOS` (durations) at top are meant to be edited. Addresses are geocoded with Nominatim (sequential, ≤1 req/s, cached in localStorage); the street route comes from the public OSRM demo server (one request, legs split from steps), with a made-up block-style path as fallback. Tiles: CARTO `light_all`/`dark_all` following the site theme. Exposes `window.TPCorrida.entrar()` called by the router.
- `css/style.css` — all styles. Theme via `html[data-tema="claro|escuro"]` CSS variables (the Corrida page follows the theme too).

## Conventions

- Code identifiers and comments in Portuguese, matching the existing files.
- All scripts load with `defer` in order: Leaflet, capitulos, personagens, app, corrida. The first route runs on `DOMContentLoaded` so `TPCorrida` exists.
- localStorage keys: `tp-tema`, `tp-fonte`, `tp-maior-18`, `tp-progresso` (`{ numero, posicao }` where posicao is 0–1 scroll ratio), `tp-enderecos` (`{ endereco: [lat, lng] }` geocode cache). Values are JSON.
- Look: the whole site imitates a ride-hailing app (owner's request): white `#FFF`/black `#000` (dark mode: pure black), grays `#F3F3F3`/`#E2E2E2`, black buttons with 10px radius, pill chips, Inter 700–800 with tight letter-spacing. Green `#05944F` only for small status badges. Lora is kept only for prose (chapter text, synopsis, long descriptions). No real ride-hailing brand names or logos anywhere.
- `netlify.toml` publishes the repo root.

## Additions (home graphic, chapter "trip" header, map fixes)

- Home: `.inicio-arte` inline SVG behind the title (streets, rain cloud from ch. 1, route house → Lorena → campus with the "lago da Doutora", a capybara moving via `<animateMotion>`). Colors come from the theme CSS variables. On phones `.arte-historia` is scaled down and labels are hidden. Reduced motion pauses it (`pauseAnimations` in `montarInicio`).
- Chapter header `#viagem` imitates the in-trip card of a ride app: status, title, "Chega em X min · previsão HH:MM", progress bar, route (previous chapter → this chapter), stats (min, words, paragraphs), driver row with plate `CAP-NN`. `atualizarViagem(pos)` updates it on scroll. `#viagem-mini` (in index.html, outside `main`, because the animated page creates a containing block for fixed elements) appears when the header scrolls out (IntersectionObserver).
- Map: default fixed coordinates in `TRAJETO` (Eduarda and Lorena live near the same police station, campus farther), optional `delegacia` reference pin, `detalhe` text per stop. Leaflet loads from unpkg with a jsDelivr fallback; `entrar()` waits up to ~10 s for `L`. CARTO tiles fall back to OSM tiles after repeated errors. A ResizeObserver keeps `invalidateSize()` in sync.

