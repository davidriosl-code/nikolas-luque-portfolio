import test from "node:test";
import assert from "node:assert/strict";
import {aiConfiguration,askAI,checkAI} from "../lib/jarvis/ai.ts";
import {NVIDIA_MODEL,NVIDIA_LIGHTNING_MODEL,requestNVIDIA} from "../lib/jarvis/nvidia.ts";

function environment(t,values){
  const previous={};
  for(const key of ["AI_PROVIDER","NVIDIA_MODEL","NVIDIA_API_KEY","OPENAI_API_KEY"]){previous[key]=process.env[key];if(values[key]===undefined)delete process.env[key];else process.env[key]=values[key];}
  t.after(()=>{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
}
const completion=(answer={reply:"Hola, Nikolas.",commands:[]})=>({choices:[{finish_reason:"stop",message:{content:JSON.stringify(answer),reasoning_content:"Not displayed or interpreted"}}]});

test("NVIDIA selection never falls back to the OpenAI key",async t=>{
  environment(t,{AI_PROVIDER:"nvidia",OPENAI_API_KEY:"unused-openai-test-key"});
  const mocked=t.mock.method(globalThis,"fetch",async()=>{throw new Error("Unexpected network request");});
  assert.equal(aiConfiguration().configured,false);
  assert.equal(aiConfiguration().keyName,"NVIDIA_API_KEY");
  await assert.rejects(()=>askAI([{role:"user",content:"Hola"}],true),error=>error.code==="missing_key");
  assert.equal(mocked.mock.callCount(),0);
  for(const invalid of ['copied\nkey','Bearer nvapi-example','"nvapi-example"']){
    process.env.NVIDIA_API_KEY=invalid;
    await assert.rejects(()=>askAI([{role:"user",content:"Hola"}],false),error=>error.code==="invalid_key_format");
  }
  assert.equal(mocked.mock.callCount(),0);
  process.env.NVIDIA_API_KEY="nvidia-test-key";
  assert.equal(aiConfiguration().configured,true);
  assert.ok(!JSON.stringify(aiConfiguration()).includes("nvidia-test-key"));
  process.env.AI_PROVIDER="not-a-provider";
  assert.throws(()=>aiConfiguration(),error=>error.code==="invalid_provider");
});

test("provider defaults are deterministic and preserve explicit OpenAI selection",t=>{
  environment(t,{OPENAI_API_KEY:"openai-test-key"});
  assert.equal(aiConfiguration().provider,"openai");
  process.env.NVIDIA_API_KEY="nvidia-test-key";
  assert.equal(aiConfiguration().provider,"nvidia");
  process.env.NVIDIA_MODEL=NVIDIA_LIGHTNING_MODEL;
  assert.equal(aiConfiguration().model,NVIDIA_LIGHTNING_MODEL);
  assert.equal(aiConfiguration().modelLabel,"Nemotron 3.5 Lightning");
  process.env.NVIDIA_MODEL="unavailable-model";
  assert.throws(()=>aiConfiguration(),error=>error.code==="invalid_model");
  process.env.AI_PROVIDER="openai";
  assert.equal(aiConfiguration().provider,"openai");
});

test("NVIDIA chat uses its own endpoint and key without unsupported web tools",async t=>{
  environment(t,{AI_PROVIDER:"nvidia",NVIDIA_API_KEY:"nvidia-test-key",OPENAI_API_KEY:"unused-openai-test-key"});
  let captured;
  t.mock.method(globalThis,"fetch",async(url,options)=>{captured={url,options,body:JSON.parse(options.body)};return Response.json(completion({reply:"Iniciaré el temporizador.",commands:["Temporizador 25 minutos"]}));});
  const result=await askAI([{role:"user",content:"Inicia un temporizador de 25 minutos"}],true);
  assert.equal(captured.url,"https://integrate.api.nvidia.com/v1/chat/completions");
  assert.equal(captured.options.headers.Authorization,"Bearer nvidia-test-key");
  assert.equal(captured.options.redirect,"manual");
  assert.equal(captured.body.model,NVIDIA_MODEL);
  assert.equal(captured.body.tools,undefined);
  assert.equal(captured.body.stream,false);
  assert.equal(captured.body.chat_template_kwargs,undefined);
  assert.equal(captured.body.messages.at(-1).role,"user");
  assert.match(captured.body.messages[0].content,/No tienes buscador web/);
  assert.equal(result.provider,"nvidia");assert.equal(result.modelLabel,"Nemotron 3 Super");
  assert.equal(result.webSearch,false);assert.equal(result.searched,false);assert.deepEqual(result.sources,[]);
  assert.deepEqual(result.commands,["Temporizador 25 minutos"]);
  assert.doesNotMatch(JSON.stringify(result),/test-key|Not displayed/);
});

test("incomplete, malformed and unsafe NVIDIA outputs never reach the action engine",async t=>{
  environment(t,{NVIDIA_API_KEY:"nvidia-test-key"});
  let body;
  t.mock.method(globalThis,"fetch",async()=>Response.json(body));
  for(const invalid of [
    {choices:[{finish_reason:"length",message:{content:'{"reply":"unfinished'}}]},
    completion({reply:"Done",commands:["Elimina todos mis archivos"]}),
    completion(null),
    {choices:[{finish_reason:"stop",message:{content:"Plain text is not a command"}}]},
    {choices:[{finish_reason:"tool_calls",message:{tool_calls:[{name:"shell"}]}}]},
  ]){body=invalid;await assert.rejects(()=>requestNVIDIA([{role:"user",content:"Test"}],256));}
  body={choices:[{finish_reason:"stop",message:{content:'```json\n{"reply":"Hola","commands":[]}\n```'}}]};
  assert.equal((await requestNVIDIA([{role:"user",content:"Hola"}],256)).reply,"Hola");
});

test("NVIDIA error messages omit upstream secrets and honor retry guidance",async t=>{
  environment(t,{NVIDIA_API_KEY:"nvidia-test-key"});
  const logs=t.mock.method(console,"error",()=>{});
  let status=401;
  t.mock.method(globalThis,"fetch",async()=>Response.json({error:{message:"Sensitive nvidia-test-key"}},{status,headers:{"retry-after":"12"}}));
  for(const [http,code] of [[302,"provider_redirect"],[401,"invalid_key"],[403,"model_access"],[402,"insufficient_quota"],[429,"rate_limit"],[500,"provider_error_500"],[503,"service_unavailable"]]){
    status=http;
    await assert.rejects(()=>requestNVIDIA([{role:"user",content:"Test"}],256),error=>error.code===code&&!error.message.includes("test-key")&&(http!==429||error.message.includes("12 segundos")));
  }
  assert.doesNotMatch(JSON.stringify(logs.mock.calls.map(call=>call.arguments)),/Sensitive|test-key/);
});

test("connection probe validates a fixed structured reply and rejects proposed actions",async t=>{
  environment(t,{AI_PROVIDER:"nvidia",NVIDIA_API_KEY:"nvidia-test-key"});
  let captured;let answer={reply:"Conexión verificada con NVIDIA.",commands:[]};
  t.mock.method(globalThis,"fetch",async(url,options)=>{captured=JSON.parse(options.body);return Response.json(completion(answer));});
  const result=await checkAI();
  assert.equal(result.provider,"nvidia");assert.equal(result.reply,answer.reply);
  assert.equal(captured.max_tokens,1024);assert.equal(captured.messages.length,2);
  answer={reply:"Iniciaré un temporizador.",commands:["Temporizador 25 minutos"]};
  await assert.rejects(()=>checkAI(),error=>error.code==="invalid_response");
});
