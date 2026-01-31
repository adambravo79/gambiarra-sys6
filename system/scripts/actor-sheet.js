// scripts/actor-sheet.js — v0.7.0h
// Fixes:
// - Reintroduz handlers de excluir/trocar poder e excluir item
// - Mantém item inicial por arquétipo

import { rollDesafio } from "./rolls.js";
import { applyArchetypeToSystem } from "./archetypes.js";

const WORLD_ITEMS_PACK = "world.gambiarra-itens";
const SYSTEM_ITEMS_PACK = "gambiarra-sys6.gambiarra-itens";

function normName(s) {
  return String(s ?? "").trim().toLocaleLowerCase("pt-BR");
}

function deriveTagline(meta) {
  const raw = String(meta?.arquetipoTagline || "").trim();
  if (raw) return raw;

  const desc = String(meta?.arquetipoDescricao || "").trim();
  if (!desc) return "";

  const firstLine = desc.split("\n")[0].trim();
  const firstSentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}…` : firstSentence;
}

function deriveStarterItem(meta) {
  return String(meta?.arquetipoItemInicial || "").trim();
}

async function findItemInPackByName(pack, name) {
  if (!pack) return null;
  await pack.getIndex();

  const target = normName(name);
  const entry = pack.index.find((e) => normName(e.name) === target);
  if (!entry) return null;

  return pack.getDocument(entry._id);
}

async function addStarterItemToActor(actor, starterItemName) {
  const wanted = String(starterItemName || "").trim();
  if (!wanted) {
    ui.notifications.warn("Este arquétipo não tem item inicial configurado.");
    return;
  }

  // não duplica por nome
  const already = actor.items?.some(
    (it) => it.type === "item" && normName(it.name) === normName(wanted),
  );
  if (already) {
    ui.notifications.info("Este item já está na ficha.");
    return;
  }

  const worldPack = game.packs.get(WORLD_ITEMS_PACK);
  const sysPack = game.packs.get(SYSTEM_ITEMS_PACK);

  let doc = await findItemInPackByName(worldPack, wanted);
  if (!doc) doc = await findItemInPackByName(sysPack, wanted);

  if (!doc) {
    ui.notifications.error(`Item inicial não encontrado no compêndio: "${wanted}".`);
    return;
  }

  const data = doc.toObject();
  delete data._id;

  data.system = data.system ?? {};
  data.system.sourceId = doc.uuid;

  await actor.createEmbeddedDocuments("Item", [data]);
  ui.notifications.info(`✅ Item inicial adicionado: ${doc.name}`);
}

export class GambiarraActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "actor"],
      template: "systems/gambiarra-sys6/templates/actor-character.html",
      width: 720,
      height: 680,
      tabs: [],
      submitOnChange: true,
      submitOnClose: true,
    });
  }

  getData() {
    const context = super.getData();

    const corpo = Number(context.actor.system?.attributes?.corpo?.value ?? 0);
    const mente = Number(context.actor.system?.attributes?.mente?.value ?? 0);
    const coracao = Number(context.actor.system?.attributes?.coracao?.value ?? 0);

    const all = context.actor.items ?? [];
    const poderes = all.filter((i) => i.type === "poder");
    const itens = all.filter((i) => i.type === "item");

    const scoreItem = (it) => {
      const tipo = it.system?.tipoItem ?? "reliquia";
      const usado = Boolean(it.system?.usado);
      const cargas = Number(it.system?.cargas ?? 0);

      // consumível "acabado" (usado OU cargas 0) vai pro final
      const depleted = tipo === "consumivel" && (usado || cargas <= 0);
      if (depleted) return 30;

      if (tipo === "consumivel") return 20;
      return 10;
    };

    const itemsSorted = [...itens].sort((a, b) => {
      const sa = scoreItem(a);
      const sb = scoreItem(b);
      if (sa !== sb) return sa - sb;
      return String(a.name).localeCompare(String(b.name), "pt-BR");
    });

    const attrSum = corpo + mente + coracao;
    const attrOk = corpo >= 1 && mente >= 1 && coracao >= 1 && attrSum === 6;

    const meta = context.actor.system?.meta ?? {};
    const isGM = game.user.isGM;

    const hasArchetype = Boolean(meta.arquetipoKey);
    const modoLivre = Boolean(meta.modoLivre);

    const attrsLocked = hasArchetype && (!isGM || !modoLivre);
    const showSumbar = Boolean(isGM && modoLivre);

    const starterItem = deriveStarterItem(meta);
    const showStarterButton = Boolean(hasArchetype && starterItem && itemsSorted.length === 0);

    return {
      ...context,
      system: context.actor.system,
      items: itemsSorted,
      poderes,
      isGM,
      attrSum,
      attrOk,
      hasArchetype,
      attrsLocked,
      showSumbar,
      showStarterButton,
      starterItem,
      arquetipo: {
        key: meta.arquetipoKey || "",
        nome: meta.arquetipoNome || "",
        icon: meta.arquetipoIcon || "",
        descricao: meta.arquetipoDescricao || "",
        comoAjuda: meta.arquetipoComoAjuda || "",
        quandoBrilha: meta.arquetipoQuandoBrilha || "",
        poderSugerido: meta.arquetipoPoderSugerido || "",
        tagline: deriveTagline(meta),
      },
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const guardAttrOk = () => {
      const c = Number(html.find('[name="system.attributes.corpo.value"]').val()) || 0;
      const m = Number(html.find('[name="system.attributes.mente.value"]').val()) || 0;
      const co = Number(html.find('[name="system.attributes.coracao.value"]').val()) || 0;
      const sum = c + m + co;

      const ok = sum === 6 && c >= 1 && m >= 1 && co >= 1;
      if (ok) return true;

      ui.notifications.warn("Ajuste Corpo+Mente+Coração para somar 6 (mínimo 1 em cada).");
      return false;
    };

    const guardOwner = () => {
      if (this.actor.isOwner) return true;
      ui.notifications.warn("Você precisa de permissão de dono para fazer isso.");
      return false;
    };

    const guardGM = () => {
      if (game.user.isGM) return true;
      ui.notifications.warn("Somente o GM pode fazer isso.");
      return false;
    };

    const hasArchetype = Boolean(this.actor.system?.meta?.arquetipoKey);
    const isGM = game.user.isGM;

    const isLocked = () => {
      if (!hasArchetype) return false;
      const modoLivre = Boolean(this.actor.system?.meta?.modoLivre);
      return !isGM || !modoLivre;
    };

    const applyLockUI = () => {
      const locked = isLocked();
      html.toggleClass("gambi-attrs-locked", locked);

      html
        .find(".attribute-value")
        .prop("disabled", locked)
        .toggleClass("is-locked", locked);
    };

    // Toggle "modo livre" (somente GM)
    html.find(".gambi-toggle-free").off("change").on("change", async (ev) => {
      if (!isGM) return;

      const checked = Boolean(ev.currentTarget.checked);

      await this.actor.update({ "system.meta.modoLivre": checked });

      if (!checked && hasArchetype) {
        const key = String(this.actor.system?.meta?.arquetipoKey || "");
        const system = foundry.utils.deepClone(this.actor.system);
        applyArchetypeToSystem(system, key);

        system.meta.modoLivre = false;

        await this.actor.update({
          "system.attributes.corpo.value": system.attributes.corpo.value,
          "system.attributes.mente.value": system.attributes.mente.value,
          "system.attributes.coracao.value": system.attributes.coracao.value,
          "system.meta.arquetipoNome": system.meta.arquetipoNome,
          "system.meta.arquetipoIcon": system.meta.arquetipoIcon,
          "system.meta.arquetipoDescricao": system.meta.arquetipoDescricao,
          "system.meta.arquetipoTagline": system.meta.arquetipoTagline,
          "system.meta.arquetipoItemInicial": system.meta.arquetipoItemInicial,
        });
      }

      applyLockUI();
    });

    // Botão: adicionar item inicial
    html.find(".add-starter-item").off("click").on("click", async () => {
      if (!guardOwner()) return;

      const starterItem = String(this.actor.system?.meta?.arquetipoItemInicial || "").trim();
      await addStarterItemToActor(this.actor, starterItem);
    });

    // rolagem
    html.find(".roll-desafio").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      rollDesafio(this.actor);
    });

    // poderes
    html.find(".roll-power").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      this.actor._despertarPoder({ sortear: true });
    });

    html.find(".add-power").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      this.actor._despertarPoder({ sortear: false });
    });

    html.find(".create-power").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      this.actor._criarPoderNoCompendioOuFicha?.();
    });

    // ✅ FIX: remover poder (GM)
    html.find(".power-remove").off("click").on("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!guardGM()) return;

      const itemId = ev.currentTarget?.dataset?.itemId;
      if (!itemId) return;

      const poder = this.actor.items.get(itemId);
      if (!poder) return;

      const ok = await Dialog.confirm({
        title: "Remover Poder",
        content: `<p>Remover <strong>${poder.name}</strong> da ficha?</p>`,
      });
      if (!ok) return;

      await poder.delete();
    });

    // ✅ FIX: trocar poder (GM)
    html.find(".power-replace").off("click").on("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!guardGM()) return;
      if (!guardAttrOk()) return;

      const itemId = ev.currentTarget?.dataset?.itemId;
      if (!itemId) return;

      const poder = this.actor.items.get(itemId);
      if (!poder) return;

      const ok = await Dialog.confirm({
        title: "Trocar Poder",
        content: `<p>Trocar <strong>${poder.name}</strong> por outro?</p>`,
      });
      if (!ok) return;

      await poder.delete();
      await this.actor._despertarPoder({ sortear: false });
    });

    // itens
    html.find(".add-item").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      if (!guardOwner()) return;
      this.actor._escolherItemDoCompendio();
    });

    html.find(".create-item").off("click").on("click", () => {
      if (!guardAttrOk()) return;
      this.actor._criarItemNoCompendioOuFicha?.();
    });

    // ✅ FIX: remover item (owner)
    html.find(".remove-item").off("click").on("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!guardOwner()) return;

      const itemId = ev.currentTarget?.dataset?.itemId;
      if (!itemId) return;

      const item = this.actor.items.get(itemId);
      if (!item) return;

      const ok = await Dialog.confirm({
        title: "Remover Item",
        content: `<p>Remover <strong>${item.name}</strong> da ficha?</p>`,
      });
      if (!ok) return;

      await item.delete();
    });

    applyLockUI();
  }
}
