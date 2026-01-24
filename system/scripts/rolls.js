/**
 * GAMBIARRA.SYS6 — Rolagens (v0.6.2d)
 * - Pool = valor do atributo
 * - Dificuldade = required + target
 * - Dados Roxos = bônus (item + manual)
 * - Itens: 1 efeito travado (reduzir | roxo | hackear | trocar)
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

const ITEM_EFFECT = {
  reduzir: {
    icon: "➖",
    title: "Reduzir a dificuldade",
    note: "➖ Item reduziu a dificuldade em 1 passo (se possível).",
  },
  roxo: {
    icon: "🟣",
    title: "Aumentar 1 dado roxo",
    note: "🟣 Item adicionou +1 dado roxo neste teste.",
  },
  trocar: {
    icon: "🔁",
    title: "Trocar atributo do desafio (registro)",
    note: "🔁 Trocar atributo do desafio (registro; sem efeito mecânico).",
  },
  hackear: {
    icon: "🪢",
    title: "Hackear o Nó (registro)",
    note: "🪢 Hackear o Nó (registro; sem efeito mecânico).",
  },
};

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

function attrOk(actor) {
  const a = actor?.system?.attributes ?? {};
  const c = Number(a.corpo?.value ?? 0);
  const m = Number(a.mente?.value ?? 0);
  const co = Number(a.coracao?.value ?? 0);
  return c >= 1 && m >= 1 && co >= 1 && c + m + co === 6;
}

function getUsableItems(actor) {
  const all = actor?.items ?? [];
  return all
    .filter((i) => i.type === "item")
    .filter((it) => {
      const tipo = String(it.system?.tipoItem ?? "reliquia");
      if (tipo !== "consumivel") return true;
      const usado = Boolean(it.system?.usado);
      const cargas = Number(it.system?.cargas ?? 0);
      return !usado && cargas > 0;
    });
}

function normalizeEffectKey(it) {
  // v0.6.2d: usa system.efeito
  const eff = String(it?.system?.efeito ?? "").trim();
  if (ITEM_EFFECT[eff]) return eff;

  // fallback leve (para itens antigos que ainda tenham efeitosPossiveis):
  const tags = it?.system?.efeitosPossiveis;
  if (Array.isArray(tags)) {
    if (tags.includes("add-dado") || tags.includes("dado")) return "roxo";
    if (tags.includes("swap-atributo") || tags.includes("trocar")) return "trocar";
    if (tags.includes("suavizar-bug") || tags.includes("hackear")) return "hackear";
    if (tags.includes("shift-dificuldade") || tags.includes("reduzir")) return "reduzir";
  }

  return "reduzir";
}

function itemOptionLabel(it) {
  const tipo = it.system?.tipoItem ?? "reliquia";
  const badge = tipo === "consumivel" ? "🔸" : "🔹";
  const ef = normalizeEffectKey(it);
  const e = ITEM_EFFECT[ef] ?? ITEM_EFFECT.reduzir;
  return `${badge} ${it.name} — ${e.icon} ${e.title}`;
}

function renderEffectCard(effectKey) {
  const e = ITEM_EFFECT[effectKey] ?? ITEM_EFFECT.reduzir;
  return `
    <div class="gambi-effect-card" style="border:1px solid #0002; border-radius:14px; padding:10px 12px; background: rgba(0,0,0,0.02);">
      <div><strong>Efeito do item:</strong> <span style="margin-left:6px;">${e.icon} ${e.title}</span></div>
      <div class="hint" style="margin-top:4px;">
        ${
          effectKey === "reduzir"
            ? "Se possível, reduz 1 passo (Bug→Complexo, Épico→Bug, Impossível→Épico). Em Normal, pede confirmação."
            : effectKey === "roxo"
              ? "Adiciona +1 dado roxo neste teste."
              : "Só registra como nota (sem impacto mecânico)."
        }
      </div>
    </div>
  `;
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

  const itens = getUsableItems(actor);

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
        ${itens.map((it) => `<option value="${it.id}">${itemOptionLabel(it)}</option>`).join("")}
      </select>

      <div class="hint" style="margin-top:6px;">
        O item tem <strong>um efeito travado</strong>. Ele será registrado no chat como <strong>Notas</strong>.
      </div>

      <div class="gambi-effect-preview" style="margin-top:8px; display:none;"></div>
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
      <div class="hint" style="margin-top:6px;">
        Se o item for <strong>🟣 +1 roxo</strong>, ele é somado automaticamente.
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
          let diffKey = String(html.find('[name="difficulty"]').val() || "normal");
          const atributo = String(html.find('[name="attribute"]').val() || "corpo");
          const purpleManual = Number(html.find('[name="purpleDice"]').val()) || 0;

          const itemId = String(html.find('[name="sceneItem"]').val() || "");
          const item = itemId ? actor.items.get(itemId) : null;

          const effectKey = item ? normalizeEffectKey(item) : null;
          const e = effectKey ? (ITEM_EFFECT[effectKey] ?? ITEM_EFFECT.reduzir) : null;

          // aplica mecânicas do item
          let roxos = clampPurple(purpleManual);
          if (effectKey === "roxo") roxos = clampPurple(roxos + 1);

          if (effectKey === "reduzir") {
            if (diffKey === "normal") {
              const ok = await Dialog.confirm({
                title: "Reduzir em Normal?",
                content: `
                  <p>Você está tentando usar <strong>➖ reduzir dificuldade</strong> em uma rolagem <strong>Normal</strong>.</p>
                  <p class="hint">Normal já é o mínimo. Deseja confirmar mesmo assim?</p>
                `,
              });
              if (!ok) return;
              // fica normal (sem reduzir)
            } else {
              diffKey = shiftDifficultyKey(diffKey, -1);
            }
          }

          const dificuldade = difficulties[diffKey];

          const notes = [];
          if (item && e) {
            notes.push(`🎒 <strong>${item.name}</strong>: ${e.note}`);
          }

          await executarRolagem({
            actor,
            atributo,
            dificuldade,
            roxos,
            notes,
          });

          // consumir carga (se consumível)
          if (item && String(item.system?.tipoItem ?? "reliquia") === "consumivel") {
            if (!actor.isOwner) {
              ui.notifications.warn(
                "Sem permissão de dono: o consumível não pôde gastar carga (mas ficou registrado no chat).",
              );
              return;
            }

            const cargas = Number(item.system?.cargas ?? 0);
            const max = Number(item.system?.cargasMax ?? 3);
            const novo = Math.max(0, Math.min(max, Math.trunc(cargas) - 1));
            const virouUsado = novo === 0;

            await item.update({
              "system.cargas": novo,
              "system.usado": virouUsado,
            });

            if (virouUsado) {
              ChatMessage.create({
                content: `🪢 O Nó recebeu o item <strong>${item.name}</strong> e o absorveu na história.`,
              });
            }
          }
        },
      },
    },
    default: "roll",
    render: (html) => {
      const $difficulty = html.find('[name="difficulty"]');
      const $attribute = html.find('[name="attribute"]');
      const $val = html.find('[name="purpleDice"]');

      const $item = html.find('[name="sceneItem"]');
      const $preview = html.find(".gambi-effect-preview");

      $attribute.val(presetAttr);
      $difficulty.val(presetDiffKey);
      $val.val("0");

      function refreshPreview() {
        const itemId = String($item.val() || "");
        if (!itemId) {
          $preview.hide().empty();
          return;
        }
        const it = actor.items.get(itemId);
        const effectKey = normalizeEffectKey(it);

        $preview.show().html(renderEffectCard(effectKey));

        // se for +1 roxo, já mostra no contador (sem travar)
        if (effectKey === "roxo") {
          const cur = Number($val.val()) || 0;
          if (cur < 1) $val.val("1");
        }
      }

      $item.on("change", refreshPreview);
      refreshPreview();

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
    ui.notifications.warn("Este personagem não tem valor nesse atributo (mínimo 1).");
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
