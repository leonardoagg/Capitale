import { STORE } from "../db/schema.js";

export const BACKUP_FORMAT_VERSION = 1;
const EXPORTED_STORES = [STORE.positions, STORE.snapshots, STORE.snapshotItems, STORE.movements, STORE.categories, STORE.settings];

export async function createBackup(database, now = new Date()) {
  return { format: "capitale-backup", formatVersion: BACKUP_FORMAT_VERSION, createdAt: now.toISOString(), data: await database.exportData() };
}

export function validateBackup(backup) {
  if (!backup || backup.format !== "capitale-backup" || backup.formatVersion !== BACKUP_FORMAT_VERSION || !isIso(backup.createdAt) || !backup.data || typeof backup.data !== "object") throw new TypeError("Il file non è un backup Capitale supportato.");
  for (const store of EXPORTED_STORES) {
    if (!Array.isArray(backup.data[store])) throw new TypeError(`Archivio backup non valido: ${store}.`);
    const ids = new Set();
    for (const record of backup.data[store]) { if (!record || typeof record.id !== "string" && typeof record.key !== "string") throw new TypeError(`Record non valido in ${store}.`); const id = record.id ?? record.key; if (ids.has(id)) throw new TypeError(`Identificatore duplicato in ${store}.`); ids.add(id); }
  }
  return backup;
}

export async function restoreBackup(database, backup) { validateBackup(backup); await database.replaceExportedData(backup.data); }
function isIso(value) { return typeof value === "string" && !Number.isNaN(Date.parse(value)); }
