import {requireLocalAI} from "@/lib/jarvis/local-access";
import {AIError,parseConversation,publicError} from "@/lib/jarvis/openai";
import {askAI} from "@/lib/jarvis/ai";
import {beginRequest,checkOrigin,readBody} from "@/lib/jarvis/api-guard";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};

export async function POST(request:Request){
  let release:(()=>void)|undefined;
  try{
    checkOrigin(request);
    const userId=requireLocalAI(request);
    const body=await readBody(request);
    const history=parseConversation(body);
    const web=Boolean(body&&typeof body==="object"&&"web" in body&&body.web===true);
    release=beginRequest(userId);
    return Response.json(await askAI(history,web,request.signal),{headers});
  }catch(error){const safe=publicError(error);return Response.json({error:safe.message,code:safe.code},{status:safe.status,headers});}
  finally{release?.();}
}
