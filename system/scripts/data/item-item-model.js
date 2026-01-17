// scripts/data/item-item-model.js
export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" })
    });

    return {
      tipo: new f.StringField({ initial: "gambiarra" }),
      efeito: new f.StringField({ initial: "" }),
      consumivel: new f.BooleanField({ initial: false }),

      reageABug: new f.BooleanField({ initial: false }),
      efeitosBug: new f.ArrayField(new f.StringField({ initial: "" }), { initial: [] }),

      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] })
    };
  }
}
