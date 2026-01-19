// scripts/seed-compendiums.js (v0.6.1)

const WORLD_PACK = "world.gambiarra-poderes";
const SYSTEM_PACK = "gambiarra-sys6.gambiarra-poderes";
const POWERS_JSON_PATH = "data/poderes-gambiarra.json";
const WORLD_LABEL = "⚡ Poderes Gambiarra";

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
  return String(s ?? "").trim().toLocaleLowerCase("pt-BR");
}

function validatePowersArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("JSON de poderes vazio ou inválido.");
  }

  const seen = new Set();

  for (const p of arr) {
    if (!p?.name || !p?.type) throw new Error("Poder sem name/type no JSON.");
    if (p.type !== "poder") throw new Error(`Tipo inválido no JSON: ${p.type} (esperado: poder).`);

    const key = normName(p.name);
    if (seen.has(key)) throw new Error(`Nome duplicado no JSON: "${p.name}"`);
    seen.add(key);

    // garante shape do system conforme seu DataModel atual
    p.system = p.system ?? {};

    p.system.descricao = String(p.system.descricao ?? "");

    // ✅ novos campos do seu modelo
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
 * Pack do mundo (editável)
 * ------------------------- */

async function ensureWorldPack() {
  if (!game.user.isGM) return null;

  let worldPack = game.packs.get(WORLD_PACK);

  if (!worldPack) {
    worldPack = await CompendiumCollection.createCompendium({
      label: WORLD_LABEL,          // ✅ nome na UI
      name: "gambiarra-poderes",   // ✅ NÃO mudar (mantém world.gambiarra-poderes)
      type: "Item",
      system: "gambiarra-sys6",
      package: "world",
    });
  } else {
    // ✅ se existe com label antigo, renomeia (não cria pack novo)
    const currentLabel = worldPack.metadata?.label ?? "";
    if (currentLabel !== WORLD_LABEL) {
      await worldPack.configure({ label: WORLD_LABEL });
    }
  }

  return worldPack;
}

async function clearPack(pack) {
  await pack.getIndex();
  if (pack.index.size === 0) return;

  // ✅ deletar direto pelos IDs do index (mais simples e confiável)
  const ids = pack.index.map((e) => e._id);
  await Item.deleteDocuments(ids, { pack: pack.collection });

  await pack.getIndex();
}

/* -------------------------
 * Seeds
 * ------------------------- */

// 1) Seed do world a partir do pack base do sistema, se o world estiver vazio
export async function seedWorldFromSystemPackIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) {
    console.log("GAMBIARRA.SYS6 | world.gambiarra-poderes já tem conteúdo; não seedo.");
    return;
  }

  const basePack = game.packs.get(SYSTEM_PACK);
  if (!basePack) {
    ui.notifications.warn("Pack base do sistema não encontrado (gambiarra-sys6.gambiarra-poderes).");
    return;
  }

  await basePack.getIndex();
  if (basePack.index.size === 0) {
    console.warn("GAMBIARRA.SYS6 | Pack base do sistema está vazio. Vou tentar seed pelo JSON.");
    await seedWorldFromJsonIfEmpty();
    return;
  }

  const ids = basePack.index.map((e) => e._id);
  const docs = [];

  for (const id of ids) {
    const doc = await basePack.getDocument(id);
    const data = doc.toObject();
    delete data._id; // novo ID no world
    docs.push(data);
  }

  await Item.createDocuments(docs, { pack: worldPack.collection });

  console.log(`GAMBIARRA.SYS6 | Seed concluído: ${docs.length} poderes em ${worldPack.collection}`);
  ui.notifications.info(`✅ Seed: ${docs.length} poderes no compêndio do mundo.`);
}

// 2) Seed do world pelo JSON, se o world estiver vazio
export async function seedWorldFromJsonIfEmpty() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPack();
  if (!worldPack) return;

  await worldPack.getIndex();
  if (worldPack.index.size > 0) return;

  const json = validatePowersArray(await fetchJson(POWERS_JSON_PATH));
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(`GAMBIARRA.SYS6 | Seed via JSON: ${json.length} poderes em ${worldPack.collection}`);
  ui.notifications.info(`✅ Seed via JSON: ${json.length} poderes no compêndio do mundo.`);
}

// 3) Reset explícito do world pack (zera e recria do JSON)
export async function resetWorldPackFromJson() {
  if (!game.user.isGM) return;

  const worldPack = await ensureWorldPack();
  if (!worldPack) return;

  const json = validatePowersArray(await fetchJson(POWERS_JSON_PATH));

  await clearPack(worldPack);
  await Item.createDocuments(json, { pack: worldPack.collection });

  console.log(`GAMBIARRA.SYS6 | RESET world pack via JSON: ${json.length} poderes em ${worldPack.collection}`);
  ui.notifications.info(`🧹 Reset: ${json.length} poderes recriados no compêndio do mundo.`);
}
