
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim();
    const servicio = String(body.servicio ?? "").trim();

    // Validar los datos del cliente
    if (
      !nombre ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !servicio ||
      nombre.length > 120 ||
      email.length > 180 ||
      servicio.length > 100
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Datos inválidos. Revisa el formulario.",
        },
        { status: 400 }
      );
    }

    // Obtener la URL privada del webhook n8n
    const webhook = process.env.N8N_LEADS_WEBHOOK_URL;

    if (!webhook) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "El webhook de n8n no está configurado.",
        },
        { status: 503 }
      );
    }

    // Enviar los datos a n8n
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        email,
        servicio,
        telefono: String(body.telefono ?? "").slice(0, 35),
        mensaje: String(body.mensaje ?? "").slice(0, 2000),
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta de n8n");
    }

    const result = await response.json();

    if (result.ok !== true) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: result.mensaje ?? "Solicitud rechazada.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: result.mensaje,
    });

  } catch (error) {
    console.error("Error al conectar con n8n:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudo procesar la solicitud.",
      },
      { status: 502 }
    );
  }
}
