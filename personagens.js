/*
  ============================================================
  PERSONAGENS DE "TRAJETO PERFEITO"
  ============================================================

  COMO TROCAR A FOTO DE UMA PERSONAGEM:
  É só colocar a imagem dentro da pasta "img" com o MESMO nome que está
  em "foto" abaixo. Exemplo: para a Lorena, salve a foto como
  img/lorena.jpg — e pronto, ela aparece no site.

  - Se a foto não existir, o site mostra um círculo com a inicial do nome.
  - Quer usar .png ou .webp? Mude também o final do caminho em "foto"
    (ex.: "img/lorena.png").
  - Fotos quadradas ou em pé (retrato) ficam melhores.

  COMO EDITAR OU ADICIONAR PERSONAGENS:
  - Troque os textos "[editar]" pelas descrições.
  - descricaoCurta: aparece no verso do cartão (1 ou 2 frases).
  - descricaoLonga: aparece na janela "Ver mais". Pode ter vários
    parágrafos: deixe uma linha em branco entre eles.
  - Para adicionar alguém, copie um bloco "{ ... }," inteiro e cole
    antes do "];" no fim do arquivo.
  - Não mude o "id" da Eduarda: a página Corrida usa ele para achar a
    foto da motorista.
  ============================================================
*/

const PERSONAGENS = [
  {
    id: "lorena",
    nome: "Lorena Ferette",
    apelido: "Lorena",
    papel: "Estudante de Psicologia",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/lorena.jpg"
  },
  {
    id: "eduarda",
    nome: "Eduarda Fragoso",
    apelido: "Juquinha · Duda",
    papel: "Estudante de Nutrição",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/eduarda.jpg"
  },
  {
    id: "maggye",
    nome: "Maggye",
    apelido: "Maggye",
    papel: "Melhor amiga da Lorena",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/maggye.jpg"
  },
  {
    id: "paulinho",
    nome: "Paulinho",
    apelido: "Paulinho",
    papel: "O irmão que a vida deu à Eduarda",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/paulinho.jpg"
  },
  {
    id: "gerluce",
    nome: "Gerluce",
    apelido: "Gerluce",
    papel: "Amiga da Eduarda",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/gerluce.jpg"
  },
  {
    id: "zenilda",
    nome: "Zenilda",
    apelido: "Dona Zenilda",
    papel: "Mãe da Lorena",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/zenilda.jpg"
  },
  {
    id: "daphne",
    nome: "Daphne",
    apelido: "Daphne",
    papel: "Amiga da Eduarda na Nutrição",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/daphne.jpg"
  },
  {
    id: "doutora",
    nome: "Doutora",
    apelido: "A capivara da faculdade",
    papel: "Mora no lago perto do prédio de Biológicas",
    descricaoCurta: "[editar]",
    descricaoLonga: `[editar]`,
    foto: "img/doutora.jpg"
  },
];
