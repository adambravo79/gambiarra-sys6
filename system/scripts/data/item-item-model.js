// scripts/data/item-item-model.js (v0.6)

export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;

    const corrupcaoSchema = new f.SchemaField({
      descricao: new f.StringField({ initial: "" }),
      origem: new f.StringField({ initial: "BUG" }),
    });

    return {
      // categorização (apoio narrativo)
      categoria: new f.StringField({
        initial: "gambiarra",
        choices: ["direcao", "gambiarra", "protecao", "estranho"],
      }),

      // ✅ novo: reliquia|consumivel
      tipoItem: new f.StringField({
        initial: "reliquia",
        choices: ["reliquia", "consumivel"],
      }),

      // ✅ controle de “consumível” sem deletar
      cargas: new f.NumberField({ initial: 1, integer: true, min: 0 }),
      usado: new f.BooleanField({ initial: false }),

      // descrição/efeito (texto livre, sem automatizar)
      descricao: new f.StringField({ initial: "" }),

      // lista de “o que ele pode fazer” (para o diálogo de rolagem sugerir)
      efeitosPossiveis: new f.ArrayField(
        new f.StringField({
          choices: [
            "add-dado",
            "reduzir-dificuldade",
            "trocar-atributo",
            "permitir",
            "bug-suavizar",
            "bug-anular",
            "bug-transformar",
          ],
        }),
        { initial: [] },
      ),

      // BUG (só pro botão “Usar no BUG” aparecer)
      reageABug: new f.BooleanField({ initial: false }),

      // corrupção (mantém seu conceito; não mexe em actor)
      corrompido: new f.BooleanField({ initial: false }),
      corrupcoes: new f.ArrayField(corrupcaoSchema, { initial: [] }),
    };
  }
}
