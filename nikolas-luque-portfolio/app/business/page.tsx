import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, ChartNoAxesCombined, DatabaseZap, Layers3, MessageCircle, Workflow } from "lucide-react";
import type { Metadata } from "next";
import styles from "./business.module.css";
import BusinessFooter from "./BusinessFooter";

export const metadata: Metadata = {
  title: "Business Solutions | Nikolas Luque",
  description: "CRMs, sistemas en Notion y automatizaciones para negocios. Soluciones diseñadas por Nikolas Luque.",
};

const offers = [
  { icon: BriefcaseBusiness, label: "CRM PERSONALIZADO", name: "CRM para negocios", price: "Desde S/399", description: "Organiza clientes, oportunidades comerciales, tareas y seguimiento de ventas en un solo lugar.", features: ["Pipeline comercial", "Seguimiento de clientes", "Panel de indicadores"] },
  { icon: Layers3, label: "NOTION WORKSPACE", name: "Plantillas Notion", price: "Desde S/49", description: "Espacios de trabajo reutilizables para administrar finanzas, operaciones y productividad.", features: ["Panel financiero", "Gestión de proyectos", "Documentación y guías"] },
  { icon: Workflow, label: "AUTOMATION SYSTEMS", name: "Automatizaciones", price: "Desde S/899", description: "Conecta herramientas y reduce tareas manuales con flujos diseñados a medida.", features: ["Integraciones mediante API", "Alertas y seguimiento", "Procesos automatizados"] },
];

const whatsapp = (service: string) => `https://wa.me/51974988237?text=${encodeURIComponent(`Hola Nikolas, quiero solicitar información sobre ${service}.`)}`;

export default function BusinessPage() {
  return (
    <main className={`${styles.page} relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white`}>
      <video className="fixed inset-0 w-full h-full object-cover z-[0]" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4" autoPlay loop muted playsInline preload="metadata" aria-hidden="true" />
      <div className={styles.videoOverlay} aria-hidden="true" />
      <div className={`${styles.contentLayer} relative z-10 w-full flex flex-col items-center`}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Volver al portafolio">nl<span>.</span><small> / BUSINESS</small></Link>
        <nav aria-label="Navegación de soluciones">
          <a href="#soluciones">Soluciones</a>
          <a href="#proceso">Proceso</a>
          <a href="#contacto" className={styles.headerCta}>Solicitar propuesta <ArrowUpRight size={15}/></a>
        </nav>
      </header>
      <section className={styles.hero}>
        <div className={styles.eyebrow}><span className={styles.dot}/> NIKOLAS LUQUE / BUSINESS SOLUTIONS</div>
        <h1>Software que transforma <em>procesos</em> en oportunidades.</h1>
        <p>Diseño CRMs, espacios inteligentes en Notion y automatizaciones para que tu negocio trabaje con más orden y menos tareas repetitivas.</p>
        <div className={styles.actions}>
          <a href="#soluciones" className={styles.primary}>Explorar soluciones <ArrowRight size={18}/></a>
          <a href={whatsapp("una solución empresarial")} target="_blank" rel="noopener noreferrer" className={styles.secondary}><MessageCircle size={18}/> Hablemos de tu proyecto</a>
        </div>
        <div className={styles.metrics}>
          <div><strong>CRM</strong><span>Gestión comercial</span></div>
          <div><strong>NOTION</strong><span>Workspaces inteligentes</span></div>
          <div><strong>API + IA</strong><span>Automatización</span></div>
        </div>
      </section>
      <section id="soluciones" className={styles.section}>
        <div className={styles.sectionTop}><div><span className={styles.kicker}>01 / SERVICIOS</span><h2>Soluciones para crecer</h2></div><p>Desde un sistema listo para adaptar hasta una implementación diseñada para tu negocio.</p></div>
        <div className={styles.cards}>{offers.map(({icon:Icon,...item})=><article className={styles.card} key={item.name}>
          <div className={styles.cardHead}><span>{item.label}</span><Icon size={27}/></div>
          <h3>{item.name}</h3><p>{item.description}</p>
          <ul>{item.features.map(feature=><li key={feature}><span>↗</span>{feature}</li>)}</ul>
          <div className={styles.cardBottom}><strong>{item.price}</strong><a href={whatsapp(item.name)} target="_blank" rel="noopener noreferrer" aria-label={`Consultar por ${item.name}`}>Consultar <ArrowUpRight size={17}/></a></div>
        </article>)}</div>
        <p className={styles.disclaimer}>Precios referenciales de lanzamiento. La cotización final depende del alcance. Las soluciones se desarrollan y configuran según cada proyecto.</p>
      </section>
      <section id="proceso" className={styles.process}>
        <div><span className={styles.kicker}>02 / CÓMO TRABAJAMOS</span><h2>De la idea al sistema.</h2><p>Una implementación clara, sin complicaciones innecesarias.</p></div>
        <div className={styles.steps}>
          <div><DatabaseZap size={24}/><span>01</span><h3>Diagnóstico</h3><p>Entendemos tus procesos y objetivos.</p></div>
          <div><ChartNoAxesCombined size={24}/><span>02</span><h3>Diseño</h3><p>Definimos el flujo, los datos y las pantallas.</p></div>
          <div><Bot size={24}/><span>03</span><h3>Implementación</h3><p>Configuramos, probamos y documentamos.</p></div>
        </div>
      </section>
      <section id="contacto" className={styles.contact}><span className={styles.kicker}>03 / EMPECEMOS</span><h2>¿Listo para organizar y escalar tu negocio?</h2><p>Cuéntame qué necesitas y preparemos una propuesta a tu medida.</p><a className={styles.primary} href={whatsapp("un CRM o una automatización")} target="_blank" rel="noopener noreferrer">Solicitar cotización <ArrowUpRight size={18}/></a></section>
      <div className="w-full max-w-7xl px-4 md:px-7 pb-8"><BusinessFooter /></div>
      </div>
    </main>
  );
}
