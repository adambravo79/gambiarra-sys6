// scripts/data/item-item-model.js (v0.6)
export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" }),
    });

    return {
      // ✅ novo: reliquia | consumivel
      tipoItem: new f.StringField({
        initial: "reliquia",
        choices: ["reliquia", "consumivel"],
      }),

      // texto curto (o que “faz” na mesa)
      efeito: new f.StringField({ initial: "" }),

      // ✅ consumíveis têm cargas; quando chega em 0 => usado=true
      cargas: new f.NumberField({ initial: 1, integer: true, min: 0 }),
      usado: new f.BooleanField({ initial: false }),

      // (mantemos seus campos antigos úteis)
      tipo: new f.StringField({ initial: "gambiarra" }), // você pode remover depois se quiser
      reageABug: new f.BooleanField({ initial: false }),
      efeitosBug: new f.ArrayField(new f.StringField({ initial: "" }), {
        initial: [],
      }),

      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] }),
    };
  }
}
