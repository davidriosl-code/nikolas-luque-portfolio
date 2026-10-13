"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, ArrowUpRight, BarChart3, CircleDollarSign, Layers3, MousePointer2, Users, Workflow } from "lucide-react";

const views = [
  { name: "Ventas", icon: BarChart3, value: "S/ 24,850", label: "Ingresos del mes", bars: [38, 56, 47, 78, 61, 93, 72, 100], trend: "+18.4%" },
  { name: "Clientes", icon: Users, value: "128", label: "Contactos registrados", bars: [29, 44, 53, 48, 69, 78, 91, 100], trend: "+12.6%" },
  { name: "Flujos", icon: Workflow, value: "42", label: "Tareas automatizadas", bars: [24, 40, 36, 59, 72, 69, 89, 100], trend: "+24.1%" },
];
const easing = [0.22, 1, 0.36, 1] as const;

export default function BusinessExperience() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const current = views[active];
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28" id="experiencia">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-10">
        <div><p className="text-xs tracking-[.28em] text-[#c6f58b] mb-4">LIVE PREVIEW / 01</p><h2 className="text-4xl md:text-6xl tracking-[-.06em] text-white font-medium max-w-2xl">Tu negocio, en otra <span className="text-[#d6a9ff]">dimensión.</span></h2></div>
        <p className="text-sm text-white/60 max-w-xs leading-relaxed">Explora un ejemplo interactivo de los paneles que podemos diseñar para tus procesos.</p>
      </div>
      <div className="relative min-h-[520px] md:min-h-[610px] rounded-[36px] overflow-hidden border border-white/15 bg-[#170c23]/45 shadow-[0_30px_120px_rgba(12,3,28,.6)] [perspective:1200px]">
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at 60% 35%,rgba(170,104,247,.33),transparent 58%),radial-gradient(ellipse at 10% 100%,rgba(90,211,226,.16),transparent 48%)"}}/>
        <motion.div aria-hidden="true" className="absolute top-[6%] right-[7%] w-44 h-44 md:w-64 md:h-64 rounded-[42%_58%_67%_33%] blur-[1px] opacity-70 pointer-events-none" style={{background:"radial-gradient(circle at 32% 27%,#fff9,transparent 25%),linear-gradient(125deg,#f3c6ff99,#642ab199 46%,#68dce877)",boxShadow:"inset 15px 12px 38px #ffffff6b,inset -22px -28px 42px #24004cbb,0 30px 90px #a256d65e"}} animate={reduced?{}:{y:[0,-20,0],rotate:[-9,8,-9],borderRadius:["42% 58% 67% 33%","58% 42% 37% 63%","42% 58% 67% 33%"]}} transition={{duration:11,repeat:Infinity,ease:"easeInOut"}}/>
        <motion.div aria-hidden="true" className="absolute bottom-[8%] left-[5%] w-24 h-24 md:w-36 md:h-36 rounded-full opacity-70 pointer-events-none" style={{background:"radial-gradient(circle at 28% 25%,#fff9,#c09bfa88 32%,#451d89dd 70%,#1c083d)",boxShadow:"inset -15px -15px 30px #16002a,0 20px 50px #9a65ee66"}} animate={reduced?{}:{y:[0,20,0],x:[0,13,0]}} transition={{duration:8,repeat:Infinity,ease:"easeInOut"}}/>
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 p-5 md:p-10 items-center min-h-[520px] md:min-h-[610px]">
          <div className="w-full lg:w-[30%] flex flex-col gap-5">
            <span className="inline-flex items-center gap-2 text-[11px] tracking-[.2em] uppercase text-[#d9c5ed]"><Activity size={15} className="text-[#c6f58b]"/> Demo interactiva</span>
            <h3 className="text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight">Control total. <br/>Sin complejidad.</h3>
            <p className="text-sm leading-relaxed text-white/65">Selecciona un módulo y observa cómo se transforma tu centro de operaciones.</p>
            <div className="flex lg:flex-col gap-2 flex-wrap" role="group" aria-label="Módulo del CRM">
              {views.map((v,i)=><button type="button" key={v.name} onClick={()=>setActive(i)} aria-pressed={active===i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 border ${active===i?"bg-white/20 border-white/40 text-white shadow-[inset_0_1px_0_#ffffff50]":"bg-white/5 border-white/10 text-white/65 hover:bg-white/15"}`}><v.icon size={17}/>{v.name}<ArrowUpRight size={15} className="ml-auto"/></button>)}
            </div>
          </div>
          <motion.div key={active} initial={reduced?false:{opacity:0,y:25,rotateY:-7}} animate={{opacity:1,y:0,rotateY:0}} transition={{duration:.65,ease:easing}} className="w-full lg:w-[70%] rounded-[28px] border border-white/30 bg-white/[.09] backdrop-blur-2xl shadow-[inset_0_1px_0_#ffffff60,0_30px_80px_#0b051b99] p-5 md:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center text-[#c6f58b]"><Layers3 size={21}/></div><div><p className="text-white font-semibold text-sm">NIKOLAS / CRM</p><p className="text-white/50 text-xs">Panel de demostración</p></div></div><span className="text-[10px] rounded-full border border-[#c6f58b]/40 text-[#c6f58b] px-3 py-1.5">● DEMO</span></div>
            <div className="grid grid-cols-2 gap-4 mt-6"><div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs text-white/55 mb-3">{current.label}</p><motion.p key={current.value} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="text-3xl md:text-4xl text-white font-semibold tracking-tight">{current.value}</motion.p><span className="inline-flex items-center gap-1 text-[#c6f58b] text-xs mt-3"><ArrowUpRight size={14}/>{current.trend} este período</span></div><div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs text-white/55 mb-3">Actividad del sistema</p><div className="flex items-center gap-3 mt-5"><CircleDollarSign size={28} className="text-[#c6f58b]"/><div><p className="text-white text-lg">Operativo</p><p className="text-white/50 text-xs">Vista de ejemplo</p></div></div></div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 mt-4"><div className="flex justify-between gap-4 items-center"><p className="text-sm text-white/85">Evolución de {current.name.toLowerCase()}</p><span className="text-xs text-white/40">Últimos 8 períodos</span></div><div className="flex items-end gap-2 md:gap-4 h-36 mt-6">{current.bars.map((height,i)=><motion.div key={i} initial={{height:0}} animate={{height:`${height}%`}} transition={{duration:.7,delay:i*.055,ease:easing}} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#6636a4]/60 via-[#a06be3] to-[#e7c7ff] shadow-[0_0_22px_#b98bf044] min-w-0"/>)}</div></div>
          </motion.div>
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-white/45 mt-5"><MousePointer2 size={14}/> Datos ilustrativos, no conectados a empresas reales.</p>
    </section>
  );
}
