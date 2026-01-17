/**
 * GAMBIARRA.SYS6 — Sistema de Rolagem (Foundry v12)
 * - Popup de desafio
 * - Pool = atributo (quantidade de dados) + dados roxos (ajuda)
 * - Exibe todos os resultados do pool no chat
 * - Integra (opcional) com Dice So Nice, com cores por atributo + roxo
 */

const COLORSET = {
  corpo: "gambi-corpo",     // verde
  mente: "gambi-mente",     // azul
  coracao: "gambi-coracao", // vermelho
  roxo: "gambi-roxo"        // roxo
};

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  // fallback seguro
  const attrs = actor.system?.attributes ?? {
    corpo: { value: 2 },
    mente: { value: 2 },
    coracao: { value: 2 }
  };

  const content = `
  <form class="gambi-roll-dialog">
    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties).map(([key, d]) =>
          `<option value="${key}">${d.label} (sucessos: ${d.required}, alvo: ${d.target}+)</option>`
        ).join("")}
      </select>
    </div>

    <div class="form-group">
      <label>Atributo</label>
      <select name="attribute">
        <option value="corpo">🟢 Corpo (${Number(attrs.corpo?.value ?? 0)}d)</option>
        <option value="mente">🔵 Mente (${Number(attrs.mente?.value ?? 0)}d)</option>
        <option value="coracao">🔴 Coração (${Number(attrs.coracao?.value ?? 0)}d)</option>
      </select>
      <p class="hint">O valor do atributo é a quantidade de dados do pool.</p>
    </div>

    <hr>

    <div class="form-group">
      <label>🟣 Dados Roxos (ajuda especial)</label>
      <div style="display:flex; gap:8px; align-items:center;">
        <button type="button" class="purple-minus">➖</button>
        <input type="number" name="purpleDice" value="0" min="0" max="10" style="width:70px; text-align:center;"/>
        <button type="button" class="purple-plus">➕</button>
      </div>
      <p class="hint">A Programadora decide quantos dados roxos entram (ideia, item, ajuda, poder etc.).</p>
    </div>

    <div class="form-group">
      <p class="hint">
        <strong>Pool total:</strong>
        <span class="pool-preview">—</span>
      </p>
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

          const purpleDice = Math.max(0, Number(html.find('[name="purpleDice"]').val()) || 0);

          const diff = difficulties[diffKey];
          await executarRolagem({
            actor,
            atributo,
            dificuldade: diff,
            purpleDice
          });
        }
      }
    },
    render: (html) => {
      const $attr = html.find('[name="attribute"]');
      const $purple = html.find('[name="purpleDice"]');
      const $preview = html.find('.pool-preview');

      const getAttrDice = () => {
        const a = $attr.val();
        const v = Number(actor.system?.attributes?.[a]?.value ?? 0);
        return Math.max(0, v);
      };

      const refreshPreview = () => {
        const aDice = getAttrDice();
        const pDice = Math.max(0, Number($purple.val()) || 0);
        $preview.text(`${aDice}d6 (${String($attr.val())}) + ${pDice}d6 (roxo) = ${aDice + pDice}d6`);
      };

      html.find(".purple-minus").on("click", () => {
        const cur = Math.max(0, Number($purple.val()) || 0);
        $purple.val(Math.max(0, cur - 1));
        refreshPreview();
      });

      html.find(".purple-plus").on("click", () => {
        const cur = Math.max(0, Number($purple.val()) || 0);
        $purple.val(cur + 1);
        refreshPreview();
      });

      $attr.on("change", refreshPreview);
      $purple.on("input", refreshPreview);

      refreshPreview();
    }
  });

  dlg.render(true);
}

async function executarRolagem({ actor, atributo, dificuldade, purpleDice }) {
  const target = Number(dificuldade?.target ?? 4);
  const required = Number(dificuldade?.required ?? 1);

  const attrDice = Math.max(0, Number(actor.system?.attributes?.[atributo]?.value ?? 0));
  const purple = Math.max(0, Number(purpleDice ?? 0));

  if (attrDice <= 0) {
    ui.notifications.warn("Este atributo está 0. Ajuste Corpo/Mente/Coração para pelo menos 1.");
    return;
  }

  // Rola separadamente para permitir cores diferentes (atributo vs roxo)
  const rollAttr = await (new Roll(`${attrDice}d6`)).evaluate();
  const rollPurple = purple > 0 ? await (new Roll(`${purple}d6`)).evaluate() : null;

  const attrResults = rollAttr.dice[0]?.results ?? [];
  const purpleResults = rollPurple ? (rollPurple.dice[0]?.results ?? []) : [];
  const allResults = [...attrResults, ...purpleResults];

  const successes = allResults.filter(r => (r?.result ?? 0) >= target).length;

  const bug = successes < required;
  const strong = !bug && successes > required; // “um ou mais além do mínimo”

  // Dice So Nice (opcional) — não deixa quebrar a rolagem
  await showDiceSoNiceSafe(rollAttr, atributo);
  if (rollPurple) await showDiceSoNiceSafe(rollPurple, "roxo");

  // BUG como estado narrativo (mantém sua ideia anterior)
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

  // Texto dos resultados
  const fmt = (results) => results.map(r => r.result).join(", ");
  const poolText = `
    <p><strong>🎲 ${atributo.toUpperCase()}:</strong> [${fmt(attrResults)}]</p>
    ${purpleResults.length ? `<p><strong>🟣 ROXO:</strong> [${fmt(purpleResults)}]</p>` : ""}
  `;

  const resultadoTexto = bug
    ? "🐞 <strong>DEU BUG</strong> — o Nó reage com uma complicação."
    : strong
      ? "🌟 <strong>Sucesso Forte</strong> — vantagem extra!"
      : "✨ <strong>Sucesso</strong> — a história avança.";

  ChatMessage.create({
    content: `
      <h2>🎲 Desafio: ${dificuldade?.label ?? "Desconhecido"}</h2>
      <p><strong>Atributo:</strong> ${atributo} (${attrDice}d6)</p>
      ${purple ? `<p><strong>Dados Roxos:</strong> ${purple}d6</p>` : ""}
      <hr>
      ${poolText}
      <p><strong>Alvo:</strong> ${target}+ | <strong>Mínimo de sucessos:</strong> ${required}</p>
      <p><strong>Sucessos obtidos:</strong> ${successes}</p>
      <hr>
      <p>${resultadoTexto}</p>
    `
  });
}

async function showDiceSoNiceSafe(roll, which) {
  const dsn = game.dice3d;
  if (!dsn?.showForRoll) return;

  // tenta aplicar colorset (se existir)
  try {
    const colorset = which === "roxo" ? COLORSET.roxo : COLORSET[which];
    if (colorset && roll?.dice?.[0]) {
      roll.dice[0].options = roll.dice[0].options ?? {};
      roll.dice[0].options.appearance = roll.dice[0].options.appearance ?? {};
      roll.dice[0].options.appearance.colorset = colorset;
    }
  } catch (e) {
    console.warn("GAMBIARRA.SYS6 | não conseguiu setar appearance/colorset", e);
  }

  // chama o DSN sem quebrar se a assinatura variar
  try {
    await dsn.showForRoll(roll, game.user, true);
  } catch (_e1) {
    try {
      await dsn.showForRoll(roll);
    } catch (_e2) {
      // se der ruim, só ignora (rolagem já foi resolvida e chat já sai)
    }
  }
}
