import { GambiarraActor } from "./actor.js";
import { GambiarraActorSheet } from "./actor-sheet.js";

import { GambiarraItem } from "./itens.js";
import { GambiarraItemSheet } from "./item-sheet.js";

import { GambiarraCharacterModel } from "./data/actor-character-model.js";
import { GambiarraNpcModel } from "./data/actor-npc-model.js";
import { GambiarraItemModel } from "./data/item-item-model.js";
import { GambiarraPoderModel } from "./data/item-poder-model.js";

import {
  seedWorldFromSystemPackIfEmpty,
  seedWorldItemsFromSystemPackIfEmpty,
} from "./seed-compendiums.js";

Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema (v0.5)");

  // ✅ V12: registrar DataModels por tipo
  CONFIG.Actor.dataModels = {
    character: GambiarraCharacterModel,
    npc: GambiarraNpcModel,
  };

  CONFIG.Item.dataModels = {
    item: GambiarraItemModel,
    poder: GambiarraPoderModel,
  };

  // Tipos + labels no diálogo de criação
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

  // Document classes
  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  // Sheets
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra-sys6", GambiarraItemSheet, {
    makeDefault: true,
  });

  // Fallback: se algum fluxo tentar criar sem type
  Hooks.on("preCreateActor", (doc, createData) => {
    if (!createData.type) doc.updateSource({ type: "character" });
  });

  // Config do sistema (v0.5): dificuldade = sucessos necessários + alvo
  game.gambiarra = {
    config: {
      difficulties: {
        normal: { label: "Normal", required: 1, target: 4 },
        complexo: { label: "Complexo", required: 2, target: 4 },
        bug: { label: "BUG Leve", required: 1, target: 5 },
        epico: { label: "Épico", required: 2, target: 5 },
        impossivel: { label: "Impossível", required: 3, target: 6 },
      },
    },
  };

  // ✅ Dice So Nice: registrar colorsets com IDs estáveis (name = id)
  Hooks.once("diceSoNiceReady", (dice3d) => {
    try {
      const category = "GAMBIARRA.SYS6";

      // Corpo = verde
      dice3d.addColorset?.({
        name: "gambi-corpo", // ✅ ID que vamos usar no rolls.js
        description: "Corpo (Verde)",
        category,
        foreground: "#ffffff",
        background: "#1fb35b",
        outline: "#0a3d22",
        edge: "#1fb35b",
      });

      // Mente = azul
      dice3d.addColorset?.({
        name: "gambi-mente",
        description: "Mente (Azul)",
        category,
        foreground: "#ffffff",
        background: "#2f7de1",
        outline: "#123a73",
        edge: "#2f7de1",
      });

      // Coração = vermelho
      dice3d.addColorset?.({
        name: "gambi-coracao",
        description: "Coração (Vermelho)",
        category,
        foreground: "#ffffff",
        background: "#e24a4a",
        outline: "#6e1515",
        edge: "#e24a4a",
      });

      // Roxo = bônus
      dice3d.addColorset?.({
        name: "gambi-roxo",
        description: "Dado Roxo (Bônus)",
        category,
        foreground: "#ffffff",
        background: "#8a4de8",
        outline: "#3a1b6e",
        edge: "#8a4de8",
      });

      console.log(
        "🎲 GAMBIARRA.SYS6 | Dice So Nice colorsets registrados (IDs estáveis)",
      );
    } catch (e) {
      console.warn(
        "GAMBIARRA.SYS6 | Falha ao registrar colorsets do Dice So Nice",
        e,
      );
    }
  });
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  await seedWorldFromSystemPackIfEmpty();
  await seedWorldItemsFromSystemPackIfEmpty();
});
