/**
 * GAMBIARRA.SYS6 — Rolagens (v0.6.2)
 * - Pool = valor do atributo
 * - Dificuldade = required + target
 * - Dados Roxos = bônus (diálogo / item)
 * - Integração Dice So Nice (se instalado)
 *
 * Presets (B):
 * rollDesafio(actor, { addPurple, shiftDiff, forceSwapAttr, presetAttr, presetDiffKey, itemId, itemName })
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

// Ordem para "reduzir 1 passo"
const DIFF_ORDER = ["impossivel", "epico", "bug", "complexo", "normal"]; // do mais pesado -> mais leve

function clampInt(n, min, max) {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, v));
}

function clampPurple(val) {
  return clampInt(val, 0, 10);
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

function itemLabel(item) {
  const tipoItem = item?.system?.tipoItem ?? "reliquia";
  const badge = tipoItem === "consumivel" ? "🔸" : "🔹";
  const usado = item?.system?.usado ? " (usado)" : "";
  return `${badge} ${item.name}${usado}`;
}

function actorItemsForRoll(actor) {
  return (actor.items ?? []).filter((i) => i.type === "item");
}

function shiftDifficultyKey(currentKey, delta) {
  if (!delta) return currentKey;
  const idx = DIFF_ORDER.indexOf(currentKey);
  if (idx === -1) return currentKey;

  // delta negativo = reduzir (vai "pra direita" na lista: impossivel -> epico -> ... -> normal)
  const next = clampInt(idx - delta, 0, DIFF_ORDER.length - 1);
  return DIFF_ORDER[next];
}

function formatResults(results) {
  return results.map((r) => r.result).join(", ");
}

// opts: { addPurple, shiftDiff, forceSwapAttr, presetAttr, presetDiffKey, itemId, itemName }
export async function rollDesafio(actor, opts = {}) {
  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  const attrs = actor.system?.attributes ?? {};
  const corpo = attrs.corpo?.value ?? 2;
  const mente = attrs.mente?.value ?? 2;
  const coracao = attrs.coracao?.value ?? 2;

  const itens = actorItemsForRoll(actor);

  const presetAttr = opts.presetAttr || "corpo";
  const presetDiffKey = opts.presetDiffKey || "normal";
  const presetPurple = clampPurple(Number(opts.addPurple ?? 0));

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
      ${opts.shiftDiff ? `<p class="hint">Item sugeriu: reduzir dificuldade (${opts.shiftDiff} passo).</p>` : ""}
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
        ${itens.map((it) => `<option value="${it.id}">${itemLabel(it)}</option>`).join("")}
      </select>

      <div class="hint" style="margin-top:6px;">
        “🎲 +1 dado” do item vira +1 🟣 automaticamente.
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

      ${opts.itemName ? `<p class="hint">Pré-selecionado por item: <strong>${opts.itemName}</strong></p>` : ""}
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
          const diffKey = String(
            html.find('[name="difficulty"]').val() || "normal",
          );
          const atributo = String(
            html.find('[name="attribute"]').val() || "corpo",
          );
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
      const $difficulty = html.find('[name="difficulty"]');
      const $attribute = html.find('[name="attribute"]');
      const $val = html.find('[name="purpleDice"]');

      const $item = html.find('[name="sceneItem"]');
      const $addDie = html.find('[name="itemAddDie"]');
      const $shiftDiff = html.find('[name="itemShiftDiff"]');
      const $swapAttr = html.find('[name="itemSwapAttr"]');

      function bumpPurple(delta) {
        const cur = Number($val.val()) || 0;
        $val.val(String(clampPurple(cur + delta)));
      }

      // presets iniciais
      $attribute.val(presetAttr);
      $difficulty.val(
        shiftDifficultyKey(presetDiffKey, Number(opts.shiftDiff ?? 0)),
      );
      $val.val(String(presetPurple));

      if (opts.itemId) $item.val(String(opts.itemId));
      if (opts.addPurple) $addDie.prop("checked", true);
      if (opts.shiftDiff) $shiftDiff.prop("checked", true);
      if (opts.forceSwapAttr) $swapAttr.prop("checked", true);

      // checkbox +1 dado -> +1 roxo
      $addDie.on("change", () => {
        const checked = $addDie.prop("checked");
        bumpPurple(checked ? +1 : -1);
      });

      // reduzir dificuldade 1 passo (aplica na combo)
      $shiftDiff.on("change", () => {
        const checked = $shiftDiff.prop("checked");
        const cur = String($difficulty.val() || "normal");
        const next = shiftDifficultyKey(cur, checked ? -1 : +1);
        $difficulty.val(next);
      });

      // trocar atributo: só marca intenção (a Programadora escolhe na hora)
      // (se quiser, depois fazemos abrir um mini-dialog pra escolher qual atributo trocar)
      if (opts.forceSwapAttr) {
        // nada automático aqui além do check
      }

      // auto-sugerir checkboxes ao trocar item
      $item.on("change", async () => {
        const itemId = String($item.val() || "");
        if (!itemId) return;

        const it = actor.items.get(itemId);
        const efeitos = Array.isArray(it?.system?.efeitosPossiveis)
          ? it.system.efeitosPossiveis
          : [];

        const shouldAdd = efeitos.includes("dado");
        const shouldShift = efeitos.includes("reduzir");
        const shouldSwap = efeitos.includes("trocar");

        // add-dado -> dado (padrao novo)
        if (shouldAdd !== $addDie.prop("checked"))
          $addDie.prop("checked", shouldAdd).trigger("change");
        if (shouldShift !== $shiftDiff.prop("checked"))
          $shiftDiff.prop("checked", shouldShift).trigger("change");
        if (shouldSwap !== $swapAttr.prop("checked"))
          $swapAttr.prop("checked", shouldSwap);
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

function listSuccesses(results, target) {
  const suc = results.filter((r) => r.result >= target).map((r) => r.result);
  return suc.join(", ");
}
