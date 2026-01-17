// scripts/data/actor-character-model.js
export class GambiarraCharacterModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const atributoSchema = new f.SchemaField({
      label: new f.StringField({ initial: "" }),
      value: new f.NumberField({ initial: 2, integer: true, min: 1, max: 4 })
    });

    const poderSchema = new f.SchemaField({
      nome: new f.StringField({ initial: "" }),
      descricao: new f.StringField({ initial: "" }),
      estado: new f.StringField({ initial: "ativo" }), // ativo | esgotado | fora | latente
      usos: new f.NumberField({ initial: 0, integer: true, min: 0 }),
      dadoRoxo: new f.BooleanField({ initial: true }),
      efeitosPossiveis: new f.ArrayField(new f.StringField({ initial: "" }), { initial: [] })
    });

    const bugSchema = new f.SchemaField({
      ativo: new f.BooleanField({ initial: false }),
      intensidade: new f.StringField({ initial: "leve" }), // leve | pesado
      descricao: new f.StringField({ initial: "" }),
      recorrente: new f.BooleanField({ initial: false })
    });

    const efeitoPermanenteSchema = new f.SchemaField({
      nome: new f.StringField({ initial: "" }),
      descricao: new f.StringField({ initial: "" })
    });

    return {
      attributes: new f.SchemaField({
        corpo: atributoSchema,
        mente: atributoSchema,
        coracao: atributoSchema
      }),

      meta: new f.SchemaField({
        arquetipo: new f.StringField({ initial: "" }),

        poderes: new f.ArrayField(poderSchema, { initial: [] }),
        estados: new f.ArrayField(new f.StringField({ initial: "" }), { initial: [] }),

        bug: bugSchema,

        marcas: new f.ArrayField(efeitoPermanenteSchema, { initial: [] }),
        custos: new f.ArrayField(efeitoPermanenteSchema, { initial: [] }),
        corrupcoes: new f.ArrayField(efeitoPermanenteSchema, { initial: [] })
      })
    };
  }
}
