// Server-side NVIDIA API adapter. The key never enters the browser or a prompt.
import {AIError,jarvisInstructions,validateAnswerText,type AIAnswer,type AIHistory} from "./openai.ts";

export const NVIDIA_MODEL="nvidia/nemotron-3-super-120b-a12b";
export const NVIDIA_LIGHTNING_MODEL="nvidia/nemotron-3.5-lightning-30b-a3b";
const models:Record<string,string>={[NVIDIA_MODEL]:"Nemotron 3 Super",[NVIDIA_LIGHTNING_MODEL]:"Nemotron 3.5 Lightning"};
const NVIDIA_ENDPOINT="https://integrate.api.nvidia.com/v1/chat/completions";

export function nvidiaModel():{id:string;label:string} {
  const id=process.env.NVIDIA_MODEL?.trim()||NVIDIA_MODEL;
  if(!Object.hasOwn(models,id))throw new AIError("invalid_model","El modelo de NVIDIA configurado no es compatible con esta versión del sitio.",503);
  return {id,label:models[id]};
}

export function nvidiaApiKey():string {
  const key=process.env.NVIDIA_API_KEY?.trim();
  if(!key)throw new AIError("missing_key","Guarda NVIDIA_API_KEY como secreto del sitio y aplica la configuración para conectar NVIDIA.",503);
  if(key.length>4096||/[^\x21-\x7e]|["'`]/.test(key))throw new AIError("invalid_key_format","NVIDIA_API_KEY debe contener únicamente la clave de API, sin espacios, saltos de línea, comillas ni código de ejemplo. Corrige el secreto y aplica la configuración.",503);
  return key;
}

export async function requestNVIDIA(messages:{role:"system"|"user"|"assistant";content:string}[],maxTokens:number,signal?:AbortSignal):Promise<{reply:string;commands:string[]}> {
  const key=nvidiaApiKey();
  const model=nvidiaModel();
  const timeout=AbortSignal.timeout(110000);
  const requestSignal=signal?AbortSignal.any([signal,timeout]):timeout;
  let response:Response;
  try{
    response=await fetch(NVIDIA_ENDPOINT,{
      method:"POST",redirect:"manual",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({model:model.id,messages,temperature:1,top_p:0.95,max_tokens:maxTokens,stream:false}),
      signal:requestSignal,
    });
  }catch(error){
    if(signal?.aborted)throw new AIError("cancelled","Solicitud cancelada.",499);
    if(timeout.aborted)throw new AIError("connection_timeout","NVIDIA no respondió a tiempo. Prueba de nuevo con una solicitud más breve.",504);
    const message=error instanceof Error?error.message:"";
    // Log only an allowlisted diagnosis, never the error, request or key.
    const diagnosis=/header|ByteString/i.test(message)?"request_headers":/redirect/i.test(message)?"redirect":/not allowed|not permitted|blocked|denied/i.test(message)?"network_policy":/dns|resolve/i.test(message)?"dns":/tls|certificate|ssl/i.test(message)?"tls":"network";
    console.error("NVIDIA connection failed",{diagnosis});
    throw new AIError(`connection_${diagnosis}`,"No se pudo establecer la conexión con NVIDIA. Los comandos locales siguen disponibles.",502);
  }
  // Do not expose provider error bodies: they can contain credential fragments.
  if(!response.ok){
    const errorBody=await response.json().catch(()=>null);
    const diagnosticText=JSON.stringify(errorBody).toLowerCase();
    const fields=["model","messages","temperature","top_p","max_tokens","stream","chat_template_kwargs"].filter(field=>diagnosticText.includes(field));
    const reasons=["extra_forbidden","invalid_request_error","unsupported","not found","unavailable","capacity","quota"].filter(reason=>diagnosticText.includes(reason));
    console.error("NVIDIA request rejected",{status:response.status,fields,reasons});
    // Manual mode works across Worker versions and never forwards the key
    // to a redirect target. A redirect is an error, not a second request.
    if(response.status>=300&&response.status<400)throw new AIError("provider_redirect","NVIDIA devolvió una redirección inesperada. No se completó la conexión.");
    if(response.status===401)throw new AIError("invalid_key","NVIDIA rechazó la clave. Revisa que NVIDIA_API_KEY contenga una clave activa de NVIDIA API Catalog.",401);
    if(response.status===403||response.status===404)throw new AIError("model_access",`NVIDIA no permite usar ${model.label} con esta clave. Revisa el acceso al modelo en build.nvidia.com.`,403);
    if(response.status===402)throw new AIError("insufficient_quota","NVIDIA indica un problema de cuota o facturación. Revisa la cuenta vinculada a la clave.",402);
    if(response.status===429){
      const seconds=Number(response.headers.get("retry-after"));
      const wait=Number.isFinite(seconds)&&seconds>0&&seconds<=86400?`Espera al menos ${Math.ceil(seconds)} segundos antes de reintentar.`:"Espera un momento y revisa los límites de tu cuenta si persiste.";
      throw new AIError("rate_limit",`NVIDIA ha limitado las solicitudes. ${wait}`,429);
    }
    if(response.status===503)throw new AIError("service_unavailable",`El servicio de NVIDIA para ${model.label} no está disponible en este momento (503). Prueba más tarde; los comandos locales siguen funcionando.`,503);
    throw new AIError(`provider_error_${response.status}`,"NVIDIA no pudo completar la solicitud. No se ejecutaron acciones del asistente.");
  }
  const data=await response.json().catch(()=>null) as {choices?:{finish_reason?:string;message?:{content?:unknown;refusal?:unknown;tool_calls?:unknown[]}}[]}|null;
  signal?.throwIfAborted();
  const choice=Array.isArray(data?.choices)?data.choices[0]:undefined;
  if(choice?.finish_reason==="length")throw new AIError("incomplete","La respuesta de NVIDIA alcanzó su límite. Divide la solicitud en pasos más pequeños; no se ejecutaron acciones.");
  if(choice?.finish_reason==="content_filter"||choice?.message?.refusal)throw new AIError("refused","NVIDIA no puede responder a esa solicitud. Prueba con otra petición.",422);
  if(choice?.finish_reason!=="stop"||choice.message?.tool_calls?.length||typeof choice.message?.content!=="string")throw new AIError("invalid_response","NVIDIA devolvió una respuesta que no pude interpretar. No se ejecutaron acciones.");
  // Some models wrap otherwise valid JSON in a single Markdown code fence.
  // Never interpret reasoning_content, tool calls or arbitrary text as commands.
  const text=choice.message.content.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i,"$1");
  return validateAnswerText(text);
}

export async function askNVIDIA(history:AIHistory,signal?:AbortSignal):Promise<AIAnswer> {
  const model=nvidiaModel();
  const date=new Intl.DateTimeFormat("es-PE",{dateStyle:"full",timeStyle:"short",timeZone:"America/Lima"}).format(new Date());
  const system=`${jarvisInstructions}\nProveedor actual: NVIDIA, modelo ${model.label}. No eres GPT-6 ni OpenAI. No tienes buscador web en esta conexión: no afirmes haber consultado fuentes actuales. Si necesitan datos actuales, puedes preparar un enlace de búsqueda para que el usuario lo abra.\nFecha y hora en Perú: ${date}.\nDevuelve únicamente un objeto JSON válido con exactamente reply (texto de la respuesta) y commands (lista de órdenes o []). No uses bloques Markdown alrededor del JSON. Ejemplo: {"reply":"A tu servicio, Nikolas.","commands":[]}`;
  const answer=await requestNVIDIA([{role:"system",content:system},...history],6000,signal);
  return {...answer,model:model.id,sources:[],searched:false};
}

export async function checkNVIDIA(signal?:AbortSignal):Promise<string> {
  const answer=await requestNVIDIA([
    {role:"system",content:'Devuelve únicamente JSON válido con los campos reply (string) y commands (array vacío). No uses Markdown ni propongas acciones.'},
    {role:"user",content:'En reply escribe: Conexión verificada con NVIDIA. J.A.R.V.I.S. está listo. Usa commands: [].'},
  ],1024,signal);
  if(answer.commands.length)throw new AIError("invalid_response","La comprobación de NVIDIA no devolvió el formato esperado.");
  return answer.reply.slice(0,500);
}
