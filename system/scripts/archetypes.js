// scripts/archetypes.js — v0.6.3a
// Galeria de Arquétipos do Nó (10 fixos)

export const ARCHETYPES = [
  {
    key: "atleta",
    nome: "A Atleta",
    icon: "🏃‍♀️",
    attrs: { corpo: 4, mente: 1, coracao: 1 },
    descricao: "Supera os limites do corpo: corre, salta e vai além do possível.",
  },
  {
    key: "genio",
    nome: "A Gênio",
    icon: "🧠",
    attrs: { corpo: 1, mente: 4, coracao: 1 },
    descricao: "Muito boa com problemas, lógica e quebra-cabeças.",
  },
  {
    key: "lider",
    nome: "O Líder",
    icon: "📣",
    attrs: { corpo: 1, mente: 1, coracao: 4 },
    descricao: "Une o grupo e inspira coragem quando tudo parece difícil.",
  },
  {
    key: "equilibrada",
    nome: "A Equilibrada",
    icon: "⚖️",
    attrs: { corpo: 2, mente: 2, coracao: 2 },
    descricao: "Faz um pouco de tudo e se adapta a qualquer situação.",
  },
  {
    key: "exploradora",
    nome: "A Exploradora",
    icon: "🧭",
    attrs: { corpo: 3, mente: 2, coracao: 1 },
    descricao: "Curiosa, rápida, sempre em movimento.",
  },
  {
    key: "guardia",
    nome: "A Guardiã",
    icon: "🛡️",
    attrs: { corpo: 3, mente: 1, coracao: 2 },
    descricao: "Protege o grupo e segura a linha quando o perigo chega.",
  },
  {
    key: "inventora",
    nome: "A Inventora",
    icon: "🔧",
    attrs: { corpo: 2, mente: 3, coracao: 1 },
    descricao: "Conserta, adapta e cria gambiarras físicas.",
  },
  {
    key: "investigadora",
    nome: "A Investigadora",
    icon: "🕵️‍♀️",
    attrs: { corpo: 1, mente: 3, coracao: 2 },
    descricao: "Pensa antes de agir, planeja e resolve códigos.",
  },
  {
    key: "amiga",
    nome: "A Amiga",
    icon: "💞",
    attrs: { corpo: 2, mente: 1, coracao: 3 },
    descricao: "Sente o Nó, conversa com tudo e entende emoções.",
  },
  {
    key: "diplomata",
    nome: "A Diplomata",
    icon: "🤝",
    attrs: { corpo: 1, mente: 2, coracao: 3 },
    descricao: "Junta ideias, pessoas e objetos para criar soluções.",
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
