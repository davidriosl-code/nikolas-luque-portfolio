"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("No se pudo iniciar sesión. Comprueba tu contraseña.");
        return;
      }

      setPassword("");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090913] px-5 py-12 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-purple-700/20 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-700/15 blur-[110px]" />
      </div>

      <div className="relative w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.055] p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-400/10">
          <LockKeyhole className="h-7 w-7 text-purple-200" />
        </div>

        <p className="mb-2 text-xs font-semibold tracking-[0.3em] text-purple-300">
          NIKOLAS BUSINESS
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Panel administrativo
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Acceso privado para gestionar clientes y solicitudes comerciales.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm text-slate-300">
              Contraseña de administrador
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Introduce tu contraseña"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-4 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-purple-500 px-5 py-4 font-semibold text-white transition hover:bg-purple-400 disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Ingresar al panel"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-purple-300" />
          Acceso restringido a administradores autorizados
        </div>
      </div>
    </main>
  );
}
