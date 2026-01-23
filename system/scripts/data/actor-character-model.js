// scripts/data/actor-character-model.js v(0.6.2)
export class GambiarraCharacterModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    // ⚠️ IMPORTANTE (Foundry v12):
    // Não reutilize a mesma instância de Field/SchemaField em mais de um lugar.
    // Use fábricas para criar instâncias novas.

    const makeAtributoSchema = () =>
      new f.SchemaField({
        label: new f.StringField({ initial: "" }),
        value: new f.NumberField({ initial: 2, integer: true, min: 1, max: 4 }),
      });

    const makePoderSchema = () =>
      new f.SchemaField({
        nome: new f.StringField({ initial: "" }),
        descricao: new f.StringField({ initial: "" }),
        estado: new f.StringField({ initial: "ativo" }), // ativo | esgotado | fora | latente
        usos: new f.NumberField({ initial: 0, integer: true, min: 0 }),
        dadoRoxo: new f.BooleanField({ initial: true }),
        efeitosPossiveis: new f.ArrayField(new f.StringField({ initial: "" }), {
          initial: [],
        }),
      });

    const makeBugSchema = () =>
      new f.SchemaField({
        ativo: new f.BooleanField({ initial: false }),
        intensidade: new f.StringField({ initial: "leve" }), // leve | pesado
        descricao: new f.StringField({ initial: "" }),
        recorrente: new f.BooleanField({ initial: false }),
      });

    const makeEfeitoPermanenteSchema = () =>
      new f.SchemaField({
        nome: new f.StringField({ initial: "" }),
        descricao: new f.StringField({ initial: "" }),
      });

    return {
      attributes: new f.SchemaField({
        corpo: makeAtributoSchema(),
        mente: makeAtributoSchema(),
        coracao: makeAtributoSchema(),
      }),

      meta: new f.SchemaField({
        arquetipo: new f.StringField({ initial: "" }),

        poderes: new f.ArrayField(makePoderSchema(), { initial: [] }),
        estados: new f.ArrayField(new f.StringField({ initial: "" }), {
          initial: [],
        }),

        bug: makeBugSchema(),

        // efeitos permanentes (cada um com instância própria)
        marcas: new f.ArrayField(makeEfeitoPermanenteSchema(), { initial: [] }),
        custos: new f.ArrayField(makeEfeitoPermanenteSchema(), { initial: [] }),
        corrupcoes: new f.ArrayField(makeEfeitoPermanenteSchema(), {
          initial: [],
        }),
      }),
    };
  }
}
