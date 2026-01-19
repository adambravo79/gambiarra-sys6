// scripts/itens.js (v0.6) — sem actor.update()

async function marcarConsumivelComoUsado(item) {
  await ChatMessage.create({
    content: `🪢 O Nó recebeu o item <strong>${item.name}</strong> e o absorveu na história.`,
  });
}

export class GambiarraItem extends Item {
  async corromper(descricao) {
    const corrupcoes = foundry.utils.duplicate(this.system.corrupcoes || []);
    corrupcoes.push({ descricao, origem: "BUG" });

    await this.update({
      "system.corrompido": true,
      "system.corrupcoes": corrupcoes,
    });
  }

  // ✅ uso normal na cena (só registra no chat)
  async usarNaCena(actor) {
    const content = `
      <p><strong>${this.name}</strong> entrou em cena.</p>
      <p class="hint">Escolha um efeito narrativo (só registra; não automatiza).</p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button data-efeito="reduzir">➖ Reduzir a dificuldade (1 passo)</button>
        <button data-efeito="dado">🎲 +1 dado (vira 🟣)</button>
        <button data-efeito="permitir">🧩 Permitir tentar algo que antes não dava</button>
        <button data-efeito="trocar">🔁 Trocar o atributo do desafio</button>
        <button data-efeito="complicar">🌀 Criar uma complicação interessante</button>
      </div>
    `;

    new Dialog({ title: "🎒 Usar Item", content, buttons: {} }).render(true);

    Hooks.once("renderDialog", (_, html) => {
      html.find("button").on("click", async (ev) => {
        const efeito = ev.currentTarget.dataset.efeito;
        this._postChatUso(actor, efeito, { context: "scene" });

        // ✅ se consumível: gasta
        if (this.system.tipoItem === "consumivel") {
          await this.gastarUmaCarga();
        }

        // fecha o diálogo
        html.closest(".app").find(".window-header a.close").click();
      });
    });
  }

  // ✅ uso “no BUG” (não precisa haver meta.bug; pergunta na hora)
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
      <p class="hint">Escolha como ele muda a situação (só registra; não automatiza).</p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button data-efeito="suavizar">🧯 Suavizar o BUG</button>
        <button data-efeito="anular">🛡️ Anular o BUG (nesta cena)</button>
        <button data-efeito="transformar">🔀 Transformar o BUG (vira outro tipo de custo)</button>
        <button data-efeito="dado">🎲 Converter em +1 🟣 no próximo teste</button>
      </div>
    `;

    new Dialog({ title: "🐞 Item no BUG", content, buttons: {} }).render(true);

    Hooks.once("renderDialog", (_, html) => {
      html.find("button").on("click", async (ev) => {
        const efeito = ev.currentTarget.dataset.efeito;
        this._postChatUso(actor, efeito, { context: "bug" });

        if (this.system.tipoItem === "consumivel") {
          await this.gastarUmaCarga();
        }

        html.closest(".app").find(".window-header a.close").click();
      });
    });
  }

  async gastarUmaCarga() {
    const usado = Boolean(this.system.usado);
    const cargas = Number(this.system.cargas ?? 0);

    if (usado || cargas <= 0) return;

    const novasCargas = Math.max(0, cargas - 1);
    const vaiFicarUsado = novasCargas === 0 && !usado;

    await this.update({
      "system.cargas": novasCargas,
      "system.usado": novasCargas === 0,
    });

    // ✅ Só posta quando acabou de virar "usado"
    if (vaiFicarUsado) {
      await marcarConsumivelComoUsado(this);
    }
  }

  _postChatUso(actor, efeito, { context }) {
    const tipo =
      this.system.tipoItem === "consumivel" ? "🔸 Consumível" : "🔹 Relíquia";

    const texto =
      {
        reduzir: "➖ Reduzir dificuldade (1 passo)",
        dado: "🎲 +1 dado (vira 🟣 no diálogo)",
        permitir: "🧩 Permitir a tentativa",
        trocar: "🔁 Trocar atributo do desafio",
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
