// scripts/itens.js (v0.6.2a)
// - Itens: chat + pendência para próxima rolagem (system.meta.pendingItemEffect)
// - Consumíveis: gastam 1 carga e, ao zerar, marcam usado + "🪢 Nó recebeu..."

export class GambiarraItem extends Item {
  async corromper(descricao) {
    const corrupcoes = foundry.utils.duplicate(this.system.corrupcoes || []);
    corrupcoes.push({ descricao, origem: "BUG" });

    await this.update({
      "system.corrompido": true,
      "system.corrupcoes": corrupcoes,
    });
  }

  async usarNaCena(actor) {
    const content = `
      <p><strong>${this.name}</strong> entrou em cena.</p>
      <p class="hint">Escolha um efeito narrativo (registra + prepara a próxima rolagem quando fizer sentido).</p>
      <div class="gambi-item-buttons" style="display:flex; flex-direction:column; gap:8px;">
        <button type="button" data-efeito="reduzir">➖ Reduzir a dificuldade (1 passo)</button>
        <button type="button" data-efeito="dado">🎲 +1 dado (vira 🟣)</button>
        <button type="button" data-efeito="permitir">🧩 Permitir tentar algo que antes não dava</button>
        <button type="button" data-efeito="trocar">🔁 Trocar o atributo do desafio</button>
        <button type="button" data-efeito="complicar">🌀 Criar uma complicação interessante</button>
      </div>
    `;

    const dlg = new Dialog({
      title: "🎒 Usar Item",
      content,
      buttons: {},
      render: (html) => {
        html.find(".gambi-item-buttons button").on("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          const efeito = ev.currentTarget.dataset.efeito;

          await this._applyPendingToActor(actor, efeito, { mode: "scene" });
          this._postChatUso(actor, efeito, { context: "scene" });

          if (this.system.tipoItem === "consumivel") {
            await this.gastarUmaCarga({ announceNo: true });
          }

          dlg.close();
        });
      },
    });

    dlg.render(true);
  }

  async usarContraBug(actor) {
    const confirmar = await Dialog.confirm({
      title: "🐞 BUG Narrativo",
      content: "<p>Existe um BUG ativo na cena?</p>",
    });

    if (!confirmar) {
      ui.notifications.info("Ok — sem BUG na cena.");
      return;
    }

    const content = `
      <p><strong>${this.name}</strong> reage ao BUG.</p>
      <p class="hint">Escolha como ele muda a situação (registra + pode preparar a próxima rolagem).</p>
      <div class="gambi-item-buttons" style="display:flex; flex-direction:column; gap:8px;">
        <button type="button" data-efeito="suavizar">🧯 Suavizar o BUG</button>
        <button type="button" data-efeito="anular">🛡️ Anular o BUG (nesta cena)</button>
        <button type="button" data-efeito="transformar">🔀 Transformar o BUG (vira outro tipo de custo)</button>
        <button type="button" data-efeito="dado">🎲 Converter em +1 🟣 no próximo teste</button>
      </div>
    `;

    const dlg = new Dialog({
      title: "🐞 Item no BUG",
      content,
      buttons: {},
      render: (html) => {
        html.find(".gambi-item-buttons button").on("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          const efeito = ev.currentTarget.dataset.efeito;

          await this._applyPendingToActor(actor, efeito, { mode: "bug" });
          this._postChatUso(actor, efeito, { context: "bug" });

          if (this.system.tipoItem === "consumivel") {
            await this.gastarUmaCarga({ announceNo: true });
          }

          dlg.close();
        });
      },
    });

    dlg.render(true);
  }

  async _applyPendingToActor(actor, efeito, { mode = "scene" } = {}) {
    if (!actor) return;

    // só alguns efeitos fazem sentido pra "próximo teste"
    const wantsPending =
      efeito === "reduzir" || efeito === "dado" || efeito === "trocar";

    if (!wantsPending) return;

    const pending = {
      itemId: this.id,
      itemName: this.name,
      mode,
      effect: efeito,
      note:
        efeito === "trocar"
          ? "🔁 Trocar atributo do desafio (narrativo)"
          : "",
    };

    await actor.update({ "system.meta.pendingItemEffect": pending });

    // feedback curto
    const label =
      {
        reduzir: "➖ Reduzir dificuldade (1 passo) no próximo teste",
        dado: "🟣 +1 dado roxo no próximo teste",
        trocar: "🔁 Trocar atributo (apenas narrativo) no próximo teste",
      }[efeito] ?? "Efeito preparado";

    ui.notifications.info(`🎒 ${this.name}: ${label}`);
  }

  async gastarUmaCarga({ announceNo = false } = {}) {
    const tipo = String(this.system.tipoItem ?? "reliquia");
    if (tipo !== "consumivel") return;

    const usado = Boolean(this.system.usado);
    const cargasRaw = Number(this.system.cargas ?? 0);

    if (usado) return;

    const cargasSafe =
      Math.max(0, Math.trunc(Number.isFinite(cargasRaw) ? cargasRaw : 0)) || 1;

    const novasCargas = Math.max(0, cargasSafe - 1);
    const virouUsado = novasCargas === 0;

    await this.update({
      "system.cargas": novasCargas,
      "system.usado": virouUsado,
    });

    if (announceNo && virouUsado) {
      await this._postChatRecebidoPeloNo();
    }
  }

  async _postChatRecebidoPeloNo() {
    ChatMessage.create({
      content: `🪢 O Nó recebeu o item <strong>${this.name}</strong> e o absorveu na história.`,
    });
  }

  _postChatUso(actor, efeito, { context }) {
    const tipo =
      this.system.tipoItem === "consumivel" ? "🔸 Consumível" : "🔹 Relíquia";

    const texto =
      {
        reduzir: "➖ Reduzir dificuldade (1 passo)",
        dado: "🎲 +1 dado (vira 🟣 no próximo teste)",
        permitir: "🧩 Permitir a tentativa",
        trocar: "🔁 Trocar atributo do desafio (narrativo)",
        complicar: "🌀 Criar complicação narrativa",

        suavizar: "🧯 Suavizar BUG",
        anular: "🛡️ Anular BUG (nesta cena)",
        transformar: "🔀 Transformar BUG",
      }[efeito] ?? efeito;

    const html = `
      <div class="gambi-item-chat">
        <div><strong>🎒 Item:</strong> ${this.name} <span class="hint">(${tipo})</span></div>
        <div><strong>👤 Personagem:</strong> ${actor?.name ?? "—"}</div>
        <div><strong>${context === "bug" ? "🐞 No BUG" : "🎬 Na cena"}:</strong> ${texto}</div>
      </div>
    `;

    ChatMessage.create({ content: html });
  }
}
