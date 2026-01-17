import { rollDesafio } from "./rolls.js";

export class GambiarraActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 600,
      height: 600
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll").click(ev => {
      const atributo = ev.currentTarget.dataset.attr;
      rollDesafio(this.actor, atributo);
    });
  }
}
