// scripts/data/actor-npc-model.js v(0.6.2)
export class GambiarraNpcModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    return {
      description: new f.StringField({ initial: "" }),
      threat: new f.StringField({ initial: "normal" }),
    };
  }
}
