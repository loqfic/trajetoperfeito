# Trajeto Perfeito

Site de fã para **ler** a fanfic *Trajeto Perfeito*, de medvedovskyg (fandom Três Graças): Lorena Ferette (Psicologia) e Eduarda "Juquinha"/"Duda" Fragoso (Nutrição) se reencontram na faculdade em São Paulo, e Eduarda passa a dar carona para Lorena todos os dias.

Original no AO3: https://archiveofourown.org/works/88140211

## Páginas

- **Início** — título, sinopse, autora, "Começar a ler" e "Continuar de onde parei" (lembra capítulo e posição).
- **Capítulos** — índice automático com palavras e tempo de leitura.
- **Leitura** (`#capitulo-3`) — tipografia confortável, A−/A+ (14–26 px, salvo), barra de progresso, aviso +18 na primeira vez.
- **Personagens** — cartões que viram (flip 3D) e janela "Ver mais".
- **Corrida** — mapa de São Paulo em que uma capivara-carro faz o trajeto Casa da Eduarda → Prédio da Lorena → Faculdade, seguindo as ruas. Sem endereços cadastrados, os pontos são sorteados a cada visita (botão "Sortear outro trajeto").

## Como editar o conteúdo

| O quê | Onde |
| --- | --- |
| Capítulos | `capitulos.js` (instruções no topo do arquivo) |
| Personagens | `personagens.js` |
| Fotos | arquivo solto (sem pasta) com o mesmo nome do campo `foto` (ex.: `lorena.jpg`) |
| Trajeto do mapa | objeto `TRAJETO` no topo de `corrida.js` — preencha `endereco` (ex.: `'Rua Augusta, 1500, São Paulo'`) ou `coord`; vazio = ponto sorteado |
| Sinopse | seção "INÍCIO" em `index.html` |

Sem foto, a personagem aparece com um círculo com a inicial do nome.

## Tecnologias

HTML, CSS e JavaScript puro — sem build, sem backend, sem banco de dados. Visual inspirado em app de carona (preto e branco, Inter). Google Fonts (Inter; Lora só no texto dos capítulos), Leaflet com tiles gratuitos CARTO `light_all`/`dark_all`, rotas pelas ruas com o servidor público do OSRM e busca de endereços com o Nominatim (OpenStreetMap) — nenhum precisa de chave. Sem internet para a rota, o site desenha um caminho aproximado. Preferências (tema, tamanho da letra, aviso +18, progresso, endereços já encontrados) ficam no `localStorage` do navegador.

## Rodar localmente

Qualquer servidor estático serve, por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Também funciona abrindo `index.html` direto no navegador.

## Publicar

O `netlify.toml` já publica a pasta raiz (`publish = "."`). Basta conectar o repositório na Netlify ou arrastar a pasta no painel.
