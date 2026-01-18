async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
  return res.json();
}

export async function seedPoderesCompendio() {
  if (!game.user.isGM) return;

  const PACK_KEY = "world.gambiarra-poderes";
  const LABEL = "⚡ Poderes Gambiarra";

  // 1) garantir que o compêndio existe
  let pack = game.packs.get(PACK_KEY);

  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: LABEL,
      name: "gambiarra-poderes",
      type: "Item",
      ownership: { PLAYER: "OBSERVER", TRUSTED: "OBSERVER", ASSISTANT: "OBSERVER", GAMEMASTER: "OWNER" },
    });
    ui.notifications.info(`Compêndio criado: ${LABEL}`);
  }

  // 2) se já tem coisa, não mexe (não duplica)
  const existing = await pack.getDocuments();
  if (existing.length > 0) return;

  // 3) importar do JSON do sistema
  const data = await fetchJson("systems/gambiarra-sys6/data/poderes-gambiarra.json");

  // normalizar entrada
  const docs = data.map((d) => ({
    name: d.name,
    type: "poder",
    system: d.system ?? {},
  }));

  await pack.importDocuments(docs);
  ui.notifications.info(`Poderes importados: ${docs.length} itens em ${LABEL}`);
}
