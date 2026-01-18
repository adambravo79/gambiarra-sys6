export class GambiarraPoderModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      descricao: new fields.StringField({ required: false, initial: "" }),

      estado: new fields.StringField({
        required: true,
        initial: "ativo",
        choices: ["ativo", "esgotado", "fora"],
      }),

      usos: new fields.NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0,
      }),

      // thresholds simples (padrão do seu texto anterior)
      limiteAtivo: new fields.NumberField({
        required: true,
        integer: true,
        min: 1,
        initial: 2,
      }),

      limiteFora: new fields.NumberField({
        required: true,
        integer: true,
        min: 2,
        initial: 3,
      }),

      efeitosPossiveis: new fields.ArrayField(
        new fields.StringField({
          choices: ["dado-roxo", "reduzir-dificuldade", "rerrolar"],
        }),
        { required: true, initial: [] },
      ),

      obsSeguranca: new fields.StringField({ required: false, initial: "" }),
    };
  }
}
