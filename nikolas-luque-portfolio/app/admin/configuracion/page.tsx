import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Settings,
  Building2,
  Database,
  Workflow,
  ShieldCheck,
  Globe,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let postgresDisponible = false;

  try {
    await db.query("SELECT 1");
    postgresDisponible = true;
  } catch (error) {
    console.error("Error comprobando PostgreSQL:", error);
  }

  const servicios = [
    {
      nombre: "PostgreSQL",
      descripcion: "Almacenamiento de clientes y solicitudes",
      disponible: postgresDisponible,
      icono: Database,
    },
    {
      nombre: "n8n",
      descripcion: "Automatización de formularios y procesos",
      disponible: null,
      icono: Workflow,
    },
    {
      nombre: "Panel de administración",
      descripcion: "Acceso protegido mediante inicio de sesión",
      disponible: true,
      icono: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-violet-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
              NIKOLAS BUSINESS SOLUTIONS
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Configuración
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Información general, servicios y seguridad del CRM.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold">Mi negocio</h2>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-400">Nombre comercial</p>
                <p className="mt-1 font-medium text-white">
                  NIKOLAS Business Solutions
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Actividad</p>
                <p className="mt-1 text-sm text-slate-200">
                  Desarrollo de software y soluciones digitales
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Panel administrativo</p>
                <p className="mt-1 text-sm text-slate-200">
                  NIKOLAS CRM
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <Globe className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold">Accesos rápidos</h2>
            </div>

            <div className="space-y-3">
              <Link
                href="/admin/clientes"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Administrar clientes
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/automatizaciones"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Ver automatizaciones
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/business"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Ver página pública
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-6 text-lg font-semibold">
            Estado de los servicios
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {servicios.map((servicio) => {
              const Icono = servicio.icono;

              return (
                <article
                  key={servicio.nombre}
                  className="rounded-2xl border border-white/10 bg-[#20152f] p-5"
                >
                  <Icono className="h-5 w-5 text-violet-300" />

                  <h3 className="mt-4 font-semibold text-white">
                    {servicio.nombre}
                  </h3>

                  <p className="mt-2 min-h-10 text-xs leading-5 text-slate-400">
                    {servicio.descripcion}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs">
                    {servicio.disponible === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-emerald-300">
                          Disponible
                        </span>
                      </>
                    ) : servicio.disponible === false ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-300" />
                        <span className="text-amber-300">
                          Sin conexión
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        Estado no verificado
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.06] p-6">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-violet-300" />
            <h2 className="font-semibold">Seguridad y privacidad</h2>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Las credenciales se administran desde el servidor.
            Esta pantalla no permite visualizar contraseñas,
            tokens de acceso ni secretos de conexión.
          </p>

          <p className="mt-3 text-xs text-amber-200">
            Antes de publicar el CRM en internet se debe reforzar
            el inicio de sesión con protección contra intentos
            repetidos y configurar HTTPS.
          </p>
        </section>
      </div>
    </main>
  );
}
