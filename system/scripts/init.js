// scripts/init.js — v0.7.0a
// Foundry V12

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

import { ARCHETYPES, applyArchetypeToSystem, getArchetype } from "./archetypes.js";

Hooks.once("init", () => {
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema (v0.7.0a)");

  // Document classes
  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  // Data models
  CONFIG.Item.dataModels = {
    item: GambiarraItemModel,
    poder: GambiarraPoderModel,
  };
  CONFIG.Actor.dataModels = {
    character: GambiarraCharacterModel,
    npc: GambiarraNpcModel,
  };

  // Types
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

  // Sheets (registrar UMA vez)
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra-sys6", GambiarraItemSheet, {
    makeDefault: true,
  });

  // garante type
  Hooks.on("preCreateActor", (doc, createData) => {
    if (!createData.type) doc.updateSource({ type: "character" });
  });

  // config global
  game.gambiarra = {
    config: {
      difficulties: {
        normal: { label: "Normal", required: 1, target: 4 },
        complexo: { label: "Complexo", required: 2, target: 4 },
        bug: { label: "BUG Leve", required: 1, target: 5 },
        epico: { label: "Épico", required: 2, target: 5 },
        impossivel: { label: "Impossível", required: 3, target: 6 },
      },
      enforceSum6: false,
    },
  };

  // Dice So Nice
  Hooks.once("diceSoNiceReady", (dice3d) => {
    try {
      const category = "GAMBIARRA.SYS6";

      dice3d.addColorset?.({
        name: "gambi-corpo",
        description: "Corpo (Verde)",
        category,
        foreground: "#ffffff",
        background: "#1fb35b",
        outline: "#0a3d22",
        edge: "#1fb35b",
      });

      dice3d.addColorset?.({
        name: "gambi-mente",
        description: "Mente (Azul)",
        category,
        foreground: "#ffffff",
        background: "#2f7de1",
        outline: "#123a73",
        edge: "#2f7de1",
      });

      dice3d.addColorset?.({
        name: "gambi-coracao",
        description: "Coração (Vermelho)",
        category,
        foreground: "#ffffff",
        background: "#e24a4a",
        outline: "#6e1515",
        edge: "#e24a4a",
      });

      dice3d.addColorset?.({
        name: "gambi-roxo",
        description: "Dado Roxo (Bônus)",
        category,
        foreground: "#ffffff",
        background: "#8a4de8",
        outline: "#3a1b6e",
        edge: "#8a4de8",
      });

      console.log("🎲 GAMBIARRA.SYS6 | Dice So Nice colorsets registrados");
    } catch (e) {
      console.warn("GAMBIARRA.SYS6 | Falha ao registrar colorsets do Dice So Nice", e);
    }
  });
});

Hooks.once("ready", async () => {
  // seeds só GM
  if (game.user.isGM) {
    await seedWorldFromSystemPackIfEmpty();
    await seedWorldItemsFromSystemPackIfEmpty();
  }
});

Hooks.once("ready", () => {
  // Intercepta o clique do botão "Criar Ator" ANTES do Foundry (capture=true)
  const handler = (ev) => {
    const btn = ev.target?.closest?.(
      '.sidebar-tab[data-tab="actors"] button.create-document, ' +
      '.sidebar-tab[data-tab="actors"] a.create-document',
    );
    if (!btn) return;

    // Só quando o Actors sidebar está ativo (evita pegar em outros lugares)
    const actorsTab = document.querySelector('.sidebar-tab[data-tab="actors"]');
    if (!actorsTab?.classList?.contains("active")) return;

    // permissão
    if (!game.user?.can?.("ACTOR_CREATE")) return;

    // mata o listener do core
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    // abre sua galeria
    try {
      openArchetypeCreateDialog();
    } catch (e) {
      console.error("GAMBIARRA | Falha ao abrir Galeria:", e);
      ui.notifications.error("Falha ao abrir Galeria de Arquétipos. Veja o console.");
    }
  };

  // registra 1 vez só
  if (!window.__gambiActorCreateIntercept) {
    window.__gambiActorCreateIntercept = true;
    document.addEventListener("click", handler, true); // CAPTURE = true
    console.log("GAMBIARRA | Intercept (capture) do Criar Ator ativo");
  }
});

