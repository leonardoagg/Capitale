import { STORE } from "../db/schema.js";
import { todayCivilDate } from "../domain/date.js";
import { formatEuro, parseEuroToCents } from "../domain/money.js";
import { assertPosition } from "../domain/validation.js";
import { calculateWealthSummary } from "../domain/wealth.js";

const NAV_ITEMS = [["home", "⌂", "Home"], ["wealth", "◫", "Patrimonio"], ["movements", "⇅", "Movimenti"], ["analysis", "◔", "Analisi"]];

export function renderShell(root, { database }) {
  if (!database) return renderFatalError(root, new Error("Non è possibile inizializzare l’archivio locale su questo dispositivo."));
  const state = { current: "home", amountsHidden: false, positions: [], database };
  const render = () => root.replaceChildren(createApp(state, render));
  state.refreshPositions = async () => { state.positions = await database.getAll(STORE.positions); render(); };
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
  const views = { home: () => homeView(state, render), wealth: () => wealthView(state, render), movements: movementsView, analysis: analysisView, settings: settingsView };
  main.append(views[state.current]());
  return main;
}

function homeView(state, render) {
  const fragment = document.createDocumentFragment();
  const intro = element("section", "intro");
  intro.append(element("h1", "page-title", "Panoramica"), element("p", "subtitle", "Il tuo spazio finanziario, senza dati dimostrativi."));
  const wealth = element("section", "hero-card");
  wealth.append(element("p", "card-label", "Patrimonio totale"), element("strong", "hero-value", hidden(state, "Non ancora rilevato")), element("p", "hint", "Aggiungi una posizione per iniziare a tracciare il patrimonio."));
  const quick = element("div", "two-column");
  quick.append(metricCard("Liquidità", hidden(state, "—"), "Nessuna posizione"), metricCard("Investimenti", hidden(state, "—"), "Nessuna posizione"));
  const month = element("section", "section-card");
  month.append(element("div", "section-title", "Movimenti del mese"), element("p", "registered-label", "Totali registrati"));
  const totals = element("div", "movement-totals");
  totals.append(metricCard("Entrate", hidden(state, "0,00 €"), ""), metricCard("Uscite", hidden(state, "0,00 €"), ""), metricCard("Bilancio", hidden(state, "0,00 €"), ""));
  month.append(totals, element("p", "empty-copy", "Nessun movimento registrato."));
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
  fragment.append(card, positionList(state), positionForm(state, render));
  return fragment;
}

function positionList(state) {
  const list = element("section", "position-list");
  const active = state.positions.filter((position) => position.status !== "archived");
  if (!active.length) { list.append(element("p", "empty-copy", "Nessuna posizione registrata.")); return list; }
  for (const position of active) {
    const row = element("article", "position-row"); const copy = element("div");
    copy.append(element("strong", "position-name", position.name), element("p", "metric-detail", positionTypeLabel(position.type)));
    row.append(copy, element("strong", "position-value", hidden(state, formatEuro(position.currentValueCents)))); list.append(row);
  }
  return list;
}

