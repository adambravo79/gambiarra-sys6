// scripts/archetypes.js — v0.7.0b
// Galeria de Arquétipos do Nó (10 fixos) — identidade + onboarding
// + itemInicial: item sugerido inicial (do compêndio de Itens do Nó)

export const ARCHETYPES = [
  {
    key: "atleta",
    nome: "A Atleta",
    icon: "🏃‍♀️",
    attrs: { corpo: 4, mente: 1, coracao: 1 },
    descricao: "Supera os limites do corpo: corre, salta e vai além do possível.",
    comoAjuda: "Ganha tempo pro grupo: resgata, alcança, atravessa e segura o risco físico.",
    quandoBrilha: "Fugas, saltos, escaladas, manobras rápidas, perigo imediato.",
    poderSugerido: "Pulo de Glitch",
    itemInicial: "Pulseira de Modo Alternativo",
    tagline: "“Alcança. Confia.”",
  },
  {
    key: "genio",
    nome: "A Gênio",
    icon: "🧠",
    attrs: { corpo: 1, mente: 4, coracao: 1 },
    descricao: "Muito boa com problemas, lógica e quebra-cabeças.",
    comoAjuda: "Encontra padrões, cria planos simples e resolve o que parece impossível de entender.",
    quandoBrilha: "Enigmas, tecnologia, estratégia, pistas confusas, decisões difíceis.",
    poderSugerido: "Salto Lógico",
    itemInicial: "Terminal Fantasma",
    tagline: "“Espera… eu saquei!”",
  },
  {
    key: "lider",
    nome: "O Líder",
    icon: "📣",
    attrs: { corpo: 1, mente: 1, coracao: 4 },
    descricao: "Une o grupo e inspira coragem quando tudo parece difícil.",
    comoAjuda: "Dá direção, junta o time, decide sob pressão e transforma medo em ação.",
    quandoBrilha: "Quando o grupo trava, discute, se perde ou está prestes a desistir.",
    poderSugerido: "Voz de Comando",
    itemInicial: "Escudo de Luz",
    tagline: "“Ninguém fica pra trás.”",
  },
  {
    key: "equilibrada",
    nome: "A Equilibrada",
    icon: "⚖️",
    attrs: { corpo: 2, mente: 2, coracao: 2 },
    descricao: "Faz um pouco de tudo e se adapta a qualquer situação.",
    comoAjuda: "Tapa buracos do time e troca de abordagem sem drama quando o plano muda.",
    quandoBrilha: "Improviso, mudança de cenário, falta de informação, situações híbridas.",
    poderSugerido: "Troca de Contexto",
    itemInicial: "Chave (Quase) Universal",
    tagline: "“Ok. Novo plano.”",
  },
  {
    key: "exploradora",
    nome: "A Exploradora",
    icon: "🧭",
    attrs: { corpo: 3, mente: 2, coracao: 1 },
    descricao: "Curiosa, rápida, sempre em movimento.",
    comoAjuda: "Descobre caminhos, lê o ambiente e puxa o grupo para o próximo passo.",
    quandoBrilha: "Mapas confusos, passagens secretas, perseguições, lugares novos.",
    poderSugerido: "Mapa Vivo",
    itemInicial: "Terminal Fantasma",
    tagline: "“Se tem um caminho, eu acho.”",
  },
  {
    key: "guardia",
    nome: "A Guardiã",
    icon: "🛡️",
    attrs: { corpo: 3, mente: 1, coracao: 2 },
    descricao: "Protege o grupo e segura a linha quando o perigo chega.",
    comoAjuda: "Vira escudo, compra tempo e mantém o grupo seguro quando o Nó aperta.",
    quandoBrilha: "Ameaça direta, risco alto, medo grande, alguém em perigo.",
    poderSugerido: "Campo de Proteção",
    itemInicial: "Escudo de Luz",
    tagline: "“Passa por mim primeiro.”",
  },
  {
    key: "inventora",
    nome: "A Inventora",
    icon: "🔧",
    attrs: { corpo: 2, mente: 3, coracao: 1 },
    descricao: "Conserta, adapta e cria gambiarras físicas.",
    comoAjuda: "Transforma sucata em solução: conserta, melhora e inventa ferramentas na hora.",
    quandoBrilha: "Coisas quebradas, travadas, portas fechadas, mecanismos estranhos.",
    poderSugerido: "Conserto Rápido",
    itemInicial: "Chave (Quase) Universal",
    tagline: "“Se não existe, a gente cria.”",
  },
  {
    key: "investigadora",
    nome: "A Investigadora",
    icon: "🕵️‍♀️",
    attrs: { corpo: 1, mente: 3, coracao: 2 },
    descricao: "Pensa antes de agir, planeja e resolve códigos.",
    comoAjuda: "Conecta pistas, prevê consequências e descobre o que está por trás do problema.",
    quandoBrilha: "Mistérios, sinais estranhos, códigos, mentiras, padrões do Nó.",
    poderSugerido: "Olhos de Debug",
    itemInicial: "Terminal Fantasma",
    tagline: "“Isso não é aleatório. É um padrão.”",
  },
  {
    key: "amiga",
    nome: "A Amiga",
    icon: "💞",
    attrs: { corpo: 2, mente: 1, coracao: 3 },
    descricao: "Sente o Nó, conversa com tudo e entende emoções.",
    comoAjuda: "Acalma, conecta e dá coragem: resolve conflitos antes que virem BUG.",
    quandoBrilha: "Medo, tristeza, brigas, vergonha, decisões que mexem com sentimentos.",
    poderSugerido: "Laço de Coragem",
    itemInicial: "Pulseira de Modo Alternativo",
    tagline: "“Eu tô com você.”",
  },
  {
    key: "diplomata",
    nome: "A Diplomata",
    icon: "🤝",
    attrs: { corpo: 1, mente: 2, coracao: 3 },
    descricao: "Junta ideias, pessoas e objetos para criar soluções.",
    comoAjuda: "Negocia, entende os dois lados e cria acordo onde parecia só conflito.",
    quandoBrilha: "Conversa tensa, alianças improváveis, convencer alguém, desarmar briga.",
    poderSugerido: "Palavra-Chave",
    itemInicial: "Chave (Quase) Universal",
    tagline: "“Vamos resolver isso falando.”",
  },
];

