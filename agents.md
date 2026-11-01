# AGENTS.md

Static fan site (pt-BR) for reading the fanfic "Trajeto Perfeito". **Plain HTML/CSS/JS — no framework, no build step, no backend, no database.** The owner explicitly asked for this; do not introduce a bundler, framework or server code.

## Structure

- `index.html` — single page with all page shells (`section.pagina[data-pagina=...]`), header/menu, modal, footer. Contains no chapter or character text (only the home synopsis).
- `capitulos.js` — `const CAPITULOS = [{ numero, titulo, texto }]`. Hand-edited by the owner; keep its format and the Portuguese instructions comment intact.
- `personagens.js` — `const PERSONAGENS = [{ id, nome, apelido, papel, descricaoCurta, descricaoLonga, foto }]`. `id: "eduarda"` is used by the Corrida page for the driver avatar.
- Character photos sit in the repo root, named as in `foto` (no folders: the owner uploads through the GitHub web UI). Missing photos fall back to an initial circle (`criarFoto` in `app.js`).
- `app.js` — home "Destinos salvos" list (one row per chapter, built in `montarDestinos`), hash router (`#inicio`, `#capitulos`, `#capitulo-N`, `#personagens`, `#corrida`), text parser (blank line = paragraph, dash lines = own paragraph, `*x*` = italic, `***` = divider), word count/reading time (200 wpm, ceil), reader prefs, characters grid + modal. Exposes `window.TP` (personagens, criarFoto, toast).
- `corrida.js` — race page. The map is a self-drawn SVG city (no Leaflet, no tiles, no external services). Fixed route `CAMINHOS` (house → Lorena, short; Lorena → campus, long) in SVG units; `TRAJETO` holds names, details and fake minutes/km; `TEMPOS` the animation durations. `enquadrar()` sets the viewBox so the route fits the area not covered by the panel; pins, labels (always below the points) and the capybara are counter-scaled to keep a constant on-screen size. Exposes `window.TPCorrida.entrar()`.
- `style.css` — all styles. Theme via `html[data-tema="claro|escuro"]` CSS variables (the Corrida page follows the theme too).

## Conventions

- Code identifiers and comments in Portuguese, matching the existing files.
- All scripts load with `defer` in order: Leaflet, capitulos, personagens, app, corrida. The first route runs on `DOMContentLoaded` so `TPCorrida` exists.
- localStorage keys: `tp-tema`, `tp-fonte`, `tp-maior-18`, `tp-progresso` (`{ numero, posicao }` where posicao is 0–1 scroll ratio), `tp-enderecos` (`{ endereco: [lat, lng] }` geocode cache). Values are JSON.
- Look: the whole site imitates a ride-hailing app (owner's request): white `#FFF`/black `#000` (dark mode: pure black), grays `#F3F3F3`/`#E2E2E2`, black buttons with 10px radius, pill chips, Inter 700–800 with tight letter-spacing. Green `#05944F` only for small status badges. Lora is kept only for prose (chapter text, synopsis, long descriptions). No real ride-hailing brand names or logos anywhere.
- `netlify.toml` publishes the repo root.

## Additions (home graphic, chapter "trip" header, map fixes)

- Home: `.inicio-arte` inline SVG behind the title (streets, rain cloud from ch. 1, route house → Lorena → campus with the "lago da Doutora", a capybara moving via `<animateMotion>`). Colors come from the theme CSS variables. On phones `.arte-historia` is scaled down and labels are hidden. Reduced motion pauses it (`pauseAnimations` in `montarInicio`).
- Chapter header `#viagem` imitates the in-trip card of a ride app: status, title, "Chega em X min · previsão HH:MM", progress bar, route (previous chapter → this chapter), stats (min, words, paragraphs), driver row with plate `CAP-NN`. `atualizarViagem(pos)` updates it on scroll. `#viagem-mini` (in index.html, outside `main`, because the animated page creates a containing block for fixed elements) appears when the header scrolls out (IntersectionObserver).
- Map: replaced by the drawn SVG map described above.