function positionForm(state, render) {
  const form = element("form", "position-form");
  form.append(element("h2", "setting-title", "Aggiungi posizione"));
  const type = selectField("Tipo", "type", [["checking", "Conto corrente"], ["deposit", "Conto deposito"], ["etf", "ETF"], ["bond", "Obbligazione"], ["cash", "Contanti"]]);
  const name = inputField("Nome", "name", "text", "es. Conto principale");
  const value = inputField("Valore attuale (€)", "value", "text", "0,00"); value.inputmode = "decimal";
  const capital = inputField("Capitale investito (€)", "capital", "text", "Solo ETF e obbligazioni"); capital.inputmode = "decimal";
  const deposit = selectField("Deposito", "depositType", [["free", "Libero"], ["locked", "Vincolato"]]);
  const error = element("p", "form-error"); error.setAttribute("role", "alert");
  const submit = button("Salva e crea fotografia", "Salva posizione e fotografia patrimoniale", "primary-button");
  submit.type = "submit";
  form.append(type.wrapper, name.wrapper, value.wrapper, capital.wrapper, deposit.wrapper, error, submit);
  const updateFields = () => { const investing = ["etf", "bond"].includes(type.input.value); capital.wrapper.hidden = !investing; capital.input.required = investing; deposit.wrapper.hidden = type.input.value !== "deposit"; };
  type.input.addEventListener("change", updateFields); updateFields();
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); error.textContent = ""; submit.disabled = true;
    try {
      const currentValueCents = parseEuroToCents(value.input.value, { allowNegative: true });
      const investing = ["etf", "bond"].includes(type.input.value);
      const investedCapitalCents = investing ? parseEuroToCents(capital.input.value) : undefined;
      const now = new Date().toISOString();
      const position = { id: createId(), type: type.input.value, name: name.input.value.trim(), status: "active", currentValueCents, createdAt: now, updatedAt: now, valuedOn: todayCivilDate() };
      if (type.input.value === "deposit") position.depositType = deposit.input.value;
      if (investing) position.investedCapitalCents = investedCapitalCents;
      assertPosition(position);
      const allActive = [...state.positions.filter((item) => item.status !== "archived"), position];
      const snapshotId = createId();
      await state.database.saveWealthSnapshot({ positions: [position], snapshot: { id: snapshotId, effectiveDate: todayCivilDate(), createdAt: now }, snapshotItems: allActive.map((item) => ({ id: createId(), snapshotId, positionId: item.id, type: item.type, name: item.name, valueCents: item.currentValueCents, investedCapitalCents: item.investedCapitalCents ?? null, depositType: item.depositType ?? null, valuedOn: item.valuedOn })) });
      form.reset(); updateFields(); await state.refreshPositions();
    } catch (exception) { error.textContent = exception.message || "Non è stato possibile salvare la posizione."; submit.disabled = false; }
  });
  return form;
}
function movementsView() { return pendingView("Movimenti mensili", "Nessun movimento registrato per questo mese.", "L’inserimento e la modifica dei movimenti saranno disponibili con la milestone Movimenti."); }
function analysisView() { return pendingView("Analisi", "I grafici appariranno qui quando saranno disponibili rilevazioni patrimoniali o movimenti registrati.", "Nessun grafico o andamento viene inventato in assenza di dati."); }

function pendingView(title, copy, note) {
  const state = element("section", "empty-state");
  const mark = element("div", "app-mark"); mark.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 3; index += 1) mark.append(element("i"));
  state.append(mark, element("h1", "page-title", title), element("p", "empty-copy", copy), element("p", "feature-note", note));
  return state;
}

function settingsView() {
  const section = element("section", "settings-list");
  section.append(element("h1", "page-title", "Impostazioni"), element("p", "subtitle", "Configurazione locale di Capitale."));
  for (const [title, description, availability] of [["Categorie", "Personalizza le sottocategorie dei movimenti.", "Milestone Movimenti"], ["Privacy e PIN", "Oscuramento importi e blocco locale facoltativo.", "Milestone Backup e sicurezza"], ["Backup e ripristino", "Esporta e recupera i dati dal dispositivo.", "Milestone Backup e sicurezza"]]) {
    const row = element("article", "setting-row"); const copy = element("div");
    copy.append(element("h2", "setting-title", title), element("p", "setting-description", description));
    row.append(copy, element("span", "availability", availability)); section.append(row);
  }
  return section;
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
function createId() { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function hidden(state, value) { return state.amountsHidden && /[€—\d]/.test(value) ? "••••••" : value; }
function screenTitle(id) { return NAV_ITEMS.find(([key]) => key === id)?.[2] ?? "Capitale"; }
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
function button(text, label, className) { const node = element("button", className, text); node.type = "button"; node.setAttribute("aria-label", label); return node; }

export function renderFatalError(root, error) { root.replaceChildren(); const panel = element("section", "error-panel"); panel.append(element("h1", "page-title", "Archivio locale non disponibile"), element("p", "", error.message || "Riprova dopo aver verificato le impostazioni del browser.")); root.append(panel); }
