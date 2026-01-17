export class GambiarraActor extends Actor {
  prepareData() {
    super.prepareData();

    const attrs = this.system.atributos;
    attrs.corpo ??= 2;
    attrs.mente ??= 2;
    attrs.coracao ??= 2;
  }
  /** =========================================================
   * Validação opcional: soma dos atributos = 6 e mínimo = 1
   * ========================================================= */
  async _preUpdate(changed, options, userId) {
    await super._preUpdate(changed, options, userId);

    // só valida se mexeu nos atributos
    const touchingAttr =
      foundry.utils.getProperty(changed, "system.attributes.corpo.value") !==
        undefined ||
      foundry.utils.getProperty(changed, "system.attributes.mente.value") !==
        undefined ||
      foundry.utils.getProperty(changed, "system.attributes.coracao.value") !==
        undefined;

    if (!touchingAttr) return;

    const next = foundry.utils.mergeObject(
      foundry.utils.deepClone(this.toObject()),
      changed,
      { inplace: false },
    );

    const corpo = Number(next.system?.attributes?.corpo?.value ?? 0);
    const mente = Number(next.system?.attributes?.mente?.value ?? 0);
    const coracao = Number(next.system?.attributes?.coracao?.value ?? 0);

    if (corpo < 1 || mente < 1 || coracao < 1) {
      ui.notifications.warn(
        "Sem zeros: Corpo, Mente e Coração precisam ser pelo menos 1.",
      );
      throw new Error("Atributo abaixo de 1");
    }

    const soma = corpo + mente + coracao;
    if (soma !== 6) {
      ui.notifications.warn(`A soma precisa ser 6. Agora está ${soma}.`);
      throw new Error("Soma de atributos diferente de 6");
    }
  }
}
