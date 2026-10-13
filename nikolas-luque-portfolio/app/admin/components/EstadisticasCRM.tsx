import Link from "next/link";
import { db } from "@/lib/admin/db";

type Estadisticas = {
  total: number;
  nuevos: number;
  contactados: number;
  cerrados: number;
};

export default async function EstadisticasCRM() {
  let datos: Estadisticas | null = null;

  try {
    const resultado = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'nuevo')::int AS nuevos,
        COUNT(*) FILTER (WHERE estado = 'contactado')::int AS contactados,
        COUNT(*) FILTER (WHERE estado = 'cerrado')::int AS cerrados
      FROM public.leads
    `);

    datos = resultado.rows[0] as Estadisticas;
  } catch (error) {
    console.error("Error cargando estadísticas CRM:", error);
  }

  if (!datos) {
    return (
      <section className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-200">
        No se pudieron cargar las estadísticas de PostgreSQL.
      </section>
    );
  }

  const tarjetas = [
    {
      titulo: "Total de clientes",
      valor: datos.total,
      detalle: "Solicitudes registradas",
      color: "text-white",
    },
    {
      titulo: "Clientes nuevos",
      valor: datos.nuevos,
      detalle: "Pendientes de atención",
      color: "text-violet-300",
    },
    {
      titulo: "Contactados",
      valor: datos.contactados,
      detalle: "Conversaciones iniciadas",
      color: "text-sky-300",
    },
    {
      titulo: "Cerrados",
      valor: datos.cerrados,
      detalle: "Gestiones finalizadas",
      color: "text-emerald-300",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
          NIKOLAS BUSINESS SOLUTIONS
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Resumen de clientes
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Estadísticas obtenidas directamente de PostgreSQL.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <article
            key={tarjeta.titulo}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl"
          >
            <p className="text-sm text-slate-400">{tarjeta.titulo}</p>
            <p className={`mt-4 text-4xl font-bold ${tarjeta.color}`}>
              {tarjeta.valor}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {tarjeta.detalle}
            </p>
          </article>
        ))}
      </div>

      <Link
        href="/admin/clientes"
        className="inline-flex rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/25"
      >
        Administrar clientes →
      </Link>
    </section>
  );
}
