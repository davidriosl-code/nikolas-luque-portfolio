import { normalizeCommand, planPortfolioCommand, type PortfolioAction } from "../portfolio-assistant.ts";

export type JarvisAction = PortfolioAction
  | { type: "timer"; seconds: number; label: string }
  | { type: "timer-control"; operation: "pause" | "resume" | "cancel" | "status"; label: string }
  | { type: "stopwatch"; operation: "start" | "pause" | "reset" | "status"; label: string }
  | { type: "voice"; enabled: boolean; label: string }
  | { type: "wake"; enabled: boolean; label: string }
  | { type: "view"; target: "conversation" | "commands" | "connections"; label: string }
  | { type: "copy-result"; label: string }
  | { type: "download-report"; label: string }
  | { type: "hash"; value: string; label: string }
  | { type: "uuid"; label: string }
  | { type: "github-public"; target: "profile" | "repos"; label: string }
  | { type: "external-link"; href: string; label: string }
  | { type: "calendar-file"; title: string; start: string; minutes: number; label: string };
export type JarvisStep = { reply: string; actions: JarvisAction[] };
export type JarvisPlan = { understood: boolean; reply: string; actions: JarvisAction[]; connections?: boolean; steps?: JarvisStep[] };
export type CatalogCommand = { id: string; category: string; prompt: string; description: string };

const ok = (reply: string, actions: JarvisAction[] = []): JarvisPlan => ({ understood: true, reply, actions });
const invalid = (reply: string): JarvisPlan => ({ understood: false, reply, actions: [] });
const fmt = (value: number) => { if (!Number.isFinite(value)) throw new Error("El resultado excede el rango permitido."); return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 10 }).format(Object.is(value, -0) ? 0 : value); };
const numeric = (value: string) => { const number = Number(value.trim().replace(",", ".")); if (!Number.isFinite(number)) throw new Error("Revisa los números de la solicitud."); return number; };

// A bounded expression parser; user text is never JavaScript or an eval argument.
export function calculate(expression: string): number {
  const source = expression.toLowerCase().replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/\bpor\b/g, "*").replace(/\bmas\b/g, "+").replace(/\bmenos\b/g, "-").replace(/\bentre\b/g, "/").replace(/\s/g, "");
  if (!source || source.length > 300 || !/^[\d.+\-*/^()%a-z]+$/.test(source)) throw new Error("Usa números, paréntesis, +, −, *, /, ^, %, sqrt(), abs() o round().");
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z]+|[()+\-*/^%]/g) ?? [];
  if (tokens.join("") !== source || tokens.length > 160) throw new Error("La expresión no tiene un formato válido.");
  let index = 0; let depth = 0;
  const peek = () => tokens[index];
  function atom(): number {
    if (++depth > 30) throw new Error("Demasiados paréntesis.");
    const token = tokens[index++]; let value: number;
    if (token === "(") { value = sum(); if (tokens[index++] !== ")") throw new Error("Falta cerrar un paréntesis."); }
    else if (token === "pi") value = Math.PI;
    else if (token === "e") value = Math.E;
    else if (["sqrt", "abs", "round", "floor", "ceil"].includes(token)) {
      if (tokens[index++] !== "(") throw new Error("La función necesita paréntesis.");
      const parameter = sum(); if (tokens[index++] !== ")") throw new Error("Falta cerrar la función.");
      const functions: Record<string, (n: number) => number> = { sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil };
      value = functions[token](parameter);
    } else if (token !== undefined && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) value = Number(token);
    else throw new Error("Falta un número o hay un símbolo no permitido.");
    while (peek() === "%") { index++; value /= 100; }
    depth--; return value;
  }
  function power(): number { const left = atom(); if (peek() === "^") { index++; return left ** unary(); } return left; }
  function unary(): number { if (peek() === "+") { index++; return unary(); } if (peek() === "-") { index++; return -unary(); } return power(); }
  function product(): number { let value = unary(); while (peek() === "*" || peek() === "/") { const operator = tokens[index++]; const next = unary(); value = operator === "*" ? value * next : value / next; } return value; }
  function sum(): number { let value = product(); while (peek() === "+" || peek() === "-") { const operator = tokens[index++]; const next = product(); value = operator === "+" ? value + next : value - next; } return value; }
  const result = sum();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error("El resultado no es un número finito. Revisa la expresión y las divisiones entre cero.");
  return result;
}

