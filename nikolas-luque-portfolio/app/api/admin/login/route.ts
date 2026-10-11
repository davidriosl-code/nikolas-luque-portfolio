import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import {
  verificarLimiteLogin,
  registrarIntentoFallido,
  limpiarIntentosLogin,
} from "@/lib/admin/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Comprobar que la solicitud procede del mismo origen.
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (!origin || !host) {
      return NextResponse.json(
        { ok: false, mensaje: "Origen no permitido" },
        { status: 403 }
      );
    }

    let origenValido = false;

    try {
      const url = new URL(origin);
      origenValido =
        url.host === host &&
        (url.protocol === "https:" ||
          (process.env.NODE_ENV !== "production" &&
            url.protocol === "http:"));
    } catch {
      origenValido = false;
    }

    if (!origenValido) {
      return NextResponse.json(
        { ok: false, mensaje: "Origen no permitido" },
        { status: 403 }
      );
    }

    // Identificador de conexión.
    // Esta versión local limita los intentos globalmente.
    // Antes del despliegue público se debe implementar
    // identificación confiable por IP desde el proxy.
    const identificador = "admin-login-local";

    const limite = await verificarLimiteLogin(identificador);

    if (!limite.permitido) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Demasiados intentos fallidos. Inténtalo nuevamente más tarde.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "900",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const body = await request.json();

    if (
      typeof body.password !== "string" ||
      body.password.length === 0 ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        { ok: false, mensaje: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    const valid = await verifyAdminPassword(body.password);

    if (!valid) {
      await registrarIntentoFallido(identificador);

      return NextResponse.json(
        { ok: false, mensaje: "Credenciales inválidas" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    await createAdminSession();
    await limpiarIntentosLogin(identificador);

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Sesión iniciada correctamente",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Error de autenticación:", error);

    return NextResponse.json(
      { ok: false, mensaje: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }
}
