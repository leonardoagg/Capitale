import test from "node:test";
import assert from "node:assert/strict";
import { calculateInvestmentGain, calculateWealthHistory, calculateWealthSummary } from "../js/domain/wealth.js";

test("calcola patrimonio, liquidità e investimenti senza usare movimenti", () => {
  const summary = calculateWealthSummary([
    { type: "checking", status: "active", currentValueCents: 650000 },
    { type: "deposit", status: "active", depositType: "locked", currentValueCents: 1500000 },
    { type: "cash", status: "active", currentValueCents: 30000 },
    { type: "etf", status: "active", currentValueCents: 1300000, investedCapitalCents: 1200000 },
    { type: "bond", status: "active", currentValueCents: 800000, investedCapitalCents: 850000 },
    { type: "checking", status: "archived", currentValueCents: 999999 }
  ]);
  assert.equal(summary.totalCents, 4280000);
  assert.equal(summary.liquidityCents, 2180000);
  assert.equal(summary.immediatelyAvailableCents, 680000);
  assert.equal(summary.lockedDepositCents, 1500000);
  assert.equal(summary.investmentValueCents, 2100000);
  assert.equal(summary.investedCapitalCents, 2050000);
  assert.equal(summary.unrealizedGainCents, 50000);
  assert.equal(Number(summary.unrealizedGainPercent.toFixed(2)), 2.44);
});

test("non espone una percentuale quando il capitale investito è nullo", () => {
  assert.deepEqual(calculateInvestmentGain({ type: "etf", currentValueCents: 1000, investedCapitalCents: 0 }), { gainCents: 1000, percent: null });
  assert.equal(calculateInvestmentGain({ type: "cash", currentValueCents: 1000 }), null);
});

test("costruisce lo storico soltanto dalle fotografie realmente disponibili", () => {
  const history = calculateWealthHistory([{ id: "second", effectiveDate: "2026-11-02", createdAt: "2026-11-02T10:00:00Z" }, { id: "first", effectiveDate: "2026-11-01", createdAt: "2026-11-01T10:00:00Z" }], [{ snapshotId: "first", valueCents: 100 }, { snapshotId: "second", valueCents: 120 }, { snapshotId: "second", valueCents: 30 }]);
  assert.deepEqual(history.map((item) => [item.effectiveDate, item.totalCents]), [["2026-11-01", 100], ["2026-11-02", 150]]);
});