function openArchetypeCreateDialog() {
  const options = ARCHETYPES.map(
    (a) =>
      `<option value="${a.key}">${a.icon} ${a.nome} — (${a.attrs.corpo}/${a.attrs.mente}/${a.attrs.coracao})</option>`,
  ).join("");

  const content = `
    <div class="gambi-dialog-body">
      <form class="gambi-create-actor">
        <div class="gambi-panel">

          <div class="form-group">
            <label>Nome</label>
            <input type="text" name="name" value="Novo Personagem" />
          </div>

          <div class="form-group">
            <label>Arquétipo</label>
            <select name="archKey">${options}</select>
            <p class="hint">O jogo oferece apenas 10 fichas fixas. Os atributos nascem travados.</p>
          </div>

          <div class="gambi-arch-preview"></div>

          <div class="gambi-hint-sep">
            <strong>Modo livre</strong> (editar atributos) existe, mas é liberado apenas para o GM dentro da ficha.
          </div>

        </div>
      </form>
    </div>
  `;

  const dlg = new Dialog(
    {
      title: "🧩 Galeria de Arquétipos do Nó",
      content,
      buttons: {
        create: {
          label: "✅ Criar Personagem",
          callback: async (html) => {
            const name = String(html.find('[name="name"]').val() || "Novo Personagem").trim();
            const key = String(html.find('[name="archKey"]').val() || "atleta");

            const system = applyArchetypeToSystem({}, key);

            await Actor.create({
              name,
              type: "character",
              img: "icons/svg/mystery-man.svg",
              system,
            });
          },
        },
        cancel: { label: "Cancelar" },
      },
      default: "create",
      render: (html) => {
        const $sel = html.find('[name="archKey"]');
        const $prev = html.find(".gambi-arch-preview");

        const esc = (s) => {
          const str = String(s ?? "");
          return str
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
        };

        const renderPreview = () => {
          const key = String($sel.val() || "atleta");
          const a = getArchetype(key);

          $prev.html(`
            <div class="gambi-arch-card">
              <div class="gambi-arch-card-row">
                <div class="gambi-arch-icon">${esc(a.icon)}</div>
                <div class="gambi-arch-info">
                  <div class="gambi-arch-title">
                    <strong>${esc(a.nome)}</strong>
                    ${a.tagline ? `<span class="gambi-arch-tagline hint">${esc(a.tagline)}</span>` : ""}
                  </div>
                  <div class="hint">Corpo ${a.attrs.corpo} • Mente ${a.attrs.mente} • Coração ${a.attrs.coracao}</div>
                </div>
              </div>

              ${a.descricao ? `<div class="hint" style="margin-top:6px;">${esc(a.descricao)}</div>` : ""}

              <div class="gambi-arch-grid">
                <div>
                  <div class="gambi-arch-block-title">Como você ajuda o grupo</div>
                  <div class="hint">${esc(a.comoAjuda ?? "")}</div>
                </div>
                <div>
                  <div class="gambi-arch-block-title">Quando você brilha</div>
                  <div class="hint">${esc(a.quandoBrilha ?? "")}</div>
                </div>
              </div>

              <div class="gambi-arch-sep hint">
                <strong>Poder sugerido:</strong> ${esc(a.poderSugerido ?? "—")}
              </div>
            </div>
          `);
        };

        $sel.on("change", renderPreview);
        renderPreview();
      },
    },
    {
      classes: ["gambiarra", "gambi-dialog", "gambi-arch-gallery"],
      width: 560,
      height: "auto",
    },
  );

  dlg.render(true);
}
