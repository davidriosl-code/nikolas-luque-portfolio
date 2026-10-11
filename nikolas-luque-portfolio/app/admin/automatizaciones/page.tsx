import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Workflow,
  Globe,
  Database,
  Users,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function AutomatizacionesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let postgresDisponible = false;
  let totalSolicitudes: number | null = null;

  try {
    const resultado = await db.query(
      "SELECT COUNT(*)::int AS total FROM public.leads"
    );

    postgresDisponible = true;
    totalSolicitudes = resultado.rows[0].total;
  } catch (error) {
    console.error("No se pudo consultar PostgreSQL:", error);
  }

  const pasos = [
    {
      titulo: "Formulario web",
      descripcion: "El visitante envía una solicitud.",
      icono: Globe,
    },
    {
      titulo: "n8n",
      descripcion: "El workflow procesa los datos.",
      icono: Workflow,
    },
    {
      titulo: "PostgreSQL",
      descripcion: "Se almacena el nuevo registro.",
      icono: Database,
    },
    {
      titulo: "NIKOLAS CRM",
      descripcion: "Gestionas el cliente y su estado.",
      icono: Users,
    },
  ];

  return (
    <main className="min-h-screen px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            NIKOLAS BUSINESS SOLUTIONS
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Automatizaciones
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Visualiza el recorrido de tus solicitudes y comprueba
            la disponibilidad de PostgreSQL.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <Workflow className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold">
              Flujo de captación de clientes
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {pasos.map((paso, index) => {
              const Icono = paso.icono;

              return (
                <div
                  key={paso.titulo}
                  className="relative rounded-2xl border border-violet-400/15 bg-[#20152f] p-5"
                >
                  <Icono className="mb-4 h-6 w-6 text-violet-300" />
                  <p className="font-semibold text-white">
                    {paso.titulo}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {paso.descripcion}
                  </p>
                  {index < pasos.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 text-violet-300 md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              {postgresDisponible ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              )}
              <h2 className="font-semibold">PostgreSQL</h2>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {postgresDisponible ? "Conectado" : "Sin conexión"}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {postgresDisponible
                ? `${totalSolicitudes} solicitudes registradas`
                : "No se pudo consultar la base de datos."}
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-violet-300" />
              <h2 className="font-semibold">Servidor n8n</h2>
            </div>

            <p className="mt-4 text-sm text-slate-300">
              Accede a tu instalación local para revisar
              ejecuciones y modificar workflows.
            </p>

            <a
              href="http://127.0.0.1:5678"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/25"
            >
              Abrir n8n
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Enlace local. No verifica automáticamente si n8n está activo.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-violet-400/15 bg-violet-500/[0.06] p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-300" />
            <h2 className="font-semibold">Administración privada</h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Esta página no muestra credenciales, contraseñas
            ni tokens de acceso.
          </p>

          <Link
            href="/admin/clientes"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Ver clientes registrados
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
