export class GambiarraActor extends Actor {
  prepareData() {
    super.prepareData();

    const attrs = this.system.atributos;
    attrs.corpo ??= 2;
    attrs.mente ??= 2;
    attrs.coracao ??= 2;
  }
}
