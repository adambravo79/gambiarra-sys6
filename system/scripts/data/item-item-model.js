// scripts/data/item-item-model.js (v0.6.2)

export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" }),
    });

    return {
      // categoria ajuda só a “taggear” no item sheet
      // direcao | gambiarra | protecao | estranho
      categoria: new f.StringField({ initial: "gambiarra" }),

      // reliquia | consumivel
      tipoItem: new f.StringField({ initial: "reliquia" }),

      // cargas (para consumíveis)
      cargas: new f.NumberField({
        initial: 1,
        integer: true,
        min: 0,
      }),

      // consumível “recebido pelo Nó”: usado = true
      usado: new f.BooleanField({ initial: false }),

      // texto principal do item
      descricao: new f.StringField({ initial: "" }),

      // referência do que este item pode fazer (não automatiza por si só)
      // add-dado, reduzir-dificuldade, permitir, trocar-atributo,
      // bug-suavizar, bug-anular, bug-transformar
      efeitosPossiveis: new f.ArrayField(new f.StringField({ initial: "" }), {
        initial: [],
      }),

      // aparece o botão “Usar no BUG” + opções na UI
      reageABug: new f.BooleanField({ initial: false }),

      // corrupção (se você quiser usar isso depois)
      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] }),
    };
  }
}
