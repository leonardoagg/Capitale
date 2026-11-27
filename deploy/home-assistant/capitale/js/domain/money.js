const ITALIAN_AMOUNT = /^-?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/;

export function parseEuroToCents(value, { allowNegative = false } = {}) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim().replace(/\s/g, "");
  if (!ITALIAN_AMOUNT.test(raw)) return null;
  const negative = raw.startsWith("-");
  if (negative && !allowNegative) return null;
  const [whole, fraction = ""] = (negative ? raw.slice(1) : raw).split(",");
  const euro = Number(whole.replace(/\./g, ""));
  const cents = Number((fraction + "00").slice(0, 2));
  const result = euro * 100 + cents;
  if (!Number.isSafeInteger(result)) return null;
  return negative ? -result : result;
}

export function formatEuro(cents, { signDisplay = "auto" } = {}) {
  if (!Number.isSafeInteger(cents)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    signDisplay,
    useGrouping: "always",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

export function sumCents(values) {
  const total = values.reduce((sum, value) => {
    if (!Number.isSafeInteger(value) || !Number.isSafeInteger(sum + value)) {
      throw new TypeError("Importo non valido o fuori intervallo sicuro");
    }
    return sum + value;
  }, 0);
  return total;
}
