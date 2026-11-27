import test from "node:test";
import assert from "node:assert/strict";
import { formatEuro, parseEuroToCents, sumCents } from "../js/domain/money.js";
import { isCivilDate, todayCivilDate } from "../js/domain/date.js";
import { assertMovement, assertPosition } from "../js/domain/validation.js";

test("gestisce importi italiani in centesimi interi", () => {
  assert.equal(parseEuroToCents("1.234,56"), 123456);
  assert.equal(parseEuroToCents("0,1"), 10);
  assert.equal(parseEuroToCents("-10,00"), null);
  assert.equal(parseEuroToCents("-10,00", { allowNegative: true }), -1000);
  assert.equal(parseEuroToCents("12,345"), null);
  assert.equal(sumCents([650000, 1500000, 30000, 1300000, 800000]), 4280000);
  assert.equal(formatEuro(150000), "1.500,00 €");
});

test("mantiene date civili senza slittamenti UTC", () => {
  assert.equal(isCivilDate("2024-02-29"), true);
  assert.equal(isCivilDate("2025-02-29"), false);
  assert.equal(todayCivilDate(new Date("2026-11-27T23:30:00+01:00")), "2026-11-27");
});

test("rifiuta movimenti e posizioni non validi", () => {
  assert.throws(() => assertMovement({ kind: "expense", amountCents: 0, date: "2026-01-01", categoryId: "x", expenseType: "fixed" }));
  assert.throws(() => assertMovement({ kind: "income", amountCents: 100, date: "2026-01-01", categoryId: "x", expenseType: "fixed" }));
  assert.throws(() => assertPosition({ type: "etf", name: "ETF", currentValueCents: 100, investedCapitalCents: -1 }));
});
