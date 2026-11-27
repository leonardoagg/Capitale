export function renderShell(root, { databaseReady }) {
  root.replaceChildren();
  const screen = document.createElement("section");
  screen.className = "empty-home";
  const mark = document.createElement("div");
  mark.className = "app-mark";
  mark.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 3; index += 1) mark.append(document.createElement("i"));
  const title = document.createElement("h1");
  title.textContent = "Capitale";
  const message = document.createElement("p");
  message.textContent = databaseReady
    ? "Il tuo spazio finanziario è pronto. Non sono presenti dati di esempio."
    : "Non è possibile inizializzare l’archivio locale su questo dispositivo.";
  screen.append(mark, title, message);
  root.append(screen);
}

export function renderFatalError(root, error) {
  root.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "error-panel";
  const title = document.createElement("h1");
  title.textContent = "Archivio locale non disponibile";
  const text = document.createElement("p");
  text.textContent = error.message || "Riprova dopo aver verificato le impostazioni del browser.";
  panel.append(title, text);
  root.append(panel);
}
