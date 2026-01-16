import { rollDesafio } from "./rolls.js";

export class GambiarraActor extends Actor {
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-desafio").click(() => rollDesafio(this));
    html.find(".add-power").click(() => this._despertarPoder());
    html.find(".clear-bug").click(() => this._resolverBug());
    html.find(".use-item-bug").click((ev) => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      const item = this.items.get(itemId);
      if (item) item.usarContraBug(this);
    });
    html.find(".power-controls button").click((ev) => {
      const index = Number(ev.currentTarget.dataset.index);
      const novoEstado = ev.currentTarget.dataset.set;
      this._setPoderEstado(index, novoEstado);
    });
    html.find(".add-effect").click(() => this._adicionarEfeitoPermanente());
    html.find(".bug-effect").click(() => {
    this._converterBugEmEfeito();
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
              usos: 0,
              dadoRoxo: true,
              efeitosPossiveis: [], // preenchido narrativamente
            });

            await this.update({ "system.meta.poderes": poderes });

            if (this.system.meta.bug.intensidade === "pesado") {
              await this._resolverBug();
            }
          },
        },
      },
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
        descricao: "",
      },
    });
  }

  async _adicionarEfeitoPermanente() {
    new Dialog({
      title: "🧠 Registrar Efeito Permanente",
      content: `
      <div class="form-group">
        <label>Tipo</label>
        <select name="tipo">
          <option value="marcas">🧬 Marca do Nó</option>
          <option value="custos">💔 Custo Emocional</option>
          <option value="corrupcoes">🧩 Corrupção</option>
        </select>
      </div>

      <div class="form-group">
        <label>Nome</label>
        <input type="text" name="nome"/>
      </div>

      <div class="form-group">
        <label>Descrição</label>
        <textarea name="descricao"></textarea>
      </div>
    `,
      buttons: {
        ok: {
          label: "Registrar",
          callback: async (html) => {
            const tipo = html.find('[name="tipo"]').val();
            const nome = html.find('[name="nome"]').val();
            const descricao = html.find('[name="descricao"]').val();

            const lista = duplicate(this.system.meta[tipo] || []);
            lista.push({ nome, descricao });

            await this.update({ [`system.meta.${tipo}`]: lista });
          },
        },
      },
    }).render(true);
  }

  async _converterBugEmEfeito() {
  new Dialog({
    title: "🐞 BUG → Efeito Permanente",
    content: `
      <p>Este BUG deixou consequências duradouras.</p>

      <div class="form-group">
        <label>Tipo de efeito</label>
        <select name="tipo">
          <option value="marcas">🧬 Marca do Nó</option>
          <option value="custos">💔 Custo Emocional</option>
          <option value="corrupcoes">🧩 Corrupção</option>
        </select>
      </div>

      <div class="form-group">
        <label>Nome</label>
        <input type="text" name="nome"/>
      </div>

      <div class="form-group">
        <label>Descrição</label>
        <textarea name="descricao">
O BUG deixou algo que não desaparece.
        </textarea>
      </div>
    `,
    buttons: {
      ok: {
        label: "Registrar",
        callback: async html => {
          const tipo = html.find('[name="tipo"]').val();
          const nome = html.find('[name="nome"]').val();
          const descricao = html.find('[name="descricao"]').val();

          const lista = duplicate(this.system.meta[tipo] || []);
          lista.push({ nome, descricao });

          await this.update({
            [`system.meta.${tipo}`]: lista,
            "system.meta.bug.ativo": false
          });
        }
      }
    }
  }).render(true);
}

}
