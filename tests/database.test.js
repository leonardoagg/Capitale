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
