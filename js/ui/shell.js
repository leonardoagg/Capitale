import { STORE } from "../db/schema.js";
import { formatCivilDate, todayCivilDate } from "../domain/date.js";
import { formatEuro, parseEuroToCents } from "../domain/money.js";
import { assertPosition } from "../domain/validation.js";
import { assertMovement } from "../domain/validation.js";
import { calculateWealthHistory, calculateWealthSummary } from "../domain/wealth.js";
import { calculateMonthlySummary } from "../domain/movements.js";
import { createBackup, restoreBackup, validateBackup } from "../backup/backup.js";
import { decryptBackup, encryptBackup } from "../backup/crypto.js";
import { movementsCsv, positionsCsv } from "../backup/csv.js";
import { createPinRecord, verifyPin } from "../security/pin.js";

const NAV_ITEMS = [["home", "⌂", "Home"], ["wealth", "◫", "Patrimonio"], ["movements", "⇅", "Movimenti"], ["analysis", "◔", "Analisi"]];

export function renderShell(root, { database }) {
  if (!database) return renderFatalError(root, new Error("Non è possibile inizializzare l’archivio locale su questo dispositivo."));
  const state = { current: "home", amountsHidden: false, positions: [], snapshots: [], snapshotItems: [], movements: [], categories: [], settings: [], editingPositionId: null, editingMovementId: null, addingPosition: false, addingMovement: false, backupPanel: false, pendingRestore: null, pinPanel: false, pinRecord: null, locked: false, ready: false, selectedMonth: todayCivilDate().slice(0, 7), database };
  const render = () => root.replaceChildren(createApp(state, render));
  state.refreshPositions = async () => { [state.positions, state.snapshots, state.snapshotItems, state.movements, state.categories, state.settings] = await Promise.all([database.getAll(STORE.positions), database.getAll(STORE.snapshots), database.getAll(STORE.snapshotItems), database.getAll(STORE.movements), database.getAll(STORE.categories), database.getAll(STORE.settings)]); render(); };
  state.initialize = async () => { state.pinRecord = await database.get(STORE.security, "pin"); state.locked = Boolean(state.pinRecord); state.ready = true; await state.refreshPositions(); };
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.pinRecord) { state.locked = true; render(); } });
  render(); state.initialize().catch((error) => renderFatalError(root, error));
}

function createApp(state, render) {
  if (!state.ready) return pendingView("Capitale", "Verifica dell’archivio locale in corso.", "");
  if (state.locked) return lockView(state, render);
  const app = element("div", "app");
  app.append(createHeader(state, render), createContent(state, render), createNavigation(state, render));
  return app;
}

