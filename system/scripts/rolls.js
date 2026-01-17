/**
 * GAMBIARRA.SYS6 — Rolagens (v0.4)
 * Regras:
 * - Pool base = valor do atributo escolhido (Corpo/Mente/Coração)
 * - Dificuldade define:
 *    - successes (quantos sucessos precisa)
 *    - target (valor mínimo no d6)
 * - Dados roxos: adicionados no diálogo (0..N)
 * - Extras: boa ideia / item / ajuda (0..N)
 * - Chat mostra os números de cada grupo de dado
 *
 * OBS: Dice So Nice DESLIGADO aqui por enquanto (estava quebrando)
 */

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  // fallback seguro (caso algo esteja vindo vazio)
  const attrs = actor.system?.attributes ?? {
    corpo: { value: 2 },
    mente: { value: 2 },
    coracao: { value: 2 }
  };

  // valor inicial do contador de roxos no diálogo
  let purpleCount = 0;

  const content = `
  <form class="gambiarra-roll">
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties).map(([key, d]) =>
          `<option value="${key}">${d.label} — precisa ${d.successes} sucesso(s), ${d.target}+</option>`
        ).join("")}
      </select>
    </div>

    <div class="form-group">
      <label>Atributo (pool base)</label>
      <select name="attribute">
        <option value="corpo">🟢 Corpo (${attrs.corpo?.value ?? 2}d)</option>
        <option value="mente">🔵 Mente (${attrs.mente?.value ?? 2}d)</option>
        <option value="coracao">🔴 Coração (${attrs.coracao?.value ?? 2}d)</option>
      </select>
    </div>

    <hr/>

    <div class="form-group">
      <label>🟣 Dados Roxos (ajuda especial)</label>
      <div style="display:flex; gap:8px; align-items:center;">
        <button type="button" class="purple-minus">−</button>
        <input type="number" name="purpleDice" value="0" min="0" max="20" style="width:80px;" />
        <button type="button" class="purple-plus">+</button>
      </div>
      <p class="hint">Ideia criativa, item, ajuda, Poder, Pessoa Estranha…</p>
    </div>

    <div class="form-group">
      <label>➕ Dados Extras (boa ideia / item / ajuda)</label>
      <input type="number" name="extraDice" value="0" min="0" max="20" style="width:120px;" />
    </div>
  </form>
  `;

  const dlg = new Dialog({
    title: "🎲 Rolar Desafio",
    content,
    buttons: {
      roll: {
        label: "Rolar",
        callback: async (html) => {
          const diffKey = html.find('[name="difficulty"]').val();
          const atributo = html.find('[name="attribute"]').val();

          const diff = difficulties[diffKey];
          if (!diff) {
            ui.notifications.error("Dificuldade inválida.");
            return;
          }

          const extraDice = Math.max(0, Number(html.find('[name="extraDice"]').val()) || 0);
          const purpleDice = Math.max(0, Number(html.find('[name="purpleDice"]').val()) || 0);

          // Pool base vem do atributo (regra v0.4)
          const baseDice = Math.max(1, Number(actor.system?.attributes?.[atributo]?.value) || 1);

          await executarRolagem({
            actor,
            atributo,
            baseDice,
            extraDice,
            purpleDice,
            dificuldade: diff
          });
        }
      }
    },
    default: "roll",
    render: (html) => {
      // botões +/- dos roxos
      const input = html.find('[name="purpleDice"]');

      html.find(".purple-plus").click(() => {
        purpleCount = Math.min(20, (Number(input.val()) || 0) + 1);
        input.val(purpleCount);
      });

      html.find(".purple-minus").click(() => {
        purpleCount = Math.max(0, (Number(input.val()) || 0) - 1);
        input.val(purpleCount);
      });
    }
  });

  dlg.render(true);
}

async function executarRolagem({ actor, atributo, baseDice, extraDice, purpleDice, dificuldade }) {
  const target = dificuldade.target;
  const required = dificuldade.successes;

  // Rolagens (v12: evaluate() é async por padrão)
  const rollBase = await new Roll(`${baseDice}d6`).evaluate();
  const rollPurple = purpleDice > 0 ? await new Roll(`${purpleDice}d6`).evaluate() : null;
  const rollExtra = extraDice > 0 ? await new Roll(`${extraDice}d6`).evaluate() : null;

  const baseResults = rollBase.dice[0].results.map(r => r.result);
  const purpleResults = rollPurple ? rollPurple.dice[0].results.map(r => r.result) : [];
  const extraResults = rollExtra ? rollExtra.dice[0].results.map(r => r.result) : [];

  const all = [...baseResults, ...purpleResults, ...extraResults];

  const successes = all.filter(n => n >= target).length;
  const strong = successes > required;
  const pass = successes >= required;
  const bug = !pass;

  // BUG como estado narrativo no personagem
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada.",
        recorrente: false
      }
    });
  }

  const resultadoTexto = bug
    ? "🐞 **BUG** — O Nó reage (complicação)."
    : strong
      ? "🌟 **Sucesso Forte**"
      : "✨ **Sucesso**";

  const fmt = (arr) => arr.length ? `[${arr.join(", ")}]` : "—";

  const extraMsg = (purpleDice + extraDice) > 0
    ? `<p class="hint">Ajuda no pool: 🟣 ${purpleDice} roxo(s) + ➕ ${extraDice} extra(s)</p>`
    : "";

  ChatMessage.create({
    content: `
      <h2>🎲 ${dificuldade.label}</h2>
      <p><strong>Atributo:</strong> ${atributo}</p>
      <p><strong>Alvo:</strong> ${target}+ &nbsp;|&nbsp; <strong>Precisa:</strong> ${required} sucesso(s)</p>

      <hr/>

      <p><strong>Base (${baseDice}d6):</strong> ${fmt(baseResults)}</p>
      <p><strong>🟣 Roxos (${purpleDice}d6):</strong> ${fmt(purpleResults)}</p>
      <p><strong>➕ Extras (${extraDice}d6):</strong> ${fmt(extraResults)}</p>

      ${extraMsg}

      <hr/>

      <p><strong>Sucessos:</strong> ${successes} / ${required}</p>
      <p><strong>Resultado:</strong> ${resultadoTexto}</p>
    `
  });
}
