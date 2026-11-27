const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isCivilDate(value) {
  if (typeof value !== "string" || !CIVIL_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function todayCivilDate(now = new Date()) {
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

export function formatCivilDate(value) {
  if (!isCivilDate(value)) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(year, month - 1, day));
}
