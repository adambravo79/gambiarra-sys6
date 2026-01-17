import { rollDesafio } from "./rolls.js";

export class GambiarraActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "actor"],
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 720,
      height: 680,
      tabs: [],
      submitOnChange: true,
      submitOnClose: true,
    });
  }

  getData() {
    const context = super.getData();

    const corpo = Number(context.actor.system?.attributes?.corpo?.value ?? 0);
    const mente = Number(context.actor.system?.attributes?.mente?.value ?? 0);
    const coracao = Number(
      context.actor.system?.attributes?.coracao?.value ?? 0,
    );

    const attrSum = corpo + mente + coracao;
    const attrOk = corpo >= 1 && mente >= 1 && coracao >= 1 && attrSum === 6;

    return {
      ...context,
      system: context.actor.system,
      items: context.actor.items,
      isGM: game.user.isGM,

      // ✅ NOVO (feedback visual)
      attrSum,
      attrOk,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-desafio").on("click", () => rollDesafio(this.actor));

    html.find(".clear-bug").on("click", () => this.actor._resolverBug?.());
    html.find(".add-power").on("click", () => this.actor._despertarPoder?.());
    html
      .find(".add-effect")
      .on("click", () => this.actor._adicionarEfeitoPermanente?.());
    html
      .find(".bug-effect")
      .on("click", () => this.actor._converterBugEmEfeito?.());

    html.find(".use-item-bug").on("click", (ev) => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item?.usarContraBug) item.usarContraBug(this.actor);
    });

    html.find(".power-controls button").on("click", (ev) => {
      const index = Number(ev.currentTarget.dataset.index);
      const novoEstado = ev.currentTarget.dataset.set;
      this.actor._setPoderEstado?.(index, novoEstado);
    });

    // Se já existir, não duplica
    if (!html.find(".gambiarra-sumbar").length) {
      html.find(".attributes").append(`
      <div class="gambiarra-sumbar ok">
        <div class="sum-left">
          <span>📐 Soma</span>
          <span class="sum-pill">6</span>
        </div>
        <div class="sum-right">Regra opcional ativa</div>
      </div>
    `);
    }
    const updateSumbar = () => {
      const c =
        Number(html.find('[name="system.attributes.corpo.value"]').val()) || 0;
      const m =
        Number(html.find('[name="system.attributes.mente.value"]').val()) || 0;
      const co =
        Number(html.find('[name="system.attributes.coracao.value"]').val()) ||
        0;
      const sum = c + m + co;

      const $bar = html.find(".gambiarra-sumbar");
      $bar.find(".sum-pill").text(String(sum));

      if (sum === 6 && c >= 1 && m >= 1 && co >= 1) {
        $bar.removeClass("bad").addClass("ok");
        $bar.find(".sum-right").text("OK ✅ (Soma = 6)");
      } else {
        $bar.removeClass("ok").addClass("bad");
        $bar.find(".sum-right").text("Ajuste para Soma = 6 (mínimo 1 em cada)");
      }
    };

    // Atualiza ao digitar
    html
      .find('[name="system.attributes.corpo.value"]')
      .on("input", updateSumbar);
    html
      .find('[name="system.attributes.mente.value"]')
      .on("input", updateSumbar);
    html
      .find('[name="system.attributes.coracao.value"]')
      .on("input", updateSumbar);

    // Estado inicial
    updateSumbar();
  }

  async _updateObject(event, formData) {
    // Atualiza normal
    // (mas antes: regra opcional soma=6)
    const enforce = game.gambiarra?.config?.enforceSum6 ?? false;
    if (enforce) {
      const corpo = Number(
        formData["system.attributes.corpo.value"] ??
          this.actor.system.attributes.corpo.value,
      );
      const mente = Number(
        formData["system.attributes.mente.value"] ??
          this.actor.system.attributes.mente.value,
      );
      const coracao = Number(
        formData["system.attributes.coracao.value"] ??
          this.actor.system.attributes.coracao.value,
      );

      const sum = corpo + mente + coracao;
      const hasZero = corpo < 1 || mente < 1 || coracao < 1;

      if (hasZero || sum !== 6) {
        ui.notifications.warn(
          "Regra opcional: Corpo+Mente+Coração deve somar 6 e nenhum pode ser 0.",
        );
        return;
      }
    }

    return this.actor.update(formData);
  }
}
