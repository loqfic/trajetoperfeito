# Trajeto Perfeito

Site de fã para **ler** a fanfic *Trajeto Perfeito*, de medvedovskyg (fandom Três Graças): Lorena Ferette (Psicologia) e Eduarda "Juquinha"/"Duda" Fragoso (Nutrição) se reencontram na faculdade em São Paulo, e Eduarda passa a dar carona para Lorena todos os dias.

Original no AO3: https://archiveofourown.org/works/88140211

## Páginas

- **Início** — título, sinopse, autora, "Começar a ler" e "Continuar de onde parei" (lembra capítulo e posição).
- **Capítulos** — índice automático com palavras e tempo de leitura.
- **Leitura** (`#capitulo-3`) — tipografia confortável, A−/A+ (14–26 px, salvo), barra de progresso, aviso +18 na primeira vez.
- **Personagens** — cartões que viram (flip 3D) e janela "Ver mais".
- **Corrida** — mapa ilustrado em que uma capivara-carro faz sempre o mesmo trajeto: Casa da Eduarda → Prédio da Lorena (pertinho) → Faculdade.

## Como editar o conteúdo

| O quê | Onde |
| --- | --- |
| Capítulos | `capitulos.js` (instruções no topo do arquivo) |
| Personagens | `personagens.js` |
| Fotos | arquivo solto (sem pasta) com o mesmo nome do campo `foto` (ex.: `lorena.jpg`) |
| Nomes, frases e tempos da corrida | objetos `TRAJETO` e `TEMPOS` no topo de `corrida.js` |
| Sinopse | seção "INÍCIO" em `index.html` |

Sem foto, a personagem aparece com um círculo com a inicial do nome.

## Tecnologias

HTML, CSS e JavaScript puro — sem build, sem backend, sem banco de dados. Visual inspirado em app de carona (preto e branco, Inter). Google Fonts (Inter; Lora só no texto dos capítulos). O mapa da Corrida é um desenho feito no próprio código (sem serviço externo, sem chave de API). Preferências (tema, tamanho da letra, aviso +18, progresso) ficam no `localStorage` do navegador.

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
