/**
 * GAMBIARRA.SYS6 — Sistema de Rolagem
 * - Popup de desafio
 * - Dados 3D coloridos
 * - Detecção automática de BUG
 * - Marcação de BUG como estado narrativo
 * - (Opcional) Dado Roxo via Poder Gambiarra
 */

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra.config.difficulties;

  // ─────────────────────────────────────────────
  // NOVO: detectar se existe Poder ativo que permite dado roxo
  // ─────────────────────────────────────────────
  const hasActivePower = actor.system.meta.poderes?.some(
    (p) => p.estado === "ativo" && p.dadoRoxo
  );

  const content = `
  <form>
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties)
          .map(
            ([key, d]) =>
              `<option value="${key}">${d.label} (${d.dice}d6, ${d.target}+)</option>`
          )
          .join("")}
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
      <p class="hint">Boa ideia (Programadora), item ou ajuda ⚙️</p>
    </div>

    <!-- ─────────────────────────────────────────
         NOVO: opção de forçar o Nó (dado roxo)
         só aparece se existir Poder válido
         ───────────────────────────────────────── -->
    ${
      hasActivePower
        ? `
    <hr>
    <div class="form-group">
      <label>
        <input type="checkbox" name="usePurple">
        ⚡ Forçar o Nó (1 dado roxo)
      </label>
      <p class="hint">Aumenta o risco do Poder Gambiarra</p>
    </div>
    `
        : ``
    }
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

          // ✔ Linha correta (já estava certa no seu git)
          const extra = Math.max(
            0,
            Number(html.find('[name="extraDice"]').val()) || 0
          );

          // ─────────────────────────────────────────
          // NOVO: ler checkbox do dado roxo
          // ─────────────────────────────────────────
          const usePurple = html.find('[name="usePurple"]').is(":checked");

          const diff = difficulties[diffKey];

          await executarRolagem({
            actor,
            atributo: attr,
            dificuldade: diff,
            extraDice: extra,
            usarDadoRoxo: usePurple, // NOVO
          });
        },
      },
    },
  }).render(true);
}

// ─────────────────────────────────────────────
// NOVO: parâmetro usarDadoRoxo (default false)
// ─────────────────────────────────────────────
async function executarRolagem({
  actor,
  atributo,
  dificuldade,
  extraDice,
  usarDadoRoxo = false,
}) {
  const baseDice = dificuldade.dice;
  const target = dificuldade.target;

  // 🎲 Rolagem base (atributo)
  const rollBase = await new Roll(`${baseDice}d6`).evaluate({ async: true });

  // 🎲 Rolagem extra (itens / amizade / ajuda)
  let rollExtra = null;
  if (extraDice > 0) {
    rollExtra = await new Roll(`${extraDice}d6`).evaluate({ async: true });
  }

  // ─────────────────────────────────────────────
  // NOVO: Dado Roxo — Poder Gambiarra
  // ─────────────────────────────────────────────
  let rollPurple = null;
  if (usarDadoRoxo) {
    rollPurple = await new Roll("1d6").evaluate({ async: true });
  }

  const baseResults = rollBase.dice[0].results;
  const extraResults = rollExtra ? rollExtra.dice[0].results : [];
  const purpleResults = rollPurple ? rollPurple.dice[0].results : [];

  // ─────────────────────────────────────────────
  // NOVO: todos os dados contam juntos
  // ─────────────────────────────────────────────
  const allResults = [...baseResults, ...extraResults, ...purpleResults];

  const successes = allResults.filter((r) => r.result >= target).length;

  const bug = successes === 0;
  const strong = successes >= 2;

  // 🎨 Dice So Nice — cores separadas
  if (game.dice3d) {
    const colorMap = {
      corpo: "green",
      mente: "blue",
      coracao: "red",
      extra: "purple",
    };

    await game.dice3d.showForRoll(rollBase, actor, {
      colorset: colorMap[atributo],
    });

    if (rollExtra) {
      await game.dice3d.showForRoll(rollExtra, actor, {
        colorset: colorMap.extra,
      });
    }

    // ─────────────────────────────────────────
    // NOVO: mostrar dado roxo separado
    // ─────────────────────────────────────────
    if (rollPurple) {
      await game.dice3d.showForRoll(rollPurple, actor, { colorset: "purple" });
    }
  }

  // 🐞 BUG como estado narrativo
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada.",
      },
    });
  }

  // ─────────────────────────────────────────────
  // NOVO: Consequência do uso do Poder
  // ─────────────────────────────────────────────
  if (usarDadoRoxo) {
    const poderes = duplicate(actor.system.meta.poderes);
    const poder = poderes.find((p) => p.estado === "ativo" && p.dadoRoxo);

    if (poder) {
      poder.usos += 1;

      if (poder.usos === 2) poder.estado = "esgotado";
      if (poder.usos >= 3) poder.estado = "fora";

      await actor.update({ "system.meta.poderes": poderes });
    }
  }

  // 💬 Mensagem no chat
  let resultadoTexto = bug
    ? "🐞 **BUG** — O Nó reage."
    : strong
    ? "🌟 **Sucesso Forte**"
    : "✨ **Sucesso**";

  // ─────────────────────────────────────────────
  // NOVO: mensagem de dados extras (boa ideia / item / ajuda)
  // ─────────────────────────────────────────────
  let extraMsg = extraDice > 0
    ? `<p>➕ ${extraDice} dado(s) concedido(s) por boa ideia, item ou ajuda.</p>`
    : "";

  ChatMessage.create({
    content: `
      <h2>🎲 Desafio ${dificuldade.label}</h2>
      <p><strong>Atributo:</strong> ${atributo}</p>
      ${extraMsg}
      <p><strong>Resultado:</strong> ${resultadoTexto}</p>
    `,
  });
}
