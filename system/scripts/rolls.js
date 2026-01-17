/**
 * GAMBIARRA.SYS6 — Sistema de Rolagem (Foundry v12 SAFE)
 * - Popup de desafio
 * - Rolagem assíncrona correta
 * - Valores dos dados no chat
 * - BUG narrativo
 * - Poder Gambiarra (dado roxo lógico)
 */

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra.config.difficulties;

  const meta = actor.system.meta ?? {
    poderes: [],
    bug: { ativo: false },
  };

  const hasActivePower = meta.poderes.some(
    (p) => p.estado === "ativo" && p.dadoRoxo,
  );

  const content = `
  <form>
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties)
          .map(
            ([key, d]) =>
              `<option value="${key}">
                ${d.label} (${d.dice}d6, ${d.target}+)
              </option>`,
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
      <p class="hint">Boa ideia, item ou ajuda ⚙️</p>
    </div>

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
    title: "🎲 Rolar Desafio",
    content,
    buttons: {
      roll: {
        label: "Rolar",
        callback: async (html) => {
          const diffKey = html.find('[name="difficulty"]').val();
          const atributo = html.find('[name="attribute"]').val();
          const extraDice = Number(html.find('[name="extraDice"]').val()) || 0;
          const usarDadoRoxo = html.find('[name="usePurple"]').is(":checked");

          await executarRolagem({
            actor,
            atributo,
            dificuldade: difficulties[diffKey],
            extraDice,
            usarDadoRoxo,
          });
        },
      },
    },
  }).render(true);
}

async function executarRolagem({
  actor,
  atributo,
  dificuldade,
  extraDice,
  usarDadoRoxo = false,
}) {
  const baseDice = dificuldade.dice;
  const target = dificuldade.target;

  // 🎲 Rolagens ASSÍNCRONAS corretas (v12)
  const rollBase = await new Roll(`${baseDice}d6`).evaluate();
  const rollExtra =
    extraDice > 0 ? await new Roll(`${extraDice}d6`).evaluate() : null;
  const rollPurple =
    usarDadoRoxo ? await new Roll("1d6").evaluate() : null;

  const baseResults = rollBase.dice[0].results.map((r) => r.result);
  const extraResults = rollExtra
    ? rollExtra.dice[0].results.map((r) => r.result)
    : [];
  const purpleResults = rollPurple
    ? rollPurple.dice[0].results.map((r) => r.result)
    : [];

  const allResults = [...baseResults, ...extraResults, ...purpleResults];
  const successes = allResults.filter((r) => r >= target).length;

  const bug = successes === 0;
  const strong = successes >= 2;

  // 🐞 BUG narrativo
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada.",
      },
    });
  }

  // ⚡ Consequência do Poder Gambiarra
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

  const fmt = (arr) => arr.join(", ");

  // 💬 Chat
  await ChatMessage.create({
    content: `
      <h2>🎲 Desafio — ${dificuldade.label}</h2>

      <p><strong>Atributo:</strong> ${atributo}</p>

      <p>
        🎲 Base: [${fmt(baseResults)}]
        ${extraResults.length ? `<br>➕ Extra: [${fmt(extraResults)}]` : ""}
        ${purpleResults.length ? `<br>⚡ Poder: [${fmt(purpleResults)}]` : ""}
      </p>

      <p><strong>Sucessos:</strong> ${successes}</p>

      <p><strong>Resultado:</strong>
        ${
          bug
            ? "🐞 BUG — O Nó reage."
            : strong
              ? "🌟 Sucesso Forte"
              : "✨ Sucesso"
        }
      </p>
    `,
  });
}
