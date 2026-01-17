export class GambiarraItem extends Item {
  async corromper(descricao) {
    const corrupcoes = duplicate(this.system.corrupcoes || []);
    corrupcoes.push({
      descricao,
      origem: "BUG",
    });

    await this.update({
      "system.corrompido": true,
      "system.corrupcoes": corrupcoes,
    });
  }

  async usarContraBug(actor) {
    const bug = actor.system.meta?.bug;

    let bugAtivo = bug?.ativo;

    // 🧠 Se não houver BUG como estado, perguntar
    if (!bugAtivo) {
      const confirmar = await Dialog.confirm({
        title: "BUG Narrativo",
        content: "<p>Existe um BUG ativo na cena?</p>",
      });

      if (!confirmar) {
        ui.notifications.info("Nenhum BUG para reagir.");
        return;
      }
    }

    const efeitos = this.system.efeitosBug || [];

    if (!efeitos.length) {
      ui.notifications.warn("Este item não reage a BUG.");
      return;
    }

    const content = `
    <p><strong>${this.name}</strong> reage ao BUG.</p>
    <p>Escolha o efeito:</p>
    ${efeitos
      .map(
        (e) => `
      <button data-efeito="${e}">${traduzirEfeito(e)}</button>
    `,
      )
      .join("")}
  `;

    new Dialog({
      title: "Item reagindo ao BUG",
      content,
      buttons: {},
    }).render(true);

    Hooks.once("renderDialog", (_, html) => {
      html.find("button").click(async (ev) => {
        const efeito = ev.currentTarget.dataset.efeito;
        await aplicarEfeitoBug(actor, efeito);

        if (this.system.consumivel) {
          await this.delete();
        }
      });
    });
  }
}

function traduzirEfeito(e) {
  return {
    suavizar: "🧯 Suavizar BUG",
    anular: "🛡️ Anular BUG",
    transformar: "🔀 Transformar BUG",
    dado: "🎲 Converter em Dado Extra",
  }[e];
}

async function aplicarEfeitoBug(actor, efeito) {
  switch (efeito) {
    case "suavizar":
      await actor.update({
        "system.meta.bug.intensidade": "leve",
        "system.meta.bug.descricao": "O impacto do BUG foi reduzido.",
      });
      break;

    case "anular":
      await actor.update({
        "system.meta.bug": {
          ativo: false,
          intensidade: "leve",
          descricao: "",
        },
      });
      break;

    case "transformar":
      ui.notifications.info(
        "BUG transformado. A Programadora decide a nova complicação.",
      );
      break;

    case "dado":
      ui.notifications.info(
        "O próximo teste ganha +1 dado extra (decisão narrativa).",
      );
      break;
  }
}
