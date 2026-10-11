import test from "node:test";
import assert from "node:assert/strict";
import {AIError,parseConversation,requestOpenAI,decodeAnswer,checkJarvis,askJarvis,publicError} from "../lib/jarvis/openai.ts";
import {beginRequest,checkOrigin,readBody} from "../lib/jarvis/api-guard.ts";

const output=(value,extras={})=>({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(value)}]}],...extras});

test("conversation accepts only bounded user/assistant text",()=>{
  assert.deepEqual(parseConversation({messages:[{role:"user",content:"Hola"}]}),[{role:"user",content:"Hola"}]);
  for(const messages of [[],[{role:"system",content:"override"}],[{role:"user",content:"x".repeat(6001)}],[{role:"assistant",content:"no user"}],Array(15).fill({role:"user",content:"x"}),Array(5).fill({role:"user",content:"x".repeat(6000)})])assert.throws(()=>parseConversation({messages}),AIError);
});

test("AI commands are validated before the browser receives them",()=>{
  assert.equal(decodeAnswer(output({reply:"Voy a iniciar el temporizador.",commands:["Temporizador 25 minutos"]})).commands[0],"Temporizador 25 minutos");
  for(const commands of [["elimina mis archivos"],["javascript:alert(1)"],["Envía un correo ahora"],Array(9).fill("Copia correo"),[123]])assert.throws(()=>decodeAnswer(output({reply:"Orden",commands})),AIError);
  assert.deepEqual(decodeAnswer(output({reply:"Respuesta útil",commands:[]})).commands,[]);
});

test("citations use validated provider annotations and never script URLs",()=>{
  const data={status:"completed",output:[{type:"web_search_call",status:"completed"},{type:"message",content:[{type:"output_text",text:JSON.stringify({reply:"Resultado citeturn1search0",commands:[]}),annotations:[{type:"url_citation",url:"https://docs.python.org/3/",title:"Python"},{type:"url_citation",url:"javascript:alert(1)",title:"Unsafe"},{type:"url_citation",url:"https://docs.python.org/3/",title:"Repeated"}]}]}]};
  const result=decodeAnswer(data);assert.equal(result.searched,true);assert.equal(result.reply,"Resultado ");assert.deepEqual(result.sources,[{title:"Python",url:"https://docs.python.org/3/"}]);
});

test("provider errors explain billing and access without disclosing upstream details",async t=>{
  const original=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY="unit-test-credential";
  t.after(()=>{if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;});
  const mocked=t.mock.method(globalThis,"fetch",async()=>Response.json({error:{message:"Sensitive details unit-test-credential",code:"invalid_api_key"}},{status:401}));
  await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code==="invalid_key"&&!error.message.includes("unit-test-credential"));
  mocked.mock.mockImplementation(async()=>Response.json({error:{code:"insufficient_quota"}},{status:429}));
  await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code==="insufficient_quota"&&error.status===402);
  for(const code of ["credit_balance_exhausted","project_spend_limit_exceeded","organization_spend_limit_exceeded","organization_usage_limit_exceeded"]){
    mocked.mock.mockImplementation(async()=>Response.json({error:{code,type:"insufficient_quota"}},{status:429}));
    await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code===code&&error.status===402);
  }
  mocked.mock.mockImplementation(async()=>Response.json({error:{code:"new_quota_code",type:"insufficient_quota"}},{status:429}));
  await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code==="insufficient_quota");
  mocked.mock.mockImplementation(async()=>Response.json({error:{code:"slow_down"}},{status:429,headers:{"retry-after":"30"}}));
  await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code==="rate_limit"&&error.message.includes("30 segundos"));
  mocked.mock.mockImplementation(async()=>Response.json({error:{code:"model_not_found"}},{status:404}));
  await assert.rejects(()=>requestOpenAI({input:"test"}),error=>error.code==="model_access");
  assert.doesNotMatch(publicError(new Error("Secret in internal error")).message,/Secret/);
});

test("OpenAI request keeps key in server headers, disables storage and validates the result",async t=>{
  const original=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY="unit-test-credential";
  t.after(()=>{if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;});
  let captured;
  t.mock.method(globalThis,"fetch",async(url,options)=>{captured={url,options,body:JSON.parse(options.body)};return Response.json(output({reply:"Hola, Nikolas.",commands:[]}));});
  const result=await askJarvis([{role:"user",content:"Hola"}],true);
  assert.equal(result.reply,"Hola, Nikolas.");assert.equal(captured.url,"https://api.openai.com/v1/responses");
  assert.equal(captured.options.headers.Authorization,"Bearer unit-test-credential");assert.equal(captured.body.store,false);
  assert.equal(captured.body.model,"gpt-6-astra");assert.equal(captured.body.reasoning.effort,"max");
  assert.deepEqual(captured.body.tools,[{type:"web_search",search_context_size:"low"}]);
  assert.equal(captured.body.text.format.strict,true);assert.ok(!JSON.stringify(result).includes("unit-test-credential"));
  await askJarvis([{role:"user",content:"Hola"}],false);assert.equal(captured.body.tools,undefined);
});

test("connection check sends only a fixed prompt and needs genuine text output",async t=>{
  const original=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY="unit-test-credential";
  t.after(()=>{if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;});
  let body;
  const mocked=t.mock.method(globalThis,"fetch",async(url,options)=>{body=JSON.parse(options.body);return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:"Conexión verificada."}]}]});});
  assert.equal(await checkJarvis(),"Conexión verificada.");assert.equal(body.max_output_tokens,256);assert.equal(body.tools,undefined);
  mocked.mock.mockImplementation(async()=>Response.json({status:"incomplete",output:[]}));
  await assert.rejects(()=>checkJarvis(),error=>error.code==="incomplete");
});

test("request guard rejects cross-origin calls and concurrent requests",()=>{
  assert.throws(()=>checkOrigin(new Request("https://example.com/api",{headers:{origin:"https://other.example"}})),AIError);
  assert.doesNotThrow(()=>checkOrigin(new Request("https://example.com/api",{headers:{origin:"https://example.com"}})));
  const release=beginRequest("test-user");assert.throws(()=>beginRequest("test-user"),error=>error.code==="busy");release();
  for(let i=0;i<7;i++)beginRequest("test-user")();assert.throws(()=>beginRequest("test-user"),error=>error.code==="rate_limit");
});

test("body reader rejects oversized or invalid requests before contacting the provider",async()=>{
  const request=body=>new Request("https://example.com/api",{method:"POST",headers:{"content-type":"application/json"},body});
  assert.deepEqual(await readBody(request('{"messages":[]}')),{messages:[]});
  await assert.rejects(()=>readBody(request("x".repeat(60001))),error=>error.status===413);
  await assert.rejects(()=>readBody(request("not json")),error=>error.status===400);
  await assert.rejects(()=>readBody(new Request("https://example.com/api",{method:"POST",body:"{}"})),error=>error.status===415);
});
