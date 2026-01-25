// scripts/data/actor-character-model.js v(0.6.3a)

export class GambiarraCharacterModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      attributes: new fields.SchemaField({
        corpo: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 2, min: 0 }),
        }),
        mente: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 2, min: 0 }),
        }),
        coracao: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 2, min: 0 }),
        }),
      }),

      meta: new fields.SchemaField({
        arquetipoKey: new fields.StringField({ required: false, initial: "" }),
        arquetipoNome: new fields.StringField({ required: false, initial: "" }),
        arquetipoIcon: new fields.StringField({ required: false, initial: "" }),
        arquetipoDescricao: new fields.StringField({ required: false, initial: "" }),

        // Toggle: somente GM usa na ficha para liberar edição
        modoLivre: new fields.BooleanField({ required: true, initial: false }),
      }),
    };
  }
}
