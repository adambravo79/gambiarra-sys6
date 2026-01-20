// scripts/seed-compendiums.js (v0.6.2)

/* =========================================================
 * PODERES
 * ========================================================= */

const WORLD_PACK = "world.gambiarra-poderes";
const SYSTEM_PACK = "gambiarra-sys6.gambiarra-poderes";
const POWERS_JSON_PATH = "data/poderes-gambiarra.json";
const WORLD_LABEL = "⚡ Poderes Gambiarra";

/* =========================================================
 * ITENS DO NO
 * ========================================================= */

const WORLD_ITEMS_PACK = "world.gambiarra-itens";
const SYSTEM_ITEMS_PACK = "gambiarra-sys6.gambiarra-itens";
const ITEMS_JSON_PATH = "data/itens-no.json";
const WORLD_ITEMS_LABEL = "🎒 Itens do Nó";

/* -------------------------
 * Helpers
 * ------------------------- */

async function fetchJson(path) {
  // usa o ID do sistema (gambiarra-sys6) e path relativo dentro do zip
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
    if (p.type !== "poder")
      throw new Error(`Tipo inválido no JSON: ${p.type} (esperado: poder).`);

    const key = normName(p.name);
    if (seen.has(key)) throw new Error(`Nome duplicado no JSON: "${p.name}"`);
    seen.add(key);

    p.system = p.system ?? {};
    p.system.descricao = String(p.system.descricao ?? "");

    p.system.categoria = String(p.system.categoria ?? "");
    p.system.origem = p.system.origem ?? "compendio";
    p.system.sourceId = p.system.sourceId ?? "";

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

  const validTipoItem = new Set(["reliquia", "consumivel"]);
  const validCategorias = new Set([
    "direcao",
    "gambiarra",
    "protecao",
    "estranho",
  ]);

  // efeitos que você já usa nos botões / lógica
  const validEfeitosCena = new Set([
    "reduzir",
    "dado",
    "permitir",
    "trocar",
    "complicar",
  ]);
  const validEfeitosBug = new Set([
    "suavizar",
    "anular",
    "transformar",
    "dado",
  ]);

  for (const it of arr) {
    if (!it?.name || !it?.type) throw new Error("Item sem name/type no JSON.");
    if (it.type !== "item")
      throw new Error(`Tipo inválido no JSON: ${it.type} (esperado: item).`);

    const key = normName(it.name);
    if (seen.has(key)) throw new Error(`Nome duplicado no JSON: "${it.name}"`);
    seen.add(key);

    it.system = it.system ?? {};

    // defaults seguros
    it.system.descricao = String(it.system.descricao ?? "");
    it.system.categoria = String(it.system.categoria ?? "");

    // categoria: se vier desconhecida, mantém "estranho" como fallback
    if (!validCategorias.has(it.system.categoria)) {
      it.system.categoria = it.system.categoria
        ? it.system.categoria
        : "estranho";
    }

    // tipoItem: default reliquia
    it.system.tipoItem = String(it.system.tipoItem ?? "reliquia");
    if (!validTipoItem.has(it.system.tipoItem)) it.system.tipoItem = "reliquia";

    // cargas/usado
    it.system.cargas = Number.isFinite(Number(it.system.cargas))
      ? Number(it.system.cargas)
      : 1;
    if (it.system.cargas < 0) it.system.cargas = 0;

    it.system.usado = Boolean(it.system.usado);

    // coerência: consumível com 0 cargas => usado true
    if (it.system.tipoItem === "consumivel" && it.system.cargas === 0) {
      it.system.usado = true;
    }

    // efeitosPossiveis (cena)
    it.system.efeitosPossiveis = Array.isArray(it.system.efeitosPossiveis)
      ? it.system.efeitosPossiveis.map((s) => String(s)).filter(Boolean)
      : [];

    // filtra inválidos
    it.system.efeitosPossiveis = it.system.efeitosPossiveis.filter((e) =>
      validEfeitosCena.has(e),
    );

    // BUG
    it.system.reageABug = Boolean(it.system.reageABug);

    it.system.efeitosBug = Array.isArray(it.system.efeitosBug)
      ? it.system.efeitosBug.map((s) => String(s)).filter(Boolean)
      : [];

    // filtra inválidos
    it.system.efeitosBug = it.system.efeitosBug.filter((e) =>
      validEfeitosBug.has(e),
    );

    // regra: se reage a BUG e não veio nada, dá um default
    if (it.system.reageABug && it.system.efeitosBug.length === 0) {
      it.system.efeitosBug = ["suavizar"];
    }

    // regra: se não reage a BUG, força vazio
    if (!it.system.reageABug) {
      it.system.efeitosBug = [];
    }
  }

  return arr;
}

