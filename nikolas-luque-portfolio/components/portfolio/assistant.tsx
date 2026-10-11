"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, AudioLines, Check, ChevronRight, CircleHelp, Clock3, Code2, Download, ExternalLink, Link2, ListFilter, LoaderCircle, Mic, MicOff, Play, Search, Send, ShieldCheck, Square, Terminal, Timer, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { portfolioContact, type SectionId, type StackId } from "@/lib/portfolio-assistant";
import { catalogCategories, commandCatalog, planJarvisCommand, type JarvisAction, type JarvisPlan } from "@/lib/jarvis/engine";
import type {AISource} from "@/lib/jarvis/openai";
import type {AIConfiguration,ProviderAnswer} from "@/lib/jarvis/ai";
import { createCalendarFile } from "@/lib/jarvis/calendar";
import { useJarvisVoice } from "./use-jarvis-voice";
import { JarvisHud } from "./jarvis-hud";

type DownloadFile={name:string;body:string;mime:string};
type Result={label:string;state:"done"|"failed"|"ready";note:string;href?:string;file?:DownloadFile;links?:{label:string;href:string;description?:string}[]};
type Message={id:number;role:"assistant"|"user";text:string;results?:Result[];target?:SectionId;connections?:boolean;model?:string;modelLabel?:string;sources?:AISource[]};
type AIState="checking"|"configured"|"connected"|"missing"|"error";
type TimerState={status:"idle"|"running"|"paused"|"finished";seconds:number;remaining:number;ends:number};
type StopwatchState={running:boolean;started:number;elapsed:number};
type GithubResponse={error?:string;name:string;bio:string;publicRepos:number;repos:{name:string;description:string;language:string;href:string}[]};
const emptyTimer:TimerState={status:"idle",seconds:0,remaining:0,ends:0};
const duration=(seconds:number)=>{const n=Math.max(0,Math.floor(seconds));return `${Math.floor(n/3600)?String(Math.floor(n/3600)).padStart(2,"0")+":":""}${String(Math.floor(n/60)%60).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;};

export function JarvisCore({active=false,small=false}:{active?:boolean;small?:boolean}){
  return <span className={`jarvis-core ${active?"is-active":""} ${small?"is-small":""}`} aria-hidden="true"><span className="core-ring"/><span className="core-ring core-ring-two"/><span className="core-center"><AudioLines/></span></span>;
}

export function PortfolioAssistant({open,onOpenChange,onNavigate,onStack}:{open:boolean;onOpenChange:(open:boolean)=>void;onNavigate:(target:SectionId)=>void;onStack:(target:StackId)=>void}){
  const [tab,setTab]=useState("conversation");
  const [input,setInput]=useState("");
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("Todos");
  const [limit,setLimit]=useState(24);
  const [busy,setBusy]=useState(false);
  const [activeStep,setActiveStep]=useState("");
  const [clock,setClock]=useState(0);
  const [githubStatus,setGithubStatus]=useState<"idle"|"working"|"connected"|"error">("idle");
  const [aiState,setAiState]=useState<AIState>("checking");
  const [aiDetail,setAiDetail]=useState("Comprobando la configuración de IA…");
  const [aiConfig,setAiConfig]=useState<AIConfiguration|null>(null);
  const [useAI,setUseAI]=useState(true);
  const [useWeb,setUseWeb]=useState(true);
  const [messages,setMessages]=useState<Message[]>([{id:0,role:"assistant",text:"A tu servicio, Nikolas. Escribe o dicta una solicitud: programación, ideas, textos, investigación o una acción de la consola. El estado de la IA aparece a la izquierda. Las cuentas privadas se vinculan por separado. Los hologramas no hacen papeleo."}]);
  const [timer,setTimer]=useState<TimerState>(emptyTimer);
  const [stopwatch,setStopwatch]=useState<StopwatchState>({running:false,started:0,elapsed:0});
  const timerRef=useRef(timer),stopwatchRef=useRef(stopwatch);
  const busyRef=useRef(false),mounted=useRef(true),nextId=useRef(1),runEpoch=useRef(0);
  const listRef=useRef<HTMLDivElement>(null),inputRef=useRef<HTMLTextAreaElement>(null),launcherRef=useRef<HTMLButtonElement>(null);
  const requestRef=useRef<AbortController|null>(null);
  const messagesRef=useRef(messages);messagesRef.current=messages;
  const runRef=useRef<(text:string)=>void>(()=>undefined);
  const wakeOpen=useCallback(()=>{onOpenChange(true);setTab("conversation");},[onOpenChange]);
  const voice=useJarvisVoice({onCommand:text=>runRef.current(text),onWake:wakeOpen});
  const completeCount=messages.reduce((total,message)=>total+(message.results?.filter(result=>result.state==="done").length??0),0);
  const setTimerValue=(value:TimerState)=>{timerRef.current=value;setTimer(value);};
  const setStopwatchValue=(value:StopwatchState)=>{stopwatchRef.current=value;setStopwatch(value);};
  const append=(message:Omit<Message,"id">)=>setMessages(current=>[...current,{...message,id:nextId.current++}].slice(-60));

  useEffect(()=>{
    mounted.current=true;setClock(Date.now());
    const id=setInterval(()=>{
      const now=Date.now();setClock(now);
      const current=timerRef.current;
      if(current.status==="running"&&now>=current.ends){const done={...current,status:"finished" as const,remaining:0};timerRef.current=done;setTimer(done);}
    },1000);
    return()=>{mounted.current=false;clearInterval(id);requestRef.current?.abort();};
  },[]);
  useEffect(()=>{if(open&&tab==="conversation"&&listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight;},[messages,open,tab,voice.partial,busy]);
  useEffect(()=>{setLimit(24);},[search,category]);
  useEffect(()=>{
    if(!open)return;const controller=new AbortController();
    void fetch("/api/jarvis/connection",{signal:controller.signal,cache:"no-store"}).then(async response=>{
      const data=await response.json() as AIConfiguration&{verified:boolean;error?:string};
      if(!response.ok)throw new Error(data.error??"No pude comprobar la configuración.");
      if(controller.signal.aborted)return;
      setAiConfig(data);if(!data.webSearch)setUseWeb(false);
      setAiState(data.configured?(data.verified?"connected":"configured"):"missing");
      setAiDetail(!data.configured?`Falta ${data.keyName}. Guárdala como secreto del sitio y aplica la configuración.`:data.verified?`Conexión verificada con ${data.providerLabel} · ${data.modelLabel}.`:"Clave guardada en el servidor. Puedes comprobar la conexión o enviar una solicitud.");
    }).catch(error=>{if(!controller.signal.aborted){setAiState("error");setAiDetail(error instanceof Error?error.message:"No pude comprobar la configuración. Prueba de nuevo desde Conexiones.");}});
    return()=>controller.abort();
  },[open]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.altKey&&event.key.toLowerCase()==="j"){event.preventDefault();onOpenChange(true);setTab("conversation");}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[onOpenChange]);

  function changeOpen(value:boolean){
    onOpenChange(value);
    if(!value){runEpoch.current++;requestRef.current?.abort();voice.cancelSpeaking();if(!voice.wakeEnabled)voice.cancelCommand();}
  }
  function download(file:DownloadFile){
    const url=URL.createObjectURL(new Blob([file.body],{type:file.mime}));const anchor=document.createElement("a");anchor.href=url;anchor.download=file.name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function report(){return ["J.A.R.V.I.S. — Nikolas Luque",new Date().toISOString(),"Reporte de esta pestaña.\n",...messagesRef.current.map(message=>`${message.role==="user"?"TÚ":"J.A.R.V.I.S."}\n${message.text}${message.results?.map(result=>`\n[${result.state}] ${result.label}: ${result.note}`).join("")??""}\n`)].join("\n");}
  async function copy(value:string){try{await navigator.clipboard.writeText(value);return {state:"done" as const,note:"Copiado al portapapeles."};}catch{return {state:"failed" as const,note:`El navegador no permitió copiar. Puedes seleccionar el texto: ${value}`};}}

  async function execute(action:JarvisAction,signal:AbortSignal,priorOutput?:string,currentReport?:string):Promise<{result:Result;target?:SectionId}>{
    const done=(note:string):{result:Result}=>({result:{label:action.label,state:"done",note}});
    const fail=(note:string):{result:Result}=>({result:{label:action.label,state:"failed",note}});
    switch(action.type){
      case "navigate":onNavigate(action.target);return {...done("Sección seleccionada."),target:action.target};
      case "stack":onStack(action.target);return {...done("Área seleccionada en el portafolio."),target:"stack"};
      case "copy":return {result:{label:action.label,...await copy(portfolioContact[action.target])}};
      case "link":return {result:{label:action.label,state:"ready",note:"Enlace preparado para abrir.",href:action.target==="email"?`mailto:${portfolioContact.email}`:portfolioContact[action.target]}};
      case "external-link":return {result:{label:action.label,state:"ready",note:"Preparado. Abre el enlace para continuar.",href:action.href}};
      case "view":setTab(action.target);return done("Vista abierta.");
      case "voice":voice.setVoice(action.enabled);return done(action.enabled?"Respuestas habladas activadas.":"Respuestas habladas desactivadas.");
      case "wake":if(!voice.supported)return fail("Este navegador no admite reconocimiento de voz.");voice.setWake(action.enabled);return {result:{label:action.label,state:action.enabled?"ready":"done",note:action.enabled?"Se solicitó la escucha. Su estado aparecerá al recibir el permiso del navegador.":"Escucha desactivada."}};
      case "copy-result":{const last=[...messagesRef.current].reverse().find(message=>message.role==="assistant");const value=priorOutput??(last?last.text+(last.results?.map(result=>"\n"+result.note).join("")??""):undefined);return value?{result:{label:action.label,...await copy(value)}}:fail("Todavía no hay una respuesta para copiar.");}
      case "download-report":return {result:{label:action.label,state:"ready",note:"Reporte preparado para descargar.",file:{name:"jarvis-reporte.txt",body:currentReport??report(),mime:"text/plain;charset=utf-8"}}};
      case "uuid":return done(crypto.randomUUID());
      case "hash":{const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(action.value));return done(Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,"0")).join(""));}
      case "timer":{if(["running","paused"].includes(timerRef.current.status))return fail("Ya hay un temporizador. Cancélalo antes de iniciar otro.");setTimerValue({status:"running",seconds:action.seconds,remaining:action.seconds,ends:Date.now()+action.seconds*1000});return done(`Cuenta atrás iniciada: ${duration(action.seconds)}. Mantén esta página abierta.`);}
      case "timer-control":{
        const current=timerRef.current;
        if(action.operation==="status")return done(current.status==="idle"?"No hay temporizador.":`Estado: ${{running:"en marcha",paused:"pausado",finished:"finalizado",idle:"sin iniciar"}[current.status]}. Restante: ${duration(current.status==="running"?Math.ceil((current.ends-Date.now())/1000):current.remaining)}.`);
        if(action.operation==="cancel"){setTimerValue(emptyTimer);return done("Temporizador cancelado.");}
        if(action.operation==="pause"&&current.status==="running"){const remaining=Math.max(0,Math.ceil((current.ends-Date.now())/1000));setTimerValue({...current,status:remaining?"paused":"finished",remaining});return done(`Temporizador pausado en ${duration(remaining)}.`);}
        if(action.operation==="resume"&&current.status==="paused"){setTimerValue({...current,status:"running",ends:Date.now()+current.remaining*1000});return done("Temporizador reanudado.");}
        return fail("El temporizador no está en un estado que permita esa acción.");
      }
      case "stopwatch":{
        const current=stopwatchRef.current;const elapsed=current.elapsed+(current.running?Date.now()-current.started:0);
        if(action.operation==="status")return done(`Cronómetro ${current.running?"en marcha":"detenido"}: ${duration(elapsed/1000)}.`);
        if(action.operation==="reset"){setStopwatchValue({running:false,started:0,elapsed:0});return done("Cronómetro reiniciado.");}
        if(action.operation==="start"){if(current.running)return fail("El cronómetro ya está en marcha.");setStopwatchValue({...current,running:true,started:Date.now()});return done("Cronómetro iniciado.");}
        setStopwatchValue({running:false,started:0,elapsed});return done(`Cronómetro pausado: ${duration(elapsed/1000)}.`);
      }
      case "calendar-file":{
        const body=createCalendarFile(action,crypto.randomUUID());
        return {result:{label:action.label,state:"ready",note:`${action.title} · ${action.start.slice(0,16).replace("T"," ")} · hora de Perú · ${action.minutes} min. Importa el archivo para añadirlo a tu calendario.`,file:{name:"jarvis-evento.ics",body,mime:"text/calendar;charset=utf-8"}}};
      }
      case "github-public":{
        setGithubStatus("working");
        try{
          const response=await fetch(`/api/jarvis/github?kind=${action.target}`,{signal});const data=await response.json() as GithubResponse;
          if(!response.ok)throw new Error(data.error??"GitHub no está disponible.");
          setGithubStatus("connected");
          if(action.target==="profile")return {result:{label:action.label,state:"done",note:`${data.name}\n${data.bio}\nRepositorios públicos: ${data.publicRepos}.`,href:portfolioContact.github}};
          const repos=data.repos as {name:string;description:string;language:string;href:string}[];
          return {result:{label:action.label,state:"done",note:repos.length?`${repos.length} repositorios públicos, ordenados por actualización.`:"El perfil no muestra repositorios públicos.",links:repos.map(repo=>({label:repo.name,href:repo.href,description:`${repo.language} · ${repo.description}`}))}};
        }catch(error){setGithubStatus("error");if(signal.aborted)throw error;return fail(error instanceof Error?error.message:"No pude consultar GitHub. No se obtuvieron datos nuevos.");}
      }
    }
  }

  async function run(raw:string){
    const text=raw.trim();if(!text||busyRef.current)return;
    busyRef.current=true;setBusy(true);setActiveStep("Interpretando orden");setInput("");setTab("conversation");voice.beginWork();
    const epoch=++runEpoch.current;const controller=new AbortController();requestRef.current=controller;
    const previousReport=report();
    append({role:"user",text});
    let plan:JarvisPlan=planJarvisCommand(text);const results:Result[]=[];let target:SectionId|undefined;
    let aiAnswer:ProviderAnswer|undefined;
    let aiAttempt=false;
    let reply=plan.reply;
    try{
      const normalized=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      const probe=/^(comprueba|prueba|verifica) (la )?(conexion (de |con )?)?ia[.!?]*$/.test(normalized);
      const localUtility=/^(calcula |convierte |convertir |\d+[.,\d]*\s*%|(?:cuanto es )?\d+\s*%|descuenta |aumenta |promedio |suma |resta |minimo |maximo |mediana |dias entre |que dia cae |hora(?: en |$)|fecha de hoy|que fecha es|(?:mayusculas|minusculas|titulo|slug|invierte texto|limpia espacios|cuenta palabras|cuenta caracteres|ordena lineas|quita duplicados|codifica url|decodifica url|codifica base64|decodifica base64|formatea json|compacta json|valida json)\s*:)/.test(normalized);
      const localAction=plan.understood&&plan.actions.length>0&&!/\b(como|explica|explicame|escribe|codigo|ayudame)\b/.test(normalized);
      if(probe){
        aiAttempt=true;
        setActiveStep(`Probando una respuesta real de ${aiConfig?.providerLabel??"la IA"}`);setAiState("checking");
        const response=await fetch("/api/jarvis/connection",{method:"POST",signal:controller.signal});
        const data=await response.json() as AIConfiguration&{reply?:string;error?:string;verified?:boolean};
        controller.signal.throwIfAborted();
        if(!response.ok||!data.verified)throw new Error(data.error??"No pude verificar la conexión.");
        setAiConfig(data);setAiState("connected");setAiDetail(`Conexión verificada con ${data.providerLabel} · ${data.modelLabel}.`);
        reply=data.reply??"Conexión verificada.";plan={understood:true,reply,actions:[]};
        results.push({label:data.providerLabel,state:"done",note:`Respuesta real recibida de ${data.modelLabel}. La clave permanece en el servidor.`});
      }else if(useAI&&(!localUtility&&!localAction||/^ia\s*:/.test(normalized))){
        aiAttempt=true;
        const web=useWeb&&Boolean(aiConfig?.webSearch);
        setActiveStep(web?"Consultando la IA · búsqueda web disponible":`Consultando ${aiConfig?.providerLabel??"la IA"}`);
        const history=messagesRef.current.filter(message=>message.id!==0).slice(-10).map(message=>({role:message.role,content:(message.text+(message.results?.map(result=>`\n[${result.state}] ${result.label}: ${result.note}`).join("")??"")).slice(0,1600)}));
        const response=await fetch("/api/jarvis/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...history,{role:"user",content:text.replace(/^ia\s*:\s*/i,"")}],web}),signal:controller.signal});
        const data=await response.json() as ProviderAnswer&{error?:string;code?:string};
        controller.signal.throwIfAborted();
        if(!response.ok)throw new Error(data.error??"La IA no pudo responder a esta solicitud.");
        aiAnswer=data;setAiConfig(data);setAiState("connected");setAiDetail(`Conexión verificada con ${data.providerLabel} · ${data.modelLabel}.`);reply=data.reply;
        if(data.commands.length){const proposed=planJarvisCommand(data.commands.join(" >> "));if(!proposed.understood)throw new Error("La IA propuso una orden no compatible. No se ejecutó.");plan={...proposed,reply:data.reply};}
        else plan={understood:true,reply:data.reply,actions:[]};
      }else if(!useAI&&!plan.understood){
        reply="El modo local no reconoce esa solicitud. Activa «Conversar con IA» para preguntas abiertas, programación e investigación.";
        plan={...plan,reply};
      }
      let actionIndex=0;let priorOutput:string|undefined=aiAnswer?.reply;const replies:string[]=[];
      sequence:for(const step of plan.steps??[plan]){
        replies.push(step.reply);
        if(!step.actions.length)priorOutput=step.reply;
        for(const action of step.actions){
          controller.signal.throwIfAborted();setActiveStep(`${++actionIndex}/${plan.actions.length} · ${action.label}`);
          const currentReport=`${previousReport}\nTÚ\n${text}\n\nJ.A.R.V.I.S.\n${replies.join("\n")}\n${results.map(result=>`[${result.state}] ${result.label}: ${result.note}`).join("\n")}`;
          const executed=await execute(action,controller.signal,priorOutput,currentReport);results.push(executed.result);if(executed.target)target=executed.target;
          if(executed.result.state==="failed"){
            if(actionIndex<plan.actions.length)results.push({label:"Secuencia detenida",state:"failed",note:`Quedan ${plan.actions.length-actionIndex} acciones sin ejecutar.`});
            reply=replies.join("\n\n");break sequence;
          }
          if(action.type!=="copy-result"&&action.type!=="download-report")priorOutput=executed.result.note;
        }
      }
    }catch(error){reply=controller.signal.aborted?"Ejecución interrumpida. El reporte conserva los pasos que llegaron a completarse.":error instanceof Error?error.message:"No se pudo completar la solicitud.";if(aiAttempt&&!controller.signal.aborted){setAiState("error");setAiDetail(reply);}results.push({label:"Solicitud",state:"failed",note:controller.signal.aborted?"Solicitud cancelada.":"La solicitud se detuvo. No se ejecutaron los pasos pendientes."});}
    finally{
      if(mounted.current){append({role:"assistant",text:reply,results,target,connections:aiAnswer?false:plan.connections,model:aiAnswer?.model,modelLabel:aiAnswer?.modelLabel,sources:aiAnswer?.sources});setBusy(false);setActiveStep("");}
      busyRef.current=false;requestRef.current=null;
    }
    if(epoch===runEpoch.current&&mounted.current){const reportText=results.map(result=>result.note).join(" ");voice.finish((reply+" "+reportText).slice(0,1400));}
  }
  runRef.current=run;

  function prepare(prompt:string){setInput(prompt);setTab("conversation");setTimeout(()=>inputRef.current?.focus({preventScroll:true}),0);}
  function submit(event:FormEvent){event.preventDefault();void run(input);}
  const filtered=useMemo(()=>{const query=search.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return commandCatalog.filter(command=>(category==="Todos"||command.category===category)&&`${command.prompt} ${command.description}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query));},[search,category]);
  const remaining=timer.status==="running"?Math.max(0,Math.ceil((timer.ends-clock)/1000)):timer.remaining;
  const watch=stopwatch.elapsed+(stopwatch.running?Math.max(0,clock-stopwatch.started):0);
  const status=busy?"EJECUTANDO":voice.starting?"ACTIVANDO MICRÓFONO":voice.speaking?"RESPONDIENDO":voice.listening?(voice.wakeEnabled?"A LA ESCUCHA":"ESCUCHANDO"):"EN ESPERA";
  const speechState=voice.listening?"Micrófono activo":voice.starting?"Solicitando micrófono":"Micrófono apagado";
  const cancel=()=>{runEpoch.current++;requestRef.current?.abort();voice.stopAll();};
  const aiLabel=({checking:"COMPROBANDO",configured:"CLAVE GUARDADA",connected:"CONECTADA",missing:"SIN CLAVE",error:"REVISAR CONEXIÓN"})[aiState];
  const providerLabel=aiConfig?.providerLabel??"IA";
  const modelLabel=aiConfig?.modelLabel??"Comprobando modelo…";

  return <>
    <div className="jarvis-dock"><Button ref={launcherRef} className={`jarvis-launcher ${voice.wakeEnabled?"dock-listening":""}`} onClick={()=>onOpenChange(true)} aria-label="Abrir consola central de J.A.R.V.I.S." aria-haspopup="dialog" aria-expanded={open}><JarvisCore small active={voice.listening||voice.speaking}/><span><strong>J.A.R.V.I.S.</strong><small>{voice.wakeEnabled?"Escucha activa · di «Jarvis»":timer.status==="finished"?"Temporizador finalizado":"Abrir consola · Alt + J"}</small></span><ArrowUpRight size={18}/></Button>{voice.wakeEnabled&&<Button className="dock-stop" onClick={()=>voice.stopAll()} aria-label="Apagar el micrófono y la escucha"><MicOff size={16}/></Button>}</div>
    <Dialog open={open} onOpenChange={changeOpen}><DialogContent className="jarvis-console" showCloseButton={false} onOpenAutoFocus={event=>{event.preventDefault();if(!voice.listening&&!voice.starting)inputRef.current?.focus({preventScroll:true});}} onCloseAutoFocus={event=>{event.preventDefault();launcherRef.current?.focus({preventScroll:true});}}>
      <header className="console-header"><div className="console-brand"><span className="console-brand-mark"><AudioLines size={24}/></span><div><span className="console-eyebrow">NIKOLAS LUQUE / CENTRO DE CONTROL</span><DialogTitle>J.A.R.V.I.S.<span>02</span></DialogTitle></div></div><div className="console-header-meta"><span>{clock?new Intl.DateTimeFormat("es-PE",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Lima"}).format(clock):"--:--"}<small>AREQUIPA, PE</small></span><DialogClose asChild><Button variant="ghost" size="icon" className="console-icon" aria-label="Cerrar consola"><X size={21}/></Button></DialogClose></div></header>
      <DialogDescription className="sr-only">Consola central de voz y comandos. Incluye herramientas locales, consultas públicas de GitHub y un catálogo de órdenes. La IA usa el proveedor indicado en Conexiones; las cuentas privadas se vinculan por separado.</DialogDescription>
      <Tabs value={tab} onValueChange={setTab} className="console-tabs"><TabsList className="console-tab-list"><TabsTrigger value="conversation"><AudioLines size={16}/> Consola</TabsTrigger><TabsTrigger value="commands"><Terminal size={16}/> Comandos <span>{commandCatalog.length}</span></TabsTrigger><TabsTrigger value="connections"><Link2 size={16}/> Conexiones</TabsTrigger></TabsList>
        <TabsContent value="conversation" className="console-main">
          <aside className="console-telemetry"><div className="telemetry-label">ESTADO DEL SISTEMA</div><div className="telemetry-block"><span>Motor de comandos</span><strong>DISPONIBLE <Check size={13}/></strong></div><div className="telemetry-block"><span>Inteligencia artificial</span><strong className={aiState==="connected"?"ai-connected":"pending-text"}>{aiLabel}</strong><small className="ai-model-label">{modelLabel}</small></div><div className="telemetry-block"><span>Acciones completadas</span><strong className="telemetry-number">{String(completeCount).padStart(2,"0")}</strong></div><div className="console-timer"><div><Timer size={15}/><span>ENFOQUE</span></div><strong>{timer.status==="idle"?"25:00":duration(remaining)}</strong><small>{({idle:"Listo para empezar",running:"En marcha · esta pestaña",paused:"Pausado",finished:"Tiempo cumplido"})[timer.status]}</small><Button variant="ghost" disabled={busy} onClick={()=>void run(timer.status==="running"?"Pausa temporizador":timer.status==="paused"?"Reanuda temporizador":"Temporizador 25 minutos")}>{timer.status==="running"?<Square size={12}/>:<Play size={12}/>} {timer.status==="running"?"Pausar":timer.status==="paused"?"Reanudar":"Iniciar"}</Button></div>{(stopwatch.running||stopwatch.elapsed>0)&&<div className="stopwatch-readout"><Clock3 size={14}/> Cronómetro <strong>{duration(watch/1000)}</strong></div>}<span className="console-local-note">Historial en esta pestaña.<br/>IA procesada por {providerLabel}.</span></aside>
          <div className={`console-core-stage ${voice.listening?"stage-listening":""} ${voice.speaking?"stage-speaking":""}`}><div className="core-top-label"><span>INTERFAZ DE VOZ</span><span>NL / J-02</span></div><div className="hud-center"><JarvisHud listening={voice.listening} speaking={voice.speaking} busy={busy} analyser={voice.analyser}/><div className="hud-wordmark"><strong>J<span>.</span></strong><span>{voice.speaking?"VOZ":voice.listening?"AUDIO":"READY"}</span></div><span className="hud-axis axis-top"/><span className="hud-axis axis-bottom"/></div><div className="hud-status" role="status">{status}</div><p className="hud-caption">{activeStep||voice.partial||(voice.wakeEnabled?"Di «Jarvis» seguido de tu solicitud.":"Pulsa el micrófono. Te escucho.")}</p><div className="hud-voice-buttons"><Button className={`hud-talk ${voice.listening||voice.starting?"is-listening":""}`} disabled={!voice.supported||busy} onClick={()=>voice.listening||voice.starting?voice.cancelCommand():voice.beginCommand()} aria-label={voice.listening||voice.starting?"Detener escucha actual":"Hablar con J.A.R.V.I.S."}>{voice.listening||voice.starting?<Square size={21}/>:<Mic size={22}/>}</Button><Button variant="ghost" className="console-icon" size="icon" disabled={!voice.speechSupported} onClick={()=>voice.setVoice(!voice.voiceEnabled)} aria-pressed={voice.voiceEnabled} aria-label={voice.voiceEnabled?"Silenciar respuestas":"Activar respuestas habladas"}>{voice.voiceEnabled?<Volume2 size={20}/>:<VolumeX size={20}/>}</Button>{voice.speaking&&<Button variant="ghost" className="console-icon" size="icon" onClick={voice.cancelSpeaking} aria-label="Detener respuesta"><Square size={17}/></Button>}</div><div className="wake-control"><Switch id="jarvis-wake" checked={voice.wakeEnabled} disabled={!voice.supported||busy} onCheckedChange={voice.setWake}/><label htmlFor="jarvis-wake">Activar escucha por «Jarvis»</label></div><span className="hud-mic-state">{speechState}</span></div>
          <div className="console-feed"><div className="feed-heading"><span>REGISTRO DE ACTIVIDAD</span><span>SESIÓN ACTUAL</span></div><div className="console-messages" ref={listRef} role="log" aria-label="Conversación y resultados" aria-live="polite" aria-relevant="additions text">{messages.map(message=><article key={message.id} className={`console-message message-${message.role}`}><span className="message-label">{message.role==="assistant"?"J.A.R.V.I.S.":"NIKOLAS / USUARIO"}{message.model&&<span className="message-ai-badge" title={message.model}>{message.modelLabel??message.model}</span>}</span><p>{message.text}</p>{!!message.sources?.length&&<div className="ai-sources"><span>FUENTES</span>{message.sources.map((source,index)=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{index+1}. {source.title}<ArrowUpRight size={12}/></a>)}</div>}{message.results?.map((result,index)=><div className={`console-result result-${result.state}`} key={index}><span className="result-icon">{result.state==="done"?<Check size={13}/>:result.state==="ready"?<ExternalLink size={13}/>:<CircleHelp size={13}/>}</span><div><strong>{result.label}</strong><p>{result.note}</p>{result.href&&<a href={result.href} target="_blank" rel="noopener noreferrer">Abrir <ArrowUpRight size={13}/></a>}{result.file&&<Button variant="ghost" className="result-download" onClick={()=>download(result.file!)}><Download size={14}/> Descargar {result.file.name}</Button>}{result.links?.map(link=><a className="repo-result-link" href={link.href} key={link.href} target="_blank" rel="noopener noreferrer"><span>{link.label}<small>{link.description}</small></span><ArrowUpRight size={14}/></a>)}</div></div>)}{message.connections&&<Button variant="ghost" className="console-text-button" onClick={()=>setTab("connections")}>Ver conexiones <Link2 size={13}/></Button>}{message.target&&<Button variant="ghost" className="console-text-button" onClick={()=>{changeOpen(false);setTimeout(()=>onNavigate(message.target!),180);}}>Ver en el portafolio <ChevronRight size={13}/></Button>}</article>)}{busy&&<div className="console-working" role="status"><LoaderCircle size={15}/>{activeStep}</div>}</div></div>
        </TabsContent>
        <TabsContent value="commands" className="command-catalog"><div className="catalog-heading"><div><span className="console-eyebrow">ÓRDENES EXPLORABLES</span><h3>Una consola. Muchas posibilidades.</h3><p>{commandCatalog.length} ejemplos ejecutables. Cambia números, texto o fechas y encadena hasta ocho pasos con <code> &gt;&gt; </code>.</p></div><span className="catalog-number">{commandCatalog.length}<small>EJEMPLOS</small></span></div><div className="catalog-search"><Search size={18}/><Input aria-label="Buscar comandos" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Busca: JSON, fechas, Kotlin, temporizador…"/></div><div className="catalog-filters" aria-label="Filtrar comandos por categoría">{catalogCategories.map(item=><Button key={item} variant="ghost" className={category===item?"active-filter":""} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</Button>)}</div><div className="catalog-count"><ListFilter size={14}/>{filtered.length} ejemplos {category!=="Todos"?`en ${category}`:"disponibles"}<span>Selecciona uno para editarlo antes de ejecutar.</span></div><div className="catalog-grid">{filtered.slice(0,limit).map(command=><button className="catalog-command" key={command.id} onClick={()=>prepare(command.prompt)}><span>{command.category}<ArrowUpRight size={14}/></span><strong>{command.prompt}</strong><small>{command.description}</small></button>)}</div>{!filtered.length&&<div className="catalog-empty">No hay ejemplos con esa búsqueda. Prueba otra palabra o categoría.</div>}{filtered.length>limit&&<Button variant="outline" className="catalog-more" onClick={()=>setLimit(value=>value+24)}>Ver 24 ejemplos más <ChevronRight size={15}/></Button>}</TabsContent>
        <TabsContent value="connections" className="console-connections"><div className="connections-heading"><ShieldCheck size={28}/><div><span className="console-eyebrow">ACCESOS REALES</span><h3>Cada conexión, con su estado.</h3><p>La autorización en este chat no entrega las credenciales de tus cuentas a esta web.</p></div></div><div className="connections-grid"><Connection title="Motor local" status="Disponible" active description="Cálculos, conversiones, texto, JSON, fechas, SHA-256 y UUID. Se procesan en este dispositivo." icon={<Code2 size={19}/>}/><Connection title="Micrófono y voz" status={voice.listening?"Micrófono activo":voice.supported?"Disponible con permiso":"Dictado no compatible"} active={voice.supported} description="Llamada por «Jarvis» y dictado mientras la página está visible. El navegador puede procesar el audio en línea." icon={<Mic size={19}/>}/><Connection title="GitHub público" status={githubStatus==="connected"?"Consulta verificada":githubStatus==="error"?"Última consulta fallida":githubStatus==="working"?"Consultando…":"Disponible para consultar"} active={githubStatus==="connected"} description="Lee el perfil y hasta 12 repositorios públicos de davidriosl-code. No accede a repositorios privados." icon={<Terminal size={19}/>}><Button variant="outline" disabled={busy} onClick={()=>void run("Consulta mis repositorios públicos")}>Consultar repositorios <ArrowUpRight size={14}/></Button></Connection><Connection title={`IA · ${providerLabel}`} status={aiLabel} active={aiState==="connected"} description={aiDetail} icon={<AudioLines size={19}/>}><Button variant="outline" disabled={busy} onClick={()=>void run("Comprueba la conexión de IA")}>Comprobar conexión <ArrowUpRight size={14}/></Button></Connection><Connection title="Correo / Gmail" status="Cuenta sin vincular" description="Los envíos y la lectura de la bandeja requieren autorización de la cuenta. Puedes preparar un borrador para abrirlo en tu correo."><Button variant="outline" onClick={()=>prepare("Borrador correo: equipo@empresa.com | Presentación | Hola, soy Nikolas Luque.")}>Preparar borrador <ArrowUpRight size={14}/></Button></Connection><Connection title="Google Calendar" status="Cuenta sin vincular" description="Todavía no consulta ni modifica tu agenda. Puedes generar un archivo de evento para importarlo tú."><Button variant="outline" onClick={()=>prepare("Evento: Reunión | 2026-10-05 10:00 | 45")}>Preparar evento .ics <ArrowUpRight size={14}/></Button></Connection><Connection title="Drive, Docs, Sheets y Slides" status="Cuentas sin vincular" description="La web aún no puede leer, crear ni editar los documentos de estas cuentas."/><Connection title="Archivos y acciones del equipo" status="Sin agente local" description="El navegador no tiene acceso general a tus carpetas, terminal o aplicaciones del ordenador."/></div><div className="connection-next"><span>CONVERSACIÓN, INVESTIGACIÓN Y ACCIONES</span><p>{aiConfig?.webSearch?"Con la IA conectada puedes conversar, programar y pedir búsquedas con fuentes.":"Con la IA conectada puedes conversar, programar y preparar enlaces para buscar en Google. La búsqueda web dentro del chat no está conectada con este proveedor."} Los comandos validados se ejecutan en la consola. Gmail, Calendar y Drive necesitan sus propias conexiones para acceder a tus cuentas.</p></div></TabsContent>
      </Tabs>
      <footer className="console-command-bar"><div className="console-ai-controls"><div><Switch id="jarvis-ai" checked={useAI} onCheckedChange={setUseAI} disabled={busy}/><label htmlFor="jarvis-ai">Conversar con IA</label></div><div><Switch id="jarvis-web" checked={useWeb&&Boolean(aiConfig?.webSearch)} onCheckedChange={setUseWeb} disabled={busy||!useAI||!aiConfig?.webSearch}/><label htmlFor="jarvis-web" title={aiConfig?.webSearch?"Permitir consultas web con fuentes":"Este proveedor no tiene un buscador conectado"}>Búsqueda web{aiConfig&&!aiConfig.webSearch?" · sin conectar":""}</label></div><span className={aiState==="connected"?"ai-connected":""}>{aiLabel}</span></div><div className="console-quick-actions">{["Ayúdame a preparar una entrevista de software","Consulta mis repositorios públicos","Temporizador 25 minutos"].map(prompt=><Button variant="ghost" key={prompt} disabled={busy} onClick={()=>prepare(prompt)}>{prompt}<ChevronRight size={12}/></Button>)}</div><form onSubmit={submit}><span className="command-prompt" aria-hidden="true">&gt;_</span><label className="sr-only" htmlFor="jarvis-command">Escribe una orden para J.A.R.V.I.S.</label><Textarea id="jarvis-command" ref={inputRef} value={input} onChange={event=>setInput(event.target.value)} maxLength={6000} rows={1} onFocus={()=>{if(voice.listening||voice.starting)voice.stopAll();}} disabled={busy} placeholder="Escribe una solicitud… o di «Jarvis» con la escucha activada" onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void run(input);}}}/>{busy?<Button type="button" className="console-send" onClick={cancel} aria-label="Cancelar ejecución"><Square size={17}/></Button>:<Button type="submit" className="console-send" disabled={!input.trim()} aria-label="Ejecutar solicitud"><Send size={18}/></Button>}</form><div className="console-bottom-line"><span role="status">{voice.note||(voice.wakeEnabled?"Micrófono habilitado para «Jarvis». Se apaga al ocultar la página.":"El micrófono se activa al pulsar Hablar o habilitar la escucha. El audio puede procesarse en línea.")}</span><span>{useAI?"IA · {providerLabel.toUpperCase()}":"MODO LOCAL · SIN LLAMADAS A IA"}</span></div></footer>
    </DialogContent></Dialog>
  </>;
}

function Connection({title,status,description,active=false,icon,children}:{title:string;status:string;description:string;active?:boolean;icon?:React.ReactNode;children?:React.ReactNode}){
  return <article className="console-connection"><div className="connection-icon">{icon??<Link2 size={19}/>}</div><div><h4>{title}</h4><span className={active?"connection-active":"connection-pending"}>{status}</span><p>{description}</p>{children}</div></article>;
}
