import { GambiarraActor } from "./actor.js";
import { GambiarraActorSheet } from "./actor-sheet.js";
import { GambiarraItem } from "./itens.js";
import { GambiarraItemSheet } from "./item-sheet.js";

Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema (v0.4)");

  // Tipos + labels (v12)
  CONFIG.Actor.defaultType = "character";
  CONFIG.Actor.typeLabels = {
    character: "Personagem",
    npc: "Entidade do Nó",
  };

  CONFIG.Item.defaultType = "item";
  CONFIG.Item.typeLabels = {
    item: "Item do Nó",
    poder: "Poder Gambiarra",
  };

  // Registrar Document classes
  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  // Registrar Sheets
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character"],
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra-sys6", GambiarraItemSheet, {
    makeDefault: true,
  });

  // Garantir tipo padrão (fallback)
  Hooks.on("preCreateActor", (doc, createData) => {
    if (!createData.type) doc.updateSource({ type: "character" });
  });

  // Config do sistema (v0.4): dificuldade define SUCESSOS + ALVO
  game.gambiarra = {
    config: {
      difficulties: {
        normal: { label: "Normal", successes: 1, target: 4 },
        complexo: { label: "Complexo", successes: 2, target: 4 },
        bug: { label: "BUG Leve", successes: 1, target: 5 },
        epico: { label: "Épico", successes: 2, target: 5 },
        impossivel: { label: "Impossível", successes: 3, target: 6 }
      }
    }
  };
});