/* =========================================================
 * Pack do mundo (PODERES)
 * ========================================================= */

async function ensureWorldPack() {
  if (!game.user.isGM) return null;

  let worldPack = game.packs.get(WORLD_PACK);

  if (!worldPack) {
    worldPack = await CompendiumCollection.createCompendium({
      label: WORLD_LABEL,
      name: "gambiarra-poderes", // mantém world.gambiarra-poderes
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  } else {
    const currentLabel = worldPack.metadata?.label ?? "";
    if (currentLabel !== WORLD_LABEL) {
      await worldPack.configure({ label: WORLD_LABEL });
    }
  }

  return worldPack;
}

/* =========================================================
 * Pack do mundo (ITENS)
 * ========================================================= */

async function ensureWorldItemsPack() {
  if (!game.user.isGM) return null;

  let worldPack = game.packs.get(WORLD_ITEMS_PACK);

  if (!worldPack) {
    worldPack = await CompendiumCollection.createCompendium({
      label: WORLD_ITEMS_LABEL,
      name: "gambiarra-itens", // vira world.gambiarra-itens
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  } else {
    const currentLabel = worldPack.metadata?.label ?? "";
    if (currentLabel !== WORLD_ITEMS_LABEL) {
      await worldPack.configure({ label: WORLD_ITEMS_LABEL });
    }
  }

  return worldPack;
}
/* =========================================================
 * Seeds: PODERES
 * ========================================================= */

export async function seedWorldFromSystemPackIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPack();
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

  const worldPack = await ensureWorldPack();
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

  const worldPack = await ensureWorldPack();
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

// 1) Seed do world items a partir do pack base do sistema, se existir (opcional) e world estiver vazio
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
    console.warn(
      "GAMBIARRA.SYS6 | Pack base de itens do sistema não encontrado. Vou tentar seed pelo JSON.",
    );
    await seedWorldItemsFromJsonIfEmpty();
    return;
  }

  await basePack.getIndex();
  if (basePack.index.size === 0) {
    console.warn(
      "GAMBIARRA.SYS6 | Pack base de itens do sistema está vazio. Vou tentar seed pelo JSON.",
    );
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

// 2) Seed do world items pelo JSON, se o world estiver vazio
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

// 3) Reset explícito do world items pack (zera e recria do JSON)

/* -------------------------
 * RESET DO PACK DE ITENS
 * ------------------------- */

const ITEMS_LABEL = "🎒 Itens do Nó";

export async function resetWorldItemsPackFromJson() {
  if (!game.user.isGM) return;

  let worldPack = game.packs.get(WORLD_ITEMS_PACK);

  if (!worldPack) {
    worldPack = await CompendiumCollection.createCompendium({
      label: ITEMS_LABEL,
      name: "gambiarra-itens",
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  }

  const json = await fetchJson(ITEMS_JSON_PATH);

  await worldPack.getIndex();
  const ids = worldPack.index.map((e) => e._id);
  if (ids.length)
    await Item.deleteDocuments(ids, { pack: worldPack.collection });

  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(`GAMBIARRA.SYS6 | RESET Itens do Nó via JSON: ${json.length}`);
  ui.notifications.info(`🧹 Reset: ${json.length} itens recriados.`);
}
