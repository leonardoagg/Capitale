import { STORE } from "../db/schema.js";
import { formatCivilDate, todayCivilDate } from "../domain/date.js";
import { formatEuro, parseEuroToCents } from "../domain/money.js";
import { assertPosition } from "../domain/validation.js";
import { assertMovement } from "../domain/validation.js";
import { calculateWealthSummary } from "../domain/wealth.js";
import { calculateMonthlySummary } from "../domain/movements.js";
import { createBackup } from "../backup/backup.js";
import { encryptBackup } from "../backup/crypto.js";

const NAV_ITEMS = [["home", "⌂", "Home"], ["wealth", "◫", "Patrimonio"], ["movements", "⇅", "Movimenti"], ["analysis", "◔", "Analisi"]];

export function renderShell(root, { database }) {
  if (!database) return renderFatalError(root, new Error("Non è possibile inizializzare l’archivio locale su questo dispositivo."));
  const state = { current: "home", amountsHidden: false, positions: [], snapshots: [], movements: [], categories: [], editingPositionId: null, editingMovementId: null, addingPosition: false, addingMovement: false, backupPanel: false, selectedMonth: todayCivilDate().slice(0, 7), database };
  const render = () => root.replaceChildren(createApp(state, render));
  state.refreshPositions = async () => { [state.positions, state.snapshots, state.movements, state.categories] = await Promise.all([database.getAll(STORE.positions), database.getAll(STORE.snapshots), database.getAll(STORE.movements), database.getAll(STORE.categories)]); render(); };
  render();
  state.refreshPositions().catch((error) => renderFatalError(root, error));
}

function createApp(state, render) {
  const app = element("div", "app");
  app.append(createHeader(state, render), createContent(state, render), createNavigation(state, render));
  return app;
}

function createHeader(state, render) {
  const header = element("header", "topbar");
  const title = element("p", "eyebrow", state.current === "settings" ? "Impostazioni" : screenTitle(state.current));
  const actions = element("div", "topbar-actions");
  if (state.current !== "settings") {
    const privacy = button(state.amountsHidden ? "◉" : "◌", state.amountsHidden ? "Mostra importi" : "Nascondi importi", "icon-button");
    privacy.addEventListener("click", () => { state.amountsHidden = !state.amountsHidden; render(); });
    actions.append(privacy);
  }
  if (state.current === "home") {
    const settings = button("⚙", "Apri impostazioni", "icon-button");
    settings.addEventListener("click", () => { state.current = "settings"; render(); });
    actions.append(settings);
  }
  if (state.current === "settings") {
    const back = button("‹", "Torna alla Home", "icon-button");
    back.addEventListener("click", () => { state.current = "home"; render(); });
    actions.append(back);
  }
  header.append(title, actions);
  return header;
}

function createContent(state, render) {
  const main = element("main", "screen");
  const views = { home: () => homeView(state, render), wealth: () => wealthView(state, render), movements: () => movementsView(state, render), analysis: analysisView, settings: () => settingsView(state, render) };
  main.append(views[state.current]());
  return main;
}

