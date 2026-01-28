// scripts/actor.js
// 0.6.3d
//
// v0.6.3d (dialogs estilo ficha + UX):
// - Criar Poder (em mesa): categoria vira "combobox" (input + datalist) com sugestões do compêndio
// - Criar Item (em mesa):
//   - Seção "Efeitos" com título e grid 2x2 (CSS)
//   - Quando Tipo = Consumível, sugestão de Cargas = 3 ao exibir o campo
// - Remove inline styles (usa classes)

// ============================================================
// Packs
// ============================================================

const POWERS_PACK_IDS = [
  "world.gambiarra-poderes", // ✅ editável
  "gambiarra-sys6.gambiarra-poderes", // fallback leitura
];

const FALLBACK_POWERS = [
  { nome: "Rebobinar", descricao: "Volta o tempo ~10 segundos para refazer uma ação recente." },
  { nome: "Pulo de Glitch", descricao: "Teletransporte curto (até 5m) para onde você está olhando." },
  { nome: "Gravidade Zero", descricao: "Flutua ou anda no teto por alguns segundos." }
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normName(s) {
  return String(s ?? "").trim().toLocaleLowerCase("pt-BR");
}

const ITEMS_PACK_IDS = [
  "world.gambiarra-itens", // ✅ editável
  "gambiarra-sys6.gambiarra-itens" // fallback leitura
];

const ITEM_EFFECT_LABEL = {
  reduzir: "➖ Reduzir dificuldade",
  roxo: "🟣 +1 dado roxo",
  hackear: "🪢 Hackear o Nó (registro)",
  trocar: "🔁 Trocar atributo (registro)"
};

export class GambiarraActor extends Actor {
  /* =========================================================
   * Helpers — packs (PODERES)
   * ========================================================= */

  async _getPack({ preferWorld = true } = {}) {
    if (preferWorld) {
      const world = game.packs.get("world.gambiarra-poderes");
      if (world) return world;
    }
    for (const id of POWERS_PACK_IDS) {
      const pack = game.packs.get(id);
      if (pack) return pack;
    }
    return null;
  }

  async _listPowersFromPack(pack) {
    if (!pack) return [];
    await pack.getIndex();
    return [...pack.index.values()]
      .map((e) => ({ id: e._id, name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async _loadPowerDoc(pack, id) {
    if (!pack || !id) return null;
    return pack.getDocument(id);
  }

  // >>> INSERIDO (v0.6.3d): lista categorias existentes no compêndio (para "combobox")
  async _listPowerCategoriesFromPack(pack) {
    if (!pack) return [];
    try {
      // Foundry v11+: getIndex pode aceitar fields
      await pack.getIndex({ fields: ["system.categoria"] });
    } catch (e) {
      // fallback: index padrão (pode não ter system.*)
      await pack.getIndex();
    }

    const cats = new Set();
    for (const e of pack.index.values()) {
      const c = String(e?.system?.categoria ?? "").trim();
      if (c) cats.add(c);
    }

    return [...cats].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  _canAddPower() {
    const current = this.items.filter((i) => i.type === "poder").length;
    if (current >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido (2).");
      return false;
    }
    return true;
  }

  _hasDuplicatePower({ sourceId = null, name = "" } = {}) {
    const wantedSource = sourceId ? String(sourceId) : null;
    const wantedName = normName(name);

    return this.items.some((i) => {
      if (i.type !== "poder") return false;

      const existingSource = i.system?.sourceId ? String(i.system.sourceId) : null;
      if (wantedSource && existingSource && existingSource === wantedSource) return true;

      return wantedName && normName(i.name) === wantedName;
    });
  }

  async _importPowerToActor(pack, id) {
    const doc = await this._loadPowerDoc(pack, id);
    if (!doc) return null;

    const sourceId = doc.uuid;
    const name = doc.name;

    if (this._hasDuplicatePower({ sourceId, name })) {
      ui.notifications.warn(`Este poder já está na ficha: ${name}`);
      return null;
    }

    const data = doc.toObject();
    delete data._id;

    data.type = "poder";
    data.system = {
      ...(data.system ?? {}),
      descricao: String(data.system?.descricao ?? ""),
      estado: data.system?.estado ?? "ativo",
      usos: Number(data.system?.usos ?? 0),
      efeitosPossiveis: Array.isArray(data.system?.efeitosPossiveis) ? data.system.efeitosPossiveis : [],
      obsSeguranca: String(data.system?.obsSeguranca ?? ""),
      origem: data.system?.origem ?? "compendio",
      sourceId
    };

    await this.createEmbeddedDocuments("Item", [data]);
    return data;
  }

  /* =========================================================
   * ✅ Criar Poder em mesa
   * ========================================================= */

  async _criarPoderNoCompendioOuFicha() {
    if (!game.user.isGM) {
      ui.notifications.warn("Apenas a Programadora (GM) pode criar poderes em mesa.");
      return;
    }

    const worldPack = game.packs.get("world.gambiarra-poderes") ?? null;
    const canWritePack = !!worldPack && game.user.isGM;

    // >>> INSERIDO (v0.6.3d): categorias sugeridas do compêndio
    const catPack = await this._getPack({ preferWorld: true });
    const suggestedCats = await this._listPowerCategoriesFromPack(catPack);
    const datalistHtml = suggestedCats.length
      ? `
        <datalist id="gambi-power-categories">
          ${suggestedCats.map((c) => `<option value="${Handlebars.escapeExpression(c)}"></option>`).join("")}
        </datalist>
      `
      : `<datalist id="gambi-power-categories"></datalist>`;

    const content = `
      <form class="gambiarra-create-power gambi-dialog-form">
        <div class="gambi-dialog-head">
          <div class="gambi-dialog-title">⚡ Criar Poder Gambiarra</div>
          <div class="hint">
            Crie um <strong>Poder Gambiarra</strong> junto com o grupo.
            Você pode <strong>adicionar à ficha</strong> e/ou <strong>salvar no compêndio</strong>.
          </div>
        </div>

        <div class="form-group">
          <label>Nome do Poder</label>
          <input type="text" name="nome" placeholder="Ex: Alterar Tamanho" />
        </div>

        <div class="form-group">
          <label>Categoria</label>

          <!-- >>> ALTERADO (v0.6.3d): combobox via datalist -->
          <input
            type="text"
            name="categoria"
            list="gambi-power-categories"
            placeholder="Ex: Utilidade e Suporte (ou digite uma nova)"
          />
          ${datalistHtml}

          <p class="hint">Dica: escolha uma já existente… ou crie uma nova digitando.</p>
        </div>

        <div class="form-group">
          <label>O que faz</label>
          <textarea name="descricao" rows="4" placeholder="Descreva o efeito do poder."></textarea>
        </div>

        <div class="form-group">
          <label>Observações de segurança (opcional)</label>
          <textarea name="obsSeguranca" rows="2" placeholder="Limites, cuidados, gatilhos, etc."></textarea>
        </div>

        ${canWritePack
          ? `<p class="hint">✅ Pode salvar em <strong>world.gambiarra-poderes</strong>.</p>`
          : `<p class="hint">⚠️ Para salvar no compêndio: precisa existir <strong>world.gambiarra-poderes</strong> e você ser GM.</p>`
        }
      </form>
    `;

    const read = (html) => {
      const nome = String(html.find('[name="nome"]').val() ?? "").trim();
      const categoria = String(html.find('[name="categoria"]').val() ?? "").trim();
      const descricao = String(html.find('[name="descricao"]').val() ?? "").trim();
      const obsSeguranca = String(html.find('[name="obsSeguranca"]').val() ?? "").trim();

      if (!nome) {
        ui.notifications.warn("Dê um nome para o Poder.");
        return null;
      }
      if (!descricao) {
        ui.notifications.warn("Escreva o que o poder faz.");
        return null;
      }

      return {
        name: nome,
        type: "poder",
        img: "icons/svg/lightning.svg",
        system: {
          descricao,
          categoria,
          estado: "ativo",
          usos: 0,
          efeitosPossiveis: [],
          obsSeguranca,
          origem: "criado-em-mesa",
          sourceId: ""
        }
      };
    };

    const dlg = new Dialog(
      {
        title: "⚡ Criar Poder Gambiarra (em mesa)",
        content,
        buttons: {
          addActor: {
            label: "➕ Adicionar à ficha",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;

              await this._criarPoderEmbedado({
                nome: data.name,
                descricao: data.system.descricao,
                categoria: data.system.categoria,
                obsSeguranca: data.system.obsSeguranca,
                meta: { origem: "criado-em-mesa" }
              });

              ui.notifications.info("✅ Poder adicionado à ficha.");
            }
          },

          savePack: {
            label: "📦 Salvar no Compêndio",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;

              if (!canWritePack) {
                ui.notifications.warn("Não consigo salvar no compêndio (precisa ser GM e pack world).");
                return;
              }

              const created = await this._createPowerInWorldPack(data);
              if (!created) return;

              ui.notifications.info("✅ Poder criado no compêndio do mundo.");
            }
          },

          saveAndAdd: {
            label: "✅ Salvar + Adicionar",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;

              await this._criarPoderEmbedado({
                nome: data.name,
                descricao: data.system.descricao,
                categoria: data.system.categoria,
                obsSeguranca: data.system.obsSeguranca,
                meta: { origem: "criado-em-mesa" }
              });

              if (canWritePack) {
                await this._createPowerInWorldPack(data);
                ui.notifications.info("✅ Poder salvo no compêndio e adicionado à ficha.");
              } else {
                ui.notifications.warn("⚠️ Não deu para salvar no compêndio — mas o poder foi adicionado à ficha.");
              }
            }
          }
        },
        default: "saveAndAdd",

        // >>> INSERIDO (v0.6.3d): pequenos toques UX
        render: (html) => {
          // foca no nome
          const $nome = html.find('[name="nome"]');
          if ($nome?.length) $nome.trigger("focus");
        }
      },
      {
        width: 620,
        height: 560,
        resizable: true,
        classes: ["gambi-create-power-dialog"]
      }
    );

    dlg.render(true);
  }

  async _criarPoderEmbedado({ nome, descricao, categoria = "", obsSeguranca = "", meta = {} }) {
    if (this._hasDuplicatePower({ sourceId: meta.sourceId ?? "", name: nome })) {
      ui.notifications.warn(`Este poder já está na ficha: ${nome}`);
      return null;
    }

    const data = {
      name: nome,
      type: "poder",
      system: {
        descricao: String(descricao ?? ""),
        categoria: String(categoria ?? ""),
        estado: "ativo",
        usos: 0,
        efeitosPossiveis: [],
        obsSeguranca: String(obsSeguranca ?? ""),
        origem: meta.origem ?? "criado-em-mesa",
        sourceId: meta.sourceId ?? ""
      }
    };

    await this.createEmbeddedDocuments("Item", [data]);
    return data;
  }

  async _createPowerInWorldPack(data) {
    const pack = await this._getPack({ preferWorld: true });

    if (!pack) {
      ui.notifications.warn("Nenhum compêndio encontrado (world.gambiarra-poderes).");
      return null;
    }
    const isWorld = String(pack.collection ?? "").startsWith("world.");
    if (!isWorld || !game.user.isGM) {
      ui.notifications.warn("Para salvar no compêndio: precisa ser GM e o pack precisa ser world.gambiarra-poderes.");
      return null;
    }

    const created = await Item.createDocuments([data], { pack: pack.collection });
    const createdDoc = created?.[0];
    if (!createdDoc) return null;

    await pack.getIndex();
    return { pack, id: createdDoc.id, uuid: createdDoc.uuid, name: createdDoc.name };
  }

  /* =========================================================
   * Despertar Poder — dropdown + preview + anti-duplicado
   * ========================================================= */

  async _despertarPoder({ sortear = false, selectedId = null } = {}) {
    if (!this._canAddPower()) return;

    const pack = await this._getPack({ preferWorld: true });

    if (pack) {
      const entries = await this._listPowersFromPack(pack);

      if (entries.length > 0) {
        if (sortear) {
          const tries = 20;
          for (let t = 0; t < tries; t++) {
            const pick = entries[Math.floor(Math.random() * entries.length)];
            const doc = await this._loadPowerDoc(pack, pick.id);
            const sourceId = doc?.uuid ?? null;
            const name = doc?.name ?? pick.name;

            if (!this._hasDuplicatePower({ sourceId, name })) {
              await this._importPowerToActor(pack, pick.id);
              ui.notifications.info(`⚡ Poder despertou: ${pick.name}`);
              return;
            }
          }
          ui.notifications.warn("Não consegui sortear um poder novo (todos os sorteados já estavam na ficha).");
          return;
        }

        const docsById = new Map();
        for (const e of entries) {
          const doc = await this._loadPowerDoc(pack, e.id);
          if (doc) docsById.set(e.id, doc);
        }

        const requestedId =
          selectedId && entries.some((e) => e.id === selectedId) ? selectedId : null;

        const firstAvailableId = (() => {
          for (const e of entries) {
            const doc = docsById.get(e.id);
            const dup = this._hasDuplicatePower({
              sourceId: doc?.uuid ?? null,
              name: doc?.name ?? e.name
            });
            if (!dup) return e.id;
          }
          return entries[0].id;
        })();

        const initialId = (() => {
          if (!requestedId) return firstAvailableId;

          const doc = docsById.get(requestedId);
          const dup = this._hasDuplicatePower({
            sourceId: doc?.uuid ?? null,
            name: doc?.name ?? ""
          });
          return dup ? firstAvailableId : requestedId;
        })();

        const optionsHtml = entries
          .map((e) => {
            const doc = docsById.get(e.id);
            const dup = this._hasDuplicatePower({
              sourceId: doc?.uuid ?? null,
              name: doc?.name ?? e.name
            });
            const label = dup ? `${e.name} (já na ficha)` : e.name;
            const dis = dup ? "disabled" : "";
            const sel = e.id === initialId ? "selected" : "";
            return `<option value="${e.id}" ${sel} ${dis}>${label}</option>`;
          })
          .join("");

        new Dialog({
          title: "⚡ Escolher Poder Gambiarra",
          content: `
            <form class="gambiarra-pick-power">
              <p>Escolha um poder do compêndio:</p>

              <div class="form-group">
                <label>Poder</label>
                <select name="powerId">${optionsHtml}</select>
              </div>

              <div class="form-group">
                <label>Descrição</label>
                <div class="hint power-preview gambi-power-preview-box">
                  Carregando...
                </div>
              </div>

              <p class="hint dup-warning gambi-is-hidden">
                ⚠️ Este poder já está na ficha.
              </p>

              <div class="gambiarra-dialog-spacer"></div>
            </form>
          `,
          buttons: {
            ok: {
              label: "Adicionar à ficha",
              callback: async (html) => {
                const id = html.find('[name="powerId"]').val();
                if (!id) return;
                if (!this._canAddPower()) return;

                const doc = docsById.get(id) ?? (await this._loadPowerDoc(pack, id));
                const sourceId = doc?.uuid ?? null;
                const name = String(doc?.name ?? "").trim();

                if (this._hasDuplicatePower({ sourceId, name })) {
                  ui.notifications.warn(`Este poder já está na ficha: ${name}`);
                  return;
                }

                await this._importPowerToActor(pack, id);
              }
            }
          },
          default: "ok",
          render: (html) => {
            const $select = html.find('[name="powerId"]');
            const $preview = html.find(".power-preview");
            const $warn = html.find(".dup-warning");

            const refresh = async () => {
              const id = $select.val();
              const doc = docsById.get(id) ?? (await this._loadPowerDoc(pack, id));

              const desc = String(doc?.system?.descricao ?? "").trim();
              const name = String(doc?.name ?? "").trim();
              const sourceId = doc?.uuid ?? null;

              $preview.text(desc || "(Sem descrição)");

              const dup = this._hasDuplicatePower({ sourceId, name });
              $warn.toggleClass("gambi-is-hidden", !dup);
            };

            $select.on("change", refresh);
            refresh();
          }
        }).render(true);

        return;
      }
    }

    ui.notifications.warn("Compêndio vazio/indisponível — usando fallback interno.");
    const p = sortear ? pickRandom(FALLBACK_POWERS) : FALLBACK_POWERS[0];
    await this._criarPoderEmbedado({
      nome: p.nome,
      descricao: p.descricao,
      meta: { origem: "fallback" }
    });
  }

  /* =========================================================
   * Helpers — packs (ITENS)
   * ========================================================= */

  async _getItemsPack({ preferWorld = true } = {}) {
    if (preferWorld) {
      const world = game.packs.get("world.gambiarra-itens");
      if (world) return world;
    }
    for (const id of ITEMS_PACK_IDS) {
      const pack = game.packs.get(id);
      if (pack) return pack;
    }
    return null;
  }

  async _createItemInWorldPack(data) {
    const pack = await this._getItemsPack({ preferWorld: true });

    if (!pack) {
      ui.notifications.warn("Nenhum compêndio encontrado (world.gambiarra-itens).");
      return null;
    }
    const isWorld = String(pack.collection ?? "").startsWith("world.");
    if (!isWorld || !game.user.isGM) {
      ui.notifications.warn("Para salvar no compêndio: precisa ser GM e o pack precisa ser world.gambiarra-itens.");
      return null;
    }

    const created = await Item.createDocuments([data], { pack: pack.collection });
    const createdDoc = created?.[0];
    if (!createdDoc) return null;

    await pack.getIndex();
    return { pack, id: createdDoc.id, uuid: createdDoc.uuid, name: createdDoc.name };
  }

  async _listItemsFromPack(pack) {
    if (!pack) return [];
    await pack.getIndex();
    return [...pack.index.values()]
      .map((e) => ({ id: e._id, name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async _loadItemDoc(pack, id) {
    if (!pack || !id) return null;
    return pack.getDocument(id);
  }

  _hasDuplicateItem({ sourceId = null, name = "" } = {}) {
    const wantedSource = sourceId ? String(sourceId) : null;
    const wantedName = String(name ?? "").trim().toLowerCase();

    return this.items.some((i) => {
      if (i.type !== "item") return false;

      const existingSource = i.system?.sourceId ? String(i.system.sourceId) : null;
      if (wantedSource && existingSource && existingSource === wantedSource) return true;

      return wantedName && String(i.name ?? "").toLowerCase() === wantedName;
    });
  }

  _clamp13(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(3, Math.trunc(v)));
  }

  async _importItemToActor(pack, id, { overrideCargasMax = null } = {}) {
    const doc = await this._loadItemDoc(pack, id);
    if (!doc) return null;

    const sourceId = doc.uuid;
    const name = doc.name;

    if (this._hasDuplicateItem({ sourceId, name })) {
      ui.notifications.warn(`Este item já está na ficha: ${name}`);
      return null;
    }

    const tipoItem = String(doc.system?.tipoItem ?? "reliquia").trim();
    const cargasPadrao = this._clamp13(doc.system?.cargasMax ?? doc.system?.cargas ?? 1);
    const chosen = overrideCargasMax ? this._clamp13(overrideCargasMax) : cargasPadrao;

    const data = doc.toObject();
    delete data._id;

    data.type = "item";
    data.system = {
      ...(data.system ?? {}),
      sourceId,

      tipoItem,
      usado: false,

      cargasMax: tipoItem === "consumivel" ? chosen : 1,
      cargas: tipoItem === "consumivel" ? chosen : 1,

      efeito: String(data.system?.efeito ?? "reduzir")
    };

    delete data.system?.efeitosPossiveis;
    delete data.system?.reageABug;
    delete data.system?.efeitosBug;

    await this.createEmbeddedDocuments("Item", [data]);
    return data;
  }

  /* =========================================================
   * Escolher Item do Compêndio
   * ========================================================= */

  async _escolherItemDoCompendio() {
    const pack = await this._getItemsPack({ preferWorld: true });

    if (!pack) {
      ui.notifications.warn("Nenhum compêndio de itens encontrado.");
      return;
    }

    const entries = await this._listItemsFromPack(pack);
    if (entries.length === 0) {
      ui.notifications.warn("Compêndio de itens está vazio.");
      return;
    }

    const docsById = new Map();
    for (const e of entries) {
      const doc = await this._loadItemDoc(pack, e.id);
      if (doc) docsById.set(e.id, doc);
    }

    const mkTipoBadge = (doc) => {
      const tipo = String(doc?.system?.tipoItem ?? "reliquia");
      return tipo === "consumivel" ? "🔸 Consumível" : "🔹 Relíquia";
    };

    const mkOptionLabel = (e) => {
      const doc = docsById.get(e.id);
      const tipo = String(doc?.system?.tipoItem ?? "reliquia");
      const padrao = this._clamp13(doc?.system?.cargasMax ?? doc?.system?.cargas ?? 1);

      const efeito = String(doc?.system?.efeito ?? "reduzir");
      const effLabel = ITEM_EFFECT_LABEL[efeito] ?? ITEM_EFFECT_LABEL.reduzir;

      if (tipo === "consumivel") {
        return `${e.name} — 🔸 Consumível (${padrao} carga${padrao > 1 ? "s" : ""}) — ${effLabel}`;
      }
      return `${e.name} — 🔹 Relíquia — ${effLabel}`;
    };

    const firstAvailableId = (() => {
      for (const e of entries) {
        const doc = docsById.get(e.id);
        const dup = this._hasDuplicateItem({
          sourceId: doc?.uuid ?? null,
          name: doc?.name ?? e.name
        });
        if (!dup) return e.id;
      }
      return entries[0].id;
    })();

    const optionsHtml = entries
      .map((e) => {
        const doc = docsById.get(e.id);
        const dup = this._hasDuplicateItem({
          sourceId: doc?.uuid ?? null,
          name: doc?.name ?? e.name
        });

        const label = dup ? `${mkOptionLabel(e)} (já na ficha)` : mkOptionLabel(e);
        const dis = dup ? "disabled" : "";
        const sel = e.id === firstAvailableId ? "selected" : "";

        return `<option value="${e.id}" ${sel} ${dis}>${label}</option>`;
      })
      .join("");

    const dlg = new Dialog(
      {
        title: "🎒 Adicionar Item do Compêndio",
        content: `
          <form class="gambiarra-pick-item gambi-dialog-form">
            <div class="gambi-dialog-head">
              <div class="gambi-dialog-title">🎒 Adicionar Item do Compêndio</div>
              <div class="hint">Escolha um item do compêndio:</div>
            </div>

            <div class="form-group">
              <label>Item</label>
              <select name="itemId">${optionsHtml}</select>
            </div>

            <div class="form-group">
              <label>Tipo</label>
              <div class="hint item-type">—</div>
            </div>

            <div class="form-group">
              <label>Cargas (1–3)</label>
              <select name="cargasMax">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              <p class="hint">Só vale para Consumíveis.</p>
            </div>

            <div class="form-group">
              <label>Descrição</label>
              <div class="hint item-preview gambi-item-preview-box">
                Carregando...
              </div>
            </div>
          </form>
        `,
        buttons: {
          ok: {
            label: "Adicionar à ficha",
            callback: async (html) => {
              const id = html.find('[name="itemId"]').val();
              if (!id) return;

              const doc = docsById.get(id);
              const sourceId = doc?.uuid ?? null;
              const name = doc?.name ?? "";

              if (this._hasDuplicateItem({ sourceId, name })) {
                ui.notifications.warn(`Este item já está na ficha: ${name}`);
                return;
              }

              const tipo = String(doc?.system?.tipoItem ?? "reliquia");
              const cargasMax =
                tipo === "consumivel" ? this._clamp13(html.find('[name="cargasMax"]').val()) : 1;

              await this._importItemToActor(pack, id, { overrideCargasMax: cargasMax });
            }
          }
        },
        default: "ok",
        render: (html) => {
          const $select = html.find('[name="itemId"]');
          const $preview = html.find(".item-preview");
          const $type = html.find(".item-type");
          const $cargas = html.find('[name="cargasMax"]');

          const refresh = async () => {
            const id = $select.val();
            const doc = docsById.get(id);

            const desc = String(doc?.system?.descricao ?? "").trim();
            const tipo = String(doc?.system?.tipoItem ?? "reliquia");
            const padrao = this._clamp13(doc?.system?.cargasMax ?? doc?.system?.cargas ?? 1);

            $preview.text(desc || "(Sem descrição)");
            $type.text(mkTipoBadge(doc));

            if (tipo === "consumivel") {
              $cargas.prop("disabled", false);
              $cargas.val(String(padrao));
            } else {
              $cargas.prop("disabled", true);
              $cargas.val("1");
            }
          };

          $select.off("change.gambiItemPick").on("change.gambiItemPick", refresh);
          refresh();
        }
      },
      {
        width: 560,
        height: 520,
        resizable: true,
        classes: ["gambi-pick-item-dialog"]
      }
    );

    dlg.render(true);
  }

  /* =========================================================
   * ✅ Criar Item em mesa
   * ========================================================= */

  async _criarItemNoCompendioOuFicha() {
    if (!game.user.isGM) {
      ui.notifications.warn("Apenas a Programadora (GM) pode criar itens em mesa.");
      return;
    }

    const worldPack = game.packs.get("world.gambiarra-itens") ?? null;
    const canWritePack = !!worldPack && game.user.isGM;

    const content = `
      <form class="gambiarra-create-item gambi-dialog-form">
        <div class="gambi-dialog-head">
          <div class="gambi-dialog-title">🎒 Criar Item do Nó</div>
          <div class="hint">
            Crie um item junto com o grupo. O item tem <strong>um efeito travado</strong>
            e ele será registrado no chat quando for usado no <strong>Rolar Desafio</strong>.
          </div>
        </div>

        <div class="form-group">
          <label>Nome do Item</label>
          <input type="text" name="nome" placeholder="Ex: Frasco Vazio" />
        </div>

        <div class="form-group">
          <label>Descrição</label>
          <textarea name="descricao" rows="3" placeholder="O que ele sugere/permite na história?"></textarea>
        </div>

        <div class="form-group">
          <label>Categoria</label>
          <select name="categoria">
            <option value="direcao">🧭 Direção</option>
            <option value="gambiarra">🔧 Gambiarra</option>
            <option value="protecao">🛡️ Proteção</option>
            <option value="estranho">🎁 Estranho</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tipo</label>
          <select name="tipoItem">
            <option value="consumivel">🔸 Consumível (some quando usado)</option>
            <option value="reliquia">🔹 Relíquia (acompanha)</option>
          </select>
        </div>

        <!-- >>> ALTERADO (v0.6.3d): sem inline style; default de sugestão será controlado no render -->
        <div class="form-group gambi-consumivel-only gambi-is-hidden">
          <label>Cargas (consumível)</label>
          <select name="cargasMax">
            <option value="1">1</option>
            <option value="2">2</option>
            <!-- >>> ALTERADO (v0.6.3d): sugestão padrão = 3 -->
            <option value="3" selected>3</option>
          </select>
          <p class="hint gambi-consumivel-hint">
            Quando chegar a 0: o item vira “usado/sem carga” e o Nó absorve no chat.
          </p>
        </div>

        <hr/>

        <!-- >>> ALTERADO (v0.6.3d): bloco "Efeitos" com título e grid 2x2 -->
        <div class="gambi-block">
          <div class="gambi-block-title">Efeitos</div>

          <div class="gambi-radios">
            <label class="gambi-radio">
              <input type="radio" name="efeito" value="reduzir" checked />
              <span class="gambi-radio-text">
                <span class="gambi-radio-title">➖ Reduzir dificuldade</span>
                <span class="gambi-radio-sub">(mecânico)</span>
              </span>
            </label>

            <label class="gambi-radio">
              <input type="radio" name="efeito" value="roxo" />
              <span class="gambi-radio-text">
                <span class="gambi-radio-title">🟣 +1 dado roxo</span>
                <span class="gambi-radio-sub">(mecânico)</span>
              </span>
            </label>

            <label class="gambi-radio">
              <input type="radio" name="efeito" value="hackear" />
              <span class="gambi-radio-text">
                <span class="gambi-radio-title">🪢 Hackear o Nó</span>
                <span class="gambi-radio-sub">(registro)</span>
              </span>
            </label>

            <label class="gambi-radio">
              <input type="radio" name="efeito" value="trocar" />
              <span class="gambi-radio-text">
                <span class="gambi-radio-title">🔁 Trocar atributo</span>
                <span class="gambi-radio-sub">(registro)</span>
              </span>
            </label>
          </div>

          <p class="hint gambi-effect-hint">
            “Hackear o Nó” e “Trocar atributo” viram <strong>Notas</strong> no chat (sem efeito
            mecânico por enquanto).
          </p>
        </div>

        <hr/>

        ${canWritePack
          ? `<p class="hint">✅ Pode salvar em <strong>world.gambiarra-itens</strong>.</p>`
          : `<p class="hint">⚠️ Para salvar no compêndio: precisa existir <strong>world.gambiarra-itens</strong> e você ser GM.</p>`
        }
      </form>
    `;

    const read = (html) => {
      const nome = String(html.find('[name="nome"]').val() ?? "").trim();
      const descricao = String(html.find('[name="descricao"]').val() ?? "").trim();
      const categoria = String(html.find('[name="categoria"]').val() ?? "gambiarra").trim();
      const tipoItem = String(html.find('[name="tipoItem"]').val() ?? "reliquia").trim();

      const efeito = String(html.find('input[name="efeito"]:checked').val() ?? "reduzir").trim();

      const cargasMax =
        tipoItem === "consumivel" ? this._clamp13(html.find('[name="cargasMax"]').val() ?? 3) : 1;

      if (!nome) {
        ui.notifications.warn("Dê um nome para o Item.");
        return null;
      }
      if (!descricao) {
        ui.notifications.warn("Escreva uma descrição curta do item.");
        return null;
      }

      const effSafe = ["reduzir", "roxo", "hackear", "trocar"].includes(efeito) ? efeito : "reduzir";

      return {
        name: nome,
        type: "item",
        img: "icons/tools/misc/toolbox.webp",
        system: {
          categoria,
          tipoItem,
          cargasMax,
          cargas: tipoItem === "consumivel" ? cargasMax : 1,
          usado: false,
          descricao,
          efeito: effSafe,

          // corrupção (mantido)
          corrompido: false,
          corrupcoes: []
        }
      };
    };

    const dlg = new Dialog(
      {
        title: "🎒 Criar Item do Nó (em mesa)",
        content,
        buttons: {
          addActor: {
            label: "➕ Adicionar à ficha",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;
              await this.createEmbeddedDocuments("Item", [data]);
              ui.notifications.info("✅ Item adicionado à ficha.");
            }
          },

          savePack: {
            label: "📦 Salvar no Compêndio",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;

              if (!canWritePack) {
                ui.notifications.warn("Não consigo salvar no compêndio (precisa ser GM e pack world).");
                return;
              }

              const created = await this._createItemInWorldPack(data);
              if (!created) return;

              ui.notifications.info("✅ Item criado no compêndio do mundo.");
            }
          },

          saveAndAdd: {
            label: "✅ Salvar + Adicionar",
            callback: async (html) => {
              const data = read(html);
              if (!data) return;

              await this.createEmbeddedDocuments("Item", [data]);

              if (canWritePack) {
                await this._createItemInWorldPack(data);
                ui.notifications.info("✅ Item salvo no compêndio e adicionado à ficha.");
              } else {
                ui.notifications.warn("⚠️ Não deu para salvar no compêndio — mas o item foi adicionado à ficha.");
              }
            }
          }
        },
        default: "saveAndAdd",
        render: (html) => {
          const $tipo = html.find('select[name="tipoItem"]');
          const $cons = html.find(".gambi-consumivel-only");
          const $cargas = html.find('select[name="cargasMax"]');

          // >>> INSERIDO (v0.6.3d): mantém a "sugestão 3" só se usuário não mexeu
          let cargasTouched = false;
          $cargas.off("change.gambiCargas").on("change.gambiCargas", () => {
            cargasTouched = true;
          });

          const sync = () => {
            const tipo = String($tipo.val() ?? "reliquia");
            const isConsumivel = tipo === "consumivel";

            $cons.toggleClass("gambi-is-hidden", !isConsumivel);

            if (isConsumivel) {
              // sugere 3 ao exibir, mas respeita se o usuário já escolheu
              if (!cargasTouched) $cargas.val("3");
            }
          };

          $tipo.off("change.gambiConsumivel").on("change.gambiConsumivel", sync);

          // default inicial: Consumível (como já vinha), então exibe cargas e sugere 3
          sync();

          // foco no nome
          const $nome = html.find('[name="nome"]');
          if ($nome?.length) $nome.trigger("focus");
        }
      },
      {
        width: 640,
        height: 670,
        resizable: true,
        classes: ["gambi-create-item-dialog"]
      }
    );

    dlg.render(true);
  }
}
