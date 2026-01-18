// scripts/actor.js

const POWERS_PACK_IDS = [
  "world.gambiarra-poderes",          // ✅ pack do mundo (editável)
  "gambiarra-sys6.gambiarra-poderes", // fallback pack do sistema (somente leitura)
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

export class GambiarraActor extends Actor {
  /**
   * ⚠️ Observação:
   * Seu sistema todo está usando system.attributes.corpo.value etc.
   * Se você tiver um prepareData mexendo em system.atributos (sem "attributes"),
   * isso fica inconsistente. Prefira alinhar tudo em system.attributes.*.value.
   */

  /** =========================================================
   * Packs / Compêndio
   * ========================================================= */

  async _getPoderesPack({ preferWorld = true } = {}) {
    const worldPack = game.packs.get("world.gambiarra-poderes");
    const systemPack = game.packs.get("gambiarra-sys6.gambiarra-poderes");

    return preferWorld ? (worldPack ?? systemPack) : (systemPack ?? worldPack);
  }

  async _listPowersFromPack(pack) {
    if (!pack) return [];
    await pack.getIndex();
    const entries = [...pack.index.values()]
      .map((e) => ({ id: e._id, name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return entries;
  }

  async _importPowerToActor(pack, id) {
    const doc = await pack.getDocument(id);
    if (!doc) return null;

    const data = doc.toObject();
    delete data._id;

    // garantir tipo
    data.type = "poder";

    // garante campos mínimos do seu model
    data.system = {
      ...(data.system ?? {}),
      descricao: String(data.system?.descricao ?? ""),
      estado: data.system?.estado ?? "ativo",
      usos: Number(data.system?.usos ?? 0),
      efeitosPossiveis: Array.isArray(data.system?.efeitosPossiveis)
        ? data.system.efeitosPossiveis
        : [],
      obsSeguranca: String(data.system?.obsSeguranca ?? ""),
      origem: data.system?.origem ?? "compendio",
      sourceId: doc.uuid,
    };

    await this.createEmbeddedDocuments("Item", [data]);
    return data;
  }

  /** =========================================================
   * Poderes
   * ========================================================= */

  /**
   * Desperta um poder:
   * - sortear: true -> sorteia do compêndio (fallback lista interna)
   * - sortear: false -> escolhe do compêndio via dropdown + preview (fallback lista interna)
   */
  async _despertarPoder({ sortear = false } = {}) {
    const poderesAtuais = this.items.filter((i) => i.type === "poder");
    if (poderesAtuais.length >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
      return;
    }

    const pack = await this._getPoderesPack({ preferWorld: true });

    // 1) Tenta compêndio
    if (pack) {
      const entries = await this._listPowersFromPack(pack);

      if (entries.length > 0) {
        if (sortear) {
          const pick = entries[Math.floor(Math.random() * entries.length)];
          await this._importPowerToActor(pack, pick.id);
          ui.notifications.info(`⚡ Poder despertou: ${pick.name}`);
          return;
        }

        // escolher via dropdown + preview
        const optionsHtml = entries
          .map((e) => `<option value="${e.id}">${e.name}</option>`)
          .join("");

        new Dialog({
          title: "⚡ Escolher Poder Gambiarra",
          content: `
            <form class="gambiarra-pick-power">
              <p>Escolha um poder do compêndio:</p>
              <div class="form-group">
                <select name="powerId">${optionsHtml}</select>
              </div>
              <div class="form-group">
                <label>Descrição</label>
                <div class="hint power-preview" style="border:1px solid #0002; border-radius:8px; padding:8px;">
                  Carregando...
                </div>
              </div>
            </form>
          `,
          buttons: {
            ok: {
              label: "Despertar",
              callback: async (html) => {
                const id = html.find('[name="powerId"]').val();
                if (!id) return;
                const entry = entries.find((e) => e.id === id);
                await this._importPowerToActor(pack, id);
                if (entry?.name) ui.notifications.info(`⚡ Poder despertou: ${entry.name}`);
              },
            },
          },
          render: (html) => {
            const $select = html.find('[name="powerId"]');
            const $preview = html.find(".power-preview");

            const loadPreview = async () => {
              const id = $select.val();
              const doc = await pack.getDocument(id);
              const desc = String(doc?.system?.descricao ?? "").trim();
              $preview.text(desc || "(Sem descrição)");
            };

            $select.on("change", loadPreview);
            loadPreview();
          },
        }).render(true);

        return;
      }
    }

    // 2) Fallback lista interna (nunca trava)
    ui.notifications.warn("Compêndio vazio/indisponível. Vou usar a lista interna (fallback).");

    if (sortear) {
      const p = pickRandom(FALLBACK_POWERS);
      await this._criarPoderEmbedado(p.nome, p.descricao, { origem: "fallback" });
      ui.notifications.info(`⚡ Poder despertou: ${p.nome}`);
      return;
    }

    // escolher fallback via dropdown + preview
    const optionsHtml = FALLBACK_POWERS
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((p, idx) => `<option value="${idx}">${p.nome}</option>`)
      .join("");

    new Dialog({
      title: "⚡ Escolher Poder (fallback)",
      content: `
        <form class="gambiarra-pick-power">
          <p>Escolha um poder:</p>
          <div class="form-group">
            <select name="powerIdx">${optionsHtml}</select>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <div class="hint power-preview" style="border:1px solid #0002; border-radius:8px; padding:8px;">
              —
            </div>
          </div>
        </form>
      `,
      buttons: {
        ok: {
          label: "Despertar",
          callback: async (html) => {
            const idx = Number(html.find('[name="powerIdx"]').val());
            const p = FALLBACK_POWERS[idx];
            if (!p) return;
            await this._criarPoderEmbedado(p.nome, p.descricao, { origem: "fallback" });
          },
        },
      },
      render: (html) => {
        const $select = html.find('[name="powerIdx"]');
        const $preview = html.find(".power-preview");

        const update = () => {
          const idx = Number($select.val());
          const p = FALLBACK_POWERS[idx];
          $preview.text(p?.descricao ?? "—");
        };

        $select.on("change", update);
        update();
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
          efeitosPossiveis: [],
          obsSeguranca: "",
          origem: meta.origem ?? "desconhecida",
          sourceId: meta.sourceId ?? null,
        },
      },
    ]);
  }

  /**
   * ✅ Criar um poder novo (mesa) com descrição,
   * e permitir: salvar no compêndio do mundo e/ou adicionar à ficha.
   */
  async _criarPoderNoCompendioOuFicha() {
    const pack = await this._getPoderesPack({ preferWorld: true });

    if (!pack) {
      ui.notifications.warn("Nenhum compêndio de poderes encontrado.");
      return;
    }

    const isWorld = pack.collection?.startsWith("world.");
    const canWritePack = isWorld && game.user.isGM;

    const content = `
      <form class="gambiarra-create-power">
        <p class="hint">
          Crie um poder junto com as crianças. Você pode salvar no compêndio (mundo) e/ou adicionar à ficha.
        </p>

        <div class="form-group">
          <label>Nome do Poder</label>
          <input type="text" name="nome" placeholder="Ex: Gravidade Zero" />
        </div>

        <div class="form-group">
          <label>Descrição (o que faz)</label>
          <textarea name="descricao" rows="4" placeholder="Explique em 1–3 frases, bem narrativo."></textarea>
        </div>

        <div class="form-group">
          <label>Categoria (opcional)</label>
          <select name="categoria">
            <option value="">—</option>
            <option value="movimento">Movimento & Espaço</option>
            <option value="combate">Combate & Defesa</option>
            <option value="mente">Percepção & Mente</option>
            <option value="suporte">Utilidade & Suporte</option>
            <option value="avancado">Avançado</option>
          </select>
        </div>

        <div class="form-group">
          <label>Observação de Segurança (opcional)</label>
          <input type="text" name="obsSeguranca" placeholder="Ex: Evitar violência gráfica; manter leve." />
        </div>

        ${
          !canWritePack
            ? `<p class="hint" style="margin-top:8px;">
                 ⚠️ Não posso salvar no compêndio do mundo (você precisa ser GM e usar <code>world.gambiarra-poderes</code>).
               </p>`
            : ""
        }
      </form>
    `;

    const makeData = (html) => {
      const nome = String(html.find('[name="nome"]').val() ?? "").trim();
      const descricao = String(html.find('[name="descricao"]').val() ?? "").trim();
      const categoria = String(html.find('[name="categoria"]').val() ?? "").trim();
      const obsSeguranca = String(html.find('[name="obsSeguranca"]').val() ?? "").trim();

      if (!nome) {
        ui.notifications.warn("Dê um nome para o Poder.");
        return null;
      }
      if (!descricao) {
        ui.notifications.warn("Escreva uma descrição curta do que o poder faz.");
        return null;
      }

      return {
        name: nome,
        type: "poder",
        system: {
          descricao,
          categoria,
          estado: "ativo",
          usos: 0,
          efeitosPossiveis: [],
          obsSeguranca,
          origem: "criado-em-mesa",
        },
      };
    };

    new Dialog({
      title: "⚡ Criar Poder Gambiarra",
      content,
      buttons: {
        savePack: {
          label: "➕ Salvar no Compêndio",
          callback: async (html) => {
            const data = makeData(html);
            if (!data) return;

            if (!canWritePack) {
              ui.notifications.warn("Não consigo salvar no compêndio agora (precisa ser GM e pack world).");
              return;
            }

            await Item.createDocuments([data], { pack: pack.collection });
            ui.notifications.info("Poder salvo no compêndio do mundo.");
          },
        },
        addActor: {
          label: "➕ Adicionar à ficha",
          callback: async (html) => {
            const data = makeData(html);
            if (!data) return;

            const poderesAtuais = this.items.filter((i) => i.type === "poder");
            if (poderesAtuais.length >= 2) {
              ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
              return;
            }

            await this.createEmbeddedDocuments("Item", [data]);
            ui.notifications.info("Poder adicionado à ficha.");
          },
        },
        saveAndAdd: {
          label: "✅ Salvar + Adicionar",
          callback: async (html) => {
            const data = makeData(html);
            if (!data) return;

            if (canWritePack) {
              await Item.createDocuments([data], { pack: pack.collection });
            } else {
              ui.notifications.warn("Pack do mundo indisponível/somente leitura — vou apenas adicionar à ficha.");
            }

            const poderesAtuais = this.items.filter((i) => i.type === "poder");
            if (poderesAtuais.length >= 2) {
              ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
              return;
            }

            await this.createEmbeddedDocuments("Item", [data]);
            ui.notifications.info("Feito!");
          },
        },
      },
      default: "saveAndAdd",
    }).render(true);
  }
}
