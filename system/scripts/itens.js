// scripts/itens.js (v0.6.2c)
// deprecated

export class GambiarraItem extends Item {
  async corromper(descricao) {
    const corrupcoes = foundry.utils.duplicate(this.system.corrupcoes || []);
    corrupcoes.push({ descricao, origem: "BUG" });

    await this.update({
      "system.corrompido": true,
      "system.corrupcoes": corrupcoes,
    });
  }
}
