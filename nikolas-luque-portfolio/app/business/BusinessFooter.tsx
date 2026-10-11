"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Github, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";

const columns = [
  { title: "Explorar", links: [{ label: "CRM para empresas", href: "#soluciones" }, { label: "Plantillas Notion", href: "#soluciones" }, { label: "Automatizaciones", href: "#soluciones" }, { label: "Cómo trabajamos", href: "#proceso" }] },
  { title: "Nikolas Luque", links: [{ label: "Portafolio", href: "/" }, { label: "Sobre mis servicios", href: "#proceso" }, { label: "GitHub", href: "https://github.com/davidriosl-code" }] },
  { title: "Contacto", links: [{ label: "Solicitar propuesta", href: "#contacto" }, { label: "Escribir por correo", href: "mailto:driosluque@gmail.com" }, { label: "WhatsApp", href: "https://wa.me/51974988237" }] },
];

export default function BusinessFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
      className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-32 md:mt-64"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-3 text-white mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" /></svg>
            <span className="text-xl font-medium tracking-[.15em]">NIKOLAS <span className="text-[#c6f58b]">LUQUE</span></span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm">Diseño software, CRMs y automatizaciones que convierten procesos complejos en experiencias simples. Tecnología con visión de negocio.</p>
          <p className="text-xs mt-6 text-white/45">Arequipa, Perú · Proyectos remotos</p>
        </div>
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {columns.map(column => <div key={column.title}>
            <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">{column.title}</h3>
            <ul className="text-xs space-y-2">
              {column.links.map(link => <li key={link.label}><a href={link.href} className="hover:text-white transition-colors inline-flex gap-1 items-center">{link.label}{link.href.startsWith("http") && <ArrowUpRight size={12}/>}</a></li>)}
            </ul>
          </div>)}
        </div>
      </div>
      <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        <p className="text-[10px] uppercase tracking-widest opacity-50">© {new Date().getFullYear()} Nikolas Luque · Software & Business</p>
        <div className="flex items-center gap-5">
          <span className="text-[10px] uppercase tracking-widest opacity-50">Conectemos:</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/davidriosl-code" aria-label="GitHub" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-colors hover:text-white"><Github size={16}/></a>
            <a href="https://www.linkedin.com/in/nikolas-r%C3%ADos-luque-510a641a2/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-colors hover:text-white"><Linkedin size={16}/></a>
            <a href="https://wa.me/51974988237" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-colors hover:text-white"><MessageCircle size={16}/></a>
            <a href="mailto:driosluque@gmail.com" aria-label="Correo" className="opacity-70 hover:opacity-100 transition-colors hover:text-white"><Mail size={16}/></a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