type Unit = { group: string; factor: number; name: string };
const units: Record<string, Unit> = {};
function addUnit(group: string, factor: number, name: string, aliases: string[]) { aliases.forEach(alias => { units[alias] = { group, factor, name }; }); }
addUnit("length", 1, "m", ["m", "metro", "metros"]); addUnit("length", .01, "cm", ["cm", "centimetros"]); addUnit("length", .001, "mm", ["mm", "milimetros"]); addUnit("length", 1000, "km", ["km", "kilometros"]); addUnit("length", 1609.344, "millas", ["milla", "millas", "mi"]); addUnit("length", .0254, "pulgadas", ["pulgada", "pulgadas", "in"]); addUnit("length", .3048, "pies", ["pie", "pies", "ft"]); addUnit("length", .9144, "yardas", ["yarda", "yardas", "yd"]);
addUnit("mass", 1, "kg", ["kg", "kilogramos", "kilos"]); addUnit("mass", .001, "g", ["g", "gramos"]); addUnit("mass", .000001, "mg", ["mg", "miligramos"]); addUnit("mass", .45359237, "lb", ["lb", "libras"]); addUnit("mass", .028349523125, "oz", ["oz", "onzas"]); addUnit("mass", 1000, "toneladas", ["tonelada", "toneladas", "t"]);
addUnit("time", 1, "segundos", ["s", "segundo", "segundos"]); addUnit("time", 60, "minutos", ["min", "minuto", "minutos"]); addUnit("time", 3600, "horas", ["h", "hora", "horas"]); addUnit("time", 86400, "días", ["dia", "dias"]); addUnit("time", 604800, "semanas", ["semana", "semanas"]);
addUnit("volume", 1, "L", ["l", "litros"]); addUnit("volume", .001, "mL", ["ml", "mililitros"]); addUnit("volume", 3.785411784, "galones US", ["galon", "galones", "gal"]); addUnit("volume", 1000, "m³", ["m3", "m³"]);
addUnit("area", 1, "m²", ["m2", "m²"]); addUnit("area", 10000, "ha", ["ha", "hectareas"]); addUnit("area", 1e6, "km²", ["km2", "km²"]); addUnit("area", .0001, "cm²", ["cm2", "cm²"]);
addUnit("speed", 1, "m/s", ["m/s"]); addUnit("speed", 1/3.6, "km/h", ["km/h", "kph"]); addUnit("speed", .44704, "mph", ["mph"]);
addUnit("data", 1, "bytes", ["byte", "bytes", "b"]); addUnit("data", 1000, "KB", ["kb"]); addUnit("data", 1e6, "MB", ["mb"]); addUnit("data", 1e9, "GB", ["gb"]); addUnit("data", 1024, "KiB", ["kib"]); addUnit("data", 1024**2, "MiB", ["mib"]); addUnit("data", 1024**3, "GiB", ["gib"]); addUnit("data", .125, "bits", ["bit", "bits"]);
addUnit("angle", 1, "radianes", ["rad", "radianes"]); addUnit("angle", Math.PI/180, "grados", ["grados", "deg"]);
export function convert(value: number, fromRaw: string, toRaw: string): string {
  const from = normalizeCommand(fromRaw), to = normalizeCommand(toRaw);
  const temperature: Record<string, string> = { c:"c", celsius:"c", "°c":"c", f:"f", fahrenheit:"f", "°f":"f", k:"k", kelvin:"k" };
  let result: number; let label: string;
  if (temperature[from] && temperature[to]) {
    const celsius = temperature[from] === "c" ? value : temperature[from] === "f" ? (value - 32) * 5/9 : value - 273.15;
    if (celsius < -273.15 - 1e-9) throw new Error("La temperatura está por debajo del cero absoluto.");
    result = temperature[to] === "c" ? celsius : temperature[to] === "f" ? celsius * 9/5 + 32 : celsius + 273.15;
    label = temperature[to] === "k" ? "K" : `°${temperature[to].toUpperCase()}`;
  } else {
    const a = units[from], b = units[to];
    if (!a || !b || a.group !== b.group) throw new Error("Necesito unidades compatibles. Ejemplo: convierte 10 km a millas. No uso tipos de cambio monetario.");
    result = value * a.factor / b.factor; label = b.name;
  }
  if (!Number.isFinite(result)) throw new Error("Ese valor es demasiado grande.");
  return `${fmt(value)} ${fromRaw} = ${fmt(result)} ${label}`;
}

