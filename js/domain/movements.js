import { sumCents } from "./money.js";

const EXPENSE_TYPES = ["fixed", "variable", "extraordinary"];

export function calculateMonthlySummary(movements, month) {
  const selected = movements.filter((movement) => movement.date.startsWith(`${month}-`));
  const incomeCents = sumCents(selected.filter((movement) => movement.kind === "income").map((movement) => movement.amountCents));
  const expenseCents = sumCents(selected.filter((movement) => movement.kind === "expense").map((movement) => movement.amountCents));
  const byExpenseType = Object.fromEntries(EXPENSE_TYPES.map((type) => [type, sumCents(selected.filter((movement) => movement.kind === "expense" && movement.expenseType === type).map((movement) => movement.amountCents))]));
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents, byExpenseType, movements: selected };
}
