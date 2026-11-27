import { formatEuro } from "../domain/money.js";

export function movementsCsv(movements, categories) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const rows = [["Data", "Tipo", "Tipologia", "Categoria", "Importo", "Descrizione"], ...movements.map((movement) => [movement.date, movement.kind === "income" ? "Entrata" : "Uscita", movement.expenseType ?? "", categoryNames.get(movement.categoryId) ?? "", formatEuro(movement.amountCents).replace(" €", ""), safeText(movement.description ?? "")])];
  return `\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\r\n")}`;
}

export function positionsCsv(positions) {
  const rows = [["Nome", "Tipo", "Stato", "Valore attuale", "Capitale investito", "ISIN"], ...positions.map((position) => [safeText(position.name), position.type, position.status, formatEuro(position.currentValueCents).replace(" €", ""), position.investedCapitalCents == null ? "" : formatEuro(position.investedCapitalCents).replace(" €", ""), safeText(position.isin ?? "")])];
  return `\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\r\n")}`;
}

function safeText(value) { const text = String(value); return /^[=+\-@]/.test(text) ? `'${text}` : text; }
function escape(value) { const text = String(value ?? ""); return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
