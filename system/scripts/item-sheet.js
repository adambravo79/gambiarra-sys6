// scripts/item-sheet.js v(0.6.2d)
// (sem mudanças funcionais aqui; o template do item foi atualizado)

export class GambiarraItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["gambiarra", "sheet", "item"],
      width: 460,
      height: 520,
    });
  }

  get template() {
    const base = "systems/gambiarra-sys6/templates/item";
    if (this.item.type === "poder") return `${base}/item-poder.html`;
    return `${base}/item-item.html`;
  }

  getData() {
    return super.getData();
  }
}
