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

const ATTR_LABEL = {
  corpo: { icon: "💪", label: "Corpo" },
  mente: { icon: "🧠", label: "Mente" },
  coracao: { icon: "❤️", label: "Coração" },
};

function itemLabel(item) {
  const tipoItem =
    item?.system?.tipoItem ??
    (item?.system?.consumivel ? "consumivel" : "reliquia");
  const badge = tipoItem === "consumivel" ? "🔸" : "🔹";
  return `${badge} ${item.name}`;
}

function actorItemsForRoll(actor) {
  const itens = (actor.items ?? []).filter((i) => i.type === "item");
  return itens;
}

function clampPurple(val) {
  return clampInt(val, 0, 10);
}

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

function renderDiceLine(
  results,
  target,
  { baseAttr = null, source = "base", tintPurpleByAttr = false } = {},
) {
  // source: "base" | "roxo"
  // baseAttr: "corpo" | "mente" | "coracao"
  // tintPurpleByAttr: se true, dado roxo em sucesso usa a cor do atributo em vez do roxo

  return results
    .map((r) => {
      const ok = r.result >= target;

      // classes base
      const cls = ["gambi-die"];

      if (ok) cls.push("is-success");

      // cor do sucesso
      if (ok) {
        if (source === "roxo") {
          cls.push(tintPurpleByAttr ? `suc-${baseAttr}` : "suc-roxo");
        } else {
          cls.push(`suc-${baseAttr}`);
        }
      }

      // marca a origem (opcional, útil p/ debug/estilo)
      cls.push(source === "roxo" ? "is-roxo" : "is-base");

      return `<span class="${cls.join(" ")}">${r.result}</span>`;
    })
    .join(" ");
}

function listSuccesses(results, target) {
  const suc = results.filter((r) => r.result >= target).map((r) => r.result);
  return suc.join(", ");
}

