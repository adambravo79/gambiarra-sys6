export class GambiarraItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "item"],
      template: `systems/gambiarra-sys6/templates/item/item-sheet.html`,
      width: 420,
      height: "auto"
    });
  }

  getData() {
    const data = super.getData();

    data.system.dadosRoxos ??= 0;
    data.system.efeitosBug ??= [];

    return data;
  }
}
