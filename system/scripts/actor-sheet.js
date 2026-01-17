import { rollDesafio } from "./rolls.js";

export class GambiarraActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "actor"],
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 720,
      height: 680,
      tabs: [],
    });
  }

  getData() {
    const context = super.getData();

    return {
      ...context,
      system: context.actor.system,
      items: context.actor.items,
      isGM: game.user.isGM,
    };
  }
  activateListeners(html) {
    super.activateListeners(html);

    const actor = this.actor;

    html.find(".roll-desafio").click((ev) => {
      ev.preventDefault();
      rollDesafio(actor);
    });

    html.find(".add-power").click(() => actor._despertarPoder());
    html.find(".clear-bug").click(() => actor._resolverBug());

    html.find(".add-effect").click(() => actor._adicionarEfeitoPermanente());

    html.find(".bug-effect").click(() => actor._converterBugEmEfeito());

    html.find(".use-item-bug").click((ev) => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      const item = actor.items.get(itemId);
      if (item) item.usarContraBug(actor);
    });

    html.find(".power-controls button").click((ev) => {
      const index = Number(ev.currentTarget.dataset.index);
      const novoEstado = ev.currentTarget.dataset.set;
      actor._setPoderEstado(index, novoEstado);
    });
  }
}
