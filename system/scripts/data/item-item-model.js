// scripts/data/item-item-model.js
// v0.6.2d
//
// DataModel do Item (type: "item") — GAMBIARRA.SYS6
// Campos finais (v0.6.2d):
// - nome (Item.name)
// - system.descricao
// - system.categoria: direcao | gambiarra | protecao | estranho
// - system.tipoItem: reliquia | consumivel
// - system.cargasMax: 1..3 (só consumível)
// - system.cargas: 0..3 (só consumível; inicial = cargasMax)
// - system.usado: boolean (vira true quando cargas chega em 0)
// - system.efeito: reduzir | roxo | hackear | trocar
//
// Compat: se vier item antigo com system.efeitosPossiveis (array), tenta mapear -> system.efeito.

const CATEGORIAS = ["direcao", "gambiarra", "protecao", "estranho"];
const TIPOS = ["reliquia", "consumivel"];
const EFEITOS = ["reduzir", "roxo", "hackear", "trocar"];

function clampInt(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function normalizeCategoria(v) {
  const s = String(v ?? "").trim();
  return CATEGORIAS.includes(s) ? s : "gambiarra";
}

function normalizeTipo(v) {
  const s = String(v ?? "").trim();
  return TIPOS.includes(s) ? s : "reliquia";
}

function normalizeEfeito(v) {
  const s = String(v ?? "").trim();
  return EFEITOS.includes(s) ? s : "reduzir";
}

function inferEfeitoFromLegacyTags(tags) {
  if (!Array.isArray(tags)) return null;

  // versões antigas misturaram valores (reduzir/dado/trocar/hackear) e/ou
  // chaves "shift-dificuldade"/"add-dado"/etc.
  const t = tags.map((x) => String(x ?? "").trim());

  if (t.includes("roxo") || t.includes("dado") || t.includes("add-dado")) return "roxo";
  if (t.includes("trocar") || t.includes("swap-atributo")) return "trocar";
  if (t.includes("hackear") || t.includes("suavizar-bug")) return "hackear";
  if (t.includes("reduzir") || t.includes("shift-dificuldade")) return "reduzir";

  return null;
}

export class GambiarraItemModel extends foundry.abstract.TypeDataModel {
  /** @override */static defineSchema() {
    const { fields } = foundry.data;

    return {
      descricao: new fields.StringField({
        required: true,
        initial: "",
        blank: true,
      }),

      categoria: new fields.StringField({
        required: true,
        initial: "gambiarra",
      }),

      tipoItem: new fields.StringField({
        required: true,
        initial: "reliquia",
      }),

      // consumível: 1..3 / relíquia: 1
      cargasMax: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 0,
        max: 3,
      }),

      // consumível: 0..3 / relíquia: 1
      cargas: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 0,
        max: 3,
      }),

      usado: new fields.BooleanField({
        required: true,
        initial: false,
      }),

      // ✅ v0.6.2d: efeito único
      efeito: new fields.StringField({
        required: true,
        initial: "reduzir",
      }),

      // Mantidos (para não quebrar itens antigos / futura expansão)
      corrompido: new fields.BooleanField({
        required: true,
        initial: false,
      }),

      // lista de strings (ex: "lento", "barulhento"... futuro)
      corrupcoes: new fields.ArrayField(new fields.StringField({ blank: true }), {
        required: true,
        initial: [],
      }),

      // rastreio de origem (quando importado do compêndio)
      sourceId: new fields.StringField({
        required: false,
        initial: "",
        blank: true,
      }),
    };
  }

  /** @override */
  static migrateData(source) {
    const s = source ?? {};
    s.categoria = normalizeCategoria(s.categoria);
    s.tipoItem = normalizeTipo(s.tipoItem);

    // efeito novo
    const direct = normalizeEfeito(s.efeito);

    // tenta inferir de tags antigas (efeitosPossiveis)
    const legacy = inferEfeitoFromLegacyTags(s.efeitosPossiveis);

    // prioriza o novo (se válido). Se não, usa inferência. Senão "reduzir".
    s.efeito = normalizeEfeito(s.efeito && EFEITOS.includes(String(s.efeito)) ? s.efeito : (legacy ?? direct));

    // remove lixo que não existe mais na v0.6.2d (se tiver)
    if ("efeitosPossiveis" in s) delete s.efeitosPossiveis;
    if ("reageABug" in s) delete s.reageABug;
    if ("efeitosBug" in s) delete s.efeitosBug;

    // cargas coerentes
    const tipo = s.tipoItem;
    if (tipo === "consumivel") {
      const max = clampInt(s.cargasMax ?? s.cargas ?? 1, 1, 3);
      const cur = clampInt(s.cargas ?? max, 0, max);
      s.cargasMax = max;
      s.cargas = cur;
      s.usado = Boolean(s.usado) || cur === 0;
    } else {
      s.cargasMax = 1;
      s.cargas = 1;
      s.usado = false;
    }

    s.descricao = String(s.descricao ?? "");
    s.corrompido = Boolean(s.corrompido);
    s.corrupcoes = Array.isArray(s.corrupcoes) ? s.corrupcoes : [];
    s.sourceId = String(s.sourceId ?? "");

    return s;
  }

  /** @override */
  prepareBaseData() {
    // garante consistência em runtime também
    this.categoria = normalizeCategoria(this.categoria);
    this.tipoItem = normalizeTipo(this.tipoItem);
    this.efeito = normalizeEfeito(this.efeito);

    if (this.tipoItem === "consumivel") {
      this.cargasMax = clampInt(this.cargasMax, 1, 3);
      this.cargas = clampInt(this.cargas, 0, this.cargasMax);
      this.usado = Boolean(this.usado) || this.cargas === 0;
    } else {
      this.cargasMax = 1;
      this.cargas = 1;
      this.usado = false;
    }
  }

  // helpers úteis
  get isConsumivel() {
    return this.tipoItem === "consumivel";
  }

  get isReliquia() {
    return this.tipoItem !== "consumivel";
  }

  get efeitoLabel() {
    switch (this.efeito) {
      case "reduzir": return "➖ Reduzir dificuldade";
      case "roxo": return "🟣 +1 dado roxo";
      case "hackear": return "🪢 Hackear o Nó (registro)";
      case "trocar": return "🔁 Trocar atributo (registro)";
      default: return "➖ Reduzir dificuldade";
    }
  }
}