function homeView(state, render) {
  const fragment = document.createDocumentFragment();
  const summary = calculateWealthSummary(state.positions);
  const monthly = calculateMonthlySummary(state.movements, todayCivilDate().slice(0, 7));
  const latestSnapshot = [...state.snapshots].sort((left, right) => `${right.effectiveDate}${right.createdAt}`.localeCompare(`${left.effectiveDate}${left.createdAt}`))[0];
  const intro = element("section", "intro");
  intro.append(element("h1", "page-title", "Panoramica"), element("p", "subtitle", "Il tuo spazio finanziario, senza dati dimostrativi."));
  const wealth = element("section", "hero-card");
  wealth.append(element("p", "card-label", "Patrimonio totale"), element("strong", "hero-value", hidden(state, latestSnapshot ? formatEuro(summary.totalCents) : "Non ancora rilevato")), element("p", "hint", latestSnapshot ? `Ultima fotografia: ${formatCivilDate(latestSnapshot.effectiveDate)}` : "Aggiungi una posizione per iniziare a tracciare il patrimonio."));
  const quick = element("div", "two-column");
  quick.append(metricCard("Liquidità", hidden(state, formatEuro(summary.liquidityCents)), summary.lockedDepositCents ? `Vincolata: ${hidden(state, formatEuro(summary.lockedDepositCents))}` : ""), metricCard("Investimenti", hidden(state, formatEuro(summary.investmentValueCents)), summary.investedCapitalCents ? `Capitale: ${hidden(state, formatEuro(summary.investedCapitalCents))}` : ""));
  const month = element("section", "section-card");
  month.append(element("div", "section-title", "Movimenti del mese"), element("p", "registered-label", "Totali registrati"));
  const totals = element("div", "movement-totals");
  totals.append(metricCard("Entrate", hidden(state, formatEuro(monthly.incomeCents)), ""), metricCard("Uscite", hidden(state, formatEuro(monthly.expenseCents)), ""), metricCard("Bilancio", hidden(state, formatEuro(monthly.balanceCents)), ""));
  month.append(totals, element("p", "empty-copy", monthly.movements.length ? "Bilancio basato sui movimenti registrati." : "Nessun movimento registrato."));
  const newMovement = button("Nuovo movimento", "Apri la sezione Movimenti", "primary-button");
  newMovement.addEventListener("click", () => { state.current = "movements"; render(); });
  fragment.append(intro, wealth, quick, month, newMovement);
  return fragment;
}

function wealthView(state, render) {
  const fragment = document.createDocumentFragment();
  fragment.append(element("h1", "page-title", "Patrimonio"), element("p", "subtitle", "Valori aggiornati manualmente, separati dai movimenti."));
  const summary = calculateWealthSummary(state.positions);
  const card = element("section", "section-card");
  card.append(element("p", "card-label", "Totale attuale"), element("strong", "hero-value", hidden(state, formatEuro(summary.totalCents))), element("p", "hint", `${state.positions.filter((position) => position.status !== "archived").length} posizioni attive`));
  const add = button("Aggiungi posizione", "Aggiungi posizione", "primary-button"); add.addEventListener("click", () => { state.addingPosition = true; render(); });
  fragment.append(card, add, positionList(state, render)); if (state.addingPosition) fragment.append(modal("Aggiungi posizione", positionForm(state, render, null), () => { state.addingPosition = false; render(); }));
  return fragment;
}

function positionList(state, render) {
  const list = element("section", "position-list");
  const active = state.positions.filter((position) => position.status !== "archived");
  if (!active.length) { list.append(element("p", "empty-copy", "Nessuna posizione registrata.")); return list; }
  for (const position of active) {
    const row = element("article", "position-row"); const copy = element("div");
    copy.append(element("strong", "position-name", position.name), element("p", "metric-detail", positionTypeLabel(position.type)));
    const actions = element("div", "position-actions"); const edit = button("Modifica", `Modifica ${position.name}`, "text-button");
    edit.addEventListener("click", () => { state.editingPositionId = position.id; render(); });
    actions.append(element("strong", "position-value", hidden(state, formatEuro(position.currentValueCents))), edit); row.append(copy, actions); list.append(row);
    if (state.editingPositionId === position.id) list.append(positionForm(state, render, position));
  }
  return list;
}

