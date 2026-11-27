import test from "node:test";
import assert from "node:assert/strict";
import { calculateMonthlyHistory, calculateMonthlySummary } from "../js/domain/movements.js";

test("calcola il bilancio mensile registrato senza toccare il patrimonio", () => {
  const summary = calculateMonthlySummary([
    { kind: "income", amountCents: 210000, date: "2026-11-01" },
    { kind: "expense", expenseType: "fixed", amountCents: 63000, date: "2026-11-02" },
    { kind: "expense", expenseType: "variable", amountCents: 17000, date: "2026-11-03" },
    { kind: "expense", expenseType: "extraordinary", amountCents: 15000, date: "2026-11-04" },
    { kind: "income", amountCents: 100, date: "2026-10-31" }
  ], "2026-11");
  assert.equal(summary.incomeCents, 210000);
  assert.equal(summary.expenseCents, 95000);
  assert.equal(summary.balanceCents, 115000);
  assert.deepEqual(summary.byExpenseType, { fixed: 63000, variable: 17000, extraordinary: 15000 });
});

test("un mese senza movimenti restituisce zeri, non NaN", () => {
  assert.deepEqual(calculateMonthlySummary([], "2026-11"), { incomeCents: 0, expenseCents: 0, balanceCents: 0, byExpenseType: { fixed: 0, variable: 0, extraordinary: 0 }, movements: [] });
});

test("raggruppa entrate e uscite per mese senza coinvolgere il patrimonio", () => {
  const history = calculateMonthlyHistory([
    { kind: "expense", amountCents: 200, date: "2026-10-31" },
    { kind: "income", amountCents: 1000, date: "2026-11-01" },
    { kind: "expense", amountCents: 300, date: "2026-11-15" }
  ]);
  assert.deepEqual(history, [{ month: "2026-10", incomeCents: 0, expenseCents: 200, balanceCents: -200 }, { month: "2026-11", incomeCents: 1000, expenseCents: 300, balanceCents: 700 }]);
});