export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Usa una fecha con formato AAAA-MM-DD.");
  const result = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(result.valueOf()) || result.toISOString().slice(0,10) !== value) throw new Error("Esa fecha no existe en el calendario.");
  return result;
}
function textOperation(operation: string, payload: string): string {
  if (!payload.trim()) throw new Error("Escribe el texto después de los dos puntos.");
  switch(operation) {
    case "mayusculas": return payload.toLocaleUpperCase("es");
    case "minusculas": return payload.toLocaleLowerCase("es");
    case "titulo": return payload.toLocaleLowerCase("es").replace(/(^|\s)\p{L}/gu, char => char.toLocaleUpperCase("es"));
    case "slug": return normalizeCommand(payload).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    case "invierte texto": return Array.from(payload).reverse().join("");
    case "limpia espacios": return payload.replace(/\s+/g," ").trim();
    case "cuenta palabras": return `${payload.trim().split(/\s+/u).length} palabras · ${Array.from(payload).length} caracteres · ${payload.split(/\r?\n/).length} líneas.`;
    case "cuenta caracteres": return `${Array.from(payload).length} caracteres (incluye espacios).`;
    case "ordena lineas": return payload.split(/\r?\n/).sort((a,b)=>a.localeCompare(b,"es")).join("\n");
    case "quita duplicados": return [...new Set(payload.split(/\r?\n/).map(line=>line.trim()).filter(Boolean))].join("\n");
    case "codifica url": return encodeURIComponent(payload);
    case "decodifica url": return decodeURIComponent(payload);
    case "codifica base64": return btoa(Array.from(new TextEncoder().encode(payload), byte=>String.fromCharCode(byte)).join(""));
    case "decodifica base64": return new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob(payload),char=>char.charCodeAt(0)));
    case "formatea json": return JSON.stringify(JSON.parse(payload),null,2);
    case "compacta json": return JSON.stringify(JSON.parse(payload));
    case "valida json": { const value = JSON.parse(payload); return `JSON válido. Tipo principal: ${Array.isArray(value)?"array":value===null?"null":typeof value}.`; }
    default: throw new Error("Operación de texto no reconocida.");
  }
}
const textOps = "mayusculas|minusculas|titulo|slug|invierte texto|limpia espacios|cuenta palabras|cuenta caracteres|ordena lineas|quita duplicados|codifica url|decodifica url|codifica base64|decodifica base64|formatea json|compacta json|valida json";

