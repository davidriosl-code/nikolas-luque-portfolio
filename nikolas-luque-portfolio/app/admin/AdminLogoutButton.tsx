"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No se pudo cerrar sesión");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch {
      alert("No se pudo cerrar sesión. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