export function getArchetype(key) {
  return ARCHETYPES.find((a) => a.key === key) ?? ARCHETYPES[0];
}

export function applyArchetypeToSystem(system, key) {
  const a = getArchetype(key);

  system.meta = system.meta ?? {};
  system.meta.arquetipoKey = a.key;
  system.meta.arquetipoNome = a.nome;
  system.meta.arquetipoIcon = a.icon;
  system.meta.arquetipoDescricao = a.descricao;

  // identidade/pedagogia
  system.meta.arquetipoComoAjuda = a.comoAjuda ?? "";
  system.meta.arquetipoQuandoBrilha = a.quandoBrilha ?? "";
  system.meta.arquetipoPoderSugerido = a.poderSugerido ?? "";
  system.meta.arquetipoTagline = a.tagline ?? "";

  // NOVO: item inicial sugerido
  system.meta.arquetipoItemInicial = a.itemInicial ?? "";

  // trava por padrão
  system.meta.modoLivre = Boolean(system.meta.modoLivre ?? false);

  system.attributes = system.attributes ?? {};
  system.attributes.corpo = system.attributes.corpo ?? {};
  system.attributes.mente = system.attributes.mente ?? {};
  system.attributes.coracao = system.attributes.coracao ?? {};

  system.attributes.corpo.value = a.attrs.corpo;
  system.attributes.mente.value = a.attrs.mente;
  system.attributes.coracao.value = a.attrs.coracao;

  return system;
}
