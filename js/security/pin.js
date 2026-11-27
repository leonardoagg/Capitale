const ITERATIONS = 210000;
const encoder = new TextEncoder();

export async function createPinRecord(pin) {
  assertPin(pin); const salt = crypto.getRandomValues(new Uint8Array(16)); const verifier = await derive(pin, salt);
  return { key: "pin", version: 1, algorithm: "PBKDF2-SHA-256", iterations: ITERATIONS, salt: base64(salt), verifier: base64(verifier) };
}

export async function verifyPin(pin, record) {
  if (!record || record.key !== "pin" || record.version !== 1 || record.iterations !== ITERATIONS) return false;
  try { const actual = new Uint8Array(await derive(pin, bytes(record.salt))); const expected = bytes(record.verifier); if (actual.length !== expected.length) return false; let difference = 0; for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index]; return difference === 0; } catch { return false; }
}

async function derive(pin, salt) { assertPin(pin); const material = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]); return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, material, 256); }
function assertPin(pin) { if (!/^\d{4,8}$/.test(pin)) throw new TypeError("Il PIN deve contenere da 4 a 8 cifre."); }
function base64(value) { let text = ""; for (const item of new Uint8Array(value)) text += String.fromCharCode(item); return btoa(text); }
function bytes(value) { return Uint8Array.from(atob(value), (item) => item.charCodeAt(0)); }
