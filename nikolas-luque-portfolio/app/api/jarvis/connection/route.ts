import {localAIAllowed,requireLocalAI} from "@/lib/jarvis/local-access";
import {publicError} from "@/lib/jarvis/openai";
import {aiConfiguration,checkAI} from "@/lib/jarvis/ai";
import {beginRequest,checkOrigin} from "@/lib/jarvis/api-guard";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
let verified:{expires:number;reply:string;model:string;provider:string}|undefined;

export async function GET(request:Request){
  try{const config=aiConfiguration();return Response.json({...config,configured:config.configured&&localAIAllowed(request),verified:Boolean(config.configured&&verified&&verified.expires>Date.now()&&verified.model===config.model&&verified.provider===config.provider)},{headers});}
  catch(error){const safe=publicError(error);return Response.json({configured:false,verified:false,error:safe.message,code:safe.code},{status:safe.status,headers});}
}

export async function POST(request:Request){
  let release:(()=>void)|undefined;
  try{
    checkOrigin(request);
    requireLocalAI(request);
    const config=aiConfiguration();
    if(config.configured&&verified&&verified.expires>Date.now()&&verified.model===config.model&&verified.provider===config.provider)return Response.json({...config,verified:true,reply:verified.reply},{headers});
    release=beginRequest("connection-probe");
    const result=await checkAI(request.signal);verified={reply:result.reply,model:result.model,provider:result.provider,expires:Date.now()+300000};
    return Response.json({...result,verified:true},{headers});
  }catch(error){const safe=publicError(error);return Response.json({verified:false,error:safe.message,code:safe.code},{status:safe.status,headers});}
  finally{release?.();}
}
