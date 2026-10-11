import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const runtime = "nodejs";

const estadosPermitidos = ["nuevo", "contactado", "cerrado"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, mensaje: "No autorizado" },
      { status: 401 }
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json(
      { ok: false, mensaje: "Origen no permitido" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { ok: false, mensaje: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const estado = body?.estado;

    if (!estadosPermitidos.includes(estado)) {
      return NextResponse.json(
        { ok: false, mensaje: "Estado inválido" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `UPDATE public.leads
       SET estado = $1
       WHERE id = $2
       RETURNING id, estado`,
      [estado, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, mensaje: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, cliente: result.rows[0] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error al actualizar estado:", error);

    return NextResponse.json(
      { ok: false, mensaje: "No se pudo actualizar el estado" },
      { status: 500 }
    );
  }
}
