// scripts/actor.js

const POWERS_PACK_IDS = [
  "world.gambiarra-poderes",          // ✅ editável
  "gambiarra-sys6.gambiarra-poderes", // fallback leitura
];

// fallback (só para não travar se pack sumir)
const FALLBACK_POWERS = [
  { nome: "Rebobinar", descricao: "Volta o tempo ~10 segundos para refazer uma ação recente." },
  { nome: "Pulo de Glitch", descricao: "Teletransporte curto (até 5m) para onde você está olhando." },
  { nome: "Gravidade Zero", descricao: "Flutua ou anda no teto por alguns segundos." },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normName(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export class GambiarraActor extends Actor {

  /* =========================================================
   * Helpers — packs
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
      efeitosPossiveis: Array.isArray(data.system?.efeitosPossiveis)
        ? data.system.efeitosPossiveis
        : [],
      obsSeguranca: String(data.system?.obsSeguranca ?? ""),
      origem: data.system?.origem ?? "compendio",
      sourceId,
    };

    await this.createEmbeddedDocuments("Item", [data]);
    return data;
  }

  async _criarPoderEmbedado({ nome, descricao, categoria = "", obsSeguranca = "", meta = {} }) {
    if (this._hasDuplicatePower({ sourceId: meta.sourceId ?? null, name: nome })) {
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
        sourceId: meta.sourceId ?? null,
      },
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
   *   ✅ desabilita duplicados no dropdown + "(já na ficha)"
   *   ✅ aumenta "um pouco" via spacer (sem esticar botão)
   * ========================================================= */

  async _despertarPoder({ sortear = false, selectedId = null } = {}) {
    if (!this._canAddPower()) return;

    const pack = await this._getPack({ preferWorld: true });

    if (pack) {
      const entries = await this._listPowersFromPack(pack);

      if (entries.length > 0) {
        // SORTear (tenta evitar duplicado)
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

        // pré-carrega docs para ter uuid/descricao e marcar duplicados com precisão
        const docsById = new Map();
        for (const e of entries) {
          const doc = await this._loadPowerDoc(pack, e.id);
          if (doc) docsById.set(e.id, doc);
        }

        // selecionado inicial
        const requestedId =
          selectedId && entries.some((e) => e.id === selectedId) ? selectedId : null;

        const firstAvailableId = (() => {
          for (const e of entries) {
            const doc = docsById.get(e.id);
            const dup = this._hasDuplicatePower({ sourceId: doc?.uuid ?? null, name: doc?.name ?? e.name });
            if (!dup) return e.id;
          }
          return entries[0].id;
        })();

        const initialId = (() => {
          if (!requestedId) return firstAvailableId;

          const doc = docsById.get(requestedId);
          const dup = this._hasDuplicatePower({ sourceId: doc?.uuid ?? null, name: doc?.name ?? "" });
          return dup ? firstAvailableId : requestedId;
        })();

        const optionsHtml = entries
          .map((e) => {
            const doc = docsById.get(e.id);
            const dup = this._hasDuplicatePower({ sourceId: doc?.uuid ?? null, name: doc?.name ?? e.name });
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
                <div class="hint power-preview" style="border:1px solid #0002; border-radius:10px; padding:10px; min-height:110px;">
                  Carregando...
                </div>
              </div>

              <p class="hint dup-warning" style="display:none; margin-top:8px;">
                ⚠️ Este poder já está na ficha.
              </p>

              <div class="gambiarra-dialog-spacer" style="height: 48px;"></div>
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
              },
            },
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
              $warn.toggle(dup);
            };

            $select.on("change", refresh);
            refresh();
          },
        }).render(true);

        return;
      }
    }

    // fallback
    ui.notifications.warn("Compêndio vazio/indisponível — usando fallback interno.");
    const p = sortear ? pickRandom(FALLBACK_POWERS) : FALLBACK_POWERS[0];
    await this._criarPoderEmbedado({
      nome: p.nome,
      descricao: p.descricao,
      meta: { origem: "fallback" },
    });
  }

  /* =========================================================
   * Criar Poder em mesa (salvar no world e/ou adicionar na ficha)
   * ========================================================= */

  async _criarPoderNoCompendioOuFicha() {
    const worldPack = game.packs.get("world.gambiarra-poderes") ?? null;
    const canWritePack = !!worldPack && game.user.isGM;

    const content = `
      <form class="gambiarra-create-power">
        <p class="hint">
          Crie um poder junto com as crianças. Você pode salvar no compêndio do mundo e/ou adicionar à ficha.
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
          <input type="text" name="obsSeguranca" placeholder="Ex: manter leve, sem violência gráfica." />
        </div>

        ${
          canWritePack
            ? `<p class="hint">✅ Vai salvar em <strong>world.gambiarra-poderes</strong>.</p>`
            : `<p class="hint">⚠️ Para salvar no compêndio: precisa existir <strong>world.gambiarra-poderes</strong> e você ser GM.</p>`
        }
      </form>
    `;

    const read = (html) => {
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
          label: "➕ Criar no Compêndio",
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
            await this._despertarPoder({ sortear: false, selectedId: created.id });
          },
        },

        addActor: {
          label: "➕ Adicionar à ficha",
          callback: async (html) => {
            const data = read(html);
            if (!data) return;
            if (!this._canAddPower()) return;

            if (this._hasDuplicatePower({ name: data.name })) {
              ui.notifications.warn(`Este poder já está na ficha: ${data.name}`);
              return;
            }

            await this._criarPoderEmbedado({
              nome: data.name,
              descricao: data.system.descricao,
              categoria: data.system.categoria,
              obsSeguranca: data.system.obsSeguranca,
              meta: { origem: "criado-em-mesa" },
            });

            ui.notifications.info("✅ Poder adicionado à ficha.");
          },
        },

        saveAndAdd: {
          label: "✅ Criar + Adicionar",
          callback: async (html) => {
            const data = read(html);
            if (!data) return;
            if (!this._canAddPower()) return;

            if (this._hasDuplicatePower({ name: data.name })) {
              ui.notifications.warn(`Este poder já está na ficha: ${data.name}`);
              return;
            }

            let created = null;

            if (canWritePack) {
              created = await this._createPowerInWorldPack(data);
              if (created) ui.notifications.info("✅ Poder salvo no compêndio do mundo.");
            } else {
              ui.notifications.warn("⚠️ Não deu para salvar no compêndio — vou apenas adicionar à ficha.");
            }

            if (created?.pack && created?.id) {
              await this._importPowerToActor(created.pack, created.id);
              ui.notifications.info("✅ Poder adicionado à ficha (vindo do compêndio).");
              return;
            }

            await this._criarPoderEmbedado({
              nome: data.name,
              descricao: data.system.descricao,
              categoria: data.system.categoria,
              obsSeguranca: data.system.obsSeguranca,
              meta: { origem: "criado-em-mesa" },
            });
            ui.notifications.info("✅ Poder adicionado à ficha.");
          },
        },
      },
      default: "saveAndAdd",
    }).render(true);
  }
}
