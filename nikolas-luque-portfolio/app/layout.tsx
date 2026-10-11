import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nikolas Luque — Software & visión de negocio",
  description: "Nikolas Luque: desarrollo web con React, Django y Laravel, Android con Kotlin y soluciones con datos. Software con visión de negocio, desde Arequipa, Perú.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
