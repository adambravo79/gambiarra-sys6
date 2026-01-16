import { rollDesafio } from "./rolls.js";

export class GambiarraActor extends Actor {

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-desafio").click(() => rollDesafio(this));
    html.find(".add-power").click(() => this._despertarPoder());
    html.find(".clear-bug").click(() => this._resolverBug());

    html.find(".use-item-bug").click(ev => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      const item = this.items.get(itemId);
      if (item) item.usarContraBug(this);
    });

    // NOVO: controle de estado dos Poderes (apenas visual/narrativo)
    html.find(".power-controls button").click(ev => {
      const index = Number(ev.currentTarget.dataset.index);
      const novoEstado = ev.currentTarget.dataset.set;
      this._setPoderEstado(index, novoEstado);
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
          callback: async html => {
            const nome = html.find('[name="nome"]').val();
            const descricao = html.find('[name="descricao"]').val();

            const poderes = duplicate(this.system.meta.poderes);
            poderes.push({
              nome,
              descricao,
              estado: "ativo",
              usos: 0,
              dadoRoxo: true
            });

            await this.update({ "system.meta.poderes": poderes });

            if (this.system.meta.bug.intensidade === "pesado") {
              await this._resolverBug();
            }
          }
        }
      }
    }).render(true);
  }

  async _setPoderEstado(index, estado) {
    const poderes = duplicate(this.system.meta.poderes);
    if (!poderes[index]) return;

    poderes[index].estado = estado;
    if (estado === "ativo") poderes[index].usos = 0;

    await this.update({ "system.meta.poderes": poderes });
  }

  async _resolverBug() {
    await this.update({
      "system.meta.bug": {
        ativo: false,
        intensidade: "leve",
        descricao: ""
      }
    });
  }
}
