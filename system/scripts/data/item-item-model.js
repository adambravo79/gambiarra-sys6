// scripts/data/item-item-model.js (v0.6.2d)
// - efeito único (radio) em system.efeito
// - remove reageABug/efeitosBug/efeitosPossiveis
// - mantém cargasMax/cargas/usado

export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" }),
    });

    return {
      categoria: new f.StringField({ initial: "gambiarra" }), // direcao|gambiarra|protecao|estranho
      tipoItem: new f.StringField({ initial: "reliquia" }),   // reliquia|consumivel

      cargasMax: new f.NumberField({ initial: 3, integer: true, min: 1, max: 3 }),
      cargas: new f.NumberField({ initial: 1, integer: true, min: 0, max: 3 }),
      usado: new f.BooleanField({ initial: false }),

      descricao: new f.StringField({ initial: "" }),

      // ✅ NOVO: efeito único (apenas 1)
      efeito: new f.StringField({
        initial: "reduzir",
        choices: ["reduzir", "roxo", "hackear", "trocar"],
      }),

      // corrupção (mantido)
      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] }),
    };
  }

  prepareBaseData() {
    const tipo = String(this.tipoItem ?? "reliquia");
    const usado = Boolean(this.usado);

    // clamp cargasMax 1..3
    const max = Math.max(1, Math.min(3, Number(this.cargasMax ?? 3) || 3));
    this.cargasMax = max;

    // normaliza efeito
    const eff = String(this.efeito ?? "reduzir");
    this.efeito = ["reduzir", "roxo", "hackear", "trocar"].includes(eff) ? eff : "reduzir";

    if (tipo === "reliquia") {
      this.cargas = 1;
      this.usado = false;
      return;
    }

    let cargas = Number(this.cargas ?? 1);
    if (!Number.isFinite(cargas)) cargas = 1;

    cargas = Math.max(0, Math.min(max, Math.trunc(cargas)));

    if (!usado && cargas === 0) cargas = 1;
    if (cargas === 0) this.usado = true;

    this.cargas = cargas;
  }
}
