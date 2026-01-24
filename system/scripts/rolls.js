/**
 * GAMBIARRA.SYS6 — Rolagens (v0.6.2a)
 * - Pool = valor do atributo
 * - Dificuldade = required + target
 * - Dados Roxos = bônus (item pendente / diálogo)
 * - Integração Dice So Nice (se instalado)
 *
 * Presets:
 * rollDesafio(actor, { presetAttr, presetDiffKey })
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

// ✅ ordem pedida (leve -> pesado)
const DIFF_ORDER = ["normal", "complexo", "bug", "epico", "impossivel"];

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
    die.options.colorset = colorsetId;
    die.options.appearance = die.options.appearance ?? {};
    die.options.appearance.colorset = colorsetId;
  }
}

async function show3dIfAvailable(roll) {
  if (!game.dice3d?.showForRoll) return;
  await game.dice3d.showForRoll(roll, game.user, true);
}

function renderDiceLine(results, target, { baseAttr = null, source = "base" } = {}) {
  return results
    .map((r) => {
      const ok = r.result >= target;
      const cls = ["gambi-die"];
      if (ok) cls.push("is-success");

      if (ok) {
        if (source === "roxo") cls.push("suc-roxo");
        else cls.push(`suc-${baseAttr}`);
      }

      cls.push(source === "roxo" ? "is-roxo" : "is-base");
      return `<span class="${cls.join(" ")}">${r.result}</span>`;
    })
    .join(" ");
}

function shiftDifficultyKey(currentKey, steps) {
  // steps: -1 = reduzir 1 passo (ex: bug -> complexo)
  // steps: +1 = aumentar 1 passo (ex: complexo -> bug)
  if (!steps) return currentKey;

  const idx = DIFF_ORDER.indexOf(currentKey);
  if (idx === -1) return currentKey;

  const next = clampInt(idx + steps, 0, DIFF_ORDER.length - 1);
  return DIFF_ORDER[next];
}

function listSuccesses(results, target) {
  const suc = results.filter((r) => r.result >= target).map((r) => r.result);
  return suc.join(", ");
}

function getPending(actor) {
  return actor?.system?.meta?.pendingItemEffect ?? null;
}

function clearPending(actor) {
  return actor?.update?.({ "system.meta.pendingItemEffect": null });
}

function attrOk(actor) {
  const a = actor?.system?.attributes ?? {};
  const c = Number(a.corpo?.value ?? 0);
  const m = Number(a.mente?.value ?? 0);
  const co = Number(a.coracao?.value ?? 0);
  return c >= 1 && m >= 1 && co >= 1 && c + m + co === 6;
}

// opts: { presetAttr, presetDiffKey }
export async function rollDesafio(actor, opts = {}) {
  if (!attrOk(actor)) {
    ui.notifications.warn("Ajuste Corpo+Mente+Coração para somar 6 (mínimo 1 em cada).");
    return;
  }

  const difficulties = game.gambiarra?.config?.difficulties ?? {};

  const attrs = actor.system?.attributes ?? {};
  const corpo = attrs.corpo?.value ?? 2;
  const mente = attrs.mente?.value ?? 2;
  const coracao = attrs.coracao?.value ?? 2;

  const presetAttr = opts.presetAttr || "corpo";
  const presetDiffKey = opts.presetDiffKey || "normal";

  const pending = getPending(actor);

  // interpreta pending (sem UI editável de item)
  const pendingShift = pending?.effect === "reduzir" ? -1 : 0;
  const pendingPurple = pending?.effect === "dado" ? 1 : 0;
  const pendingSwapNarrative = pending?.effect === "trocar";

  const pendingHtml = pending
    ? `
      <div style="border:1px solid #0002; border-radius:14px; padding:10px 12px; background: rgba(0,0,0,0.02);">
        <div><strong>🎒 Item preparado:</strong> ${pending.itemName ?? "—"}</div>
        <div class="hint" style="margin-top:4px;">
          ${
            pending.effect === "reduzir"
              ? "➖ Vai tentar reduzir a dificuldade em 1 passo (ex: Bug Leve → Complexo)."
              : pending.effect === "dado"
                ? "🟣 Vai adicionar +1 dado roxo neste teste."
                : pending.effect === "trocar"
                  ? "🔁 Trocar atributo do desafio (apenas narrativo; sem efeito mecânico)."
                  : "Efeito preparado."
          }
        </div>
      </div>
    `
    : `<p class="hint">Nenhum item preparado para este teste.</p>`;

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
      ${pending?.effect === "reduzir" ? `<p class="hint">➖ Reduzir dificuldade: 1 passo.</p>` : ""}
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
      ${pendingHtml}
    </div>

    <hr/>

    <div class="form-group">
      <label class="purple-label">🟣 Dados Roxos</label>
      <div class="purple-row">
        <button type="button" class="purple-btn purple-minus" aria-label="Diminuir">−</button>
        <input class="purple-value" type="text" name="purpleDice" value="0" readonly />
        <button type="button" class="purple-btn purple-plus" aria-label="Aumentar">+</button>
        <span class="hint">A Programadora decide (ideia, ajuda, poder etc.)</span>
      </div>
      ${pendingPurple ? `<p class="hint">🟣 Item adicionou +1 roxo automaticamente.</p>` : ""}
      ${pendingSwapNarrative ? `<p class="hint">🔁 “Trocar atributo” ficará registrado no chat (sem impacto mecânico).</p>` : ""}
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
          let diffKey = String(html.find('[name="difficulty"]').val() || "normal");
          const atributo = String(html.find('[name="attribute"]').val() || "corpo");
          const purpleManual = Number(html.find('[name="purpleDice"]').val()) || 0;

          // ✅ aplica +1 roxo do pending
          const roxos = clampPurple(purpleManual + pendingPurple);

          // ✅ aplicar reduzir dificuldade de verdade (ex: bug -> complexo)
          if (pending?.effect === "reduzir") {
            if (diffKey === "normal") {
              // regra pedida: não reduz abaixo de normal -> confirmar uso “sem efeito”
              const ok = await Dialog.confirm({
                title: "Reduzir em Normal?",
                content: `
                  <p>Você está tentando usar <strong>➖ reduzir dificuldade</strong> em uma rolagem <strong>Normal</strong>.</p>
                  <p class="hint">Normal já é o mínimo. Deseja confirmar mesmo assim?</p>
                `,
              });
              if (!ok) return;
              // mantém normal (não muda)
            } else {
              diffKey = shiftDifficultyKey(diffKey, -1);
            }
          }

          const dificuldade = difficulties[diffKey];

          // narrativa “trocar atributo” aparece no chat como nota
          const narrativeNotes = [];
          if (pendingSwapNarrative) {
            narrativeNotes.push("🔁 Trocar atributo do desafio (narrativo; sem efeito mecânico).");
          }
          if (pending?.effect === "reduzir") {
            narrativeNotes.push("➖ Item tentou reduzir a dificuldade (aplicado no teste).");
          }
          if (pending?.effect === "dado") {
            narrativeNotes.push("🟣 Item adicionou +1 dado roxo neste teste.");
          }

          await executarRolagem({
            actor,
            atributo,
            dificuldade,
            roxos,
            notes: narrativeNotes,
          });

          // ✅ consome a pendência após rolar
          if (pending) await clearPending(actor);
        },
      },
    },
    default: "roll",
    render: (html) => {
      const $difficulty = html.find('[name="difficulty"]');
      const $attribute = html.find('[name="attribute"]');
      const $val = html.find('[name="purpleDice"]');

      // presets iniciais
      $attribute.val(presetAttr);
      $difficulty.val(presetDiffKey);
      $val.val(String(clampPurple(pendingPurple)));

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

async function executarRolagem({ actor, atributo, dificuldade, roxos = 0, notes = [] }) {
  const required = Number(dificuldade?.required ?? 1);
  const target = Number(dificuldade?.target ?? 4);

  const pool = Number(actor.system?.attributes?.[atributo]?.value ?? 0);

  if (!pool || pool < 1) {
    ui.notifications.warn(
      "Este personagem não tem valor nesse atributo (pool vazio). Ajuste Corpo/Mente/Coração na ficha. (mínimo 1)",
    );
    return;
  }

  const rollBase = await new Roll(`${pool}d6`).evaluate();
  applyDiceSoNiceAppearance(rollBase, COLORSET[atributo] ?? COLORSET.corpo);

  let rollRoxo = null;
  if (roxos > 0) {
    rollRoxo = await new Roll(`${roxos}d6`).evaluate();
    applyDiceSoNiceAppearance(rollRoxo, COLORSET.roxo);
  }

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
      <div class="gambi-dice">${renderDiceLine(roxoResults, target, { baseAttr: atributo, source: "roxo" })}</div>
      ${
        roxoSuccessList
          ? `<div class="gambi-sub">✅ Sucessos aqui: ${roxoSuccessList}</div>`
          : `<div class="gambi-sub is-muted">— nenhum sucesso aqui</div>`
      }
    </div>
  `
    : "";

  const notesHtml =
    notes?.length
      ? `<div class="gambi-line" style="margin-top:10px;">
           <div class="gambi-line-title">📝 Notas</div>
           <div class="gambi-sub">${notes.map((n) => `• ${n}`).join("<br/>")}</div>
         </div>`
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
      ${notesHtml}

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
