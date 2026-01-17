Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando v0.4");

  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra", GambiarraActorSheet, {
    types: ["character"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra", GambiarraItemSheet, {
    makeDefault: true
  });

  game.gambiarra = {
    difficulties: {
      normal: { label: "Normal", sucessos: 1, alvo: 4 },
      complexo: { label: "Complexo", sucessos: 2, alvo: 4 },
      bug: { label: "BUG Leve", sucessos: 1, alvo: 5 },
      epico: { label: "Épico", sucessos: 2, alvo: 5 },
      impossivel: { label: "Impossível", sucessos: 3, alvo: 6 }
    }
  };
});
