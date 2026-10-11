import {AIError} from "./openai.ts";

const activity=new Map<string,{since:number;count:number;busy:boolean}>();
// A per-worker burst/concurrency guard, not a substitute for Platform spend limits.
export function beginRequest(id:string):()=>void {
  const now=Date.now();
  if(activity.size>1000)for(const [key,value] of activity)if(now-value.since>60000&&!value.busy)activity.delete(key);
  let entry=activity.get(id);
  if(entry?.busy)throw new AIError("busy","Ya hay una respuesta en curso. Espera a que termine.",429);
  if(!entry||now-entry.since>=60000){entry={since:now,count:0,busy:false};activity.set(id,entry);}
  if(entry.count>=8)throw new AIError("rate_limit","Has realizado varias solicitudes seguidas. Espera un minuto.",429);
  entry.count++;entry.busy=true;const current=entry;
  return()=>{current.busy=false;};
}

export function checkOrigin(request:Request):void {
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)throw new AIError("forbidden","La solicitud debe iniciarse desde esta página.",403);
  if(request.headers.get("sec-fetch-site")==="cross-site")throw new AIError("forbidden","La solicitud debe iniciarse desde esta página.",403);
}

export async function readBody(request:Request):Promise<unknown> {
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new AIError("invalid_input","Se requiere una solicitud JSON.",415);
  if(Number(request.headers.get("content-length"))>60000)throw new AIError("invalid_input","La solicitud es demasiado larga.",413);
  const reader=request.body?.getReader();if(!reader)throw new AIError("invalid_input","Falta la solicitud.",400);
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>60000){await reader.cancel();throw new AIError("invalid_input","La solicitud es demasiado larga.",413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new AIError("invalid_input","El JSON de la solicitud no es válido.",400);}
}
