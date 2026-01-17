// scripts/actor-sheet.js
import { rollDesafio } from "./rolls.js";

export class GambiarraActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "actor"],
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 720,
      height: 680,
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

    html.find(".roll-desafio").on("click", (ev) => {
      ev.preventDefault();
      rollDesafio(this.actor);
    });

    html.find(".clear-bug").on("click", (ev) => {
      ev.preventDefault();
      this.actor._resolverBug?.();
    });
  }
}
