import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, mensaje: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const result = await db.query(`
      SELECT
        id,
        nombre,
        email,
        telefono,
        servicio,
        mensaje,
        estado,
        fecha_registro
      FROM public.leads
      ORDER BY fecha_registro DESC
      LIMIT 100
    `);

    return NextResponse.json(
      {
        ok: true,
        clientes: result.rows,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error al consultar clientes:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudieron consultar los clientes",
      },
      { status: 500 }
    );
  }
}
