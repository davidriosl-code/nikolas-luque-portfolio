
import EstadisticasCRM from "./components/EstadisticasCRM";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto mb-10 max-w-7xl"><EstadisticasCRM /></div>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-purple-300">
              NIKOLAS CRM
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              Panel administrativo
            </h1>
            <p className="mt-3 text-slate-400">
              Bienvenido a tu centro privado de gestión empresarial.
            </p>
          </div>

          <AdminLogoutButton />
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["Clientes", "Próximamente"],
            ["Solicitudes", "Próximamente"],
            ["Automatizaciones", "Próximamente"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-5 text-xl font-semibold text-purple-200">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-purple-300/15 bg-purple-400/[0.06] p-7">
          <h2 className="text-xl font-semibold">
            Tu CRM está tomando forma
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            La autenticación ya está integrada. El siguiente paso será
            consultar PostgreSQL para mostrar los clientes registrados,
            gestionar estados y buscar solicitudes.
          </p>
        </section>
      </div>
    </main>
  );
}
