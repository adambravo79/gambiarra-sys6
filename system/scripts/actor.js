// scripts/actor.js

const POWERS_PACK_IDS = [
  "gambiarra-sys6.gambiarra-poderes", // se virar pack do sistema
  "world.gambiarra-poderes", // seu caso atual (pack do mundo)
];

// Lista interna (fallback) — 40 poderes (nome + descrição curta)
const FALLBACK_POWERS = [
  {
    nome: "Rebobinar",
    descricao: "Volta o tempo ~10 segundos para refazer uma ação recente.",
  },
  {
    nome: "Pulo de Glitch",
    descricao: "Teletransporte curto (até 5m) para onde você está olhando.",
  },
  {
    nome: "Gravidade Zero",
    descricao: "Flutua ou anda no teto por alguns segundos.",
  },
  {
    nome: "Velocidade Turbo",
    descricao: "Move-se tão rápido que parece um vulto borrado.",
  },
  {
    nome: "Elasticidade",
    descricao: "Estica membros para alcançar lugares distantes.",
  },
  {
    nome: "Atravessar Dados",
    descricao: "Passa por paredes sólidas que tenham circuitos.",
  },
  {
    nome: "Salto Duplo",
    descricao: "Faz um segundo salto no ar, pisando num pixel invisível.",
  },
  {
    nome: "Caminho de Luz",
    descricao: "Cria uma ponte temporária de neon sob os pés.",
  },

  {
    nome: "Pele de Pixel",
    descricao: "O corpo endurece como pedra por um instante (defesa total).",
  },
  {
    nome: "Super Força",
    descricao: "Ergue coisas muito maiores do que você (até 10x, narrativo).",
  },
  {
    nome: "Sopro de Gelo",
    descricao: "Congela mecanismos ou inimigos com estática gelada.",
  },
  { nome: "Ímã Humano", descricao: "Atrai/ repele metal com as mãos." },
  {
    nome: "Escudo de Erro",
    descricao: "Cria uma bolha que rebate impactos de volta.",
  },
  {
    nome: "Mãos de Faísca",
    descricao: "Gera eletricidade: carregar, acender, dar choque leve.",
  },
  {
    nome: "Rajada de Bits",
    descricao: "Dispara cubos de energia pelos dedos.",
  },
  { nome: "Grito Sônico", descricao: "Um som alto que empurra tudo à frente." },

  {
    nome: "Visão de Código",
    descricao: "Enxerga 'o que está por trás' e padrões escondidos.",
  },
  {
    nome: "Invisibilidade Digital",
    descricao: "Fica transparente e silencioso por pouco tempo.",
  },
  {
    nome: "Tradução Universal",
    descricao: "Entende qualquer língua, inclusive máquinas.",
  },
  {
    nome: "Sentido de Perigo",
    descricao: "Um arrepio avisa quando algo ruim vai acontecer.",
  },
  {
    nome: "Cópia de Dados",
    descricao: "Cria uma ilusão de si mesmo para distrair/ enganar.",
  },
  {
    nome: "Flash de Memória",
    descricao: "Toca num objeto e vê quem o usou por último.",
  },
  {
    nome: "Raio-X Neon",
    descricao: "Vê circuitos e engrenagens dentro de máquinas.",
  },
  {
    nome: "Telepatia",
    descricao: "Conversa mentalmente com aliados a distância.",
  },

  {
    nome: "Voz de Comando",
    descricao: "Dá ordens simples a objetos (ex: 'porta, abra!').",
  },
  {
    nome: "Luz Neon",
    descricao: "Emana brilho forte: ilumina, revela ou assusta o medo.",
  },
  {
    nome: "Conserto Rápido",
    descricao: "Pixels se reorganizam: conserta algo quebrado na hora.",
  },
  {
    nome: "Cura de Dados",
    descricao: "Recupera energia/ânimo de um personagem (narrativo).",
  },
  {
    nome: "Hackear à Distância",
    descricao: "Controla painéis/portas olhando e focando.",
  },
  {
    nome: "Alterar Tamanho",
    descricao: "Encolhe ou cresce por pouco tempo (limites narrativos).",
  },
  {
    nome: "Voo Planado",
    descricao: "Roupas viram 'asas de código' para planar.",
  },
  {
    nome: "Invocar Item",
    descricao: "Cria um objeto simples de pixels por 1 minuto.",
  },

  {
    nome: "Mestre do Clima",
    descricao: "Cria chuva/vento local dentro de uma sala.",
  },
  {
    nome: "Fusão de Pixels",
    descricao: "Camufla perfeitamente em superfícies.",
  },
  {
    nome: "Paralisia Temporal",
    descricao: "Congela algo/ alguém por ~5 segundos.",
  },
  { nome: "Ondas de Rádio", descricao: "Capta conversas de outros setores." },
  {
    nome: "Eco Duplicador",
    descricao: "Uma vez, sua ação acontece duas vezes.",
  },
  {
    nome: "Armadura de Plasma",
    descricao: "Chamas azuis que protegem sem ferir aliados.",
  },
  {
    nome: "Piso Aderente",
    descricao: "Escala qualquer superfície como inseto.",
  },
  {
    nome: "Sorte Programada",
    descricao: "1x por sessão: transforma uma falha em sucesso total.",
  },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getPowerFromCompendium() {
  for (const packId of POWERS_PACK_IDS) {
    const pack = game.packs.get(packId);
    if (!pack) continue;

    // garante índice
    const index = pack.index ?? (await pack.getIndex());
    if (!index || index.size === 0) continue;

    // pega um item aleatório do índice e carrega o documento
    const ids = Array.from(index.keys());
    const chosenId = ids[Math.floor(Math.random() * ids.length)];
    const doc = await pack.getDocument(chosenId);
    if (doc) return doc;
  }
  return null;
}

export class GambiarraActor extends Actor {
  /**
   * Desperta um poder:
   * - sortear: true -> tenta compêndio, fallback para lista interna
   * - sortear: false -> escolhe da lista interna via diálogo (se compêndio vazio)
   */
  async _despertarPoder({ sortear = false } = {}) {
    const poderesAtuais = this.items.filter((i) => i.type === "poder");
    if (poderesAtuais.length >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
      return;
    }

    const pack =
      game.packs.get("world.gambiarra-poderes") ??
      game.packs.get("gambiarra-sys6.gambiarra-poderes");

    if (!pack) {
      ui.notifications.warn("Nenhum compêndio de poderes encontrado.");
      return;
    }

    await pack.getIndex();
    if (pack.index.size === 0) {
      ui.notifications.warn("O compêndio de poderes está vazio.");
      return;
    }

    const entries = [...pack.index.values()]
      .map((e) => ({ id: e._id, name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const importar = async (id) => {
      const doc = await pack.getDocument(id);
      const data = doc.toObject();
      delete data._id;
      // garante que vira embedded item do ator
      await this.createEmbeddedDocuments("Item", [data]);
    };

    if (sortear) {
      const pick = entries[Math.floor(Math.random() * entries.length)];
      await importar(pick.id);
      ui.notifications.info(`⚡ Poder despertou: ${pick.name}`);
      return;
    }

    // escolher via dropdown
    const optionsHtml = entries
      .map((e) => `<option value="${e.id}">${e.name}</option>`)
      .join("");

    new Dialog({
      title: "⚡ Escolher Poder Gambiarra",
      content: `
      <form>
        <p>Escolha um poder do compêndio:</p>
        <div class="form-group">
          <select name="powerId">${optionsHtml}</select>
        </div>
      </form>
    `,
      buttons: {
        ok: {
          label: "Despertar",
          callback: async (html) => {
            const id = html.find('[name="powerId"]').val();
            if (!id) return;
            await importar(id);
          },
        },
      },
    }).render(true);
  }

  async _criarPoderEmbedado(nome, descricao, meta = {}) {
    return this.createEmbeddedDocuments("Item", [
      {
        name: nome,
        type: "poder",
        system: {
          descricao: String(descricao ?? ""),
          estado: "ativo",
          usos: 0,
          // mantém compat com seu model atual
          efeitosPossiveis: [],
          obsSeguranca: "",
          origem: meta.origem ?? "desconhecida",
          sourceId: meta.sourceId ?? null,
        },
      },
    ]);
  }
}
