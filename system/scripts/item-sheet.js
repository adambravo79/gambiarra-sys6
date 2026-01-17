export class GambiarraItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "item"],
      template: `systems/gambiarra-sys6/templates/item/item-sheet.html`,
      width: 400,
      height: 300
    });
  }

  getData() {
    const data = super.getData();
    return data;
  }
}
