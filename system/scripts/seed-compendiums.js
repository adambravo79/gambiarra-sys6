// scripts/seed-compendiums.js (v0.6.2)

/* =========================================================
 * PODERES
 * ========================================================= */

const WORLD_PACK = "world.gambiarra-poderes";
const SYSTEM_PACK = "gambiarra-sys6.gambiarra-poderes";
const POWERS_JSON_PATH = "data/poderes-gambiarra.json";
const WORLD_LABEL = "⚡ Poderes Gambiarra";

/* =========================================================
 * ITENS DO NÓ
 * ========================================================= */

const WORLD_ITEMS_PACK = "world.gambiarra-itens";
const SYSTEM_ITEMS_PACK = "gambiarra-sys6.gambiarra-itens";
const ITEMS_JSON_PATH = "data/itens-no.json";
const WORLD_ITEMS_LABEL = "🎒 Itens do Nó";

/* -------------------------
 * Helpers
 * ------------------------- */

async function fetchJson(path) {
  const url = `systems/gambiarra-sys6/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url} (${res.status})`);
  return res.json();
}

function normName(s) {
  return String(s ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

async function clearPack(pack) {
  await pack.getIndex();
  if (pack.index.size === 0) return;

  const ids = pack.index.map((e) => e._id);
  await Item.deleteDocuments(ids, { pack: pack.collection });

  await pack.getIndex();
}

/* -------------------------
 * Validate: PODERES
 * ------------------------- */

function validatePowersArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("JSON de poderes vazio ou inválido.");
  }

  const seen = new Set();

  for (const p of arr) {
    if (!p?.name || !p?.type) throw new Error("Poder sem name/type no JSON.");
    if (p.type !== "poder") {
      throw new Error(`Tipo inválido no JSON: ${p.type} (esperado: poder).`);
    }

    const key = normName(p.name);
    if (seen.has(key)) throw new Error(`Nome duplicado no JSON: "${p.name}"`);
    seen.add(key);

    p.system = p.system ?? {};
    p.system.descricao = String(p.system.descricao ?? "");

    p.system.categoria = String(p.system.categoria ?? "");
    p.system.origem = p.system.origem ?? "compendio";
    p.system.sourceId = String(p.system.sourceId ?? "");

    p.system.estado = p.system.estado ?? "ativo";
    p.system.usos = Number(p.system.usos ?? 0);

    p.system.limiteAtivo = Number(p.system.limiteAtivo ?? 2);
    p.system.limiteFora = Number(p.system.limiteFora ?? 3);

    p.system.efeitosPossiveis = Array.isArray(p.system.efeitosPossiveis)
      ? p.system.efeitosPossiveis
      : [];

    p.system.obsSeguranca = String(p.system.obsSeguranca ?? "");
  }

  return arr;
}

/* -------------------------
 * Validate: ITENS
 * ------------------------- */

function validateItemsArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("JSON de itens vazio ou inválido.");
  }

  const seen = new Set();

  for (const it of arr) {
    if (!it?.name || !it?.type) throw new Error("Item sem name/type no JSON.");
    if (it.type !== "item") {
      throw new Error(`Tipo inválido no JSON: ${it.type} (esperado: item).`);
    }

    const key = normName(it.name);
    if (seen.has(key)) throw new Error(`Nome duplicado no JSON: "${it.name}"`);
    seen.add(key);

    it.system = it.system ?? {};

    it.system.categoria = String(it.system.categoria ?? "gambiarra");
    it.system.tipoItem = it.system.tipoItem ?? "reliquia"; // reliquia|consumivel
    it.system.cargas = Number(it.system.cargas ?? 1);
    it.system.usado = Boolean(it.system.usado ?? false);
    it.system.descricao = String(it.system.descricao ?? "");

    it.system.efeitosPossiveis = Array.isArray(it.system.efeitosPossiveis)
      ? it.system.efeitosPossiveis
      : [];

    it.system.reageABug = Boolean(it.system.reageABug ?? false);

    // garante efeitosBug coerente
    it.system.efeitosBug = Array.isArray(it.system.efeitosBug)
      ? it.system.efeitosBug
      : [];

    if (it.system.reageABug && it.system.efeitosBug.length === 0) {
      it.system.efeitosBug = ["suavizar"];
    }
    if (!it.system.reageABug) {
      it.system.efeitosBug = [];
    }

    // corrupção (mantido)
    it.system.corrompido = Boolean(it.system.corrompido ?? false);
    it.system.corrupcoes = Array.isArray(it.system.corrupcoes)
      ? it.system.corrupcoes
      : [];
  }

  return arr;
}

/* -------------------------
 * Ensure world packs
 * ------------------------- */

