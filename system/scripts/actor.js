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

  async _despertarPoder() {
    if (this.system.meta.poderes.length >= 2) return;

    new Dialog({
      title: "Despertar Poder Gambiarra",
      content: `
        <p>Este poder nasce de um BUG intenso.</p>
        <input name="nome" placeholder="Nome do Poder"/>
        <textarea name="descricao" placeholder="O que ele faz"></textarea>
      `,
      buttons: {
        ok: {
          label: "Despertar",
          callback: async html => {
            const poderes = duplicate(this.system.meta.poderes);
            poderes.push({
              nome: html.find('[name="nome"]').val(),
              descricao: html.find('[name="descricao"]').val(),
              estado: "ativo",
              usos: 0
            });
            await this.update({ "system.meta.poderes": poderes });
          }
        }
      }
    }).render(true);
  }

  async _ativarPoder(index) {
    const poderes = duplicate(this.system.meta.poderes);
    const poder = poderes[index];

    poder.usos++;

    new Dialog({
      title: "Consequência do Poder",
      content: `
        <p>O poder força o Nó. Escolha o que acontece:</p>
        <button data="bug">🐞 Gerar BUG Pesado</button>
        <button data="esgotar">⚡ Poder Esgotado</button>
        <button data="controle">🔥 Fora de Controle</button>
      `,
      buttons: {}
    }).render(true);

    Hooks.once("renderDialog", (_, html) => {
      html.find("button").click(async ev => {
        const escolha = ev.currentTarget.dataset;

        if (escolha === "bug") {
          await this.update({
            "system.meta.bug": {
              ativo: true,
              intensidade: "pesado",
              descricao: "O poder chamou atenção demais."
            }
          });
        }

        if (escolha === "esgotar") poder.estado = "esgotado";
        if (escolha === "controle") poder.estado = "fora_de_controle";

        poderes[index] = poder;
        await this.update({ "system.meta.poderes": poderes });
      });
    });
  }

  async _resolverBug() {
    await this.update({
      "system.meta.bug": { ativo: false, intensidade: "leve", descricao: "" }
    });
  }
}
