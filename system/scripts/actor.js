// scripts/actor.js

const POWERS_PACK_IDS = [
  "gambiarra-sys6.gambiarra-poderes", // se virar pack do sistema
  "world.gambiarra-poderes",          // seu caso atual (pack do mundo)
];

// Lista interna (fallback) — 40 poderes (nome + descrição curta)
const FALLBACK_POWERS = [
  { nome: "Rebobinar", descricao: "Volta o tempo ~10 segundos para refazer uma ação recente." },
  { nome: "Pulo de Glitch", descricao: "Teletransporte curto (até 5m) para onde você está olhando." },
  { nome: "Gravidade Zero", descricao: "Flutua ou anda no teto por alguns segundos." },
  { nome: "Velocidade Turbo", descricao: "Move-se tão rápido que parece um vulto borrado." },
  { nome: "Elasticidade", descricao: "Estica membros para alcançar lugares distantes." },
  { nome: "Atravessar Dados", descricao: "Passa por paredes sólidas que tenham circuitos." },
  { nome: "Salto Duplo", descricao: "Faz um segundo salto no ar, pisando num pixel invisível." },
  { nome: "Caminho de Luz", descricao: "Cria uma ponte temporária de neon sob os pés." },

  { nome: "Pele de Pixel", descricao: "O corpo endurece como pedra por um instante (defesa total)." },
  { nome: "Super Força", descricao: "Ergue coisas muito maiores do que você (até 10x, narrativo)." },
  { nome: "Sopro de Gelo", descricao: "Congela mecanismos ou inimigos com estática gelada." },
  { nome: "Ímã Humano", descricao: "Atrai/ repele metal com as mãos." },
  { nome: "Escudo de Erro", descricao: "Cria uma bolha que rebate impactos de volta." },
  { nome: "Mãos de Faísca", descricao: "Gera eletricidade: carregar, acender, dar choque leve." },
  { nome: "Rajada de Bits", descricao: "Dispara cubos de energia pelos dedos." },
  { nome: "Grito Sônico", descricao: "Um som alto que empurra tudo à frente." },

  { nome: "Visão de Código", descricao: "Enxerga 'o que está por trás' e padrões escondidos." },
  { nome: "Invisibilidade Digital", descricao: "Fica transparente e silencioso por pouco tempo." },
  { nome: "Tradução Universal", descricao: "Entende qualquer língua, inclusive máquinas." },
  { nome: "Sentido de Perigo", descricao: "Um arrepio avisa quando algo ruim vai acontecer." },
  { nome: "Cópia de Dados", descricao: "Cria uma ilusão de si mesmo para distrair/ enganar." },
  { nome: "Flash de Memória", descricao: "Toca num objeto e vê quem o usou por último." },
  { nome: "Raio-X Neon", descricao: "Vê circuitos e engrenagens dentro de máquinas." },
  { nome: "Telepatia", descricao: "Conversa mentalmente com aliados a distância." },

  { nome: "Voz de Comando", descricao: "Dá ordens simples a objetos (ex: 'porta, abra!')." },
  { nome: "Luz Neon", descricao: "Emana brilho forte: ilumina, revela ou assusta o medo." },
  { nome: "Conserto Rápido", descricao: "Pixels se reorganizam: conserta algo quebrado na hora." },
  { nome: "Cura de Dados", descricao: "Recupera energia/ânimo de um personagem (narrativo)." },
  { nome: "Hackear à Distância", descricao: "Controla painéis/portas olhando e focando." },
  { nome: "Alterar Tamanho", descricao: "Encolhe ou cresce por pouco tempo (limites narrativos)." },
  { nome: "Voo Planado", descricao: "Roupas viram 'asas de código' para planar." },
  { nome: "Invocar Item", descricao: "Cria um objeto simples de pixels por 1 minuto." },

  { nome: "Mestre do Clima", descricao: "Cria chuva/vento local dentro de uma sala." },
  { nome: "Fusão de Pixels", descricao: "Camufla perfeitamente em superfícies." },
  { nome: "Paralisia Temporal", descricao: "Congela algo/ alguém por ~5 segundos." },
  { nome: "Ondas de Rádio", descricao: "Capta conversas de outros setores." },
  { nome: "Eco Duplicador", descricao: "Uma vez, sua ação acontece duas vezes." },
  { nome: "Armadura de Plasma", descricao: "Chamas azuis que protegem sem ferir aliados." },
  { nome: "Piso Aderente", descricao: "Escala qualquer superfície como inseto." },
  { nome: "Sorte Programada", descricao: "1x por sessão: transforma uma falha em sucesso total." },
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
  async _despertarPoder({ sortear = true } = {}) {
    const poderesAtuais = this.items.filter((i) => i.type === "poder");
    if (poderesAtuais.length >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
      return;
    }

    // 1) tenta compêndio (se sortear)
    let chosen = null;
    if (sortear) {
      chosen = await getPowerFromCompendium();
    }

    // 2) se não veio do compêndio, usa fallback
    if (!chosen) {
      if (sortear) {
        const f = pickRandom(FALLBACK_POWERS);
        return this._criarPoderEmbedado(f.nome, f.descricao, { origem: "fallback" });
      }

      // Escolha manual (lista)
      const options = FALLBACK_POWERS.map(
        (p, idx) => `<option value="${idx}">${String(idx + 1).padStart(2, "0")}. ${p.nome}</option>`
      ).join("");

      return new Dialog({
        title: "⚡ Despertar Poder (Escolher)",
        content: `
          <form>
            <div class="form-group">
              <label>Poder</label>
              <select name="idx">${options}</select>
            </div>
            <div class="form-group">
              <label>Notas (opcional)</label>
              <textarea name="nota" rows="2" placeholder="Como ele apareceu? Cor, som, sensação..."></textarea>
            </div>
          </form>
        `,
        buttons: {
          ok: {
            label: "Despertar",
            callback: async (html) => {
              const idx = Number(html.find('[name="idx"]').val());
              const nota = String(html.find('[name="nota"]').val() ?? "").trim();
              const p = FALLBACK_POWERS[idx] ?? pickRandom(FALLBACK_POWERS);
              const desc = nota ? `${p.descricao}\n\n🪢 Nota: ${nota}` : p.descricao;
              await this._criarPoderEmbedado(p.nome, desc, { origem: "manual" });
            },
          },
        },
        default: "ok",
      }).render(true);
    }

    // 3) veio do compêndio: cria cópia embedada no ator
    const nome = chosen.name ?? "Poder Gambiarra";
    const descricao = chosen.system?.descricao ?? chosen.system?.description ?? "";
    return this._criarPoderEmbedado(nome, descricao, { origem: "compendio", sourceId: chosen.uuid });
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