function positionForm(state, render, editing = null) {
  const form = element("form", "position-form");
  form.append(element("h2", "setting-title", editing ? "Modifica posizione" : "Aggiungi posizione"));
  const type = selectField("Tipo", "type", [["checking", "Conto corrente"], ["deposit", "Conto deposito"], ["etf", "ETF"], ["bond", "Obbligazione"], ["cash", "Contanti"]]);
  const name = inputField("Nome", "name", "text", "es. Conto principale");
  const value = inputField("Valore attuale (€)", "value", "text", "0,00"); value.inputmode = "decimal";
  const capital = inputField("Capitale investito (€)", "capital", "text", "Solo ETF e obbligazioni"); capital.inputmode = "decimal";
  const deposit = selectField("Deposito", "depositType", [["free", "Libero"], ["locked", "Vincolato"]]);
  const error = element("p", "form-error"); error.setAttribute("role", "alert");
  const submit = button(editing ? "Salva modifiche" : "Aggiungi", editing ? "Salva modifiche" : "Aggiungi posizione", "primary-button");
  submit.type = "submit";
  const formActions = element("div", "form-actions");
  if (editing) { const cancel = button("Annulla", "Annulla modifica", "secondary-button"); cancel.addEventListener("click", () => { state.editingPositionId = null; render(); }); const remove = button("Cancella conto", "Cancella conto", "delete-button"); remove.addEventListener("click", async () => { if (!window.confirm("Sicuro di voler cancellare?")) return; const now = new Date().toISOString(); const effectiveDate = todayCivilDate(); const remaining = state.positions.filter((item) => item.status !== "archived" && item.id !== editing.id); const existingSnapshot = state.snapshots.filter((item) => item.effectiveDate === effectiveDate).sort((left, right) => `${right.createdAt}${right.id}`.localeCompare(`${left.createdAt}${left.id}`))[0]; const snapshotId = existingSnapshot?.id ?? createId(); await state.database.deleteWealthPosition({ positionId: editing.id, replaceSnapshotId: existingSnapshot?.id ?? null, snapshot: { id: snapshotId, effectiveDate, createdAt: existingSnapshot?.createdAt ?? now, updatedAt: now }, snapshotItems: remaining.map((item) => ({ id: createId(), snapshotId, positionId: item.id, type: item.type, name: item.name, valueCents: item.currentValueCents, investedCapitalCents: item.investedCapitalCents ?? null, depositType: item.depositType ?? null, valuedOn: item.valuedOn })) }); state.editingPositionId = null; await state.refreshPositions(); }); formActions.append(remove, cancel); }
  formActions.append(submit); form.append(type.wrapper, name.wrapper, value.wrapper, capital.wrapper, deposit.wrapper, error, formActions);
  const updateFields = () => { const investing = ["etf", "bond"].includes(type.input.value); capital.wrapper.hidden = !investing; capital.input.required = investing; deposit.wrapper.hidden = type.input.value !== "deposit"; };
  type.input.addEventListener("change", updateFields);
  if (editing) { type.input.value = editing.type; name.input.value = editing.name; value.input.value = String(editing.currentValueCents / 100).replace(".", ","); capital.input.value = editing.investedCapitalCents == null ? "" : String(editing.investedCapitalCents / 100).replace(".", ","); deposit.input.value = editing.depositType ?? "free"; }
  updateFields();
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); error.textContent = ""; submit.disabled = true;
    try {
      const currentValueCents = parseEuroToCents(value.input.value, { allowNegative: true });
      const investing = ["etf", "bond"].includes(type.input.value);
      const investedCapitalCents = investing ? parseEuroToCents(capital.input.value) : undefined;
      const now = new Date().toISOString();
      const position = { id: editing?.id ?? createId(), type: type.input.value, name: name.input.value.trim(), status: "active", currentValueCents, createdAt: editing?.createdAt ?? now, updatedAt: now, valuedOn: todayCivilDate() };
      if (type.input.value === "deposit") position.depositType = deposit.input.value;
      if (investing) position.investedCapitalCents = investedCapitalCents;
      assertPosition(position);
      const allActive = [...state.positions.filter((item) => item.status !== "archived" && item.id !== position.id), position];
      const effectiveDate = todayCivilDate(); const existingSnapshot = state.snapshots.filter((item) => item.effectiveDate === effectiveDate).sort((left, right) => `${right.createdAt}${right.id}`.localeCompare(`${left.createdAt}${left.id}`))[0]; const snapshotId = existingSnapshot?.id ?? createId();
      await state.database.saveWealthSnapshot({ positions: [position], replaceSnapshotId: existingSnapshot?.id ?? null, snapshot: { id: snapshotId, effectiveDate, createdAt: existingSnapshot?.createdAt ?? now, updatedAt: now }, snapshotItems: allActive.map((item) => ({ id: createId(), snapshotId, positionId: item.id, type: item.type, name: item.name, valueCents: item.currentValueCents, investedCapitalCents: item.investedCapitalCents ?? null, depositType: item.depositType ?? null, valuedOn: item.valuedOn })) });
      state.editingPositionId = null; state.addingPosition = false; form.reset(); updateFields(); await state.refreshPositions();
    } catch (exception) { error.textContent = exception.message || "Non è stato possibile salvare la posizione."; submit.disabled = false; }
  });
  return form;
}
function movementsView(state, render) {
  const month = state.selectedMonth; const summary = calculateMonthlySummary(state.movements, month);
  const fragment = document.createDocumentFragment();
  fragment.append(element("h1", "page-title", "Movimenti mensili"), monthSelector(state, render), element("p", "subtitle", "Totali registrati del mese selezionato."));
  const totals = element("section", "movement-totals section-card");
  totals.append(metricCard("Entrate", hidden(state, formatEuro(summary.incomeCents)), ""), metricCard("Uscite", hidden(state, formatEuro(summary.expenseCents)), ""), metricCard("Bilancio", hidden(state, formatEuro(summary.balanceCents)), ""));
  const add = button("Nuovo movimento", "Nuovo movimento", "primary-button"); add.addEventListener("click", () => { state.addingMovement = true; render(); });
  fragment.append(totals, add);
  const list = element("section", "position-list"); list.append(element("h2", "setting-title", "Registrati questo mese"));
  if (!summary.movements.length) list.append(element("p", "empty-copy", "Nessun movimento registrato."));
  for (const movement of [...summary.movements].sort((left, right) => right.date.localeCompare(left.date))) {
    const row = element("article", "position-row"); const copy = element("div"); const category = state.categories.find((item) => item.id === movement.categoryId);
    copy.append(element("strong", "position-name", category?.name ?? "Categoria archiviata"), element("p", "metric-detail", movement.date));
    const actions = element("div", "position-actions");
    const edit = button("✎", `Modifica movimento ${category?.name ?? ""}`, "action-button"); edit.addEventListener("click", () => { state.editingMovementId = movement.id; render(); });
    const remove = button("⌫", `Cancella movimento ${category?.name ?? ""}`, "action-button danger-button"); remove.addEventListener("click", async () => { if (!window.confirm("Cancellare definitivamente questo movimento?")) return; await state.database.delete(STORE.movements, movement.id); if (state.editingMovementId === movement.id) state.editingMovementId = null; await state.refreshPositions(); });
    actions.append(element("strong", `position-value ${movement.kind === "expense" ? "negative" : "positive"}`, `${movement.kind === "expense" ? "−" : "+"}${hidden(state, formatEuro(movement.amountCents))}`), edit, remove); row.append(copy, actions); list.append(row);
    if (state.editingMovementId === movement.id) list.append(movementForm(state, render, movement));
  }
  fragment.append(list); if (state.addingMovement) fragment.append(modal("Nuovo movimento", movementForm(state, render, null), () => { state.addingMovement = false; render(); })); return fragment;
}

