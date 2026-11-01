/*
  ============================================================
  PERSONAGENS DE "TRAJETO PERFEITO"
  ============================================================

  COMO TROCAR A FOTO DE UMA PERSONAGEM:
  É só enviar a imagem para o GitHub (junto com os outros arquivos, sem pasta)
  com o MESMO nome que está em "foto" abaixo. Exemplo: para a Lorena, salve a
  foto como lorena.jpg — e pronto, ela aparece no site.

  - Se a foto não existir, o site mostra um círculo com a inicial do nome.
  - Quer usar .png ou .webp? Mude também o final do caminho em "foto"
    (ex.: "lorena.png").
  - Fotos quadradas ou em pé (retrato) ficam melhores.

  COMO EDITAR OU ADICIONAR PERSONAGENS:
  - descricaoCurta: aparece no verso do cartão (1 ou 2 frases curtas).
  - (Opcional) descricaoLonga: se você adicionar este campo a alguém,
    aparece o botão "Ver mais" com o texto completo.
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
    descricaoCurta: "Tímida e dedicada, sonha em ser psicopedagoga. Tem medo de chuva forte e guarda os Minions da infância.",
    foto: "lorena.jpg"
  },
  {
    id: "eduarda",
    nome: "Eduarda Fragoso",
    apelido: "Juquinha · Duda",
    papel: "Estudante de Nutrição",
    descricaoCurta: "Ruiva, falante e emocionada. A carona é dela, e a playlist também: nem pense em trocar a música.",
    foto: "eduarda.jpg"
  },
  {
    id: "maggye",
    nome: "Maggye",
    apelido: "Maggye",
    papel: "Melhor amiga da Lorena",
    descricaoCurta: "Divertida e sem filtro, nunca dispensa uma fofoca. Está do lado da amiga para o que der e vier.",
    foto: "maggye.jpg"
  },
  {
    id: "paulinho",
    nome: "Paulinho",
    apelido: "Paulinho",
    papel: "Melhor amigo da Eduarda",
    descricaoCurta: "O irmão que a vida deu à Eduarda. Trabalha na delegacia e não abre mão do barzinho de sexta.",
    foto: "paulinho.jpg"
  },
  {
    id: "gerluce",
    nome: "Gerluce",
    apelido: "Gerluce",
    papel: "Namorada do Paulinho",
    descricaoCurta: "Carinhosa e acolhedora, quase maternal. Um abraço dela e a Lorena já se sente em casa.",
    foto: "gerluce.jpg"
  },
  {
    id: "zenilda",
    nome: "Zenilda",
    apelido: "Dona Zenilda",
    papel: "Mãe da Lorena",
    descricaoCurta: "Advogada de rotina corrida e coração enorme. É a ela que a Lorena sempre avisa onde está.",
    foto: "zenilda.jpg"
  },
  {
    id: "daphne",
    nome: "Daphne",
    apelido: "Daphne",
    papel: "Amiga da Eduarda na Nutrição",
    descricaoCurta: "Organizada e detalhista, confere cada medida duas vezes. O oposto perfeito da Eduarda.",
    foto: "daphne.jpg"
  },
  {
    id: "doutora",
    nome: "Doutora",
    apelido: "A capivara da faculdade",
    papel: "A capivara da faculdade",
    descricaoCurta: "Mora no lago de Biológicas e aparece onde quer. Já interrompeu prova e roubou o sanduíche de um veterano.",
    foto: "doutora.jpg"
  },
];
