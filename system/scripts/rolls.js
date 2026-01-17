/**
 * GAMBIARRA.SYS6 — Rolagens (v0.4)
 * - Pool = valor do atributo
 * - Dificuldade = sucessos necessários (required) + alvo (target)
 * - Dados Roxos = bônus decidido pela Programadora no diálogo
 * - Chat mostra os valores rolados
 * - Integração Dice So Nice (se instalado)
 */

const COLORSET = {
  corpo: "gambi-corpo",
  mente: "gambi-mente",
  coracao: "gambi-coracao",
  roxo: "gambi-roxo",
};

const ATTR_LABEL = {
  corpo: "💪 Corpo",
  mente: "🧠 Mente",
  coracao: "❤️ Coração",
};

function clampInt(n, min, max) {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, v));
}

function formatResults(results) {
  return results.map((r) => r.result).join(", ");
}

function applyDiceSoNiceAppearance(roll, colorsetId) {
  // Dice So Nice v4+ aceita appearance no DiceTerm
  for (const die of roll.dice ?? []) {
    die.options = die.options ?? {};
    // compat
    die.options.colorset = colorsetId;
    // v4+ appearance
    die.options.appearance = die.options.appearance ?? {};
    die.options.appearance.colorset = colorsetId;
  }
}

async function show3dIfAvailable(roll) {
  // Assinatura comum: showForRoll(roll, user, synchronize?)
  if (!game.dice3d?.showForRoll) return;
  await game.dice3d.showForRoll(roll, game.user, true);
}

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  // Valores seguros (caso algum ator antigo esteja incompleto)
  const attrs = actor.system?.attributes ?? {};
  const corpo = Number(attrs.corpo?.value ?? 2);
  const mente = Number(attrs.mente?.value ?? 2);
  const coracao = Number(attrs.coracao?.value ?? 2);

  const content = `
  <form class="gambiarra-roll" autocomplete="off">
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
        <option value="corpo">💪 Corpo (${corpo}d)</option>
        <option value="mente">🧠 Mente (${mente}d)</option>
        <option value="coracao">❤️ Coração (${coracao}d)</option>
      </select>
      <p class="hint">O valor do atributo é o tamanho do pool.</p>
    </div>

    <hr/>

    <div class="form-group">
      <label>🟣 Dados Roxos</label>
      <div class="purple-row">
        <button type="button" class="purple-minus">−</button>
        <input class="purple-count" type="text" name="purpleDice" value="0" readonly />
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
      "Este personagem não tem valor nesse atributo (pool vazio). Ajuste Corpo/Mente/Coração na ficha.",
    );
    return;
  }

  // 1) Rolagem base (cor do atributo)
  const rollBase = await new Roll(`${pool}d6`).evaluate(); // v12: sem {async:true}
  applyDiceSoNiceAppearance(rollBase, COLORSET[atributo] ?? "gambi-corpo");

  // 2) Rolagem roxa (se existir)
  let rollRoxo = null;
  if (roxos > 0) {
    rollRoxo = await new Roll(`${roxos}d6`).evaluate();
    applyDiceSoNiceAppearance(rollRoxo, COLORSET.roxo);
  }

  // Mostrar 3D (se módulo existir)
  await show3dIfAvailable(rollBase);
  if (rollRoxo) await show3dIfAvailable(rollRoxo);

  const baseResults = rollBase.dice[0].results;
  const roxoResults = rollRoxo ? rollRoxo.dice[0].results : [];

  const allResults = [...baseResults, ...roxoResults];
  const successes = allResults.filter((r) => r.result >= target).length;

  // ✅ NOVO: quais valores foram sucessos (>= alvo)
  const successValues = allResults
    .filter((r) => r.result >= target)
    .map((r) => r.result)
    .sort((a, b) => a - b);

  // ✅ NOVO: classe de cor do atributo (para o badge)
  const attrClass =
    atributo === "corpo"
      ? "attr-corpo"
      : atributo === "mente"
        ? "attr-mente"
        : "attr-coracao";

  const bug = successes < required;
  const strong = successes > required;

  // BUG como estado narrativo
  if (bug) {
    await actor.update({
      "system.meta.bug": {
        ativo: true,
        intensidade: target === 6 ? "pesado" : "leve",
        descricao: "O Nó reagiu de forma inesperada.",
        recorrente: actor.system?.meta?.bug?.recorrente ?? false,
      },
    });
  }

  const attrLabel =
    atributo === "corpo"
      ? "💪 Corpo"
      : atributo === "mente"
        ? "🧠 Mente"
        : "❤️ Coração";

  const baseText = `🎲 ${attrLabel} (${pool}d6): <strong>[${formatResults(baseResults)}]</strong>`;
  const roxoText = roxoResults.length
    ? `<div class="gambi-line">🟣 Roxos (${roxos}d6): <strong>[${formatResults(roxoResults)}]</strong></div>`
    : "";

  const resultBadge = bug
    ? `<span class="gambi-badge ${attrClass} bug">🐞 BUG</span>`
    : strong
      ? `<span class="gambi-badge ${attrClass} strong">🌟 Sucesso Forte</span>`
      : `<span class="gambi-badge ${attrClass} ok">✨ Sucesso</span>`;

  const diffLine = `<div class="gambi-sub">Dificuldade: <strong>${required}</strong> sucesso(s), alvo <strong>${target}+</strong></div>`;

  // ✅ NOVO: detalhar sucessos (quantos e quais valores bateram o alvo)
  const successLine =
    successValues.length > 0
      ? `<div class="gambi-sub">✅ Dados em sucesso (${successValues.length}): <strong>${successValues.join(", ")}</strong></div>`
      : `<div class="gambi-sub">✅ Dados em sucesso (0)</div>`;

  ChatMessage.create({
    content: `
      <div class="gambi-chat-card">
        <div class="gambi-title">🎲 Desafio ${dificuldade.label} ${resultBadge}</div>
        ${diffLine}

        <div class="gambi-line">${baseText}</div>
        ${roxoText}

        <div class="gambi-sub">Sucessos totais: <strong>${successes}</strong></div>
        ${successLine}
      </div>
    `,
  });
}
