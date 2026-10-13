"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Workflow,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const enlaces = [
  {
    nombre: "Dashboard",
    href: "/admin",
    icono: LayoutDashboard,
  },
  {
    nombre: "Clientes",
    href: "/admin/clientes",
    icono: Users,
  },
  {
    nombre: "Automatizaciones",
    href: "/admin/automatizaciones",
    icono: Workflow,
  },
  {
    nombre: "Configuración",
    href: "/admin/configuracion",
    icono: Settings,
  },
];

export default function SidebarCRM() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 w-full shrink-0 overflow-hidden border-b border-white/10 bg-[#160f25] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-r-violet-400/10">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative flex min-h-full flex-col px-4 py-6 sm:px-5 lg:px-5 lg:py-8">

        {/* Identidad */}
        <Link href="/admin" className="mb-8 flex min-w-0 items-center gap-3 px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/20 shadow-lg shadow-violet-950/30">
            <Sparkles className="h-5 w-5 text-violet-200" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
              NIKOLAS
            </p>
            <h2 className="truncate text-lg font-bold leading-tight tracking-tight text-white">
              CRM Dashboard
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Business Solutions
            </p>
          </div>
        </Link>

        {/* Navegación */}
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Menú principal
        </p>

        <nav
          aria-label="Navegación del CRM"
          className="flex flex-wrap gap-2 lg:flex-col"
        >
          {enlaces.map(({ nombre, href, icono: Icono }) => {
            const activo =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={[
                  "group flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
                  activo
                    ? "border-violet-400/35 bg-violet-500/20 text-white shadow-md shadow-violet-950/20"
                    : "border-transparent text-slate-200 hover:border-white/10 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icono
                  className={`h-[18px] w-[18px] shrink-0 ${
                    activo
                      ? "text-violet-300"
                      : "text-slate-400 group-hover:text-violet-300"
                  }`}
                />

                <span className="truncate">{nombre}</span>

                {activo && (
                  <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-violet-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tarjeta inferior */}
        <div className="mt-8 lg:mt-auto lg:pt-10">
          <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <p className="text-sm font-semibold text-white">
                Panel privado
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-300">
              Gestiona tus clientes, solicitudes y operaciones.
            </p>
          </div>

          <p className="mt-5 text-center text-[10px] tracking-wide text-slate-500">
            © NIKOLAS BUSINESS SOLUTIONS
          </p>
        </div>
      </div>
    </aside>
  );
}
