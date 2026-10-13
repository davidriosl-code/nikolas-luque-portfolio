"use client";

import { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Search,
  MessageCircle,
} from "lucide-react";

type Cliente = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  estado: string;
  fecha_registro: string;
};

function crearEnlaceWhatsApp(cliente: Cliente): string | null {
  const numero = cliente.telefono.replace(/\D/g, "");

  let telefonoInternacional: string;

  if (numero.length === 9 && numero.startsWith("9")) {
    telefonoInternacional = `51${numero}`;
  } else if (
    numero.length === 11 &&
    numero.startsWith("51") &&
    numero[2] === "9"
  ) {
    telefonoInternacional = numero;
  } else {
    return null;
  }

  const mensaje =
    `Hola, ${cliente.nombre}. Soy Nikolas, de Nikolas Business Solutions. ` +
    `Recibí tu solicitud sobre nuestro servicio ${cliente.servicio}. ` +
    `Me gustaría conversar contigo para conocer mejor tu proyecto.`;

  return `https://wa.me/${telefonoInternacional}?text=${encodeURIComponent(mensaje)}`;
}
export default function ClientesPanel({
  clientes,
}: {
  clientes: Cliente[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [registros, setRegistros] = useState(clientes);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [errorEstado, setErrorEstado] = useState("");

  async function cambiarEstado(id: string, estado: string) {
    if (guardando) return;

    setGuardando(id);
    setErrorEstado("");

    try {
      const response = await fetch(
        `/api/admin/clientes/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo guardar el estado");
      }

      setRegistros((actuales) =>
        actuales.map((cliente) =>
          cliente.id === id ? { ...cliente, estado } : cliente
        )
      );
    } catch {
      setErrorEstado("No se pudo guardar el cambio. Inténtalo otra vez.");
    } finally {
      setGuardando(null);
    }
  }

  const filtrados = useMemo(() => {
    const texto = busqueda.toLocaleLowerCase().trim();

    return registros.filter((cliente) => {
      const coincideEstado =
        filtro === "todos" || cliente.estado === filtro;

      const coincideBusqueda = [
        cliente.nombre,
        cliente.email,
        cliente.telefono,
        cliente.servicio,
      ].some((valor) => valor.toLocaleLowerCase().includes(texto));

      return coincideEstado && coincideBusqueda;
    });
  }, [registros, busqueda, filtro]);

  const estadisticas = [
    {
      titulo: "Total de clientes",
      valor: registros.length,
      icono: Users,
    },
    {
      titulo: "Nuevos",
      valor: registros.filter((c) => c.estado === "nuevo").length,
      icono: UserPlus,
    },
    {
      titulo: "Contactados",
      valor: registros.filter((c) => c.estado === "contactado").length,
      icono: PhoneCall,
    },
    {
      titulo: "Cerrados",
      valor: registros.filter((c) => c.estado === "cerrado").length,
      icono: CheckCircle2,
    },
  ];

  return (
    <div className="mt-9 space-y-7">
      {errorEstado && (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorEstado}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {estadisticas.map(({ titulo, valor, icono: Icono }) => (
          <div
            key={titulo}
            className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{titulo}</span>
              <Icono className="h-5 w-5 text-purple-300" />
            </div>
            <p className="mt-5 text-3xl font-semibold">{valor}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Solicitudes recibidas</h2>
            <p className="mt-1 text-sm text-slate-400">
              {filtrados.length} resultados
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar cliente..."
                aria-label="Buscar cliente"
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <select
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              aria-label="Filtrar por estado"
              className="rounded-xl border border-white/10 bg-[#222136] px-4 py-3 text-sm text-white"
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevos</option>
              <option value="contactado">Contactados</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-white/[0.035] text-slate-400">
              <tr>
                {["Cliente", "Contacto", "Servicio", "Fecha", "Estado", "Acciones"].map(
                  (titulo) => (
                    <th key={titulo} className="px-5 py-4 font-medium">
                      {titulo}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-t border-white/[0.07] hover:bg-white/[0.035]"
                >
                  <td className="px-5 py-5">
                    <p className="font-semibold">{cliente.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID #{cliente.id}
                    </p>
                  </td>
                  <td className="px-5 py-5">
                    <p>{cliente.email}</p>
                    <p className="mt-1 text-slate-400">
                      {cliente.telefono || "Sin teléfono"}
                    </p>
                  </td>
                  <td className="px-5 py-5 text-purple-200">
                    {cliente.servicio}
                  </td>
                  <td className="px-5 py-5 text-slate-300">
                    {new Date(cliente.fecha_registro).toLocaleDateString(
                      "es-PE",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "America/Lima",
                      }
                    )}
                  </td>
                  <td className="px-5 py-5">
                    <select
                      aria-label={`Estado de ${cliente.nombre}`}
                      value={cliente.estado}
                      disabled={guardando !== null}
                      onChange={(event) =>
                        cambiarEstado(cliente.id, event.target.value)
                      }
                      className="rounded-xl border border-purple-400/20 bg-[#252038] px-3 py-2 text-sm text-purple-100 outline-none focus:border-purple-400 disabled:opacity-50"
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </td>
                  <td className="px-5 py-5">
                    {crearEnlaceWhatsApp(cliente) ? (
                      <a
                        href={crearEnlaceWhatsApp(cliente)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/20"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Número no válido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No se encontraron clientes con esos filtros.
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Se muestran hasta 100 registros recientes. Esta versión permite
        consultar, buscar y filtrar; todavía no modifica estados.
      </p>
    </div>
  );
}
