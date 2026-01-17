// scripts/data/item-poder-model.js
export class GambiarraPoderModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    return {
      descricao: new f.StringField({ initial: "" }),
      nivel: new f.NumberField({ initial: 1, integer: true, min: 1, max: 2 }),
      efeitosPossiveis: new f.ArrayField(new f.StringField({ initial: "" }), { initial: [] })
    };
  }
}