export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  const attrs = actor.system?.attributes ?? {};
  const corpo = attrs.corpo?.value ?? 2;
  const mente = attrs.mente?.value ?? 2;
  const coracao = attrs.coracao?.value ?? 2;
  const itens = actorItemsForRoll(actor);

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
        <option value="corpo">💪 Corpo (${corpo}d)</option>
        <option value="mente">🧠 Mente (${mente}d)</option>
        <option value="coracao">❤️ Coração (${coracao}d)</option>
      </select>
      <p class="hint">O valor do atributo é o tamanho do pool.</p>
    </div>

    <hr/>
        <div class="form-group">
      <label>🎒 Item do Nó (opcional)</label>
      <select name="sceneItem">
        <option value="">— nenhum —</option>
        ${itens
          .map((it) => `<option value="${it.id}">${itemLabel(it)}</option>`)
          .join("")}
      </select>

      <div class="hint" style="margin-top:6px;">
        Se escolher um item e marcar “+1 dado”, ele vira +1 🟣 automaticamente.
      </div>

      <div class="gambi-item-effects" style="margin-top:8px; display:flex; gap:10px; flex-wrap:wrap;">
        <label class="checkbox" style="display:flex; gap:6px; align-items:center;">
          <input type="checkbox" name="itemAddDie" />
          🎲 +1 dado (vira 🟣)
        </label>

        <label class="checkbox" style="display:flex; gap:6px; align-items:center;">
          <input type="checkbox" name="itemShiftDiff" />
          ➖ Reduzir dificuldade (1 passo)
        </label>

        <label class="checkbox" style="display:flex; gap:6px; align-items:center;">
          <input type="checkbox" name="itemSwapAttr" />
          🔁 Trocar atributo do desafio
        </label>
      </div>
    </div>

    <hr/>


    <div class="form-group">
      <label class="purple-label">🟣 Dados Roxos</label>

      <div class="purple-row">
        <button type="button" class="purple-btn purple-minus" aria-label="Diminuir">−</button>
        <input class="purple-value" type="text" name="purpleDice" value="0" readonly />
        <button type="button" class="purple-btn purple-plus" aria-label="Aumentar">+</button>
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
      const $item = html.find('[name="sceneItem"]');
      const $addDie = html.find('[name="itemAddDie"]');

      function bumpPurple(delta) {
        const cur = Number($val.val()) || 0;
        $val.val(String(clampPurple(cur + delta)));
      }

      // Ao marcar/desmarcar “+1 dado”, aplica/remove +1 roxo automaticamente
      $addDie.on("change", () => {
        const checked = $addDie.prop("checked");
        bumpPurple(checked ? +1 : -1);
      });

      // Se trocar o item, não mexe em roxos automaticamente (evita somas fantasmas)
      // (Depois a gente pode “autossugerir” o checkbox com base no item.efeitosPossiveis.)
      $item.on("change", async () => {
        const itemId = String($item.val() || "");
        if (!itemId) return;

        const it = actor.items.get(itemId);
        const efeitos = Array.isArray(it?.system?.efeitosPossiveis)
          ? it.system.efeitosPossiveis
          : [];
        const shouldAdd = efeitos.includes("add-dado");

        // se for marcar automaticamente e já não estiver marcado
        if (shouldAdd && !$addDie.prop("checked")) {
          $addDie.prop("checked", true).trigger("change");
        }

        // se trocar para item que NÃO tem e estava marcado, desmarca e remove o +1
        if (!shouldAdd && $addDie.prop("checked")) {
          $addDie.prop("checked", false).trigger("change");
        }
      });

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
      "Este personagem não tem valor nesse atributo (pool vazio). Ajuste Corpo/Mente/Coração na ficha. (mínimo 1)",
    );
    return;
  }

  // 1) Rolagem base (cor do atributo)
  const rollBase = await new Roll(`${pool}d6`).evaluate();
  applyDiceSoNiceAppearance(rollBase, COLORSET[atributo] ?? COLORSET.corpo);

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

  const a = ATTR_LABEL[atributo] ?? { icon: "🎲", label: atributo };

  const baseSuccessList = listSuccesses(baseResults, target);
  const roxoSuccessList = listSuccesses(roxoResults, target);
  const allSuccessList = listSuccesses(allResults, target);

  const badge = bug
    ? `<span class="gambi-badge is-bug">🐞 BUG</span>`
    : strong
      ? `<span class="gambi-badge is-strong">🌟 Sucesso Forte</span>`
      : `<span class="gambi-badge is-ok">✨ Sucesso</span>`;

  const baseLine = `
    <div class="gambi-line">
      <div class="gambi-line-title">${a.icon} ${a.label} (${pool}d6)</div>
      <div class="gambi-dice">${renderDiceLine(baseResults, target, { baseAttr: atributo, source: "base" })}</div>
      ${
        baseSuccessList
          ? `<div class="gambi-sub">✅ Sucessos aqui: ${baseSuccessList}</div>`
          : `<div class="gambi-sub is-muted">— nenhum sucesso aqui</div>`
      }
    </div>
  `;

  const roxoLine = roxos
    ? `
    <div class="gambi-line">
      <div class="gambi-line-title">🟣 Roxos (${roxos}d6)</div>
      <div class="gambi-dice">${renderDiceLine(roxoResults, target, { baseAttr: atributo, source: "roxo", tintPurpleByAttr: false })}</div>

      ${
        roxoSuccessList
          ? `<div class="gambi-sub">✅ Sucessos aqui: ${roxoSuccessList}</div>`
          : `<div class="gambi-sub is-muted">— nenhum sucesso aqui</div>`
      }
    </div>
  `
    : "";

  const chatHtml = `
    <div class="gambi-chat">
      <div class="gambi-chat-head">
        <h2>🎲 ${dificuldade.label}</h2>
        ${badge}
      </div>

      <div class="gambi-chat-meta">
        <div><strong>Dificuldade:</strong> ${required} sucesso(s)</div>
        <div><strong>Alvo:</strong> ${target}+</div>
      </div>

      ${baseLine}
      ${roxoLine}

      <div class="gambi-chat-summary">
        <div><strong>Sucessos totais:</strong> ${successes}</div>
        ${
          allSuccessList
            ? `<div class="gambi-sub">✅ Dados em sucesso (${allResults.filter((r) => r.result >= target).length}): ${allSuccessList}</div>`
            : `<div class="gambi-sub is-muted">— nenhum dado bateu o alvo</div>`
        }
        <div class="gambi-result"><strong>Resultado:</strong> ${resultadoTexto}</div>
      </div>
    </div>
  `;
  ChatMessage.create({ content: chatHtml });
}
