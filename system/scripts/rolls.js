/**
 * GAMBIARRA.SYS6 — Sistema de Rolagem (v0.4)
 * - Popup de desafio
 * - Pool = atributo (d6) + dados roxos (d6)
 * - Exibe números rolados no chat
 * - Detecção de BUG (0 sucessos)
 *
 * Foundry v12: usar Roll#evaluate() (async) sem { async: true }
 */

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra.config.difficulties;

  // fallback seguro (caso meta não exista por algum ator antigo)
  const meta = actor.system?.meta ?? { poderes: [], bug: { ativo: false } };

  const content = `
  <form class="gambiarra-roll-form">
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties)
          .map(([key, d]) => `<option value="${key}">${d.label} (${d.target}+)</option>`)
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

    <hr>

    <div class="form-group">
      <label>🟣 Dados Roxos</label>
      <div class="purple-counter" style="display:flex; gap:8px; align-items:center;">
        <button type="button" class="purple-minus">−</button>
        <input type="number" name="purpleDice" value="0" min="0" max="10" style="width:70px; text-align:center;" />
        <button type="button" class="purple-plus">+</button>
      </div>
      <p class="hint">Ideia criativa, item, ajuda ou Poder Gambiarra.</p>
    </div>
  </form>
  `;

  const dlg = new Dialog({
    title: "Rolar Desafio",
    content,
    buttons: {
      roll: {
        label: "🎲 Rolar Agora",
        callback: async (html) => {
          const diffKey = html.find('[name="difficulty"]').val();
          const attr = html.find('[name="attribute"]').val();
          const purple = Math.max(0, Number(html.find('[name="purpleDice"]').val()) || 0);

          const diff = difficulties[diffKey];

          await executarRolagem({
            actor,
            atributo: attr,
            dificuldade: diff,
            dadosRoxos: purple
          });
        }
      }
    },
    default: "roll",
    render: (html) => {
      const $input = html.find('[name="purpleDice"]');
      html.find(".purple-plus").on("click", () => {
        const v = Math.max(0, Number($input.val()) || 0);
        $input.val(v + 1);
      });
      html.find(".purple-minus").on("click", () => {
        const v = Math.max(0, Number($input.val()) || 0);
        $input.val(Math.max(0, v - 1));
      });
    }
  });

  dlg.render(true);
}

async function executarRolagem({ actor, atributo, dificuldade, dadosRoxos }) {
  const target = dificuldade.target;

  // valor do atributo = quantidade de dados base
  const baseDice = Number(actor.system?.attributes?.[atributo]?.value ?? 0);

  if (!baseDice || baseDice < 1) {
    ui.notifications.warn(
      `Este personagem ainda não tem valor em ${atributo}. Preencha Corpo/Mente/Coração (mínimo 1).`
    );
    return;
  }

  // Rola base e roxos separadamente (pra poder mostrar no chat)
  const rollBase = await new Roll(`${baseDice}d6`).evaluate();
  const rollPurple = dadosRoxos > 0 ? await new Roll(`${dadosRoxos}d6`).evaluate() : null;

  const baseResults = rollBase.dice[0].results;
  const purpleResults = rollPurple ? rollPurple.dice[0].results : [];

  const allResults = [...baseResults, ...purpleResults];
  const successes = allResults.filter((r) => r.result >= target).length;

  const bug = successes === 0;
  const strong = successes >= 2;

  // BUG como estado narrativo no personagem
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada.",
      },
    });
  }

  // Texto de resultados no chat
  const formatResults = (results) => results.map((r) => r.result).join(", ");

  const baseText = `🎲 Base (${baseDice}): [${formatResults(baseResults)}]`;
  const purpleText =
    purpleResults.length > 0
      ? `<br>🟣 Roxos (${dadosRoxos}): [${formatResults(purpleResults)}]`
      : "";

  let resultadoTexto = bug
    ? "🐞 **BUG** — O Nó reage."
    : strong
      ? "🌟 **Sucesso Forte**"
      : "✨ **Sucesso**";

  const roxosMsg =
    dadosRoxos > 0
      ? `<p>🟣 ${dadosRoxos} dado(s) roxo(s) adicionados (ideia/item/ajuda/poder).</p>`
      : "";

  ChatMessage.create({
    content: `
      <h2>🎲 Desafio ${dificuldade.label}</h2>
      <p><strong>Atributo:</strong> ${atributo}</p>
      <p><strong>Alvo:</strong> ${target}+</p>

      <p>
        ${baseText}
        ${purpleText}
      </p>

      ${roxosMsg}

      <p><strong>Sucessos:</strong> ${successes}</p>
      <p><strong>Resultado:</strong> ${resultadoTexto}</p>
    `,
  });
}