function monthSelector(state, render) {
  const selector = element("div", "month-selector"); const previous = button("‹", "Mese precedente", "icon-button"); const next = button("›", "Mese successivo", "icon-button"); const label = element("strong", "month-label", formatMonth(state.selectedMonth));
  previous.addEventListener("click", () => { state.selectedMonth = shiftMonth(state.selectedMonth, -1); render(); }); next.addEventListener("click", () => { state.selectedMonth = shiftMonth(state.selectedMonth, 1); render(); }); selector.append(previous, label, next); return selector;
}

function movementForm(state, render, editing = null) {
  const form = element("form", "position-form"); form.append(element("h2", "setting-title", editing ? "Modifica movimento" : "Nuovo movimento"));
  const kind = selectField("Tipo", "kind", [["expense", "Uscita"], ["income", "Entrata"]]); const expenseType = selectField("Tipologia di spesa", "expenseType", [["fixed", "Fissa"], ["variable", "Variabile"], ["extraordinary", "Straordinaria"]]); const category = selectField("Categoria", "category", []);
  const amount = inputField("Importo (€)", "amount", "text", "0,00"); amount.input.inputMode = "decimal"; const date = inputField("Data", "date", "date", ""); date.input.value = todayCivilDate(); const description = inputField("Descrizione (facoltativa)", "description", "text", ""); description.input.required = false;
  const error = element("p", "form-error"); error.setAttribute("role", "alert"); const submit = button(editing ? "Salva modifiche" : "Salva movimento", editing ? "Salva modifiche" : "Salva movimento", "primary-button"); submit.type = "submit";
  const updateCategories = () => { const isExpense = kind.input.value === "expense"; expenseType.wrapper.hidden = !isExpense; expenseType.input.required = isExpense; category.input.replaceChildren(); const available = state.categories.filter((item) => !item.archived && item.kind === kind.input.value && (!isExpense || item.expenseType === expenseType.input.value)); for (const item of available) { const option = document.createElement("option"); option.value = item.id; option.textContent = item.name; category.input.append(option); } };
  kind.input.addEventListener("change", updateCategories); expenseType.input.addEventListener("change", updateCategories);
  if (editing) { kind.input.value = editing.kind; expenseType.input.value = editing.expenseType ?? "fixed"; amount.input.value = String(editing.amountCents / 100).replace(".", ","); date.input.value = editing.date; description.input.value = editing.description ?? ""; }
  updateCategories(); if (editing) category.input.value = editing.categoryId;
  const formActions = element("div", "form-actions"); if (editing) { const cancel = button("Annulla", "Annulla modifica", "secondary-button"); cancel.addEventListener("click", () => { state.editingMovementId = null; render(); }); formActions.append(cancel); } formActions.append(submit); form.append(kind.wrapper, expenseType.wrapper, category.wrapper, amount.wrapper, date.wrapper, description.wrapper, error, formActions);
  form.addEventListener("submit", async (event) => { event.preventDefault(); error.textContent = ""; submit.disabled = true; try { const now = new Date().toISOString(); const movement = { id: editing?.id ?? createId(), kind: kind.input.value, amountCents: parseEuroToCents(amount.input.value), categoryId: category.input.value, date: date.input.value, description: description.input.value.trim() || undefined, createdAt: editing?.createdAt ?? now, updatedAt: now }; if (movement.kind === "expense") movement.expenseType = expenseType.input.value; assertMovement(movement); await state.database.put(STORE.movements, movement); state.editingMovementId = null; state.addingMovement = false; form.reset(); date.input.value = todayCivilDate(); updateCategories(); await state.refreshPositions(); } catch (exception) { error.textContent = exception.message || "Non è stato possibile salvare il movimento."; submit.disabled = false; } });
  return form;
}
function analysisView() { return pendingView("Analisi", "I grafici appariranno qui quando saranno disponibili rilevazioni patrimoniali o movimenti registrati.", "Nessun grafico o andamento viene inventato in assenza di dati."); }

