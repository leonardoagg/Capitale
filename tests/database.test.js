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

test("sostituisce le righe della fotografia quando la stessa giornata viene aggiornata", async () => {
  const database = await CapitaleDatabase.open();
  await database.saveWealthSnapshot({ positions: [], snapshot: { id: "daily-snapshot", effectiveDate: "2026-11-27", createdAt: "2026-11-27T10:00:00.000Z" }, snapshotItems: [{ id: "old-item", snapshotId: "daily-snapshot", positionId: "p", type: "cash", name: "Vecchio", valueCents: 100 }] });
  await database.saveWealthSnapshot({ positions: [], replaceSnapshotId: "daily-snapshot", snapshot: { id: "daily-snapshot", effectiveDate: "2026-11-27", createdAt: "2026-11-27T10:00:00.000Z", updatedAt: "2026-11-27T11:00:00.000Z" }, snapshotItems: [{ id: "new-item", snapshotId: "daily-snapshot", positionId: "p", type: "cash", name: "Nuovo", valueCents: 200 }] });
  const items = await database.getAllByIndex(STORE.snapshotItems, "by-snapshot", "daily-snapshot");
  assert.deepEqual(items.map((item) => item.id), ["new-item"]);
  database.close();
});

test("cancella posizione e aggiorna atomicamente la fotografia del giorno", async () => {
  const database = await CapitaleDatabase.open();
  await database.put(STORE.positions, { id: "delete-position", type: "cash", name: "Da cancellare", status: "active", currentValueCents: 100 });
  await database.saveWealthSnapshot({ positions: [], snapshot: { id: "delete-snapshot", effectiveDate: "2026-11-27", createdAt: "2026-11-27T10:00:00.000Z" }, snapshotItems: [{ id: "delete-item", snapshotId: "delete-snapshot", positionId: "delete-position", type: "cash", name: "Da cancellare", valueCents: 100 }] });
  await database.deleteWealthPosition({ positionId: "delete-position", replaceSnapshotId: "delete-snapshot", snapshot: { id: "delete-snapshot", effectiveDate: "2026-11-27", createdAt: "2026-11-27T10:00:00.000Z" }, snapshotItems: [] });
  assert.equal(await database.get(STORE.positions, "delete-position"), undefined);
  assert.deepEqual(await database.getAllByIndex(STORE.snapshotItems, "by-snapshot", "delete-snapshot"), []);
  database.close();
});

test("cancella tutti i dati e ripristina soltanto le categorie predefinite", async () => {
  const database = await CapitaleDatabase.open();
  await database.put(STORE.movements, { id: "erase-movement", kind: "income", amountCents: 1, categoryId: "income-other", date: "2026-11-27" });
  await database.put(STORE.security, { key: "pin", value: "test" });
  await database.clearAllData();
  assert.equal((await database.getAll(STORE.movements)).length, 0);
  assert.equal(await database.get(STORE.security, "pin"), undefined);
  assert.ok((await database.getAll(STORE.categories)).length > 0);
  database.close();
});
