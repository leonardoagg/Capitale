import { isCivilDate } from "./date.js";

export const POSITION_TYPES = ["checking", "deposit", "etf", "bond", "cash"];
export const MOVEMENT_KINDS = ["income", "expense"];
export const EXPENSE_TYPES = ["fixed", "variable", "extraordinary"];

export function isSafeCents(value, { allowNegative = false } = {}) {
  return Number.isSafeInteger(value) && (allowNegative || value >= 0);
}

export function assertMovement(movement) {
  if (!movement || !MOVEMENT_KINDS.includes(movement.kind)) throw new TypeError("Tipo movimento non valido");
  if (!isSafeCents(movement.amountCents) || movement.amountCents === 0) throw new TypeError("Importo movimento non valido");
  if (!isCivilDate(movement.date)) throw new TypeError("Data movimento non valida");
  if (typeof movement.categoryId !== "string" || !movement.categoryId) throw new TypeError("Categoria non valida");
  if (movement.kind === "expense" && !EXPENSE_TYPES.includes(movement.expenseType)) {
    throw new TypeError("Tipologia di spesa non valida");
  }
  if (movement.kind === "income" && movement.expenseType != null) throw new TypeError("Entrata con tipologia non valida");
}

export function assertPosition(position) {
  if (!position || !POSITION_TYPES.includes(position.type)) throw new TypeError("Tipo posizione non valido");
  if (typeof position.name !== "string" || !position.name.trim()) throw new TypeError("Nome posizione obbligatorio");
  if (!isSafeCents(position.currentValueCents, { allowNegative: true })) throw new TypeError("Valore posizione non valido");
  if (["etf", "bond"].includes(position.type) && !isSafeCents(position.investedCapitalCents ?? 0)) {
    throw new TypeError("Capitale investito non valido");
  }
}
