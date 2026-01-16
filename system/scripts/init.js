Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema");

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