function lockView(state, render) { const section = element("section", "empty-state"); const form = element("form", "position-form"); const pin = inputField("PIN", "unlock-pin", "password", "Inserisci il PIN"); pin.input.inputMode = "numeric"; const error = element("p", "form-error"); const submit = button("Sblocca", "Sblocca Capitale", "primary-button"); submit.type = "submit"; form.append(element("h1", "page-title", "Capitale bloccata"), element("p", "empty-copy", "Inserisci il PIN locale per continuare."), pin.wrapper, error, submit); form.addEventListener("submit", async (event) => { event.preventDefault(); if (await verifyPin(pin.input.value, state.pinRecord)) { state.locked = false; render(); } else error.textContent = "PIN non corretto."; }); section.append(form); return section; }

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
  const views = { home: () => homeView(state, render), wealth: () => wealthView(state, render), movements: () => movementsView(state, render), analysis: () => analysisView(state), settings: () => settingsView(state, render) };
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
  const backup = state.settings.find((item) => item.key === "backup.lastExportPreparedAt")?.value;
  if (!backup || Date.now() - Date.parse(backup) >= 30 * 24 * 60 * 60 * 1000) fragment.append(element("p", "backup-warning", backup ? "È consigliato creare un nuovo backup." : "Nessun backup esportato: proteggi i tuoi dati con un backup."));
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
function analysisView(state) { const section = element("section", "settings-list"); const history = calculateWealthHistory(state.snapshots, state.snapshotItems); section.append(element("h1", "page-title", "Analisi"), element("p", "subtitle", "Andamento basato sulle fotografie disponibili.")); if (!history.length) { section.append(element("p", "empty-copy", "Nessuna fotografia patrimoniale disponibile.")); return section; } const card = element("section", "chart-card"); card.append(element("h2", "setting-title", "Andamento patrimonio")); const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 480 210"); const values = history.map((item) => item.totalCents); const min = Math.min(...values), max = Math.max(...values), pad = Math.max((max-min)*.1,100), low=min-pad, high=max+pad, span=high-low; const x=(i)=>132+i*320/Math.max(1,history.length-1), y=(v)=>165-(v-low)*125/span; for(const v of [low,(low+high)/2,high]) { const grid=document.createElementNS("http://www.w3.org/2000/svg","line"); grid.setAttribute("x1","132");grid.setAttribute("x2","452");grid.setAttribute("y1",y(v));grid.setAttribute("y2",y(v));grid.setAttribute("class","chart-grid");svg.append(grid); const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x","122");t.setAttribute("y",y(v)+4);t.setAttribute("text-anchor","end");t.setAttribute("class","chart-label");t.textContent=state.amountsHidden?"••••":formatEuro(Math.round(v));svg.append(t); } const line=document.createElementNS("http://www.w3.org/2000/svg","polyline");line.setAttribute("points",history.map((p,i)=>`${x(i)},${y(p.totalCents)}`).join(" "));line.setAttribute("fill","none");line.setAttribute("stroke","#69D6A5");line.setAttribute("stroke-width","4");svg.append(line); for(const [i,p] of history.entries()) { const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");dot.setAttribute("cx",x(i));dot.setAttribute("cy",y(p.totalCents));dot.setAttribute("r","4");dot.setAttribute("class","chart-dot");svg.append(dot); if(i===0||i===history.length-1){const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",x(i));t.setAttribute("y","190");t.setAttribute("text-anchor",i===0?"start":"end");t.setAttribute("class","chart-label");t.textContent=formatCivilDate(p.effectiveDate);svg.append(t);} } card.append(svg,element("p","metric-detail",state.amountsHidden?"Importi nascosti":`Da ${formatEuro(history[0].totalCents)} a ${formatEuro(history.at(-1).totalCents)}`));section.append(card);return section; }

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
  const privacy = button(state.pinRecord ? "Gestisci PIN" : "Attiva PIN", state.pinRecord ? "Gestisci PIN" : "Attiva PIN", "secondary-button"); privacy.addEventListener("click", () => { state.pinPanel = true; render(); }); section.append(privacy);
  const erase = button("Cancella tutti i dati", "Cancella tutti i dati", "delete-button"); erase.addEventListener("click", async () => { if (!window.confirm("Sicuro di voler cancellare tutti i dati locali? L’azione non è reversibile.")) return; await state.database.clearAllData(); state.pinRecord = null; state.locked = false; await state.refreshPositions(); }); section.append(erase);
  if (state.backupPanel) section.append(modal("Backup e ripristino", backupPanel(state, render), () => { state.backupPanel = false; state.pendingRestore = null; render(); }));
  if (state.pinPanel) section.append(modal("Privacy e PIN", pinPanel(state, render), () => { state.pinPanel = false; render(); }));
  return section;
}

function pinPanel(state, render) { const panel = element("section", "backup-panel"); panel.append(element("p", "empty-copy", "Il PIN blocca l’interfaccia, ma non cifra il database locale né i backup.")); if (state.pinRecord) { const disable = button("Disattiva PIN", "Disattiva PIN", "delete-button"); disable.addEventListener("click", async () => { if (!window.confirm("Disattivare il PIN?")) return; await state.database.delete(STORE.security, "pin"); state.pinRecord = null; state.pinPanel = false; render(); }); panel.append(disable); return panel; } const pin = inputField("Nuovo PIN", "new-pin", "password", "4–8 cifre"); pin.input.inputMode = "numeric"; const confirm = inputField("Conferma PIN", "confirm-pin", "password", "Ripeti il PIN"); confirm.input.inputMode = "numeric"; const error = element("p", "form-error"); const save = button("Attiva PIN", "Attiva PIN", "primary-button"); save.addEventListener("click", async () => { try { if (pin.input.value !== confirm.input.value) throw new Error("I PIN non coincidono."); state.pinRecord = await createPinRecord(pin.input.value); await state.database.put(STORE.security, state.pinRecord); state.pinPanel = false; render(); } catch (exception) { error.textContent = exception.message; } }); panel.append(pin.wrapper, confirm.wrapper, error, save); return panel; }

