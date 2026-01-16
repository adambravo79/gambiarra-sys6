import { rollDesafio } from "./rolls.js";

export class GambiarraActor extends Actor {

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-desafio").click(() => rollDesafio(this));
    html.find(".add-power").click(() => this._despertarPoder());
    html.find(".clear-bug").click(() => this._resolverBug());
    html.find(".use-power").click(ev => {
      const index = ev.currentTarget.dataset.index;
      this._ativarPoder(index);
    });
    html.find(".use-item-bug").click(ev => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      const item = this.items.get(itemId);
      if (item) item.usarContraBug(this);
    });

  }

 /* ============================
  * PODER GAMBIARRA
  * ============================ */

  async _despertarPoder() {
    if (this.system.meta.poderes.length >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido.");
      return;
    }

    new Dialog({
      title: "⚡ Despertar Poder Gambiarra",
      content: `
        <p>Este poder surge de um momento narrativo intenso.</p>
        <div class="form-group">
          <label>Nome do Poder</label>
          <input type="text" name="nome"/>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="descricao"></textarea>
        </div>
      `,
      buttons: {
        ok: {
          label: "Despertar",
          callback: async (html) => {
            const nome = html.find('[name="nome"]').val();
            const descricao = html.find('[name="descricao"]').val();

            const poderes = duplicate(this.system.meta.poderes);
            poderes.push({
              nome,
              descricao,
              estado: "ativo",
              usos: 0
            });

            await this.update({ "system.meta.poderes": poderes });

            // BUG pesado costuma desaparecer após o despertar
            if (this.system.meta.bug.intensidade === "pesado") {
              await this._resolverBug();
            }
          }
        }
      }
    }).render(true);
  }

    async _usarPoder(index) {
    const poderes = duplicate(this.system.meta.poderes);
    const poder = poderes[index];

    if (!poder || poder.estado !== "ativo") {
      ui.notifications.warn("Este poder não pode ser usado agora.");
      return;
    }

    poder.usos += 1;

    // RISCO: quanto mais usa, mais instável
    if (poder.usos >= 3) {
      poder.estado = "fora";
      ui.notifications.warn(
        `⚠ O poder ${poder.nome} saiu do controle!`
      );
    }

    await this.update({ "system.meta.poderes": poderes });

    ui.notifications.info(
      `⚡ ${poder.nome} foi usado. A Programadora descreve o efeito.`
    );
  }

  async _resolverBug() {
    await this.update({
      "system.meta.bug": { ativo: false, intensidade: "leve", descricao: "" }
    });
  }
}
