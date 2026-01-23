// scripts/data/item-item-model.js (v0.6.2)
// scripts/data/item-item-model.js (v0.6.4)
// - adiciona cargasMax (default 3)
// - clampa cargas 0..cargasMax
// - se tipoItem = reliquia: força cargas=1, usado=false
// - se tipoItem = consumivel: garante cargasMax 1..3 e cargas >=1 ao criar (quando não usado)

export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" }),
    });

    return {
      // direcao | gambiarra | protecao | estranho
      categoria: new f.StringField({ initial: "gambiarra" }),

      // reliquia | consumivel
      tipoItem: new f.StringField({ initial: "reliquia" }),

      // ✅ máximo de cargas (só faz sentido em consumível)
      cargasMax: new f.NumberField({
        initial: 3,
        integer: true,
        min: 1,
        max: 3,
      }),

      // cargas atuais
      cargas: new f.NumberField({
        initial: 1,
        integer: true,
        min: 0,
        max: 3, // clamp final é no prepareBaseData (cargasMax)
      }),

      // consumível “recebido pelo Nó”: usado = true
      usado: new f.BooleanField({ initial: false }),

      // texto principal do item
      descricao: new f.StringField({ initial: "" }),

      // tags/efeitos (referência)
      efeitosPossiveis: new f.ArrayField(new f.StringField({ initial: "" }), {
        initial: [],
      }),

      reageABug: new f.BooleanField({ initial: false }),

      // corrupção (mantido)
      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] }),
    };
  }

  /** Clamps e coerência entre campos */
  prepareBaseData() {
    const tipo = String(this.tipoItem ?? "reliquia");
    const usado = Boolean(this.usado);

    // clamp cargasMax 1..3
    const max = Math.max(1, Math.min(3, Number(this.cargasMax ?? 3) || 3));
    this.cargasMax = max;

    if (tipo === "reliquia") {
      // relíquia não “gasta”
      this.cargas = 1;
      this.usado = false;
      return;
    }

    // consumível
    let cargas = Number(this.cargas ?? 1);
    if (!Number.isFinite(cargas)) cargas = 1;

    // clamp 0..max
    cargas = Math.max(0, Math.min(max, Math.trunc(cargas)));

    // se não está usado, não deixa nascer “sem carga” por acidente
    if (!usado && cargas === 0) cargas = 1;

    // coerência: se cargas = 0 => usado = true
    if (cargas === 0) this.usado = true;

    this.cargas = cargas;
  }
}
