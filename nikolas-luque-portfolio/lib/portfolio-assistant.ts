export const portfolioContact = {
  email: "driosluque@gmail.com",
  phone: "+51 974 988 237",
  github: "https://github.com/davidriosl-code",
  linkedin: "https://www.linkedin.com/in/nikolas-r%C3%ADos-luque-510a641a2/",
  whatsapp: "https://wa.me/51974988237?text=Hola%20Nikolas%2C%20me%20gustar%C3%ADa%20conversar%20contigo%20sobre%20una%20oportunidad.",
} as const;

export type StackId = "web" | "backend" | "android" | "datos" | "flujo" | "herramientas";
export type SectionId = "inicio" | "sobre-mi" | "capacidades" | "stack" | "valor-diferencial" | "contacto";
export type PortfolioAction =
  | { type: "navigate"; target: SectionId; label: string }
  | { type: "stack"; target: StackId; label: string }
  | { type: "copy"; target: "email" | "phone"; label: string }
  | { type: "link"; target: "github" | "linkedin" | "whatsapp" | "email"; label: string };
export type AssistantPlan = { reply: string; actions: PortfolioAction[]; understood: boolean; connections?: boolean };

const knowledge: Record<StackId, string> = {
  web: "Nikolas construye interfaces con HTML5, CSS3, JavaScript y React. Su enfoque es que la estructura, el diseño y la interacción sean fáciles de entender.",
  backend: "Trabaja con Python, Django, PHP y Laravel, además de Node.js y Express. Consume e integra APIs REST para conectar datos y servicios.",
  android: "Desarrolla interfaces Android con Kotlin y Jetpack Compose. Su formación también incluye Java y Gradle.",
  datos: "Utiliza SQL, Oracle y MongoDB para organizar y consultar información. Con Power BI transforma datos en visualizaciones útiles para un negocio.",
  flujo: "Organiza el código con Git y GitHub. Tiene fundamentos de Docker, Bash y CI/CD. Fundamentos significa fundamentos: aquí no inflamos el currículum.",
  herramientas: "Desarrolla con Visual Studio Code y PyCharm; complementa su trabajo con Adobe Photoshop y Microsoft Excel.",
};
const aliases: { target: StackId; label: string; pattern: RegExp }[] = [
  { target: "web", label: "Frontend", pattern: /\b(react|html5?|css3?|javascript|frontend|front end)\b/ },
  { target: "backend", label: "Backend", pattern: /\b(django|python|php|laravel|node(?:\.js)?|express|api|apis|backend|back end)\b/ },
  { target: "android", label: "Android", pattern: /\b(kotlin|java|android|compose|gradle)\b/ },
  { target: "datos", label: "Datos", pattern: /\b(sql|oracle|mongodb|power bi|datos)\b/ },
  { target: "flujo", label: "Control y despliegue", pattern: /\b(git|github|docker|bash|ci\/cd|despliegue)\b/ },
  { target: "herramientas", label: "Herramientas", pattern: /\b(vs code|visual studio|pycharm|photoshop|excel|herramientas)\b/ },
];
export function normalizeCommand(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function parsePart(raw: string): AssistantPlan {
  const text = normalizeCommand(raw).replace(/j\.?a\.?r\.?v\.?i\.?s\.?[, ]*/g, "").trim();
  const answer = (reply: string): AssistantPlan => ({ reply, actions: [], understood: true });
  const action = (item: PortfolioAction, reply = "Orden recibida. Vamos por partes."): AssistantPlan => ({ reply, actions: [item], understood: true });
  if (!text || /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey)[!.? ]*$/.test(text)) {
    return answer("A tu servicio. Puedo explicarte el perfil de Nikolas, mostrar sus tecnologías o copiar sus datos de contacto. Sin discursos de tres horas. Salvo que los pidas.");
  }
  // Never reinterpret destructive, external, or negated instructions as navigation.
  if (/\b(no|nunca|borra|borres|elimina|borrar|eliminar|paga|compra|publica|ejecuta codigo|envia|enviar|manda|programa|agenda|reserva|busca en internet|investiga|lee mis|lee mi|abre mis|abre mi)\b/.test(text)) {
    return { reply: "Esa orden no está disponible en el modo de comandos del portafolio. Las tareas con IA, correo, calendario o archivos necesitan conexiones propias de esta web; todavía no están vinculadas. No he ejecutado ninguna acción.", actions: [], understood: false, connections: true };
  }
  if (/\b(conexion|conexiones|conectores|conectar|permisos|cuenta|cuentas|gmail|calendario|drive|documentos|agente autonomo|inteligencia artificial|openai)\b|que herramientas (tienes|ves|puedes)/.test(text)) {
    return { ...answer("En esta web están disponibles los comandos del portafolio y la voz del navegador, si es compatible. La IA y los accesos a correo, calendario y archivos aún no están configurados. Los conectores de ChatGPT no se transfieren automáticamente aquí."), connections: true };
  }
  if (/\bcopia\b/.test(text)) {
    if (/\b(correo|email|e-mail)\b/.test(text)) return action({ type: "copy", target: "email", label: "Copiar correo" });
    if (/\b(telefono|numero|celular)\b/.test(text)) return action({ type: "copy", target: "phone", label: "Copiar teléfono" });
  }
  if (/\b(abre|abrir|ver|visita|ir|muestra|muestrame)\b/.test(text)) {
    const target = /\bgithub\b/.test(text) ? "github" : /\blinkedin\b/.test(text) ? "linkedin" : /\bwhatsapp\b/.test(text) ? "whatsapp" : null;
    if (target) return action({ type: "link", target, label: target === "github" ? "GitHub" : target === "linkedin" ? "LinkedIn" : "WhatsApp" }, "Te dejo el enlace verificado. Ábrelo cuando quieras.");
  }
  const wantsNavigation = /\b(muestra|muestrame|ver|lleva|llevame|ir|ve|abre|abrir|explorar|explora|selecciona|inicio|sube|baja)\b/.test(text);
  if (/\b(valor diferencial|diferencial|diferencia|diferente|negocio|destaca|contratar)\b/.test(text)) {
    if (wantsNavigation) return action({ type: "navigate", target: "valor-diferencial", label: "Ver valor diferencial" });
    return answer("Su valor diferencial es conectar software y negocio: combina desarrollo con experiencia en marketing digital, ventas y emprendimientos. Eso le ayuda a pensar en el cliente, entender la operación y dar una utilidad concreta a interfaces y datos.");
  }
  if (/\b(resumen|presenta|presentacion|quien es|quien eres|sobre nikolas|perfil|sobre mi|conocelo)\b/.test(text)) {
    if (wantsNavigation) return action({ type: "navigate", target: "sobre-mi", label: "Ver perfil" });
    return answer("Nikolas Luque estudia Diseño y Desarrollo de Software en Arequipa, Perú. Su perfil reúne desarrollo web, Android y datos, con una perspectiva práctica de marketing, ventas y emprendimiento. Tecnología con un motivo, no solo con un nombre complicado.");
  }
  if (/\b(contacto|contactar|correo|email|telefono|numero|celular)\b/.test(text)) {
    if (wantsNavigation) return action({ type: "navigate", target: "contacto", label: "Ver contacto" });
    return answer(`Puedes escribirle a ${portfolioContact.email} o llamarlo al ${portfolioContact.phone}. También tiene enlaces directos a WhatsApp, GitHub y LinkedIn.`);
  }
  const matched = aliases.filter(item => item.pattern.test(text));
  if (matched.length) {
    // A single visible stack can be selected. Knowledge questions may cover many areas.
    if (wantsNavigation) {
      if (matched.length > 1) return { reply: "Puedo mostrar un área a la vez. Prueba «muéstrame React y luego muéstrame Kotlin».", actions: [], understood: false };
      return action({ type: "stack", target: matched[0].target, label: `Mostrar ${matched[0].label}` }, knowledge[matched[0].target]);
    }
    return answer(matched.map(item => knowledge[item.target]).join("\n\n"));
  }
  if (/\b(inicio|arriba|sube)\b/.test(text)) return action({ type: "navigate", target: "inicio", label: "Volver al inicio" });
  if (/\b(capacidades|que sabe|que hace|habilidades|tecnologias|stack|lenguajes|entornos)\b/.test(text)) {
    if (wantsNavigation) return action({ type: "navigate", target: /\b(stack|tecnologias|lenguajes|entornos)\b/.test(text) ? "stack" : "capacidades", label: "Mostrar capacidades y tecnologías" });
    return answer("Su stack se organiza en frontend, backend, Android, datos, control y despliegue, y herramientas. Puedo explicarte cada área: pregunta por React, Django, Kotlin, SQL, Docker o Photoshop.");
  }
  if (/\b(ayuda|comandos|que puedes|que haces|escuchar|voz|multitarea)\b/.test(text)) {
    return answer("Puedes decir «muéstrame Kotlin», «¿cuál es su valor diferencial?» o «copia el correo». También puedes encadenar: «muéstrame React y copia el correo». En este modo reconozco comandos definidos; la conversación libre con IA requiere la conexión pendiente.");
  }
  if (/\b(gracias|genial|perfecto|excelente)\b/.test(text)) return answer("Para servirte. La eficiencia también puede tener buenos modales.");
  return { reply: "Todavía estoy en modo de comandos del portafolio. Prueba «muéstrame Kotlin», «resume el perfil» o «copia el correo». La conversación libre y las tareas externas estarán disponibles cuando se configure la conexión de IA.", actions: [], understood: false };
}

export function planPortfolioCommand(input: string): AssistantPlan {
  if (input.length > 1200) return { reply: "La orden es demasiado larga. Escribe hasta 1.200 caracteres.", actions: [], understood: false };
  const parts = input.split(/\s+(?:y\s+(?:luego\s+)?|luego\s+|despu[eé]s\s+)(?=(?:copia|mu[eé]strame|muestra|abre|ve|ll[eé]vame|selecciona)\b)|[;\n]+/i).filter(part => part.trim());
  if (parts.length > 4) return { reply: "Vamos con un máximo de cuatro instrucciones por turno. Incluso un asistente necesita orden.", actions: [], understood: false };
  const plans = parts.map(parsePart);
  const unsupported = plans.find(plan => !plan.understood);
  if (unsupported) return { ...unsupported, actions: [], reply: parts.length > 1 ? `No he iniciado la secuencia. ${unsupported.reply}` : unsupported.reply };
  if (!plans.length) return parsePart("");
  return { understood: true, reply: [...new Set(plans.map(plan => plan.reply))].join("\n\n"), actions: plans.flatMap(plan => plan.actions), connections: plans.some(plan => plan.connections) };
}