function parseSingle(raw: string, now: Date): JarvisPlan {
  const clean = raw.trim().replace(/^(?:j\.?a\.?r\.?v\.?i\.?s\.?|yarvis)[,\s:]*/i, "");
  const text = normalizeCommand(clean);
  let match: RegExpExecArray | null;
  try {
    const colon = clean.indexOf(":");
    if (colon >= 0 && new RegExp(`^(?:${textOps})$`).test(normalizeCommand(clean.slice(0,colon)))) return ok(textOperation(normalizeCommand(clean.slice(0,colon)),clean.slice(colon+1).trim()));
    if ((match=/^(?:cuanto es |calcula )?(-?[\d.,]+)\s*%\s*de\s*(-?[\d.,]+)[?¿]*$/.exec(text))) return ok(`${match[1]} % de ${match[2]} = ${fmt(numeric(match[1])*numeric(match[2])/100)}`);
    if ((match=/^calcula\s+(.+)$/i.exec(clean))) return ok(`${match[1]} = ${fmt(calculate(normalizeCommand(match[1])))}`);
    if ((match=/^(descuenta|aumenta)\s+([\d.,]+)\s*%\s*(?:a|de)\s*([\d.,]+)$/.exec(text))) { const amount=numeric(match[3]), rate=numeric(match[2]); if(rate<0||rate>10000) throw new Error("Revisa el porcentaje."); const change=amount*rate/100; return ok(`Base: ${fmt(amount)}\n${match[1]==="descuenta"?"Descuento":"Aumento"}: ${fmt(change)}\nResultado: ${fmt(match[1]==="descuenta"?amount-change:amount+change)}`); }
    if ((match=/^(promedio|suma|minimo|maximo|mediana)\s+(?:de\s+)?([\d.,;\s+-]+)$/.exec(text))) {
      const values=match[2].split(/[;\s]+/).filter(Boolean).map(numeric);
      if(!values.length||values.length>200||values.some(value=>!Number.isFinite(value))) throw new Error("Separa los números con espacios. Ejemplo: promedio 10 20 30.");
      const sorted=[...values].sort((a,b)=>a-b); const mid=Math.floor(sorted.length/2);
      const total=values.reduce((a,b)=>a+b,0);
      const result=match[1]==="suma"?total:match[1]==="promedio"?total/values.length:match[1]==="minimo"?sorted[0]:match[1]==="maximo"?sorted.at(-1)!:sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
      return ok(`${match[1]} de ${values.length} valores: ${fmt(result)}`);
    }
    if ((match=/^(?:convierte|convertir)\s+(-?[\d.,]+)\s+(.+?)\s+(?:a|en)\s+(.+)$/.exec(text))) return ok(convert(numeric(match[1]),match[2],match[3]));
    if ((match=/^dias entre (\d{4}-\d{2}-\d{2}) y (\d{4}-\d{2}-\d{2})$/.exec(text))) return ok(`${Math.abs(parseDate(match[2]).valueOf()-parseDate(match[1]).valueOf())/86400000} días entre ${match[1]} y ${match[2]}.`);
    if ((match=/^(suma|resta) (\d{1,5}) dias? (?:a|de) (\d{4}-\d{2}-\d{2})$/.exec(text))) { const date=parseDate(match[3]); date.setUTCDate(date.getUTCDate()+(match[1]==="suma"?1:-1)*Number(match[2])); return ok(`Fecha resultante: ${date.toISOString().slice(0,10)}.`); }
    if ((match=/^que dia cae (\d{4}-\d{2}-\d{2})[?]*$/.exec(text))) return ok(new Intl.DateTimeFormat("es-PE",{dateStyle:"full",timeZone:"UTC"}).format(parseDate(match[1])));
    if (/^(?:que fecha es|fecha de hoy|que dia es hoy)[?]*$/.test(text)) return ok(new Intl.DateTimeFormat("es-PE",{dateStyle:"full",timeZone:"America/Lima"}).format(now));
    if ((match=/^(?:que hora es|hora)(?: en (.+?))?[?]*$/.exec(text))) {
      const zones:Record<string,string>={lima:"America/Lima",arequipa:"America/Lima",peru:"America/Lima",madrid:"Europe/Madrid",londres:"Europe/London",tokio:"Asia/Tokyo","nueva york":"America/New_York","buenos aires":"America/Argentina/Buenos_Aires",santiago:"America/Santiago",bogota:"America/Bogota",mexico:"America/Mexico_City",sydney:"Australia/Sydney",paris:"Europe/Paris",berlin:"Europe/Berlin",utc:"UTC"};
      const city=match[1]??"arequipa"; if(!zones[city]) throw new Error("Prueba con Arequipa, Lima, Madrid, Londres, Nueva York, Tokio, Buenos Aires, Santiago, Bogotá, México, París, Berlín, Sydney o UTC.");
      return ok(`${city}: ${new Intl.DateTimeFormat("es-PE",{timeStyle:"medium",timeZone:zones[city]}).format(now)}. Hora del reloj de tu dispositivo.`);
    }
    if ((match=/^(?:temporizador|enfoque|pomodoro)(?: (?:de |por )?(\d+(?:[.,]\d+)?) (segundos?|s|minutos?|min|horas?|h))?$/.exec(text))) {
      const value=match[1]?numeric(match[1]):25; const unit=match[2]??"minutos"; const seconds=value*(/^h/.test(unit)?3600:/^(min)/.test(unit)?60:1);
      if(seconds<1||seconds>86400) throw new Error("Usa un temporizador de 1 segundo a 24 horas.");
      return ok("Preparando el temporizador. Solo funciona mientras esta página permanece abierta.",[{type:"timer",seconds:Math.round(seconds),label:"Iniciar temporizador"}]);
    }
    if ((match=/^(pausa|reanuda|cancela|estado del) temporizador$/.exec(text))) { const map={pausa:"pause",reanuda:"resume",cancela:"cancel","estado del":"status"} as const; return ok("Comprobando el temporizador.",[{type:"timer-control",operation:map[match[1] as keyof typeof map],label:clean}]); }
    if ((match=/^(inicia|pausa|reinicia|estado del) cronometro$/.exec(text))) { const map={inicia:"start",pausa:"pause",reinicia:"reset","estado del":"status"} as const; return ok("Comprobando el cronómetro.",[{type:"stopwatch",operation:map[match[1] as keyof typeof map],label:clean}]); }
    if (/^(activa|enciende) (la )?voz$/.test(text)) return ok("Voz activada. Procuraré decir algo útil.",[{type:"voice",enabled:true,label:"Activar respuestas habladas"}]);
    if (/^(desactiva|apaga|silencia) (la )?voz$/.test(text)) return ok("Respuestas por escrito.",[{type:"voice",enabled:false,label:"Silenciar respuestas"}]);
    if (/^(activa|inicia) (la )?escucha$/.test(text)) return ok("Activando la escucha por «Jarvis», mientras esta página está visible.",[{type:"wake",enabled:true,label:"Activar palabra de llamada"}]);
    if (/^(desactiva|deten|apaga) (la )?escucha$/.test(text)) return ok("Escucha desactivada.",[{type:"wake",enabled:false,label:"Detener escucha"}]);
    if (/^(abre|muestra|ver) (el )?(catalogo|comandos)$/.test(text)) return ok("Catálogo abierto. Puedes filtrar, buscar o probar cualquier ejemplo.",[{type:"view",target:"commands",label:"Abrir catálogo"}]);
    if (/^(abre|muestra|ver) (las )?conexiones$/.test(text)) return ok("Estado de las conexiones.",[{type:"view",target:"connections",label:"Ver conexiones"}]);
    if (/^copia (el |la )?(resultado|ultima respuesta)$/.test(text)) return ok("Intentando copiar la última respuesta.",[{type:"copy-result",label:"Copiar último resultado"}]);
    if (/^(exporta|descarga) (el )?(reporte|historial|conversacion)$/.test(text)) return ok("Preparando el reporte de esta sesión.",[{type:"download-report",label:"Descargar reporte"}]);
    if (/^(genera|crea) (un )?uuid$/.test(text)) return ok("Generando un identificador UUID v4.",[{type:"uuid",label:"Generar UUID"}]);
    if ((match=/^sha256\s*:\s*([\s\S]+)$/i.exec(clean))) return ok("Calculando SHA-256 en este dispositivo.",[{type:"hash",value:match[1],label:"Calcular SHA-256"}]);
    if (/^(consulta|muestra|lee) (mis |los )?repositorios( publicos)?$/.test(text)) return ok("Consultaré los repositorios públicos de davidriosl-code en GitHub.",[{type:"github-public",target:"repos",label:"Consultar GitHub público"}]);
    if (/^consulta (mi |el )?perfil( publico)? de github$/.test(text)) return ok("Consultaré el perfil público de davidriosl-code.",[{type:"github-public",target:"profile",label:"Consultar perfil público"}]);
    if ((match=/^(?:busca en (google|github|youtube)|documentacion de)\s*:\s*([\s\S]+)$/i.exec(clean))) {
      const provider=match[1]?.toLowerCase()??"google"; const query=match[1]?match[2]:`${match[2]} documentación oficial`;
      const base=provider==="github"?"https://github.com/search?q=":provider==="youtube"?"https://www.youtube.com/results?search_query=":"https://www.google.com/search?q=";
      return ok("Búsqueda preparada para abrirla. No he leído ni investigado los resultados.",[{type:"external-link",href:base+encodeURIComponent(query),label:`Buscar en ${provider}`}]);
    }
    if ((match=/^borrador correo\s*:\s*([^|]+)\|([^|]+)\|([\s\S]+)$/i.exec(clean))) {
      const recipient=match[1].trim(); if(!/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(recipient)) throw new Error("Revisa el correo del destinatario.");
      return ok("Borrador preparado para tu aplicación de correo. No se ha enviado ningún mensaje.",[{type:"external-link",label:"Revisar borrador de correo",href:`mailto:${recipient}?subject=${encodeURIComponent(match[2].trim())}&body=${encodeURIComponent(match[3].trim())}`}]);
    }
    if ((match=/^evento\s*:\s*([^|]+)\|\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\|\s*(\d{1,4})$/i.exec(clean))) {
      parseDate(match[2]); const [hours,minutes]=match[3].split(":").map(Number); const duration=Number(match[4]);
      if(hours>23||minutes>59||duration<1||duration>1440) throw new Error("Revisa la hora (00:00–23:59) y la duración (1–1440 minutos).");
      return ok("Archivo de calendario preparado con hora de Perú. Tendrás que importarlo en tu calendario; todavía no he creado ninguna cita en una cuenta.",[{type:"calendar-file",title:match[1].trim(),start:`${match[2]}T${match[3]}:00-05:00`,minutes:duration,label:"Preparar evento .ics"}]);
    }
    if (/^(hola|buenas|ayuda|que puedes hacer|que haces|comandos)[!.?¿ ]*$/.test(text)) return ok("A tu servicio. Puedo calcular, convertir unidades, trabajar con texto y JSON, consultar GitHub público, controlar temporizadores y recorrer el portafolio. Usa el catálogo para ver ejemplos. La IA libre y tus cuentas privadas aún necesitan conexión.");
    return planPortfolioCommand(clean);
  } catch(error) { return invalid(error instanceof Error?error.message:"No pude interpretar esa orden. Revisa el formato del catálogo."); }
}

