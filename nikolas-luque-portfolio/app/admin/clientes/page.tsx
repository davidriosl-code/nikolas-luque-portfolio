import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import ClientesPanel from "./ClientesPanel";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const result = await db.query(`
    SELECT id, nombre, email, telefono, servicio,
           mensaje, estado, fecha_registro
    FROM public.leads
    ORDER BY fecha_registro DESC
    LIMIT 100
  `);

  const clientes = result.rows.map((cliente) => ({
    id: String(cliente.id),
    nombre: String(cliente.nombre),
    email: String(cliente.email),
    telefono: cliente.telefono ?? "",
    servicio: String(cliente.servicio),
    mensaje: cliente.mensaje ?? "",
    estado: String(cliente.estado),
    fecha_registro: new Date(cliente.fecha_registro).toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[#090913] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm text-purple-300 hover:text-purple-200"
        >
          ← Volver al dashboard
        </Link>

        <div className="mt-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-purple-300">
            NIKOLAS CRM
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Gestión de clientes
          </h1>
          <p className="mt-3 text-slate-400">
            Solicitudes recibidas desde Business Solutions.
          </p>
        </div>

        <ClientesPanel clientes={clientes} />
      </div>
    </main>
  );
}
