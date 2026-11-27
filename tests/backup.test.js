import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { createBackup, restoreBackup, validateBackup } from "../js/backup/backup.js";
import { decryptBackup, encryptBackup } from "../js/backup/crypto.js";
import { movementsCsv } from "../js/backup/csv.js";
import { createPinRecord, verifyPin } from "../js/security/pin.js";
import { CapitaleDatabase } from "../js/db/database.js";
import { STORE } from "../js/db/schema.js";

test("esporta e ripristina i dati senza esportare la sicurezza locale", async () => {
  const db = await CapitaleDatabase.open();
  await db.put(STORE.movements, { id: "backup-movement", kind: "income", amountCents: 100, categoryId: "income-other", date: "2026-11-27" });
  await db.put(STORE.security, { key: "pin", value: "non-esportabile" });
  const backup = await createBackup(db, new Date("2026-11-27T10:00:00.000Z"));
  assert.equal(backup.data.security, undefined);
  await db.delete(STORE.movements, "backup-movement");
  await restoreBackup(db, backup);
  assert.equal((await db.get(STORE.movements, "backup-movement")).amountCents, 100);
  assert.equal((await db.get(STORE.security, "pin")).value, "non-esportabile");
  db.close();
});

test("rifiuta formati e identificatori duplicati", () => {
  assert.throws(() => validateBackup({ format: "altro" }));
  const data = Object.fromEntries(["positions", "snapshots", "snapshotItems", "movements", "categories", "settings"].map((store) => [store, []]));
  data.movements = [{ id: "same" }, { id: "same" }];
  assert.throws(() => validateBackup({ format: "capitale-backup", formatVersion: 1, createdAt: "2026-11-27T10:00:00.000Z", data }));
});

test("cifra e decifra il backup e rifiuta password o contenuto alterato", async () => {
  const data = Object.fromEntries(["positions", "snapshots", "snapshotItems", "movements", "categories", "settings"].map((store) => [store, []]));
  const backup = { format: "capitale-backup", formatVersion: 1, createdAt: "2026-11-27T10:00:00.000Z", data };
  const encrypted = await encryptBackup(backup, "password-di-prova");
  assert.equal((await decryptBackup(encrypted, "password-di-prova")).format, "capitale-backup");
  await assert.rejects(() => decryptBackup(encrypted, "password-errata"));
  encrypted.ciphertext = `${encrypted.ciphertext.slice(0, -2)}aa`;
  await assert.rejects(() => decryptBackup(encrypted, "password-di-prova"));
});

test("esporta CSV con separatore italiano e neutralizza formule", () => {
  const csv = movementsCsv([{ kind: "expense", expenseType: "fixed", amountCents: 1234, categoryId: "cat", date: "2026-11-27", description: "=1+1" }], [{ id: "cat", name: "Bollette" }]);
  assert.match(csv, /27\/11\/2026|2026-11-27/);
  assert.match(csv, /12,34/);
  assert.match(csv, /'=1\+1/);
});

test("conserva soltanto un verificatore del PIN", async () => {
  const record = await createPinRecord("1234");
  assert.equal(record.pin, undefined);
  assert.equal(await verifyPin("1234", record), true);
  assert.equal(await verifyPin("4321", record), false);
  await assert.rejects(() => createPinRecord("12"));
});