function backupPanel(state, render) {
  const panel = element("section", "backup-panel"); const standard = button("Scarica backup JSON", "Scarica backup JSON", "primary-button"); const password = inputField("Password per backup cifrato o ripristino", "backup-password", "password", "Almeno 8 caratteri se cifrato"); password.input.required = false; const encrypted = button("Scarica backup cifrato", "Scarica backup cifrato", "secondary-button"); const csvMovements = button("Esporta movimenti CSV", "Esporta movimenti CSV", "secondary-button"); const csvPositions = button("Esporta patrimonio CSV", "Esporta patrimonio CSV", "secondary-button"); const file = inputField("File di backup", "backup-file", "file", ""); file.input.accept = ".json,application/json"; const load = button("Verifica file per ripristino", "Verifica file per ripristino", "secondary-button"); const status = element("p", "form-error");
  standard.addEventListener("click", async () => { try { downloadJson(await createBackup(state.database), "Capitale_backup.json"); await markBackupPrepared(state); status.textContent = "Backup JSON preparato per il download."; } catch (error) { status.textContent = error.message; } });
  encrypted.addEventListener("click", async () => { try { encrypted.disabled = true; downloadJson(await encryptBackup(await createBackup(state.database), password.input.value), "Capitale_backup.encrypted.json"); await markBackupPrepared(state); status.textContent = "Backup cifrato preparato per il download."; } catch (error) { status.textContent = error.message; } finally { encrypted.disabled = false; } });
  csvMovements.addEventListener("click", () => downloadText(movementsCsv(state.movements, state.categories), "Capitale_movimenti.csv", "text/csv;charset=utf-8")); csvPositions.addEventListener("click", () => downloadText(positionsCsv(state.positions), "Capitale_patrimonio.csv", "text/csv;charset=utf-8"));
  load.addEventListener("click", async () => { try { const selected = file.input.files?.[0]; if (!selected) throw new Error("Seleziona prima un file di backup."); const parsed = JSON.parse(await selected.text()); state.pendingRestore = parsed.format === "capitale-encrypted-backup" ? await decryptBackup(parsed, password.input.value) : validateBackup(parsed); render(); } catch (error) { status.textContent = error.message || "File di backup non valido."; } });
  panel.append(element("p", "empty-copy", "Il backup standard contiene dati finanziari leggibili. Quello cifrato richiede la password per il ripristino."), standard, password.wrapper, encrypted, csvMovements, csvPositions, file.wrapper, load);
  if (state.pendingRestore) { const counts = Object.entries(state.pendingRestore.data).map(([store, records]) => `${store}: ${records.length}`).join(" · "); const restore = button("Conferma ripristino completo", "Conferma ripristino completo", "delete-button"); restore.addEventListener("click", async () => { if (!window.confirm("Sicuro di voler sostituire tutti i dati locali con questo backup?")) return; await restoreBackup(state.database, state.pendingRestore); state.pendingRestore = null; state.backupPanel = false; await state.refreshPositions(); }); panel.append(element("p", "feature-note", `Backup verificato — ${counts}`), restore); }
  panel.append(status); return panel;
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
function downloadText(data, filename, type) { const url = URL.createObjectURL(new Blob([data], { type })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
async function markBackupPrepared(state) { const value = new Date().toISOString(); await state.database.put(STORE.settings, { key: "backup.lastExportPreparedAt", value }); state.settings = [...state.settings.filter((item) => item.key !== "backup.lastExportPreparedAt"), { key: "backup.lastExportPreparedAt", value }]; }
function createId() { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function hidden(state, value) { return state.amountsHidden && /[€—\d]/.test(value) ? "••••••" : value; }
function screenTitle(id) { return NAV_ITEMS.find(([key]) => key === id)?.[2] ?? "Capitale"; }
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
function button(text, label, className) { const node = element("button", className, text); node.type = "button"; node.setAttribute("aria-label", label); return node; }

export function renderFatalError(root, error) { root.replaceChildren(); const panel = element("section", "error-panel"); panel.append(element("h1", "page-title", "Archivio locale non disponibile"), element("p", "", error.message || "Riprova dopo aver verificato le impostazioni del browser.")); root.append(panel); }
