import { GambiarraActor } from "./actor.js";
import { GambiarraActorSheet } from "./actor-sheet.js";
import { GambiarraItem } from "./itens.js";
import { GambiarraItemSheet } from "./item-sheet.js";

Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema");

  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra-sys6", GambiarraItemSheet, {
    types: ["item"],
    makeDefault: true
  });

  Hooks.on("preCreateActor", (actor, data) => {
    if (!data.type) actor.updateSource({ type: "character" });
  });

  game.gambiarra = {
    config: {
      difficulties: {
        normal: { label: "Normal", dice: 1, target: 4 },
        complexo: { label: "Complexo", dice: 2, target: 4 },
        bug: { label: "BUG Leve", dice: 1, target: 5 },
        epico: { label: "Épico", dice: 2, target: 5 },
        impossivel: { label: "Impossível", dice: 3, target: 6 }
      }
    }
  };
});
