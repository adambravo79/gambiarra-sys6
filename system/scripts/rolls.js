/**
 * GAMBIARRA.SYS6 — Rolagens (v0.6.3d)
 * - Limpeza CSS: remove inline style e usa classes do rolls.css/item.css
 *
 * v0.6.3d (fix consumível "perde dados"):
 * ✅ Ao gastar carga de consumível, faz update defensivo preservando:
 *   - system.descricao
 *   - system.tipoItem
 *   - system.efeito
 *   - system.cargasMax
 * Isso evita que itens legados/normalizações acabem “resetando” campos
 * após o primeiro uso (efeito virar errado, sumir descrição, sumir contador).
 */

const COLORSET = {
  corpo: "gambi-corpo",
  mente: "gambi-mente",
  coracao: "gambi-coracao",
  roxo: "gambi-roxo"
};

const ATTR_LABEL = {
  corpo: { icon: "💪", label: "Corpo" },
  mente: { icon: "🧠", label: "Mente" },
  coracao: { icon: "❤️", label: "Coração" }
};

const DIFF_ORDER = ["normal", "complexo", "bug", "epico", "impossivel"];

const ITEM_EFFECT = {
  reduzir: {
    icon: "➖",
    title: "Reduzir a dificuldade",
    note: "➖ Item reduziu a dificuldade em 1 passo (se possível)."
  },
  roxo: {
    icon: "🟣",
    title: "Aumentar 1 dado roxo",
    note: "🟣 Item adicionou +1 dado roxo neste teste."
  },
  trocar: {
    icon: "🔁",
    title: "Trocar atributo do desafio (registro)",
    note: "🔁 Trocar atributo do desafio (registro; sem efeito mecânico)."
  },
  hackear: {
    icon: "🪢",
    title: "Hackear o Nó (registro)",
    note: "🪢 Hackear o Nó (registro; sem efeito mecânico)."
  }
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

// ============================================================
// Renderiza uma linha de dados como “pílulas” (chat)
// - aplica .gambi-die
// - marca .is-success quando >= target
// - marca .suc-corpo/.suc-mente/.suc-coracao/.suc-roxo
// - marca .is-base / .is-roxo (opcional)
// ============================================================
function renderDiceLine(results = [], target = 4, { baseAttr = "corpo", source = "base" } = {}) {
  const sucClass =
    source === "roxo"
      ? "suc-roxo"
      : baseAttr === "mente"
        ? "suc-mente"
        : baseAttr === "coracao"
          ? "suc-coracao"
          : "suc-corpo";

  const originClass = source === "roxo" ? "is-roxo" : "is-base";

  // results pode ser [{result: 6}, ...] (Foundry) ou [6, ...] (fallback)
  return results
    .map((r) => {
      const val = Number(r?.result ?? r);
      const isSuccess = val >= Number(target);

      const cls = [
        "gambi-die",
        originClass,
        isSuccess ? "is-success" : "",
        isSuccess ? sucClass : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `<span class="${cls}" title="${isSuccess ? "Sucesso" : "Sem sucesso"}">${val}</span>`;
    })
    .join("");
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
  const eff = String(it?.system?.efeito ?? "").trim();
  if (ITEM_EFFECT[eff]) return eff;

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
    <div class="gambi-effect-card">
      <div><strong>Efeito do item:</strong> <span class="gambi-effect-title">${e.icon} ${e.title}</span></div>
      <div class="hint gambi-effect-note">
        ${effectKey === "reduzir"
          ? "Se possível, reduz 1 passo (Bug→Complexo, Épico→Bug, Impossível→Épico). Em Normal, pede confirmação."
          : effectKey === "roxo"
            ? "Adiciona +1 dado roxo neste teste."
            : "Só registra como nota (sem impacto mecânico)."
        }
      </div>
    </div>
  `;
}

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

        <div class="hint">
          O item tem <strong>um efeito travado</strong>. Ele será registrado no chat como <strong>Notas</strong>.
        </div>

        <div class="gambi-effect-preview" style="display:none;"></div>
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
        <div class="hint">
          Se o item for <strong>🟣 +1 roxo</strong>, ele é somado automaticamente.
        </div>
      </div>
    </form>
  `;

  const dlg = new Dialog(
    {
      title: "🎲 Rolar Desafio",
      content,
      buttons: {
        roll: {
          label: "Rolar",
          callback: async (html) => {
            let diffKey = String(html.find('[name="difficulty"]').val() || "normal");
            const atributo = String(html.find('[name="attribute"]').val() || "corpo");
            const purpleTotal = Number(html.find('[name="purpleDice"]').val()) || 0;

            const itemId = String(html.find('[name="sceneItem"]').val() || "");
            const item = itemId ? actor.items.get(itemId) : null;

            const effectKey = item ? normalizeEffectKey(item) : null;
            const e = effectKey ? (ITEM_EFFECT[effectKey] ?? ITEM_EFFECT.reduzir) : null;

            let roxos = clampPurple(purpleTotal);

            if (effectKey === "reduzir") {
              if (diffKey === "normal") {
                const ok = await Dialog.confirm({
                  title: "Reduzir em Normal?",
                  content: `
                    <p>Você está tentando usar <strong>➖ reduzir dificuldade</strong> em uma rolagem <strong>Normal</strong>.</p>
                    <p class="hint">Normal já é o mínimo. Deseja confirmar mesmo assim?</p>
                  `
                });
                if (!ok) return;
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
              notes
            });

            // ============================================================
            // v0.6.3d — FIX DEFENSIVO DO CONSUMÍVEL
            //
            // Problema reportado:
            // - Após usar consumível, some descricao / some contagem / efeito vira outro.
            //
            // Estratégia:
            // - Ao gastar carga, além de cargas/usado, regrava campos essenciais
            //   para evitar “reset” por normalização/migração/itens legados.
            // - Se o item não tiver system.efeito consistente, fixa com o normalizeEffectKey.
            // ============================================================
            if (item && String(item.system?.tipoItem ?? "reliquia") === "consumivel") {
              if (!actor.isOwner) {
                ui.notifications.warn("Sem permissão de dono: o consumível não pôde gastar carga (mas ficou registrado no chat).");
                return;
              }

              const cargas = Number(item.system?.cargas ?? 0);
              const max = Number(item.system?.cargasMax ?? 3);
              const novo = Math.max(0, Math.min(max, Math.trunc(cargas) - 1));
              const virouUsado = novo === 0;

              // ✅ inserção v0.6.3d: “freeze” dos campos essenciais
              const safeDescricao = String(item.system?.descricao ?? "");
              const safeTipoItem = "consumivel"; // estamos dentro do bloco consumível
              const safeCargasMax = clampInt(max, 1, 3);
              const safeEfeito = String(item.system?.efeito ?? "").trim() || normalizeEffectKey(item);

              await item.update({
                // sempre
                "system.cargas": novo,
                "system.usado": virouUsado,

                // ✅ defensivo: preserva / fixa
                "system.descricao": safeDescricao,
                "system.tipoItem": safeTipoItem,
                "system.cargasMax": safeCargasMax,
                "system.efeito": safeEfeito
              });

              if (virouUsado) {
                ChatMessage.create({
                  content: `🪢 O Nó recebeu o item <strong>${item.name}</strong> e o absorveu na história.`
                });
              }
            }
          }
        }
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

        let manualPurple = 0;

        const getAutoBonus = () => {
          const itemId = String($item.val() || "");
          if (!itemId) return 0;
          const it = actor.items.get(itemId);
          const effectKey = normalizeEffectKey(it);
          return effectKey === "roxo" ? 1 : 0;
        };

        const setDisplayedPurple = () => {
          const auto = getAutoBonus();
          const total = clampInt(manualPurple + auto, 0, 10);
          $val.val(String(total));
        };

        function refreshPreview() {
          const itemId = String($item.val() || "");
          if (!itemId) {
            $preview.hide().empty();
            setDisplayedPurple();
            return;
          }
          const it = actor.items.get(itemId);
          const effectKey = normalizeEffectKey(it);

          $preview.show().html(renderEffectCard(effectKey));
          setDisplayedPurple();
        }

        $item.on("change", refreshPreview);
        html.find(".purple-minus").on("click", () => {
          manualPurple = clampInt(manualPurple - 1, 0, 10);
          setDisplayedPurple();
        });

        html.find(".purple-plus").on("click", () => {
          manualPurple = clampInt(manualPurple + 1, 0, 10);
          setDisplayedPurple();
        });

        manualPurple = 0;
        setDisplayedPurple();
        refreshPreview();
      }
    },
    {
      width: 620,
      height: 635,
      resizable: true,
      classes: ["gambi-roll-desafio-dialog"]
    }
  );

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
      ${baseSuccessList
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
        ${roxoSuccessList
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
        ${allSuccessList
          ? `<div class="gambi-sub">✅ Dados em sucesso (${allResults.filter((r) => r.result >= target).length}): ${allSuccessList}</div>`
          : `<div class="gambi-sub is-muted">— nenhum dado bateu o alvo</div>`
        }
        <div class="gambi-result"><strong>Resultado:</strong> ${resultadoTexto}</div>
      </div>
    </div>
  `;

  ChatMessage.create({ content: chatHtml });
}
