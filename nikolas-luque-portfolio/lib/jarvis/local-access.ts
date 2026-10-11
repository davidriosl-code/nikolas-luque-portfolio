import {AIError} from "./openai.ts";

/** Public clones do not inherit authentication from the original private host. */
export function localAIAllowed(request:Request):boolean {
  if(process.env.NODE_ENV!=="development"||process.env.JARVIS_ENABLE_LOCAL_AI!=="true")return false;
  const hostname=new URL(request.url).hostname.replace(/^\[|\]$/g,"");
  return ["localhost","127.0.0.1","::1"].includes(hostname);
}

export function requireLocalAI(request:Request):string {
  if(!localAIAllowed(request))throw new AIError("local_ai_only","La IA externa de esta edición se activa en desarrollo local. Los comandos del portafolio siguen disponibles.",403);
  return "local-developer";
}
