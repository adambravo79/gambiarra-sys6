export class GambiarraActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "actor"],
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 720,
      height: 680,
      tabs: []
    });
  }

  getData() {
    const context = super.getData();

    return {
      ...context,
      system: context.actor.system,
      items: context.actor.items,
      isGM: game.user.isGM
    };
  }
}
