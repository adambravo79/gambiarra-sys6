// scripts/seed-compendiums.js

const POWERS_PACK_IDS = [
  "gambiarra-sys6.gambiarra-poderes",
  "world.gambiarra-poderes",
];

const PODERES_40 = [
  // Movimento e Espaço
  { nome: "Rebobinar", descricao: "Volta o tempo em ~10 segundos para refazer uma ação." },
  { nome: "Pulo de Glitch", descricao: "Teletransporte curto (5m) para onde você está olhando." },
  { nome: "Gravidade Zero", descricao: "Permite flutuar ou andar no teto por alguns segundos." },
  { nome: "Velocidade Turbo", descricao: "Move-se tão rápido que parece um vulto borrado." },
  { nome: "Elasticidade", descricao: "Estica membros para alcançar lugares distantes." },
  { nome: "Atravessar Dados", descricao: "Pode passar por paredes sólidas que tenham circuitos." },
  { nome: "Salto Duplo", descricao: "Faz um segundo salto no ar, pisando em um pixel invisível." },
  { nome: "Caminho de Luz", descricao: "Cria uma ponte temporária de neon sob os pés." },

  // Combate e Defesa
  { nome: "Pele de Pixel", descricao: "Torna o corpo duro como pedra por um instante (defesa absoluta)." },
  { nome: "Super Força", descricao: "Pode erguer objetos muito maiores do que você (narrativo)." },
  { nome: "Sopro de Gelo", descricao: "Congela mecanismos ou inimigos de estática." },
  { nome: "Ímã Humano", descricao: "Atrai ou repele objetos de metal com as mãos." },
  { nome: "Escudo de Erro", descricao: "Cria uma bolha que rebate ataques/impactos de volta." },
  { nome: "Mãos de Faísca", descricao: "Gera eletricidade para carregar baterias ou dar choques leves." },
  { nome: "Rajada de Bits", descricao: "Dispara pequenos cubos de energia pelos dedos." },
  { nome: "Grito Sônico", descricao: "Um som tão alto que empurra tudo à frente." },

  // Percepção e Mente
  { nome: "Visão de Código", descricao: "Enxerga padrões e camadas escondidas do Nó." },
  { nome: "Invisibilidade Digital", descricao: "Fica transparente e silencioso por um curto período." },
  { nome: "Tradução Universal", descricao: "Entende qualquer língua, inclusive de máquinas." },
  { nome: "Sentido de Perigo", descricao: "Um arrepio avisa quando algo ruim vai acontecer." },
  { nome: "Cópia de Dados", descricao: "Cria uma ilusão de si mesmo para enganar guardas." },
  { nome: "Flash de Memória", descricao: "Toca em um objeto e vê quem o usou por último." },
  { nome: "Raio-X Neon", descricao: "Vê circuitos e engrenagens dentro de qualquer máquina." },
  { nome: "Telepatia", descricao: "Conversa mentalmente com aliados, não importa a distância." },

  // Utilidade e Suporte
  { nome: "Voz de Comando", descricao: "Dá ordens simples a objetos (ex: “Porta, abra!”)." },
  { nome: "Luz Neon", descricao: "Emana um brilho forte que ilumina ou afasta o medo." },
  { nome: "Conserto Rápido", descricao: "Toca em algo quebrado e os pixels se reorganizam sozinhos." },
  { nome: "Cura de Dados", descricao: "Toca em um personagem e recupera a energia dele (narrativo)." },
  { nome: "Hackear à Distância", descricao: "Controla computadores ou painéis apenas olhando." },
  { nome: "Alterar Tamanho", descricao: "Pode encolher ou crescer por um curto período." },
  { nome: "Voo Planado", descricao: "Roupas se transformam em “asas de código” para planar." },
  { nome: "Invocar Item", descricao: "Cria um objeto simples de pixels que dura 1 minuto." },

  // Avançados (2º poder)
  { nome: "Mestre do Clima", descricao: "Cria pequenas nuvens de chuva ou vento dentro de salas." },
  { nome: "Fusão de Pixels", descricao: "Pode se camuflar perfeitamente em qualquer superfície." },
  { nome: "Paralisia Temporal", descricao: "Congela um objeto ou inimigo no tempo por 5 segundos." },
  { nome: "Ondas de Rádio", descricao: "Capta conversas que acontecem em outros setores." },
  { nome: "Eco Duplicador", descricao: "Suas ações acontecem duas vezes (efeito narrativo)." },
  { nome: "Armadura de Plasma", descricao: "Envolve o corpo em chamas azuis que não queimam aliados." },
  { nome: "Piso Aderente", descricao: "Consegue escalar qualquer superfície como um inseto." },
  { nome: "Sorte Programada", descricao: "Uma vez por sessão, transforma uma falha em sucesso total." },
];

async function findPack() {
  for (const id of POWERS_PACK_IDS) {
    const pack = game.packs.get(id);
    if (pack) return pack;
  }
  return null;
}

export async function seedPoderesCompendio() {
  if (!game.user.isGM) return; // só GM pode escrever em pack

  const pack = await findPack();
  if (!pack) {
    console.warn("GAMBIARRA.SYS6 | Nenhum pack de poderes encontrado.");
    return;
  }

  // garantir índice carregado
  await pack.getIndex();

  if (pack.index?.size > 0) {
    console.log("GAMBIARRA.SYS6 | Compêndio de poderes já possui conteúdo, não vou seedar.");
    return;
  }

  const docs = PODERES_40.map((p) => ({
    name: p.nome,
    type: "poder",
    system: {
      descricao: p.descricao,
      estado: "ativo",
      usos: 0,
      efeitosPossiveis: [],
      obsSeguranca: "",
      origem: "seed",
    },
  }));

  // ✅ Foundry v12: cria direto no pack
  await Item.createDocuments(docs, { pack: pack.collection });

  console.log(`GAMBIARRA.SYS6 | Seed concluído: ${docs.length} poderes em ${pack.collection}`);
}
