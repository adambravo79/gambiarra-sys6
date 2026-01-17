import { GambiarraActor } from "./actor.js";
import { GambiarraActorSheet } from "./actor-sheet.js";

Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema");

  // 🔹 Registrar Actor customizado
  CONFIG.Actor.documentClass = GambiarraActor;

  // 🔹 Registrar ActorSheet (V12)
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character"],
    makeDefault: true
  });

  // 🔹 Garantir tipo padrão
  Hooks.on("preCreateActor", (actor, data) => {
    if (!data.type) {
      actor.updateSource({ type: "character" });
    }
  });

  // 🔹 Configuração global do sistema
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
