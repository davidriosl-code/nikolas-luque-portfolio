import test from "node:test";
import assert from "node:assert/strict";
import {localAIAllowed,requireLocalAI} from "../lib/jarvis/local-access.ts";

test("paid AI requires explicit local development and rejects production or external origins",t=>{
  const previous={NODE_ENV:process.env.NODE_ENV,JARVIS_ENABLE_LOCAL_AI:process.env.JARVIS_ENABLE_LOCAL_AI};
  t.after(()=>{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
  const local=new Request("http://localhost:3000/api/jarvis/chat");
  process.env.NODE_ENV="development";delete process.env.JARVIS_ENABLE_LOCAL_AI;
  assert.equal(localAIAllowed(local),false);
  process.env.JARVIS_ENABLE_LOCAL_AI="true";
  assert.equal(requireLocalAI(local),"local-developer");
  for(const url of ["http://127.0.0.1:3000/api/jarvis/chat","http://[::1]:3000/api/jarvis/chat"])assert.equal(localAIAllowed(new Request(url)),true);
  for(const url of ["https://example.com/api/jarvis/chat","https://localhost.example.com/api/jarvis/chat"])assert.throws(()=>requireLocalAI(new Request(url)),{code:"local_ai_only"});
  process.env.NODE_ENV="production";
  assert.throws(()=>requireLocalAI(new Request(local,{headers:{"oai-authenticated-user-id":"forged","oai-authenticated-user-email":"forged@example.com"}})),{code:"local_ai_only"});
});
