/**
 * GAMBIARRA.SYS6 — Rolagens (v0.5)
 * - Pool = valor do atributo
 * - Dificuldade = sucessos necessários (required) + alvo (target)
 * - Dados Roxos = bônus decidido pela Programadora no diálogo
 * - Chat mostra os valores rolados
 * - Integração Dice So Nice (se instalado)
 *
 * ✅ v0.5.x: NÃO aplica mais estado de BUG no Actor (sem uso por enquanto)
 */

const COLORSET = {
  corpo: "gambi-corpo",
  mente: "gambi-mente",
  coracao: "gambi-coracao",
  roxo: "gambi-roxo",
};

function clampInt(n, min, max) {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, v));
}

function formatResults(results) {
  return results.map((r) => r.result).join(", ");
}

function applyDiceSoNiceAppearance(roll, colorsetId) {
  for (const die of roll.dice ?? []) {
    die.options = die.options ?? {};
    die.options.colorset = colorsetId; // compat
    die.options.appearance = die.options.appearance ?? {};
    die.options.appearance.colorset = colorsetId;
  }
}

async function show3dIfAvailable(roll) {
  if (!game.dice3d?.showForRoll) return;
  await game.dice3d.showForRoll(roll, game.user, true);
}

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  const attrs = actor.system?.attributes ?? {};
  const corpo = attrs.corpo?.value ?? 2;
  const mente = attrs.mente?.value ?? 2;
  const coracao = attrs.coracao?.value ?? 2;

  const content = `
  <form class="gambiarra-roll">
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties)
          .map(([key, d]) => {
            const req = d.required ?? 1;
            const tgt = d.target ?? 4;
            return `<option value="${key}">${d.label} (sucessos: ${req}, alvo: ${tgt}+)</option>`;
          })
          .join("")}
      </select>
    </div>

    <div class="form-group">
      <label>Atributo</label>
      <select name="attribute">
        <option value="corpo">🟢 Corpo (${corpo}d)</option>
        <option value="mente">🔵 Mente (${mente}d)</option>
        <option value="coracao">🔴 Coração (${coracao}d)</option>
      </select>
      <p class="hint">O valor do atributo é o tamanho do pool.</p>
    </div>

    <hr/>

    <div class="form-group">
      <label>🟣 Dados Roxos</label>
      <div class="purple-ctrl">
        <button type="button" class="purple-minus">−</button>
        <input type="text" name="purpleDice" value="0" readonly />
        <button type="button" class="purple-plus">+</button>
        <span class="hint">A Programadora decide (ideia, item, ajuda, poder etc.)</span>
      </div>
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
          const purple = Number(html.find('[name="purpleDice"]').val()) || 0;

          const dificuldade = difficulties[diffKey];
          await executarRolagem({
            actor,
            atributo,
            dificuldade,
            roxos: clampInt(purple, 0, 10),
          });
        },
      },
    },
    default: "roll",
    render: (html) => {
      const $val = html.find('[name="purpleDice"]');

      html.find(".purple-minus").on("click", () => {
        const cur = Number($val.val()) || 0;
        $val.val(String(clampInt(cur - 1, 0, 10)));
      });

      html.find(".purple-plus").on("click", () => {
        const cur = Number($val.val()) || 0;
        $val.val(String(clampInt(cur + 1, 0, 10)));
      });
    },
  });

  dlg.render(true);
}

async function executarRolagem({ actor, atributo, dificuldade, roxos = 0 }) {
  const required = Number(dificuldade?.required ?? 1);
  const target = Number(dificuldade?.target ?? 4);

  const pool = Number(actor.system?.attributes?.[atributo]?.value ?? 0);

  if (!pool || pool < 1) {
    ui.notifications.warn(
      "Este personagem não tem valor nesse atributo (pool vazio). Ajuste Corpo/Mente/Coração na ficha."
    );
    return;
  }

  // 1) Rolagem base (cor do atributo)
  const rollBase = await new Roll(`${pool}d6`).evaluate();
  applyDiceSoNiceAppearance(rollBase, COLORSET[atributo] ?? "gambi-corpo");

  // 2) Rolagem roxa (se existir)
  let rollRoxo = null;
  if (roxos > 0) {
    rollRoxo = await new Roll(`${roxos}d6`).evaluate();
    applyDiceSoNiceAppearance(rollRoxo, COLORSET.roxo);
  }

  // 3D
  await show3dIfAvailable(rollBase);
  if (rollRoxo) await show3dIfAvailable(rollRoxo);

  const baseResults = rollBase.dice[0].results;
  const roxoResults = rollRoxo ? rollRoxo.dice[0].results : [];

  const allResults = [...baseResults, ...roxoResults];
  const successes = allResults.filter((r) => r.result >= target).length;

  const bug = successes < required;
  const strong = successes > required;

  const resultadoTexto = bug
    ? "🐞 **BUG** — O Nó reage (complicação)."
    : strong
    ? "🌟 **Sucesso Forte**"
    : "✨ **Sucesso**";

  const attrLabel =
    atributo === "corpo" ? "🟢 Corpo" : atributo === "mente" ? "🔵 Mente" : "🔴 Coração";

  const baseText = `${attrLabel} (${pool}d6): <strong>[${formatResults(baseResults)}]</strong>`;
  const roxoText = roxoResults.length
    ? `<br>🟣 Roxos (${roxos}d6): <strong>[${formatResults(roxoResults)}]</strong>`
    : "";

  ChatMessage.create({
    content: `
      <div class="gambiarra-chat">
        <h2>🎲 Desafio ${dificuldade?.label ?? ""}</h2>
        <p><strong>Dificuldade:</strong> ${required} sucesso(s), alvo ${target}+</p>
        <p class="dice-lines">${baseText}${roxoText}</p>
        <p><strong>Sucessos:</strong> ${successes}</p>
        <p><strong>Resultado:</strong> ${resultadoTexto}</p>
      </div>
    `,
  });
}
