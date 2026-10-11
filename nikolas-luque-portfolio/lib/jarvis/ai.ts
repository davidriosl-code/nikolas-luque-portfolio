import {AIError,AI_MODEL,askJarvis as askOpenAI,checkJarvis as checkOpenAI,type AIAnswer,type AIHistory} from "./openai.ts";
import {nvidiaModel,askNVIDIA,checkNVIDIA} from "./nvidia.ts";

export type AIConfiguration={provider:"openai"|"nvidia";providerLabel:string;model:string;modelLabel:string;webSearch:boolean;configured:boolean;keyName:string};
export type ProviderAnswer=AIAnswer&AIConfiguration;

export function aiConfiguration():AIConfiguration {
  const selected=process.env.AI_PROVIDER?.trim().toLowerCase()||(process.env.NVIDIA_API_KEY?.trim()?"nvidia":"openai");
  if(selected!=="nvidia"&&selected!=="openai")throw new AIError("invalid_provider","El proveedor de IA configurado no es compatible. Usa nvidia u openai.",503);
  const nvidia=selected==="nvidia";
  const keyName=nvidia?"NVIDIA_API_KEY":"OPENAI_API_KEY";
  const model=nvidia?nvidiaModel():{id:AI_MODEL,label:"GPT-6 Astra · Max"};
  return {provider:selected,providerLabel:nvidia?"NVIDIA":"OpenAI",model:model.id,modelLabel:model.label,webSearch:!nvidia,configured:Boolean(process.env[keyName]?.trim()),keyName};
}

export async function askAI(history:AIHistory,web:boolean,signal?:AbortSignal):Promise<ProviderAnswer> {
  const config=aiConfiguration();
  // The chosen provider is authoritative. No fallback sends data or charges
  // to another provider if a key is missing, rejected or out of quota.
  const answer=config.provider==="nvidia"?await askNVIDIA(history,signal):await askOpenAI(history,web,signal);
  return {...answer,...config};
}

export async function checkAI(signal?:AbortSignal):Promise<AIConfiguration&{reply:string}> {
  const config=aiConfiguration();
  const reply=config.provider==="nvidia"?await checkNVIDIA(signal):await checkOpenAI(signal);
  return {...config,reply};
}
