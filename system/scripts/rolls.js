/**
 * GAMBIARRA.SYS6 — Rolagens (v0.4)
 * - Pool = valor do atributo (Corpo/Mente/Coração)
 * - Dados Roxos = itens (automático) + extras (ideia/ajuda/poder)
 * - Dificuldade define alvo (4+/5+/6) e "sucessos exigidos" (mínimo)
 * - Chat mostra todos os resultados do pool
 * - BUG marca estado narrativo no Actor (system.meta.bug)
 *
 * Compatível com Foundry v12+
 */

/* -------------------------------------------- */
/* Util: soma dados roxos dos itens do ator      */
/* -------------------------------------------- */
function contarDadosRoxosDeItens(actor) {
  return actor.items.reduce((total, item) => {
    const dados = Number(item.system?.dadosRoxos || 0);
    return total + dados;
  }, 0);
}

/* -------------------------------------------- */
/* Rolagem principal                             */
/* -------------------------------------------- */
export async function rollDesafio(actor) {
  const difficulties = game.gambiarra?.config?.difficulties || {};

  const dadosRoxosItens = contarDadosRoxosDeItens(actor);

  const content = `
  <form>

    <div class="form-group">
      <label>Dificuldade</label>
      <select name="difficulty">
        ${Object.entries(difficulties)
          .map(
            ([key, d]) => `
              <option value="${key}">
                ${d.label} (mín. ${d.dice} sucesso(s), ${d.target}+)
              </option>
            `
          )
          .join("")}
      </select>
    </div>

    <div class="form-group">
      <label>Atributo usado</label>
      <select name="attribute">
        <option value="corpo">🟢 Corpo</option>
        <option value="mente">🔵 Mente</option>
        <option value="coracao">🔴 Coração</option>
      </select>
    </div>

    <hr>

    <div class="form-group">
      <p><strong>🟣 Dados Roxos automáticos (itens):</strong> ${dadosRoxosItens}</p>
    </div>

    <div class="form-group">
      <label>Adicionar mais dados roxos?</label>
      <div class="number-control" style="display:flex; gap:8px; align-items:center;">
        <button type="button" class="minus">−</button>
        <input type="number" name="extraPurple" value="0" min="0" max="10" style="width:72px; text-align:center;">
        <button type="button" class="plus">+</button>
      </div>
      <p class="hint" style="opacity:0.85;">
        Ideia criativa, ajuda de aliado ou decisão da Programadora
      </p>
    </div>

  </form>
  `;

  new Dialog({
    title: "🎲 Rolar Desafio",
    content,
    buttons: {
      roll: {
        label: "Rolar",
        callback: async (html) => {
          const diffKey = html.find('[name="difficulty"]').val();
          const atributo = html.find('[name="attribute"]').val();

          const dadosRoxosExtras =
            Number(html.find('[name="extraPurple"]').val()) || 0;

          const dificuldade = difficulties[diffKey];

          await executarRolagem({
            actor,
            atributo,
            dificuldade,
            dadosRoxosItens,
            dadosRoxosExtras
          });
        }
      }
    },
    render: (html) => {
      const input = html.find('[name="extraPurple"]');

      html.find(".plus").click(() => {
        input.val(Number(input.val()) + 1);
      });

      html.find(".minus").click(() => {
        input.val(Math.max(0, Number(input.val()) - 1));
      });
    }
  }).render(true);
}

/* -------------------------------------------- */
/* Executa rolagem                               */
/* -------------------------------------------- */
async function executarRolagem({
  actor,
  atributo,
  dificuldade,
  dadosRoxosItens = 0,
  dadosRoxosExtras = 0
}) {
  if (!dificuldade) {
    ui.notifications.error("Dificuldade inválida. Verifique game.gambiarra.config.difficulties.");
    return;
  }

  // Pool principal = valor do atributo
  const valorAtributo =
    actor.system?.attributes?.[atributo]?.value ?? 1; // fallback seguro (sem zeros)

  const totalRoxos = (dadosRoxosItens || 0) + (dadosRoxosExtras || 0);
  const totalDados = valorAtributo + totalRoxos;

  // Rolagem única do pool
  const roll = new Roll(`${totalDados}d6`);
  await roll.evaluate();

  const resultados = roll.dice[0].results.map(r => r.result);

  // Sucessos = quantos >= target
  const sucessos = resultados.filter(r => r >= dificuldade.target).length;

  // Resultado conforme v0.4:
  // - sucesso: atinge o mínimo exigido (dificuldade.dice)
  // - sucesso forte: passa do mínimo
  // - bug: abaixo do mínimo
  const minSucessos = Number(dificuldade.dice || 1);

  const bug = sucessos < minSucessos;
  const forte = sucessos > minSucessos;
  const sucesso = !bug && !forte; // exatamente o mínimo

  let resultadoTexto = bug
    ? "🐞 BUG — O Nó reage."
    : forte
      ? "🌟 Sucesso Forte"
      : "✨ Sucesso";

  // BUG vira estado narrativo (se bug)
  if (bug) {
    await actor.update({
      "system.meta.bug.ativo": true,
      "system.meta.bug.intensidade": (dificuldade.target === 6) ? "pesado" : "leve",
      "system.meta.bug.descricao": "O Nó reagiu de forma inesperada."
    });
  }

  // Mensagem de composição do pool (para as crianças verem)
  const detalhePool = `
    <p>
      <strong>Pool:</strong>
      ${valorAtributo} (atributo) + ${totalRoxos} (🟣 roxos)
      = <strong>${totalDados}d6</strong>
    </p>
  `;

  const detalheRoxos = `
    <p>
      <strong>🟣 Roxos:</strong>
      ${dadosRoxosItens} (itens) + ${dadosRoxosExtras} (extras) = ${totalRoxos}
    </p>
  `;

  // Chat mostra todos os números rolados
  ChatMessage.create({
    content: `
      <h2>🎲 Desafio ${dificuldade.label}</h2>

      <p><strong>Atributo:</strong> ${atributo}</p>

      ${detalhePool}
      ${detalheRoxos}

      <p><strong>🎲 Resultados:</strong> [ ${resultados.join(", ")} ]</p>

      <p><strong>Alvo:</strong> ${dificuldade.target}+ — <strong>Mínimo:</strong> ${minSucessos} sucesso(s)</p>

      <p><strong>Sucessos:</strong> ${sucessos}</p>

      <p><strong>Resultado:</strong> ${resultadoTexto}</p>
    `
  });
}
