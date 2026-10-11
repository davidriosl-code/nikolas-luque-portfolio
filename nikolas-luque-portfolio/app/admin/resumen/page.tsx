import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import EstadisticasCRM from "../components/EstadisticasCRM";

export const dynamic = "force-dynamic";

export default async function ResumenPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#100b1b] px-5 py-12 text-white sm:px-10">
      <div className="mx-auto max-w-7xl">
        <EstadisticasCRM />
      </div>
    </main>
  );
}
