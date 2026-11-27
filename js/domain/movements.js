import { sumCents } from "./money.js";

const EXPENSE_TYPES = ["fixed", "variable", "extraordinary"];

export function calculateMonthlySummary(movements, month) {
  const selected = movements.filter((movement) => movement.date.startsWith(`${month}-`));
  const incomeCents = sumCents(selected.filter((movement) => movement.kind === "income").map((movement) => movement.amountCents));
  const expenseCents = sumCents(selected.filter((movement) => movement.kind === "expense").map((movement) => movement.amountCents));
  const byExpenseType = Object.fromEntries(EXPENSE_TYPES.map((type) => [type, sumCents(selected.filter((movement) => movement.kind === "expense" && movement.expenseType === type).map((movement) => movement.amountCents))]));
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents, byExpenseType, movements: selected };
}

export function calculateMonthlyHistory(movements) {
  const months = new Map();
  for (const movement of movements) {
    const month = movement.date.slice(0, 7);
    const totals = months.get(month) ?? { month, incomeCents: 0, expenseCents: 0 };
    if (movement.kind === "income") totals.incomeCents += movement.amountCents;
    if (movement.kind === "expense") totals.expenseCents += movement.amountCents;
    months.set(month, totals);
  }
  return [...months.values()].sort((left, right) => left.month.localeCompare(right.month)).map((totals) => ({ ...totals, balanceCents: totals.incomeCents - totals.expenseCents }));
}
