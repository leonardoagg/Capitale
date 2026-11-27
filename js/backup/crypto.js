import { validateBackup } from "./backup.js";

const ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptBackup(backup, password) {
  validateBackup(backup); assertPassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = encoder.encode(JSON.stringify(backup));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { format: "capitale-encrypted-backup", formatVersion: 1, algorithm: "AES-256-GCM", kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: encode(salt) }, iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) };
}

export async function decryptBackup(envelope, password) {
  assertPassword(password);
  if (!envelope || envelope.format !== "capitale-encrypted-backup" || envelope.formatVersion !== 1 || envelope.algorithm !== "AES-256-GCM" || envelope.kdf?.name !== "PBKDF2" || envelope.kdf?.hash !== "SHA-256" || envelope.kdf?.iterations !== ITERATIONS) throw new TypeError("Backup cifrato non supportato.");
  try {
    const key = await deriveKey(password, decode(envelope.kdf.salt));
    const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(envelope.iv) }, key, decode(envelope.ciphertext));
    const backup = JSON.parse(decoder.decode(bytes));
    return validateBackup(backup);
  } catch (error) { if (error instanceof TypeError) throw error; throw new Error("Password errata o backup cifrato alterato."); }
}

async function deriveKey(password, salt) { const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
function assertPassword(password) { if (typeof password !== "string" || password.length < 8) throw new TypeError("La password deve contenere almeno 8 caratteri."); }
function encode(bytes) { let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
function decode(value) { if (typeof value !== "string") throw new TypeError("Backup cifrato non valido."); const binary = atob(value); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); }
