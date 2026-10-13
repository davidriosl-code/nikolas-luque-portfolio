import "server-only";

import { createHmac } from "node:crypto";
import { db } from "@/lib/admin/db";

const MAX_INTENTOS = 5;
const VENTANA_MINUTOS = 15;

function hashIdentificador(identifier: string): string {
  const secreto = process.env.ADMIN_SESSION_SECRET;

  if (!secreto) {
    throw new Error("ADMIN_SESSION_SECRET no configurado");
  }

  return createHmac("sha256", secreto)
    .update(identifier)
    .digest("hex");
}

export async function verificarLimiteLogin(identifier: string) {
  const hash = hashIdentificador(identifier);

  const resultado = await db.query(
    `SELECT COUNT(*)::int AS intentos
     FROM public.admin_login_attempts
     WHERE identifier_hash = $1
       AND attempted_at > NOW() - INTERVAL '15 minutes'`,
    [hash]
  );

  const intentos = resultado.rows[0].intentos as number;

  return {
    permitido: intentos < MAX_INTENTOS,
    intentosRestantes: Math.max(0, MAX_INTENTOS - intentos),
  };
}

export async function registrarIntentoFallido(identifier: string) {
  const hash = hashIdentificador(identifier);

  await db.query(
    `INSERT INTO public.admin_login_attempts (identifier_hash)
     VALUES ($1)`,
    [hash]
  );
}

export async function limpiarIntentosLogin(identifier: string) {
  const hash = hashIdentificador(identifier);

  await db.query(
    `DELETE FROM public.admin_login_attempts
     WHERE identifier_hash = $1`,
    [hash]
  );
}