function pendingView(title, copy, note) {
  const state = element("section", "empty-state");
  const mark = element("div", "app-mark"); mark.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 3; index += 1) mark.append(element("i"));
  state.append(mark, element("h1", "page-title", title), element("p", "empty-copy", copy), element("p", "feature-note", note));
  return state;
}

function settingsView(state, render) {
  const section = element("section", "settings-list");
  section.append(element("h1", "page-title", "Impostazioni"), element("p", "subtitle", "Configurazione locale di Capitale."));
  for (const [title, description, availability] of [["Categorie", "Personalizza le sottocategorie dei movimenti.", "Milestone Movimenti"], ["Privacy e PIN", "Oscuramento importi e blocco locale facoltativo.", "Milestone Backup e sicurezza"], ["Backup e ripristino", "Esporta e recupera i dati dal dispositivo.", "Milestone Backup e sicurezza"]]) {
    const row = element("article", "setting-row"); const copy = element("div");
    copy.append(element("h2", "setting-title", title), element("p", "setting-description", description));
    row.append(copy, element("span", "availability", availability)); section.append(row);
  }
  const backup = button("Backup e ripristino", "Apri backup e ripristino", "primary-button"); backup.addEventListener("click", () => { state.backupPanel = true; render(); }); section.append(backup);
  if (state.backupPanel) section.append(modal("Backup e ripristino", backupPanel(state), () => { state.backupPanel = false; render(); }));
  return section;
}

