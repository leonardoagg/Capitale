import { DB_NAME, DB_VERSION, STORE, createSchema, defaultCategories } from "./schema.js";

export class DatabaseError extends Error {
  constructor(message, cause) { super(message, { cause }); this.name = "DatabaseError"; }
}

export class CapitaleDatabase {
  #db;

  static async open({ indexedDB = globalThis.indexedDB } = {}) {
    if (!indexedDB) throw new DatabaseError("IndexedDB non è disponibile in questo browser.");
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) createSchema(request.result, request.transaction);
    };
    const database = await requestToPromise(request, "Impossibile aprire il database locale.");
    database.onversionchange = () => database.close();
    return new CapitaleDatabase(database);
  }

  constructor(database) { this.#db = database; }
  close() { this.#db.close(); }

  async get(storeName, id) {
    return this.#run(storeName, "readonly", (store) => requestToPromise(store.get(id), "Lettura locale non riuscita."));
  }

  async getAll(storeName) {
    return this.#run(storeName, "readonly", (store) => requestToPromise(store.getAll(), "Lettura locale non riuscita."));
  }

  async put(storeName, value) {
    return this.#run(storeName, "readwrite", (store) => requestToPromise(store.put(value), "Salvataggio locale non riuscito."));
  }

  async delete(storeName, id) {
    return this.#run(storeName, "readwrite", (store) => requestToPromise(store.delete(id), "Eliminazione locale non riuscita."));
  }

  async getAllByIndex(storeName, indexName, query = null) {
    return this.#run(storeName, "readonly", (store) => requestToPromise(store.index(indexName).getAll(query), "Lettura locale non riuscita."));
  }

  async saveWealthSnapshot({ positions, snapshot, snapshotItems, replaceSnapshotId = null }) {
    const names = [STORE.positions, STORE.snapshots, STORE.snapshotItems];
    let transaction;
    try { transaction = this.#db.transaction(names, "readwrite"); } catch (error) { throw new DatabaseError("Transazione patrimoniale non disponibile.", error); }
    const completion = transactionDone(transaction);
    try {
      const positionStore = transaction.objectStore(STORE.positions);
      const snapshotStore = transaction.objectStore(STORE.snapshots);
      const itemStore = transaction.objectStore(STORE.snapshotItems);
      const writeSnapshot = () => {
        for (const position of positions) positionStore.put(position);
        snapshotStore.put(snapshot);
        for (const item of snapshotItems) itemStore.put(item);
      };
      if (replaceSnapshotId) {
        const request = itemStore.index("by-snapshot").openCursor(IDBKeyRange.only(replaceSnapshotId));
        request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } else writeSnapshot(); };
        request.onerror = () => transaction.abort();
      } else writeSnapshot();
      await completion;
    } catch (error) {
      try { transaction.abort(); } catch { /* transaction already completed */ }
      throw error instanceof DatabaseError ? error : new DatabaseError("Salvataggio dello storico patrimoniale non riuscito.", error);
    }
  }

  async deleteWealthPosition({ positionId, snapshot, snapshotItems, replaceSnapshotId = null }) {
    const names = [STORE.positions, STORE.snapshots, STORE.snapshotItems];
    const transaction = this.#db.transaction(names, "readwrite"); const completion = transactionDone(transaction);
    try {
      const positionStore = transaction.objectStore(STORE.positions); const snapshotStore = transaction.objectStore(STORE.snapshots); const itemStore = transaction.objectStore(STORE.snapshotItems);
      const write = () => { positionStore.delete(positionId); snapshotStore.put(snapshot); for (const item of snapshotItems) itemStore.put(item); };
      if (replaceSnapshotId) { const request = itemStore.index("by-snapshot").openCursor(IDBKeyRange.only(replaceSnapshotId)); request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } else write(); }; request.onerror = () => transaction.abort(); } else write();
      await completion;
    } catch (error) { try { transaction.abort(); } catch { /* complete */ } throw new DatabaseError("Cancellazione posizione non riuscita.", error); }
  }

  async clearAllFinancialData() {
    return this.#run([STORE.positions, STORE.snapshots, STORE.snapshotItems, STORE.movements], "readwrite", (stores) =>
      Promise.all(stores.map((store) => requestToPromise(store.clear(), "Pulizia locale non riuscita."))));
  }

  async clearAllData() {
    const stores = Object.values(STORE); const transaction = this.#db.transaction(stores, "readwrite"); const completion = transactionDone(transaction);
    try { for (const name of stores) transaction.objectStore(name).clear(); for (const category of defaultCategories()) transaction.objectStore(STORE.categories).put(category); await completion; } catch (error) { try { transaction.abort(); } catch { /* complete */ } throw new DatabaseError("Cancellazione locale non riuscita.", error); }
  }

  async exportData() {
    const stores = [STORE.positions, STORE.snapshots, STORE.snapshotItems, STORE.movements, STORE.categories, STORE.settings];
    const entries = await Promise.all(stores.map(async (store) => [store, await this.getAll(store)]));
    return Object.fromEntries(entries);
  }

  async replaceExportedData(data) {
    const stores = [STORE.positions, STORE.snapshots, STORE.snapshotItems, STORE.movements, STORE.categories, STORE.settings];
    let transaction;
    try { transaction = this.#db.transaction(stores, "readwrite"); } catch (error) { throw new DatabaseError("Ripristino locale non disponibile.", error); }
    const completion = transactionDone(transaction);
    try {
      for (const storeName of stores) transaction.objectStore(storeName).clear();
      for (const storeName of stores) for (const record of data[storeName] ?? []) transaction.objectStore(storeName).put(record);
      await completion;
    } catch (error) {
      try { transaction.abort(); } catch { /* already complete */ }
      throw error instanceof DatabaseError ? error : new DatabaseError("Ripristino locale non riuscito.", error);
    }
  }

  async #run(storeNames, mode, action) {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    let transaction;
    try { transaction = this.#db.transaction(names, mode); } catch (error) { throw new DatabaseError("Transazione locale non disponibile.", error); }
    const stores = names.map((name) => transaction.objectStore(name));
    const completion = transactionDone(transaction);
    const result = await action(Array.isArray(storeNames) ? stores : stores[0]);
    await completion;
    return result;
  }
}

function requestToPromise(request, message) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatabaseError(message, request.error));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(new DatabaseError("La transazione locale è stata annullata.", transaction.error));
    transaction.onerror = () => reject(new DatabaseError("La transazione locale non è riuscita.", transaction.error));
  });
}