async function ensureWorldPowersPack() {
  if (!game.user.isGM) return null;

  let pack = game.packs.get(WORLD_PACK);

  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: WORLD_LABEL,
      name: "gambiarra-poderes",
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  } else {
    const currentLabel = pack.metadata?.label ?? "";
    if (currentLabel !== WORLD_LABEL) {
      await pack.configure({ label: WORLD_LABEL });
    }
  }

  return pack;
}

async function ensureWorldItemsPack() {
  if (!game.user.isGM) return null;

  let pack = game.packs.get(WORLD_ITEMS_PACK);

  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: WORLD_ITEMS_LABEL,
      name: "gambiarra-itens",
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  } else {
    const currentLabel = pack.metadata?.label ?? "";
    if (currentLabel !== WORLD_ITEMS_LABEL) {
      await pack.configure({ label: WORLD_ITEMS_LABEL });
    }
  }

  return pack;
}

/* =========================================================
 * Seeds: PODERES
 * ========================================================= */

export async function seedWorldFromSystemPackIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPowersPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) {
    console.log(
      "GAMBIARRA.SYS6 | world.gambiarra-poderes já tem conteúdo; não seedo.",
    );
    return;
  }

  const basePack = game.packs.get(SYSTEM_PACK);
  if (!basePack) {
    ui.notifications.warn(
      "Pack base do sistema não encontrado (gambiarra-sys6.gambiarra-poderes).",
    );
    return;
  }

  await basePack.getIndex();
  if (basePack.index.size === 0) {
    console.warn(
      "GAMBIARRA.SYS6 | Pack base do sistema está vazio. Vou tentar seed pelo JSON.",
    );
    await seedWorldFromJsonIfEmpty();
    return;
  }

  const ids = basePack.index.map((e) => e._id);
  const docs = [];

  for (const id of ids) {
    const doc = await basePack.getDocument(id);
    const data = doc.toObject();
    delete data._id;
    docs.push(data);
  }

  await Item.createDocuments(docs, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | Seed concluído: ${docs.length} poderes em ${worldPack.collection}`,
  );
  ui.notifications.info(
    `✅ Seed: ${docs.length} poderes no compêndio do mundo.`,
  );
}

export async function seedWorldFromJsonIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPowersPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) return;

  const json = validatePowersArray(await fetchJson(POWERS_JSON_PATH));
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | Seed via JSON: ${json.length} poderes em ${worldPack.collection}`,
  );
  ui.notifications.info(
    `✅ Seed via JSON: ${json.length} poderes no compêndio do mundo.`,
  );
}

export async function resetWorldPackFromJson() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPowersPack();
  if (!worldPack) return;

  const json = validatePowersArray(await fetchJson(POWERS_JSON_PATH));

  await clearPack(worldPack);
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | RESET world pack via JSON: ${json.length} poderes em ${worldPack.collection}`,
  );
  ui.notifications.info(
    `🧹 Reset: ${json.length} poderes recriados no compêndio do mundo.`,
  );
}

/* =========================================================
 * Seeds: ITENS
 * ========================================================= */

export async function seedWorldItemsFromSystemPackIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldItemsPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) {
    console.log(
      "GAMBIARRA.SYS6 | world.gambiarra-itens já tem conteúdo; não seedo.",
    );
    return;
  }

  const basePack = game.packs.get(SYSTEM_ITEMS_PACK);
  if (!basePack) {
    // se não houver pack do sistema ainda, cai pro JSON
    await seedWorldItemsFromJsonIfEmpty();
    return;
  }

  await basePack.getIndex();
  if (basePack.index.size === 0) {
    await seedWorldItemsFromJsonIfEmpty();
    return;
  }

  const ids = basePack.index.map((e) => e._id);
  const docs = [];

  for (const id of ids) {
    const doc = await basePack.getDocument(id);
    const data = doc.toObject();
    delete data._id;
    docs.push(data);
  }

  await Item.createDocuments(docs, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | Seed concluído: ${docs.length} itens em ${worldPack.collection}`,
  );
  ui.notifications.info(`✅ Seed: ${docs.length} itens no compêndio do mundo.`);
}

export async function seedWorldItemsFromJsonIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldItemsPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) return;

  const json = validateItemsArray(await fetchJson(ITEMS_JSON_PATH));
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | Seed via JSON: ${json.length} itens em ${worldPack.collection}`,
  );
  ui.notifications.info(
    `✅ Seed via JSON: ${json.length} itens no compêndio do mundo.`,
  );
}

export async function resetWorldItemsPackFromJson() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldItemsPack();
  if (!worldPack) return;

  const json = validateItemsArray(await fetchJson(ITEMS_JSON_PATH));

  await clearPack(worldPack);
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(
    `GAMBIARRA.SYS6 | RESET itens via JSON: ${json.length} itens em ${worldPack.collection}`,
  );
  ui.notifications.info(
    `🧹 Reset: ${json.length} itens recriados no compêndio do mundo.`,
  );
}
