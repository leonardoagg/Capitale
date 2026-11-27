const NAV_ITEMS = [["home", "⌂", "Home"], ["wealth", "◫", "Patrimonio"], ["movements", "⇅", "Movimenti"], ["analysis", "◔", "Analisi"]];

export function renderShell(root, { databaseReady }) {
  if (!databaseReady) return renderFatalError(root, new Error("Non è possibile inizializzare l’archivio locale su questo dispositivo."));
  const state = { current: "home", amountsHidden: false };
  const render = () => root.replaceChildren(createApp(state, render));
  render();
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
  const views = { home: () => homeView(state, render), wealth: wealthView, movements: movementsView, analysis: analysisView, settings: settingsView };
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

function wealthView() { return pendingView("Patrimonio", "Aggiungi conti, depositi, investimenti o contanti per visualizzare qui la distribuzione del patrimonio.", "La gestione delle posizioni sarà disponibile con la milestone Patrimonio."); }
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
function hidden(state, value) { return state.amountsHidden && /[€—\d]/.test(value) ? "••••••" : value; }
function screenTitle(id) { return NAV_ITEMS.find(([key]) => key === id)?.[2] ?? "Capitale"; }
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
function button(text, label, className) { const node = element("button", className, text); node.type = "button"; node.setAttribute("aria-label", label); return node; }

export function renderFatalError(root, error) { root.replaceChildren(); const panel = element("section", "error-panel"); panel.append(element("h1", "page-title", "Archivio locale non disponibile"), element("p", "", error.message || "Riprova dopo aver verificato le impostazioni del browser.")); root.append(panel); }
