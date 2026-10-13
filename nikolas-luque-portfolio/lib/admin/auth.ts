import "server-only";
import { pbkdf2 as pbkdf2Callback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const pbkdf2 = promisify(pbkdf2Callback);
const COOKIE_NAME = "nikolas_admin_session";

function sessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET");
  }

  const key = Buffer.from(secret, "base64");

  if (key.length !== 32) {
    throw new Error("La clave de sesión debe tener 32 bytes");
  }

  return key;
}

export async function verifyAdminPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH;

  if (!stored) {
    throw new Error("Falta ADMIN_PASSWORD_HASH");
  }

  const parts = stored.split(":");

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
    throw new Error("Hash de administrador inválido");
  }

  const iterations = Number(parts[1]);
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");

  if (
    iterations !== 600000 ||
    salt.length !== 16 ||
    expected.length !== 32
  ) {
    throw new Error("Configuración de contraseña inválida");
  }

  const actual = await pbkdf2(
    password,
    salt,
    iterations,
    expected.length,
    "sha256"
  );

  return timingSafeEqual(actual, expected);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionKey());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
    });

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
