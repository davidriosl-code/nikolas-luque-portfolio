"use client";

import { usePathname } from "next/navigation";
import SidebarCRM from "./components/SidebarCRM";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // La pantalla de acceso no debe mostrar el menú privado.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#100b1b] lg:flex">
      <SidebarCRM />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
