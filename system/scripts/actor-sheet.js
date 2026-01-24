// scripts/actor-sheet.js v0.6.2c

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
      attrSum,
      attrOk,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const isOwner = this.actor.isOwner;

    const isAttrOkNow = () => {
      const c =
        Number(html.find('[name="system.attributes.corpo.value"]').val()) || 0;
      const m =
        Number(html.find('[name="system.attributes.mente.value"]').val()) || 0;
      const co =
        Number(html.find('[name="system.attributes.coracao.value"]').val()) ||
        0;

      const sum = c + m + co;
      return sum === 6 && c >= 1 && m >= 1 && co >= 1;
    };

    const guardAttrOk = () => {
      if (isAttrOkNow()) return true;
      ui.notifications.warn("Ajuste Corpo+Mente+Coração para somar 6 (mínimo 1 em cada).");
      return false;
    };

    const guardOwner = () => {
      if (this.actor.isOwner) return true;
      ui.notifications.warn("Você precisa de permissão de dono para fazer isso.");
      return false;
    };

    // rolagem
    html
      .find(".roll-desafio")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        rollDesafio(this.actor);
      });

    // poderes
    html
      .find(".roll-power")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._despertarPoder({ sortear: true });
      });

    html
      .find(".add-power")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._despertarPoder({ sortear: false });
      });

    html
      .find(".create-power")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._criarPoderNoCompendioOuFicha();
      });

    // remover poder (GM)
    html
      .find(".power-remove")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        if (!guardAttrOk()) return;

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

    // trocar poder (GM)
    html
      .find(".power-replace")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        if (!guardAttrOk()) return;

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

    // ✅ Adicionar item: dono da ficha também pode
    html
      .find(".add-item")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        if (!guardOwner()) return; // adicionar mexe em embedded docs
        this.actor._escolherItemDoCompendio();
      });

    // Criar item em mesa (GM)
    html
      .find(".create-item")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._criarItemNoCompendioOuFicha?.();
      });

    // ✅ Remover item (somente owner)
    const syncRemoveButtons = () => {
      const canRemove = this.actor.isOwner;
      html.find(".remove-item").each((_, el) => {
        const $b = $(el);
        if (!canRemove) $b.hide();
        else $b.show();
      });
    };
    syncRemoveButtons();

    html
      .find(".remove-item")
      .off("click")
      .on("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (!guardAttrOk()) return;

        if (!this.actor.isOwner) {
          ui.notifications.warn("Você precisa de permissão de dono para remover.");
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
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._adicionarEfeitoPermanente?.();
      });

    html
      .find(".bug-effect")
      .off("click")
      .on("click", () => {
        if (!guardAttrOk()) return;
        this.actor._converterBugEmEfeito?.();
      });

    // sumbar + trava de botões
    const updateSumbar = () => {
      const c =
        Number(html.find('[name="system.attributes.corpo.value"]').val()) || 0;
      const m =
        Number(html.find('[name="system.attributes.mente.value"]').val()) || 0;
      const co =
        Number(html.find('[name="system.attributes.coracao.value"]').val()) ||
        0;

      const sum = c + m + co;
      const ok = sum === 6 && c >= 1 && m >= 1 && co >= 1;

      const $bar = html.find(".gambiarra-sumbar");
      $bar.find(".sum-pill").text(String(sum));

      if (ok) {
        $bar.removeClass("bad").addClass("ok");
        $bar.find(".sum-right").text("OK ✅ (Soma = 6)");
      } else {
        $bar.removeClass("ok").addClass("bad");
        $bar.find(".sum-right").text("Ajuste para Soma = 6 (mínimo 1 em cada)");
      }

      // ✅ desabilita ações “funcionais” quando inválido
      const disable = !ok;

      html
        .find(
          ".roll-desafio, .add-power, .roll-power, .create-power, .add-item, .create-item, .remove-item, .add-effect, .bug-effect",
        )
        .prop("disabled", disable);

      // (botões GM de remover/trocar poder continuam possíveis, mas desativamos também por consistência)
      html.find(".power-remove, .power-replace").prop("disabled", disable);

      // remover item: se não for owner, esconde (e não só desabilita)
      syncRemoveButtons();
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
    // ✅ agora é regra fixa: não salva se invalidar Soma=6
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
        "Corpo+Mente+Coração deve somar 6 e nenhum pode ser 0.",
      );
      return;
    }

    return this.actor.update(formData);
  }
}
