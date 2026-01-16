import { rollDesafio } from "./rolls.js";

export class GambiarraActor extends Actor {

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-desafio").click(() => {
      rollDesafio(this);
    });

    html.find(".add-power").click(() => {
      this._despertarPoder();
    });
  }

  async _despertarPoder() {
    if (this.system.meta.poderes.length >= 2) {
      ui.notifications.warn("Limite máximo de Poderes Gambiarra atingido.");
      return;
    }

    new Dialog({
      title: "Despertar Poder Gambiarra",
      content: `
        <p>Este poder surge por causa de um momento narrativo importante.</p>
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
            poderes.push({ nome, descricao });

            await this.update({ "system.meta.poderes": poderes });
          }
        }
      }
    }).render(true);
  }
}
