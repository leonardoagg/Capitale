import { CapitaleDatabase } from "./db/database.js";
import { renderFatalError, renderShell } from "./ui/shell.js";

const root = document.querySelector("#app");

try {
  const database = await CapitaleDatabase.open();
  renderShell(root, { databaseReady: true });
  window.addEventListener("pagehide", () => database.close(), { once: true });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
} catch (error) {
  renderFatalError(root, error);
}
