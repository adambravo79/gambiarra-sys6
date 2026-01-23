// scripts/actor-sheet.js (v0.6.1d)
// - Dono da ficha (actor.isOwner) pode adicionar item do compêndio
// - Botão Remover só aparece para dono
// - Se tentar remover sem permissão: toast

import { rollDesafio } from "./rolls.js";

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
    const coracao = Number(
      context.actor.system?.attributes?.coracao?.value ?? 0,
    );

    const all = context.actor.items ?? [];
    const poderes = all.filter((i) => i.type === "poder");
    const itens = all.filter((i) => i.type === "item");

    const scoreItem = (it) => {
      const tipo = it.system?.tipoItem ?? "reliquia";
      const usado = Boolean(it.system?.usado);
      if (tipo === "consumivel" && usado) return 30;
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

    return {
      ...context,
      system: context.actor.system,
      items: itemsSorted,
      poderes,
      isGM: game.user.isGM,
      isOwner: this.actor.isOwner, // ✅ novo
      attrSum,
      attrOk,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // rolagem
    html
      .find(".roll-desafio")
      .off("click")
      .on("click", () => rollDesafio(this.actor));

    // poderes
    html
      .find(".roll-power")
      .off("click")
      .on("click", () => this.actor._despertarPoder({ sortear: true }));
    html
      .find(".add-power")
      .off("click")
      .on("click", () => this.actor._despertarPoder({ sortear: false }));
    html
      .find(".create-power")
      .off("click")
      .on("click", () => this.actor._criarPoderNoCompendioOuFicha());

    // remover poder
    html
      .find(".power-remove")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        const itemId = ev.currentTarget.dataset.itemId;
        const poder = this.actor.items.get(itemId);
        if (!poder) return;

        const ok = await Dialog.confirm({
          title: "Remover Poder",
          content: `<p>Remover <strong>${poder.name}</strong> da ficha?</p>`,
        });

        if (!ok) return;
        await poder.delete();
      });

    // trocar poder
    html
      .find(".power-replace")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        const itemId = ev.currentTarget.dataset.itemId;
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

    // ✅ ITENS — usar na cena
    html
      .find(".use-item-scene")
      .off("click")
      .on("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const itemId = ev.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.usarNaCena) item.usarNaCena(this.actor);
      });

    // ✅ ITENS — usar no BUG
    html
      .find(".use-item-bug")
      .off("click")
      .on("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const itemId = ev.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.usarContraBug) item.usarContraBug(this.actor);
      });

    // ✅ ITENS — criar em mesa (GM)
    html
      .find(".create-item")
      .off("click")
      .on("click", () => this.actor._criarItemNoCompendioOuFicha?.());

    // ✅ ITENS — adicionar do compêndio (DONO da ficha)
    html
      .find(".add-item")
      .off("click")
      .on("click", () => {
        if (!this.actor.isOwner) {
          ui.notifications.warn(
            "Você precisa de permissão de dono para adicionar itens.",
          );
          return;
        }
        this.actor._escolherItemDoCompendio?.();
      });

    // ✅ ITENS — remover (DONO da ficha)
    html
      .find(".remove-item")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (!this.actor.isOwner) {
          ui.notifications.warn(
            "Você precisa de permissão de dono para remover.",
          );
          return;
        }

        const itemId = ev.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        const ok = await Dialog.confirm({
          title: "Remover Item",
          content: `<p>Remover <strong>${item.name}</strong> da ficha?</p>`,
        });

        if (!ok) return;
        await item.delete();
      });

    // efeitos permanentes
    html
      .find(".add-effect")
      .off("click")
      .on("click", () => this.actor._adicionarEfeitoPermanente?.());
    html
      .find(".bug-effect")
      .off("click")
      .on("click", () => this.actor._converterBugEmEfeito?.());

    // sumbar
    const updateSumbar = () => {
      const c =
        Number(html.find('[name="system.attributes.corpo.value"]').val()) || 0;
      const m =
        Number(html.find('[name="system.attributes.mente.value"]').val()) || 0;
      const co =
        Number(html.find('[name="system.attributes.coracao.value"]').val()) ||
        0;

      const sum = c + m + co;
      const $bar = html.find(".gambiarra-sumbar");
      $bar.find(".sum-pill").text(String(sum));

      if (sum === 6 && c >= 1 && m >= 1 && co >= 1) {
        $bar.removeClass("bad").addClass("ok");
        $bar.find(".sum-right").text("OK ✅ (Soma = 6)");
      } else {
        $bar.removeClass("ok").addClass("bad");
        $bar.find(".sum-right").text("Ajuste para Soma = 6 (mínimo 1 em cada)");
      }
    };

    html
      .find('[name="system.attributes.corpo.value"]')
      .off("input")
      .on("input", updateSumbar);
    html
      .find('[name="system.attributes.mente.value"]')
      .off("input")
      .on("input", updateSumbar);
    html
      .find('[name="system.attributes.coracao.value"]')
      .off("input")
      .on("input", updateSumbar);

    updateSumbar();
  }

  async _updateObject(event, formData) {
    const enforce = game.gambiarra?.config?.enforceSum6 ?? false;

    if (enforce) {
      const corpo = Number(
        formData["system.attributes.corpo.value"] ??
          this.actor.system.attributes.corpo.value,
      );
      const mente = Number(
        formData["system.attributes.mente.value"] ??
          this.actor.system.attributes.mente.value,
      );
      const coracao = Number(
        formData["system.attributes.coracao.value"] ??
          this.actor.system.attributes.coracao.value,
      );

      const sum = corpo + mente + coracao;
      const hasZero = corpo < 1 || mente < 1 || coracao < 1;

      if (hasZero || sum !== 6) {
        ui.notifications.warn(
          "Regra opcional: Corpo+Mente+Coração deve somar 6 e nenhum pode ser 0.",
        );
        return;
      }
    }

    return this.actor.update(formData);
  }
}