function backupPanel(state) {
  const panel = element("section", "backup-panel"); const standard = button("Scarica backup JSON", "Scarica backup JSON", "primary-button"); const password = inputField("Password per backup cifrato", "backup-password", "password", "Almeno 8 caratteri"); const encrypted = button("Scarica backup cifrato", "Scarica backup cifrato", "secondary-button"); const status = element("p", "form-error");
  standard.addEventListener("click", async () => { try { downloadJson(await createBackup(state.database), "Capitale_backup.json"); status.textContent = "Backup JSON preparato per il download."; } catch (error) { status.textContent = error.message; } });
  encrypted.addEventListener("click", async () => { try { encrypted.disabled = true; downloadJson(await encryptBackup(await createBackup(state.database), password.input.value), "Capitale_backup.encrypted.json"); status.textContent = "Backup cifrato preparato per il download."; } catch (error) { status.textContent = error.message; } finally { encrypted.disabled = false; } });
  panel.append(element("p", "empty-copy", "Il backup standard contiene dati finanziari leggibili. Quello cifrato richiede la password per il ripristino."), standard, password.wrapper, encrypted, status); return panel;
}

function createNavigation(state, render) {
  const nav = element("nav", "bottom-nav"); nav.setAttribute("aria-label", "Navigazione principale");
  for (const [id, icon, label] of NAV_ITEMS) {
    const item = button("", label, `nav-item${state.current === id ? " is-active" : ""}`);
    item.setAttribute("aria-current", state.current === id ? "page" : "false"); item.append(element("span", "nav-icon", icon), element("span", "nav-label", label));
    item.addEventListener("click", () => { state.current = id; render(); }); nav.append(item);
  }
  return nav;
}

function metricCard(label, value, detail) { const card = element("article", "metric-card"); card.append(element("p", "card-label", label), element("strong", "metric-value", value)); if (detail) card.append(element("p", "metric-detail", detail)); return card; }
function inputField(label, name, type, placeholder) { const wrapper = element("label", "form-field"); wrapper.append(element("span", "field-label", label)); const input = element("input", "field-input"); input.name = name; input.type = type; input.placeholder = placeholder; input.required = true; wrapper.append(input); return { wrapper, input }; }
function selectField(label, name, options) { const wrapper = element("label", "form-field"); wrapper.append(element("span", "field-label", label)); const input = element("select", "field-input"); input.name = name; for (const [value, text] of options) { const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option); } wrapper.append(input); return { wrapper, input }; }
function positionTypeLabel(type) { return { checking: "Conto corrente", deposit: "Conto deposito", etf: "ETF", bond: "Obbligazione", cash: "Contanti" }[type] ?? type; }
function shiftMonth(month, offset) { const [year, monthNumber] = month.split("-").map(Number); const date = new Date(year, monthNumber - 1 + offset, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function formatMonth(month) { const [year, monthNumber] = month.split("-").map(Number); return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1)); }
function modal(title, content, close) { const overlay = element("section", "modal-overlay"); overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", title); const panel = element("div", "modal-panel"); const header = element("div", "modal-header"); const closeButton = button("×", "Chiudi", "icon-button"); closeButton.addEventListener("click", close); header.append(element("h2", "setting-title", title), closeButton); panel.append(header, content); overlay.append(panel); return overlay; }
function downloadJson(data, filename) { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function createId() { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function hidden(state, value) { return state.amountsHidden && /[€—\d]/.test(value) ? "••••••" : value; }
function screenTitle(id) { return NAV_ITEMS.find(([key]) => key === id)?.[2] ?? "Capitale"; }
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
function button(text, label, className) { const node = element("button", className, text); node.type = "button"; node.setAttribute("aria-label", label); return node; }

export function renderFatalError(root, error) { root.replaceChildren(); const panel = element("section", "error-panel"); panel.append(element("h1", "page-title", "Archivio locale non disponibile"), element("p", "", error.message || "Riprova dopo aver verificato le impostazioni del browser.")); root.append(panel); }