// Explicit >> sequences preserve punctuation/newlines inside JSON and text payloads.
export function planJarvisCommand(input: string, now = new Date()): JarvisPlan {
  if(input.length>6000) return invalid("Usa un máximo de 6.000 caracteres por solicitud.");
  const parts = input.split(/\s+>>\s+|\s+y luego\s+(?=(?:calcula|convierte|copia|muestrame|muéstrame|abre|temporizador|consulta|activa|desactiva)\b)/i).map(part=>part.trim()).filter(Boolean);
  if(parts.length>8) return invalid("Puedo ejecutar hasta ocho pasos por solicitud. Divide esta secuencia en dos.");
  if(!parts.length) return invalid("Escribe una orden o pulsa el micrófono.");
  const plans=parts.map(part=>parseSingle(part,now)); const failed=plans.find(plan=>!plan.understood);
  if(failed) return { ...failed,actions:[],reply:parts.length>1?`No he iniciado la secuencia. ${failed.reply}`:failed.reply };
  const actions=plans.flatMap(plan=>plan.actions);
  if(actions.length>8) return invalid("Puedo ejecutar hasta ocho acciones por solicitud. Divide esta secuencia en dos.");
  return {understood:true,reply:plans.map(plan=>plan.reply).join("\n\n"),actions,connections:plans.some(plan=>plan.connections),steps:plans.map(({reply,actions})=>({reply,actions}))};
}

