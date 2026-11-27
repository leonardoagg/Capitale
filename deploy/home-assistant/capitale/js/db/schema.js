export const DB_NAME = "capitale";
export const DB_VERSION = 1;

export const STORE = Object.freeze({
  positions: "positions",
  snapshots: "snapshots",
  snapshotItems: "snapshotItems",
  movements: "movements",
  categories: "categories",
  settings: "settings",
  security: "security"
});

const CATEGORY_DEFINITIONS = [
  ["expense-fixed-rent", "expense", "fixed", "Affitto o mutuo"],
  ["expense-fixed-subscriptions", "expense", "fixed", "Abbonamenti"],
  ["expense-fixed-insurance", "expense", "fixed", "Assicurazioni"],
  ["expense-fixed-bills", "expense", "fixed", "Bollette"],
  ["expense-fixed-phone", "expense", "fixed", "Telefonia"],
  ["expense-fixed-other", "expense", "fixed", "Altro"],
  ["expense-variable-groceries", "expense", "variable", "Supermercato"],
  ["expense-variable-food", "expense", "variable", "Ristoranti e bar"],
  ["expense-variable-fuel", "expense", "variable", "Carburante"],
  ["expense-variable-clothing", "expense", "variable", "Abbigliamento"],
  ["expense-variable-leisure", "expense", "variable", "Svago"],
  ["expense-variable-other", "expense", "variable", "Altro"],
  ["expense-extra-holidays", "expense", "extraordinary", "Vacanze"],
  ["expense-extra-electronics", "expense", "extraordinary", "Elettronica"],
  ["expense-extra-car", "expense", "extraordinary", "Automobile"],
  ["expense-extra-home", "expense", "extraordinary", "Arredamento"],
  ["expense-extra-unexpected", "expense", "extraordinary", "Imprevisti"],
  ["expense-extra-other", "expense", "extraordinary", "Altro"],
  ["income-salary", "income", null, "Stipendio"],
  ["income-refund", "income", null, "Rimborsi"],
  ["income-gift", "income", null, "Regali"],
  ["income-interest", "income", null, "Interessi e cedole"],
  ["income-other", "income", null, "Altro"]
];

export function defaultCategories() {
  return CATEGORY_DEFINITIONS.map(([id, kind, expenseType, name]) => ({ id, kind, expenseType, name, archived: false, builtIn: true }));
}

export function createSchema(database, transaction) {
  const positions = database.createObjectStore(STORE.positions, { keyPath: "id" });
  positions.createIndex("by-status", "status");
  positions.createIndex("by-type", "type");
  const snapshots = database.createObjectStore(STORE.snapshots, { keyPath: "id" });
  snapshots.createIndex("by-effective-date", "effectiveDate");
  const snapshotItems = database.createObjectStore(STORE.snapshotItems, { keyPath: "id" });
  snapshotItems.createIndex("by-snapshot", "snapshotId");
  snapshotItems.createIndex("by-position", "positionId");
  const movements = database.createObjectStore(STORE.movements, { keyPath: "id" });
  movements.createIndex("by-date", "date");
  movements.createIndex("by-category", "categoryId");
  movements.createIndex("by-kind", "kind");
  const categories = database.createObjectStore(STORE.categories, { keyPath: "id" });
  categories.createIndex("by-kind", "kind");
  categories.createIndex("by-expense-type", "expenseType");
  database.createObjectStore(STORE.settings, { keyPath: "key" });
  database.createObjectStore(STORE.security, { keyPath: "key" });
  for (const category of defaultCategories()) transaction.objectStore(STORE.categories).put(category);
}
