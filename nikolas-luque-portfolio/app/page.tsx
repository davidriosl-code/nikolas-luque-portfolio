"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { JarvisHudToggle } from "@/components/ui/jarvis-hud-toggle";
import { Code2, Smartphone, ChartNoAxesCombined, GitBranch, Mail, MapPin, Menu, X, Check, Copy, Terminal, Sparkles, Globe2, Layers, MousePointer2, AudioLines, Maximize2, MessageCircle, Braces, Scan, Orbit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PortfolioAssistant } from "@/components/portfolio/assistant";
import { PortfolioDetails, type DetailId } from "@/components/portfolio/details";
import { MaterialMotion } from "@/components/portfolio/material-motion";
import { SpatialExperience } from "@/components/portfolio/spatial-experience";
import WelcomeHero from "@/components/WelcomeHero"; // + NUEVO
import type { SectionId, StackId } from "@/lib/portfolio-assistant";

function Github({size=20}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"/></svg>;}
function Linkedin({size=20}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7m4-7v7m0-4c0-4 6-4 6 0v4"/><circle cx="7" cy="6.8" r=".7" fill="currentColor" stroke="none"/></svg>;}

const github = "https://github.com/davidriosl-code";
const linkedin = "https://www.linkedin.com/in/nikolas-r%C3%ADos-luque-510a641a2/";
const whatsapp = "https://wa.me/51974988237?text=Hola%20Nikolas%2C%20me%20gustar%C3%ADa%20conversar%20contigo%20sobre%20una%20oportunidad.";
const nav = [
  {label:"Sobre mí",href:"#sobre-mi",external:false},
  {label:"Capacidades",href:"#capacidades",external:false},
  {label:"Mi stack",href:"#stack",external:false},
  {label:"Business Solutions",href:"/business",external:false},
  {label:"Iron Man",href:"https://jarvis-armor-lab-david.driosluque.chatgpt.site",external:true}
];
const stacks = [
  {id:"web", label:"Frontend", icon:Code2, title:"Interfaces claras, desde la base.", description:"Construyo interfaces web con HTML5, CSS3, JavaScript y React. Organizo el contenido, el diseño y la interacción para que cada pantalla sea fácil de entender y usar.", tools:[{name:"HTML5",sub:"Estructura web",mark:"H5",color:"#efa892"},{name:"CSS3",sub:"Diseño y adaptación",mark:"C3",color:"#91c5e2"},{name:"JavaScript",sub:"Interactividad",mark:"JS",color:"#e7d77d"},{name:"React",sub:"Interfaces por componentes",mark:"R",color:"#91d5eb"}]},
  {id:"backend", label:"Backend", icon:Terminal, title:"La lógica detrás de la experiencia.", description:"Desarrollo lógica de servidor con Python, Django, PHP y Laravel. También trabajo con Node.js y Express, y consumo APIs REST para conectar información y servicios.", tools:[{name:"Python",sub:"Lenguaje",mark:"Py",color:"#94b7e5"},{name:"Django",sub:"Framework backend",mark:"dj",color:"#a1d7b7"},{name:"PHP",sub:"Lenguaje de servidor",mark:"php",color:"#b8abe4"},{name:"Laravel",sub:"Framework backend",mark:"La",color:"#ef9696"},{name:"Node.js",sub:"Entorno de ejecución",mark:"N",color:"#b0d68d"},{name:"Express",sub:"Backend",mark:"ex",color:"#ded4e1"},{name:"APIs REST",sub:"Consumo e integración",mark:"API",color:"#c6f58b"}]},
  {id:"android", label:"Android", icon:Smartphone, title:"Ideas que van contigo.", description:"Desarrollo para Android con Kotlin y Jetpack Compose: interfaces declarativas, gestión de estados y componentes que responden a la interacción.", tools:[{name:"Kotlin",sub:"Lenguaje",mark:"K",color:"#c99dec"},{name:"Jetpack Compose",sub:"Interfaz Android",mark:"JC",color:"#a6cfe7"},{name:"Java",sub:"Programación orientada a objetos",mark:"J",color:"#edb78a"},{name:"Gradle",sub:"Construcción",mark:"G",color:"#9bd8c7"}]},
  {id:"datos", label:"Datos", icon:ChartNoAxesCombined, title:"Datos que tienen sentido.", description:"Trabajo con SQL, Oracle y MongoDB para organizar información y consultar datos. Con Power BI puedo transformar esa información en visualizaciones que faciliten la lectura de un negocio.", tools:[{name:"SQL",sub:"Consultas y modelado",mark:"SQL",color:"#91c5e2"},{name:"Oracle",sub:"Base de datos relacional",mark:"Or",color:"#ef9696"},{name:"MongoDB",sub:"Base de datos documental",mark:"M",color:"#acd699"},{name:"Power BI",sub:"Visualización",mark:"BI",color:"#e9d985"},{name:"Django ORM",sub:"Modelos y relaciones",mark:"ORM",color:"#a1d7b7"}]},
  {id:"flujo", label:"Control y despliegue", icon:GitBranch, title:"Orden para seguir construyendo.", description:"Organizo los cambios con Git y GitHub. Tengo fundamentos de contenedores con Docker, además de bases en Bash, automatización y entrega continua.", tools:[{name:"Git",sub:"Control de versiones",mark:"git",color:"#efa892"},{name:"GitHub",sub:"Repositorios",mark:"GH",color:"#d9c9e6"},{name:"Docker",sub:"Fundamentos de contenedores",mark:"D",color:"#91c5e2"},{name:"Bash",sub:"Terminal y scripts",mark:">_",color:"#c6f58b"},{name:"CI/CD",sub:"Fundamentos",mark:"∞",color:"#a5c9e9"}]},
  {id:"herramientas", label:"Herramientas", icon:Layers, title:"Del código a la comunicación visual.", description:"Utilizo Visual Studio Code y PyCharm para desarrollar. Complemento ese trabajo con Adobe Photoshop y Microsoft Excel para preparar recursos visuales y organizar información.", tools:[{name:"Visual Studio Code",sub:"Editor de código",mark:"VS",color:"#91c5e2"},{name:"PyCharm",sub:"Entorno de desarrollo",mark:"PC",color:"#b0d68d"},{name:"Adobe Photoshop",sub:"Edición y recursos visuales",mark:"Ps",color:"#94b7e5"},{name:"Microsoft Excel",sub:"Organización de información",mark:"X",color:"#a1d7b7"}]}
];

function SectionLabel({number,children}:{number:string,children:React.ReactNode}) {
  return <div className="section-label"><span>{number}</span>{children}</div>;
}

export default function Home() {
  const [jarvisOpen,setJarvisOpen]=useState(false);
  const [entered,setEntered]=useState(false); // + NUEVO: false = se ve el hero de bienvenida
  const [detail,setDetail]=useState<DetailId|null>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [activeStack,setActiveStack]=useState("web");
  const [copyStatus,setCopyStatus]=useState("");
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const progressRef=useRef<HTMLDivElement>(null);
  // + NUEVO: bloquea el scroll de la página mientras el hero está visible
  useEffect(()=>{
    if(entered)return;
    const prev=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=prev;};
  },[entered]);
  useEffect(()=>{
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}
    }),{threshold:.08});
    if(!reduced.matches)document.querySelectorAll(".reveal").forEach(node=>{node.classList.add("will-reveal");observer.observe(node);});
    const scroll=()=>{const total=document.documentElement.scrollHeight-innerHeight;if(progressRef.current)progressRef.current.style.transform=`scaleX(${total>0?scrollY/total:0})`;};
    window.addEventListener("scroll",scroll,{passive:true});scroll();
    return()=>{observer.disconnect();window.removeEventListener("scroll",scroll);if(copyTimer.current)clearTimeout(copyTimer.current);};
  },[]);
  const navigate=useCallback((target:SectionId)=>{
    const still=matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motionPaused==="true";
    document.getElementById(target)?.scrollIntoView({behavior:still?"instant":"smooth",block:"start"});
  },[]);
  const showStack=useCallback((target:StackId)=>{setActiveStack(target);navigate("stack");},[navigate]);
  async function copyEmail(){
    try{await navigator.clipboard.writeText("driosluque@gmail.com");setCopyStatus("Correo copiado");}
    catch{setCopyStatus("Escríbeme a driosluque@gmail.com");}
    if(copyTimer.current)clearTimeout(copyTimer.current);
    copyTimer.current=setTimeout(()=>setCopyStatus(""),3500);
  }
  return <>
    {/* + NUEVO: vista inicial de bienvenida; al pulsar entra al portafolio y abre J.A.R.V.I.S. */}
    {!entered&&<WelcomeHero onEnterJarvis={()=>{setEntered(true);setJarvisOpen(true);}}/>}
    <SpatialExperience/><MaterialMotion/>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <div className="scroll-progress" ref={progressRef}/>
    <header className="site-header">
      <a className="wordmark" href="#inicio" aria-label="Nikolas Luque, inicio">nl<span>.</span></a>
      <nav className="desktop-nav" aria-label="Navegación principal">{nav.map(n=><a key={n.href} href={n.href} target={n.external?"_blank":undefined} rel={n.external?"noopener noreferrer":undefined} aria-label={n.external?"Iron Man: J.A.R.V.I.S. Armor Lab (abre una pestaña nueva)":undefined}>{n.label}{n.external&&<Orbit size={15}/>}</a>)}</nav>
      <a href="#contacto" className="nav-contact">Conversemos <Mail size={17}/></a>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild><button className="mobile-menu" aria-label="Abrir menú"><Menu size={23}/></button></SheetTrigger>
        <SheetContent className="mobile-sheet" showCloseButton={false}>
          <div className="sheet-heading"><SheetTitle className="wordmark">nl<span>.</span></SheetTitle><SheetClose aria-label="Cerrar menú"><X/></SheetClose></div>
          <SheetDescription>Software, creatividad y visión de negocio.</SheetDescription>
          <nav aria-label="Navegación móvil">{[...nav,{label:"Contacto",href:"#contacto",external:false}].map((n,i)=><a key={n.href} href={n.href} target={n.external?"_blank":undefined} rel={n.external?"noopener noreferrer":undefined} onClick={()=>setMenuOpen(false)}><span>0{i+1}</span>{n.label}</a>)}</nav>
          <span className="sheet-location">Desde Arequipa, para el mundo.</span>
        </SheetContent>
      </Sheet>
    </header>
    <main id="contenido">
      <section className="hero page-width" id="inicio" aria-labelledby="hero-title" data-scene="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-enter"><span className="eyebrow-line"/> SOFTWARE CON VISIÓN DE NEGOCIO</p>
          <h1 id="hero-title" className="hero-enter"><span className="hello">Hola, soy</span><span className="name">Nikolas</span><span className="name surname">Luque<span className="name-dot">.</span></span></h1>
          <div className="hero-description hero-enter"><p>De esto vivo: de convertir ideas<br className="desktop-break"/> en <strong>soluciones digitales.</strong></p><p className="hero-sub">Desarrollo web. Android. Datos.<br/>Una mirada técnica que entiende el negocio.</p></div>
          <div className="hero-actions hero-enter"><a className="button button-lime" href="#capacidades">Explora mis capacidades <Braces size={19}/></a><a className="round-link" href={github} target="_blank" rel="noopener noreferrer" aria-label="GitHub de Nikolas (abre una pestaña nueva)"><Github/></a><a className="round-link" href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Nikolas (abre una pestaña nueva)"><Linkedin/></a></div>
          <Button variant="ghost" className="hero-jarvis hero-enter" onClick={()=>setJarvisOpen(true)}><span className="hero-jarvis-icon"><AudioLines size={20}/></span><span>Conóceme con <strong>J.A.R.V.I.S.</strong></span></Button>
        </div>
        <div className="hero-visual hero-enter" data-scene-anchor>
          <div className="portrait-floor" aria-hidden="true"/>
          <div className="portrait-scene">
            <div className="portrait-backplate" aria-hidden="true"/>
            <div className="portrait-frame"><img className="portrait" src="/nikolas-portrait.png" alt="Nikolas Luque, desarrollador de software en Arequipa" width="1122" height="1402" fetchPriority="high"/><div className="portrait-shade"/></div>
            <Button variant="ghost" className="floating-label label-kotlin" onClick={()=>showStack("android")}><span className="tech-glyph kotlin-glyph">K</span><span className="floating-text">Kotlin<small>Desarrollo Android</small></span></Button>
            <Button variant="ghost" className="floating-label label-django" onClick={()=>showStack("backend")}><span className="tech-glyph django-glyph">dj</span><span className="floating-text">Django<small>Backend & APIs</small></span></Button>
            <div className="portrait-caption"><span className="caption-mark"><Code2 size={22}/></span><span>NIKOLAS LUQUE<small>Software developer</small></span><Button variant="ghost" size="icon" className="caption-plus" aria-label="Ampliar retrato y conocer más de Nikolas" onClick={()=>setDetail("portrait")}><Maximize2 size={18}/></Button></div>
          </div>
          <div className="visual-note"><Scan size={17}/><span>CÓDIGO. CRITERIO. CREATIVIDAD.</span></div>
          <span className="vertical-note">PORTFOLIO / 2026</span>
        </div>
        <div className="hero-bottom"><span><MapPin size={15}/> Arequipa, Perú <span className="meta-separator">/</span> Oportunidades remotas</span><a href="#sobre-mi"><MousePointer2 size={15}/> Sigue explorando</a></div>
      </section>
      <div className="ticker" aria-label="Desarrollo web, Android, datos y visión de negocio"><div className="ticker-track" aria-hidden="true">{[0,1].map(n=><div className="ticker-group" key={n}><span>DESARROLLO WEB</span><i>✳</i><span>ANDROID</span><i>✳</i><span>DATOS CON SENTIDO</span><i>✳</i><span>VISIÓN DE NEGOCIO</span><i>✳</i></div>)}</div></div>

      <section id="sobre-mi" className="about-section page-width section-space" data-scene="about">
        <div className="about-main reveal"><SectionLabel number="01">MÁS ALLÁ DEL CÓDIGO</SectionLabel><h2>Pienso en personas.<br/>Construyo con<br/><em>tecnología.</em></h2><div className="about-columns"><p>Soy Nikolas, estudiante de Diseño y Desarrollo de Software en Arequipa. Me interesa entender un problema, darle estructura y convertirlo en una experiencia útil.</p><p>Además de programar, trabajo con marketing digital, ventas y emprendimientos. Esa experiencia me ayuda a entender a un cliente, el trabajo de un equipo y las necesidades de un negocio.</p></div><a className="text-link" href={linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={18}/> Conóceme en LinkedIn</a></div>
        <div className="mind-card depth-card reveal"><img src="/spatial/chrome-mind.png" alt="Escultura digital de un rostro de cristal y metal" width="736" height="736" loading="lazy"/><div className="mind-card-shade"/><span className="mind-card-index">INTELIGENCIA × CREATIVIDAD</span><div className="mind-card-copy"><span>Un poco más sobre mí.</span><h3>Una conversación.<br/>Muchas posibilidades.</h3><Button className="mind-launch" onClick={()=>setJarvisOpen(true)}><AudioLines size={18}/> Hablar con J.A.R.V.I.S.</Button></div></div>
      </section>

      <section id="capacidades" className="capabilities-section section-space" data-scene="capabilities"><div className="page-width">
        <div className="section-heading reveal"><div><SectionLabel number="02">LO QUE PUEDO APORTAR</SectionLabel><h2>Ideas que toman<br/><em>otra dimensión.</em></h2></div><p>Del primer boceto a la lógica que lo sostiene.<br/>Cada pieza tiene un propósito.</p></div>
        <div className="capability-grid">
          <article className="capability-card card-web reveal"><div className="card-top"><span>01 / WEB & BACKEND</span><Code2 size={22}/></div><div className="capability-art"><img src="/spatial/glass-systems.png" alt="Carpetas de cristal sobre una plataforma tridimensional" width="736" height="736" loading="lazy"/></div><div className="capability-copy"><h3>Sistemas que<br/>conectan las piezas.</h3><p>Frontend con React, backend con Django o Laravel e integración de información mediante APIs REST.</p><div className="card-tags"><span>React</span><span>Django</span><span>Laravel</span></div><Button variant="ghost" className="card-link capability-detail-button" onClick={()=>setDetail("web")}>Explorar desarrollo web <Braces size={18}/></Button></div></article>
          <article className="capability-card card-mobile reveal"><div className="card-top"><span>02 / ANDROID</span><Smartphone size={22}/></div><div className="android-visual" aria-hidden="true"><div className="android-symbol"><Smartphone size={66} strokeWidth={1.2}/></div><div className="compose-code"><span>@Composable</span><code>fun Idea() {'{'}<br/>&nbsp; Experiencia()<br/>{'}'}</code></div><span className="android-label">KOTLIN + COMPOSE</span></div><div className="capability-copy"><h3>Tu idea.<br/>Siempre a mano.</h3><p>Interfaces Android con Kotlin y Jetpack Compose, pensadas desde la interacción y la gestión de estados.</p><div className="card-tags"><span>Kotlin</span><span>Jetpack Compose</span></div><Button variant="ghost" className="card-link capability-detail-button" onClick={()=>setDetail("android")}>Explorar desarrollo Android <Smartphone size={18}/></Button></div></article>
          <article className="capability-card card-data reveal"><div className="card-top"><span>03 / DATOS</span><ChartNoAxesCombined size={22}/></div><div className="capability-art"><img src="/spatial/glass-data.png" alt="Ilustración conceptual de paneles de análisis tridimensionales; no representa resultados de un proyecto" width="736" height="736" loading="lazy"/><span className="art-caption">Visualización conceptual</span></div><div className="capability-copy"><h3>Información.<br/>Con dirección.</h3><p>Modelado de datos y visualizaciones que hacen más fácil entender qué sucede en un negocio.</p><div className="card-tags"><span>Power BI</span><span>SQL</span><span>MongoDB</span></div><Button variant="ghost" className="card-link capability-detail-button" onClick={()=>setDetail("datos")}>Explorar datos y análisis <ChartNoAxesCombined size={18}/></Button></div></article>
        </div>
      </div></section>

      <section id="stack" className="stack-section page-width section-space" data-scene="stack">
        <div className="section-heading reveal"><div><SectionLabel number="03">MI CAJA DE HERRAMIENTAS</SectionLabel><h2>Un universo<br/>en <em>construcción.</em></h2></div><p>Elijo la herramienta según el problema.<br/>Y sigo aprendiendo con cada reto.</p></div>
        <Tabs value={activeStack} onValueChange={setActiveStack} className="stack-tabs reveal"><TabsList className="stack-tab-list" aria-label="Áreas de tecnología"><span className="stack-active-pill" aria-hidden="true"/>{stacks.map(s=><TabsTrigger key={s.id} value={s.id} className="stack-trigger"><s.icon size={18}/>{s.label}</TabsTrigger>)}</TabsList>
          {stacks.map((s,i)=><TabsContent key={s.id} value={s.id} className="stack-content"><div className="stack-intro"><span className="stack-number">{String(i+1).padStart(2,"0")} <span>/ 06</span></span><h3>{s.title}</h3><p>{s.description}</p><span className="stack-terminal"><Terminal size={16}/> Siempre hay algo nuevo por aprender.</span></div><div className="tools-grid">{s.tools.map((t,index)=><div key={t.name} className="tool-tile" style={{"--tile-delay":`${index*45}ms`} as CSSProperties}><span className="tool-mark" style={{"--tool-color":t.color} as CSSProperties}>{t.mark}</span><span><strong>{t.name}</strong><small>{t.sub}</small></span></div>)}</div></TabsContent>)}
        </Tabs>
        <div className="learning-line reveal"><span><Sparkles size={17}/> TAMBIÉN EN MI FORMACIÓN</span><p>Spring Boot <b>·</b> Angular <b>·</b> Maven <b>·</b> Arduino <b>·</b> UML</p></div>
      </section>

      <section id="valor-diferencial" className="perspective-section section-space" data-scene="perspective"><div className="page-width perspective-layout">
        <div className="perspective-main reveal"><SectionLabel number="04">MI VALOR DIFERENCIAL</SectionLabel><h2>Desarrollo software.<br/>Entiendo<br/><em>el negocio.</em></h2><p>Combino formación técnica con experiencia en marketing digital, ventas y emprendimientos. Conecto lo que una empresa necesita con interfaces, procesos y datos que tienen una utilidad concreta.</p><a className="text-link" href={github} target="_blank" rel="noopener noreferrer"><Github size={19}/> Explora mi código en GitHub</a></div>
        <div className="perspective-list"><article className="depth-card reveal"><span>01</span><div><h3>Pienso en el cliente.</h3><p>Mi experiencia en marketing me lleva a cuidar la claridad de cada interfaz y el camino entre una visita, una consulta y una venta.</p></div><MousePointer2 size={24}/></article><article className="depth-card reveal"><span>02</span><div><h3>Entiendo la operación.</h3><p>Conozco el día a día de un emprendimiento: atender consultas, dar seguimiento y organizar información. Eso guía qué conviene simplificar.</p></div><Layers size={24}/></article><article className="depth-card reveal"><span>03</span><div><h3>Conecto las piezas.</h3><p>Reúno desarrollo web, datos y comunicación visual para mantener coherencia entre cómo se ve una solución y cómo funciona.</p></div><GitBranch size={24}/></article></div>
      </div></section>

      <section id="contacto" className="contact-section section-space" data-scene="contact"><div className="page-width contact-inner">
        <SectionLabel number="05">EL SIGUIENTE PASO</SectionLabel><div className="contact-heading reveal"><h2>Las buenas ideas<br/>empiezan con una<br/><em>conversación.</em></h2><a className="contact-circle" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Conversar con Nikolas por WhatsApp"><MessageCircle strokeWidth={1.2}/><span>HABLEMOS</span></a></div>
        <div className="contact-bottom reveal"><p>¿Una oportunidad en tu equipo o un proyecto en mente?<br/>Me gustaría saber más.</p><div className="contact-buttons"><a className="button button-lime" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/> Escríbeme por WhatsApp</a><a href="mailto:driosluque@gmail.com" className="button button-outline"><Mail size={18}/> Enviar un correo</a></div></div>
        <div className="contact-details"><div><span>CORREO</span><div><a href="mailto:driosluque@gmail.com">driosluque@gmail.com</a><button onClick={copyEmail} aria-label="Copiar dirección de correo">{copyStatus==="Correo copiado"?<Check size={17}/>:<Copy size={17}/>}</button></div><span className="copy-message" role="status">{copyStatus}</span></div><div><span>TELÉFONO</span><a href="tel:+51974988237">+51 974 988 237</a></div><div><span>ENCUÉNTRAME EN</span><div className="social-text"><a href={github} target="_blank" rel="noopener noreferrer"><Github size={17}/> GitHub</a><a href={linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={17}/> LinkedIn</a></div></div></div>
      </div></section>
    </main>
    <footer className="site-footer page-width"><a className="wordmark" href="#inicio" aria-label="Volver al inicio">nl<span>.</span></a><span>© 2026 Nikolas Luque</span><span className="footer-location"><Globe2 size={16}/> Desde Arequipa, para el mundo.</span><a href="#inicio" className="back-top">Volver arriba</a></footer>
    <PortfolioDetails detail={detail} onClose={()=>setDetail(null)} onStack={showStack}/>
    <PortfolioAssistant open={jarvisOpen} onOpenChange={setJarvisOpen} onNavigate={navigate} onStack={showStack}/>
  </>;
}
