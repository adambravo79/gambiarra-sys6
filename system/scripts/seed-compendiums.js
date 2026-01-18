const WORLD_PACK = "world.gambiarra-poderes";
const SYSTEM_PACK = "gambiarra-sys6.gambiarra-poderes";

// se você quiser seedar por JSON “hardcoded”, pode manter PODERES_40 aqui.
// Melhor: copiar do pack do sistema (SYSTEM_PACK).
export async function seedPoderesCompendio() {
  if (!game.user.isGM) return;

  // 1) garantir pack do mundo (editável)
  let worldPack = game.packs.get(WORLD_PACK);

  if (!worldPack) {
    // cria pack do mundo
    worldPack = await CompendiumCollection.createCompendium({
      label: "GAMBIARRA — Poderes",
      name: "gambiarra-poderes",
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  }

  await worldPack.getIndex();

  // Se já tem conteúdo, não seedar
  if (worldPack.index.size > 0) {
    console.log("GAMBIARRA.SYS6 | world.gambiarra-poderes já tem conteúdo; não seedo.");
    return;
  }

  // 2) fonte: pack do sistema (base)
  const basePack = game.packs.get(SYSTEM_PACK);
  if (!basePack) {
    ui.notifications.warn("Pack base do sistema não encontrado (gambiarra-sys6.gambiarra-poderes).");
    return;
  }

  await basePack.getIndex();

  if (basePack.index.size === 0) {
    ui.notifications.warn("Pack base do sistema está vazio.");
    return;
  }

  // 3) copiar documentos do pack base para o pack do mundo
  const ids = basePack.index.map((e) => e._id);

  const docs = [];
  for (const id of ids) {
    const doc = await basePack.getDocument(id);
    // toObject() traz o doc completo
    const data = doc.toObject();
    delete data._id; // novo ID no mundo
    docs.push(data);
  }

  await Item.createDocuments(docs, { pack: worldPack.collection });

  console.log(`GAMBIARRA.SYS6 | Seed concluído: ${docs.length} poderes em ${worldPack.collection}`);
}
