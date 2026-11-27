import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { CapitaleDatabase } from "../js/db/database.js";
import { STORE, defaultCategories } from "../js/db/schema.js";

test("crea schema, categorie iniziali e conserva dati dopo la riapertura", async () => {
  const database = await CapitaleDatabase.open();
  assert.equal((await database.getAll(STORE.categories)).length, defaultCategories().length);
  await database.put(STORE.settings, { key: "privacy.hiddenAmounts", value: true });
  database.close();
  const reopened = await CapitaleDatabase.open();
  assert.deepEqual(await reopened.get(STORE.settings, "privacy.hiddenAmounts"), { key: "privacy.hiddenAmounts", value: true });
  reopened.close();
});

test("CRUD di base conferma l'operazione solo dopo la transazione", async () => {
  const database = await CapitaleDatabase.open();
  await database.put(STORE.movements, { id: "movement-test", kind: "income", amountCents: 210000, categoryId: "income-salary", date: "2026-11-01" });
  assert.equal((await database.get(STORE.movements, "movement-test")).amountCents, 210000);
  await database.delete(STORE.movements, "movement-test");
  assert.equal(await database.get(STORE.movements, "movement-test"), undefined);
  database.close();
});

test("salva posizione, snapshot e righe storiche nella stessa transazione", async () => {
  const database = await CapitaleDatabase.open();
  await database.saveWealthSnapshot({
    positions: [{ id: "position-test", type: "etf", name: "ETF sintetico", status: "active", currentValueCents: 1300000, investedCapitalCents: 1200000 }],
    snapshot: { id: "snapshot-test", effectiveDate: "2026-11-27", createdAt: "2026-11-27T12:00:00.000Z" },
    snapshotItems: [{ id: "snapshot-item-test", snapshotId: "snapshot-test", positionId: "position-test", type: "etf", name: "ETF sintetico", valueCents: 1300000, investedCapitalCents: 1200000 }]
  });
  assert.equal((await database.get(STORE.positions, "position-test")).currentValueCents, 1300000);
  assert.equal((await database.get(STORE.snapshots, "snapshot-test")).effectiveDate, "2026-11-27");
  assert.equal((await database.getAllByIndex(STORE.snapshotItems, "by-snapshot", "snapshot-test")).length, 1);
  database.close();
});
