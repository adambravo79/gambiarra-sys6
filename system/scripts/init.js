// scripts/init.js (v0.6.3a)

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
  console.log("🪢 GAMBIARRA.SYS6 | Inicializando sistema (v0.6.3");

  // registra sheet
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    makeDefault: true,
    types: ["character"],
  });

  CONFIG.Item.dataModels = {
    item: GambiarraItemModel,
    poder: GambiarraPoderModel,
  };

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

  CONFIG.Actor.documentClass = GambiarraActor;
  CONFIG.Item.documentClass = GambiarraItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("gambiarra-sys6", GambiarraActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("gambiarra-sys6", GambiarraItemSheet, {
    makeDefault: true,
  });

  Hooks.on("preCreateActor", (doc, createData) => {
    if (!createData.type) doc.updateSource({ type: "character" });
  });

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
      console.warn(
        "GAMBIARRA.SYS6 | Falha ao registrar colorsets do Dice So Nice",
        e,
      );
    }
  });
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  await seedWorldFromSystemPackIfEmpty();
  await seedWorldItemsFromSystemPackIfEmpty();
});

Hooks.once("ready", async () => {
  // Intercepta o "Criar Ator" no diretório de Actors
  Hooks.on("renderActorDirectory", (app, html) => {
    // Foundry v12: botão padrão
    const $btn = html.find('button.create-document, a.create-document');
    if (!$btn.length) return;

    // evita duplicar handler
    $btn.off("click.gambi-archetypes").on("click.gambi-archetypes", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      // se não tiver permissão para criar, deixa o core lidar (fail-safe)
      if (!game.user.can("ACTOR_CREATE")) return;

      openArchetypeCreateDialog();
    });
  });
});

function openArchetypeCreateDialog() {
  const options = ARCHETYPES.map(
    (a) =>
      `<option value="${a.key}">${a.icon} ${a.nome} — (${a.attrs.corpo}/${a.attrs.mente}/${a.attrs.coracao})</option>`,
  ).join("");

  const content = `
  <form class="gambi-create-actor">
    <div class="form-group">
      <label>Nome</label>
      <input type="text" name="name" value="Novo Personagem" />
    </div>

    <div class="form-group">
      <label>Arquétipo</label>
      <select name="archKey">${options}</select>
      <p class="hint">O jogo oferece apenas 10 fichas fixas. Os atributos nascem travados.</p>
    </div>

    <div class="gambi-arch-preview" style="margin-top:10px;"></div>

    <hr/>
    <div class="hint">
      <strong>Modo livre</strong> (editar atributos) existe, mas é liberado apenas para o GM dentro da ficha.
    </div>
  </form>
  `;

  const dlg = new Dialog({
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

      const renderPreview = () => {
        const key = String($sel.val() || "atleta");
        const a = getArchetype(key);

        $prev.html(`
          <div class="gambi-arch-card">
            <div class="gambi-arch-card-row">
              <div class="gambi-arch-icon">${a.icon}</div>
              <div class="gambi-arch-info">
                <div><strong>${a.nome}</strong></div>
                <div class="hint">Corpo ${a.attrs.corpo} • Mente ${a.attrs.mente} • Coração ${a.attrs.coracao}</div>
              </div>
            </div>
            <div class="hint" style="margin-top:6px;">${a.descricao}</div>
          </div>
        `);
      };

      $sel.on("change", renderPreview);
      renderPreview();
    },
  });

  dlg.render(true);
}