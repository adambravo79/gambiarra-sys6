export async function rollDesafio(actor, atributo) {
  const diffs = game.gambiarra.difficulties;

  let roxos = 0;

  const dialog = new Dialog({
    title: "🎲 Rolagem de Desafio",
    content: `
      <p><strong>Atributo:</strong> ${atributo}</p>
      <p><strong>Dados base:</strong> ${actor.system.atributos[atributo]}</p>

      <div class="dados-roxos">
        <button id="menos">−</button>
        <span id="roxos">0</span>
        <button id="mais">+</button>
      </div>

      <select id="dificuldade">
        ${Object.entries(diffs)
          .map(
            ([k, d]) =>
              `<option value="${k}">${d.label}</option>`
          )
          .join("")}
      </select>
    `,
    buttons: {
      rolar: {
        label: "Rolar",
        callback: html => {
          const diffKey = html.find("#dificuldade").val();
          const diff = diffs[diffKey];

          const base = actor.system.atributos[atributo];
          const total = base + roxos;

          const roll = new Roll(`${total}d6`).evaluateSync();
          const resultados = roll.dice[0].results.map(r => r.result);

          const sucessos = resultados.filter(r => r >= diff.alvo).length;

          let resultadoTexto = "🐞 DEU BUG";
          if (sucessos >= diff.sucessos) {
            resultadoTexto =
              sucessos > diff.sucessos
                ? "🌟 Sucesso Forte"
                : "✨ Sucesso";
          }

          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `
              <strong>${resultadoTexto}</strong><br>
              Pool: ${total} dados (${base} + ${roxos} roxos)<br>
              Resultados: [ ${resultados.join(", ")} ]
            `
          });
        }
      }
    },
    render: html => {
      html.find("#mais").click(() => {
        roxos++;
        html.find("#roxos").text(roxos);
      });
      html.find("#menos").click(() => {
        roxos = Math.max(0, roxos - 1);
        html.find("#roxos").text(roxos);
      });
    }
  });

  dialog.render(true);
}