function buildCatalog(): CatalogCommand[] {
  const rows:Omit<CatalogCommand,"id">[]=[];
  const add=(category:string,prompt:string,description:string)=>rows.push({category,prompt,description});
  const techs=["HTML5","CSS3","JavaScript","React","Django","Python","PHP","Laravel","Node.js","Express","APIs REST","Kotlin","Jetpack Compose","Java","Gradle","SQL","Oracle","MongoDB","Power BI","Git","Docker","Bash","CI/CD","Visual Studio Code","PyCharm","Photoshop","Excel"];
  for(const tech of techs) { add("Portafolio",`Muéstrame ${tech}`,"Selecciona su área en el stack."); add("Portafolio",`¿Qué sabe de ${tech}?`,"Consulta el perfil publicado de Nikolas."); }
  for(const section of ["inicio","perfil","capacidades","stack","valor diferencial","contacto"]) add("Portafolio",`Muéstrame ${section}`,"Navega a esta sección del portafolio.");
  for(const command of ["Copia el correo","Copia el teléfono","Abre GitHub","Abre LinkedIn","Abre WhatsApp","Resume el perfil","Valor diferencial"]) add("Portafolio",command,"Perfil y contacto de Nikolas.");
  const expressions=["125 + 375","950 - 220","24 * 18","144 / 12","(150 + 50) * 3","2 ^ 10","sqrt(144)","abs(-73)","round(3.75)","floor(9.8)","ceil(9.1)","pi * 5 ^ 2","(1200 * 18%) + 1200","365 * 24","(70 + 85 + 90) / 3","(350 - 220) / 350 * 100","8 ^ 3","1250 / 30","(12 * 40) + 80","450 * 0.15","1024 * 1024","3600 / 60","17 * 23","(90 - 30) / 4","sqrt(81) + sqrt(16)","2 ^ (3 + 2)","9 / (3 + 6)","-5 + 12","0.5 * 80","1000 * (1 + 10%)"];
  expressions.forEach(expression=>add("Cálculos",`Calcula ${expression}`,"Opera con números, funciones y paréntesis."));
  for(const rate of [5,10,15,18,20,25,30,50]) { add("Cálculos",`${rate}% de 850`,"Calcula una proporción."); add("Cálculos",`Descuenta ${rate}% a 1200`,"Calcula base, descuento y resultado."); add("Cálculos",`Aumenta ${rate}% a 500`,"Calcula base, aumento y resultado."); }
  for(const operation of ["Promedio","Suma","Mínimo","Máximo","Mediana"]) for(const numbers of ["10 20 30 40","8 15 12 22 18"]) add("Cálculos",`${operation} ${numbers}`,"Resume una lista de números.");
  const pairs=[["km","millas"],["millas","km"],["m","cm"],["cm","pulgadas"],["pies","m"],["yardas","m"],["mm","cm"],["kg","libras"],["libras","kg"],["g","kg"],["onzas","g"],["toneladas","kg"],["horas","minutos"],["minutos","segundos"],["días","horas"],["semanas","días"],["litros","ml"],["galones","litros"],["m3","litros"],["m2","cm2"],["hectareas","m2"],["km/h","m/s"],["mph","km/h"],["MB","KB"],["MiB","KiB"],["GB","MB"],["GiB","MiB"],["bytes","bits"],["celsius","fahrenheit"],["fahrenheit","celsius"],["kelvin","celsius"],["grados","radianes"]];
  for(const [from,to] of pairs) for(const value of [10,100]) add("Conversiones",`Convierte ${value} ${from} a ${to}`,"Convierte unidades compatibles, sin conexión.");
  for(const operation of ["Mayúsculas","Minúsculas","Título","Slug","Invierte texto","Limpia espacios","Cuenta palabras","Cuenta caracteres","Codifica URL","Codifica Base64"]) for(const value of ["Nikolas Luque","Desarrollo de software","Una idea con futuro"]) add("Texto y código",`${operation}: ${value}`,"Transforma el texto en tu dispositivo.");
  for(const operation of ["Formatea JSON","Compacta JSON","Valida JSON"]) for(const value of ['{"nombre":"Nikolas","stack":["Kotlin","Django"]}','[1,2,3,{"activo":true}]','{"proyecto":"Portafolio","version":2}']) add("Texto y código",`${operation}: ${value}`,"Comprueba o transforma JSON sin ejecutarlo.");
  for(const command of ["Decodifica Base64: SG9sYSwgTmlrb2xhcy4=","Decodifica URL: Hola%20Nikolas","Ordena líneas: Python\nKotlin\nDjango","Quita duplicados: React\nReact\nKotlin","Genera un UUID","SHA256: Hola Nikolas","SHA256: Mi proyecto de software"]) add("Texto y código",command,"Utilidades de desarrollo en el navegador.");
  for(const city of ["Arequipa","Lima","Madrid","Londres","Nueva York","Tokio","Buenos Aires","Santiago","Bogotá","México","París","Berlín","Sydney","UTC"]) add("Fechas y hora",`Hora en ${city}`,"Usa el reloj del dispositivo y la zona horaria indicada.");
  add("Fechas y hora","Fecha de hoy","Fecha actual en Perú.");
  for(const days of [1,7,15,30,60,90]) { add("Fechas y hora",`Suma ${days} ${days===1?"día":"días"} a 2026-10-01`,"Calcula una fecha futura."); add("Fechas y hora",`Resta ${days} ${days===1?"día":"días"} de 2026-12-31`,"Calcula una fecha anterior."); }
  for(const date of ["2026-10-01","2026-12-25","2027-01-01","2028-02-29"]) { add("Fechas y hora",`Qué día cae ${date}`,"Consulta el día de la semana."); add("Fechas y hora",`Días entre 2026-09-24 y ${date}`,"Calcula la distancia entre dos fechas."); }
  for(const minutes of [1,2,3,5,10,15,20,25,30,45,60,90]) add("Enfoque",`Temporizador ${minutes} minutos`,"Cuenta atrás en esta pestaña; no es una alarma del sistema.");
  for(const command of ["Pomodoro","Enfoque 50 minutos","Pausa temporizador","Reanuda temporizador","Cancela temporizador","Estado del temporizador","Inicia cronómetro","Pausa cronómetro","Reinicia cronómetro","Estado del cronómetro"]) add("Enfoque",command,"Controla tu sesión de trabajo.");
  for(const command of ["Activa voz","Desactiva voz","Activa escucha","Detén escucha","Abre comandos","Abre conexiones","Copia el resultado","Exporta reporte"]) add("Consola",command,"Configura voz, consulta funciones o exporta esta sesión.");
  for(const command of ["Consulta mis repositorios públicos","Consulta mi perfil de GitHub"]) add("Web y enlaces",command,"Consulta datos públicos; no usa una cuenta privada.");
  for(const topic of ["Kotlin Compose","Django ORM","React componentes","Python documentación","SQL consultas","Docker fundamentos","Git ramas","Laravel rutas"]) { add("Web y enlaces",`Documentación de: ${topic}`,"Prepara una búsqueda para que abras los resultados."); add("Web y enlaces",`Busca en GitHub: ${topic}`,"Prepara un enlace de búsqueda; no lee resultados."); }
  add("Web y enlaces","Borrador correo: equipo@empresa.com | Presentación | Hola, soy Nikolas Luque. Me gustaría conversar sobre una oportunidad.","Abre un borrador en tu correo; no envía mensajes.");
  add("Web y enlaces","Evento: Entrevista | 2026-10-05 10:00 | 45","Genera un archivo .ics para importar, en hora de Perú.");
  for(const tech of ["Kotlin","React","Django","SQL","Docker","Photoshop"]) add("Secuencias",`Muéstrame ${tech} >> Copia el correo`,"Ejecuta dos acciones en orden.");
  for(const minutes of [5,15,25,45]) add("Secuencias",`Calcula 24 * 18 >> Temporizador ${minutes} minutos`,"Calcula y empieza una sesión de enfoque.");
  return rows.map((row,index)=>({...row,id:`command-${index+1}`}));
}
export const commandCatalog = buildCatalog();
export const catalogCategories = ["Todos", ...new Set(commandCatalog.map(command=>command.category))];
