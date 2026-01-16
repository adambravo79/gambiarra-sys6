export async function rollDesafio(actor) {

    /**
 * Dados Extras:
 * - Sempre rolam em pool separado
 * - Cor padrão: roxo
 * - Representam contexto (itens, amizade, poderes)
 * - Cor será customizável futuramente via settings
 */

  const difficulties = game.gambiarra.config.difficulties;

  const content = `
  <form>
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties).map(([key, d]) =>
          `<option value="${key}">${d.label} (${d.dice}d6, ${d.target}+)</option>`
        ).join("")}
      </select>
    </div>

    <div class="form-group">
      <label>Atributo</label>
      <select name="attribute">
        <option value="corpo">🟢 Corpo</option>
        <option value="mente">🔵 Mente</option>
        <option value="coracao">🔴 Coração</option>
      </select>
    </div>

    <div class="form-group">
      <label>Dados Extras</label>
      <input type="number" name="extraDice" value="0" min="0" max="5"/>
      <p class="hint">Itens, amizade ou Poder Gambiarra</p>
    </div>
  </form>
  `;

  new Dialog({
    title: "Rolar Desafio",
    content,
    buttons: {
      roll: {
        label: "🎲 Rolar Agora",
        callback: async (html) => {

          const diffKey = html.find('[name="difficulty"]').val();
          const attr = html.find('[name="attribute"]').val();
          const extra = Number(html.find('[name="extraDice"]').val());

          const diff = difficulties[diffKey];

          await executarRolagem({
            actor,
            atributo: attr,
            dificuldade: diff,
            extraDice: extra
          });
        }
      }
    }
  }).render(true);
}

async function executarRolagem({ actor, atributo, dificuldade, extraDice }) {

  const baseDice = dificuldade.dice;
  const target = dificuldade.target;

  // 🎲 Criando a rolagem base
  const rollBase = new Roll(`${baseDice}d6`).evaluate({ async: true });

  // 🎲 Criando os dados extras (se existirem)
  let rollExtra = null;
  if (extraDice > 0) {
    rollExtra = new Roll(`${extraDice}d6`).evaluate({ async: true });
  }

  await Promise.all([rollBase, rollExtra]);

  const results = [
    ...rollBase.dice[0].results,
    ...(rollExtra ? rollExtra.dice[0].results : [])
  ];

  const successes = results.filter(r => r.result >= target).length;

  const bug = successes === 0;
  const strong = successes >= 2;

  // 🎨 Dice So Nice integration
  if (game.dice3d) {

    const colorMap = {
      corpo: "green",
      mente: "blue",
      coracao: "red",
      extra: "purple"
    };

    await game.dice3d.showForRoll(
      rollBase,
      actor,
      { colorset: colorMap[atributo] }
    );

    if (rollExtra) {
      await game.dice3d.showForRoll(
        rollExtra,
        actor,
        { colorset: colorMap.extra }
      );
    }
  }

  // 💬 Mensagem no chat
  let resultadoTexto = bug
    ? "🐞 **BUG** — O Nó reage."
    : strong
      ? "🌟 **Sucesso Forte**"
      : "✨ **Sucesso**";

  ChatMessage.create({
    content: `
      <h2>🎲 Desafio ${dificuldade.label}</h2>
      <p><strong>Atributo:</strong> ${atributo}</p>
      <p><strong>Resultado:</strong> ${resultadoTexto}</p>
    `
  });
}
