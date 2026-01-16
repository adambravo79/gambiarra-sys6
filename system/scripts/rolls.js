/**
 * GAMBIARRA.SYS6 — Sistema de Rolagem
 * - Popup de desafio
 * - Dados 3D coloridos
 * - Detecção automática de BUG
 * - Marcação de BUG como estado narrativo
 */

export async function rollDesafio(actor) {

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

  // 🎲 Rolagem base (atributo)
  const rollBase = await new Roll(`${baseDice}d6`).evaluate({ async: true });

  // 🎲 Rolagem extra (itens / amizade / poder)
  let rollExtra = null;
  if (extraDice > 0) {
    rollExtra = await new Roll(`${extraDice}d6`).evaluate({ async: true });
  }

  const baseResults = rollBase.dice[0].results;
  const extraResults = rollExtra ? rollExtra.dice[0].results : [];

  const allResults = [...baseResults, ...extraResults];

  const successes = allResults.filter(r => r.result >= target).length;

  const bug = successes === 0;          // NOVO: BUG detectado
  const strong = successes >= 2;

  // 🎨 Dice So Nice — cores separadas
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

  // 🐞 NOVO: Marcar BUG como estado narrativo no personagem
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada."
      }
    });
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
