import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "presta_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "dev.andresgr@gmail.com";
}

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

function sign(payload: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAdminCredentials(email: string, password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return false;
  return safeEqual(email.trim().toLowerCase(), getAdminEmail()) && safeEqual(password, configuredPassword);
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(`admin:${expiresAt}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isAdminSessionValid(token?: string) {
  if (!token || !process.env.AUTH_SECRET) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [role, expiresAt] = decoded.split(":");
    return role === "admin" && Number(expiresAt) > Date.now();
  } catch {
    return false;
  }
}
