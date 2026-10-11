import test from "node:test";
import assert from "node:assert/strict";
import {calculate,convert,parseDate,planJarvisCommand,commandCatalog} from "../lib/jarvis/engine.ts";
import {createCalendarFile} from "../lib/jarvis/calendar.ts";
import {GET} from "../app/api/jarvis/github/route.ts";

test("every advertised example resolves, with unique catalog IDs",()=>{
  assert.equal(commandCatalog.length,336);
  assert.equal(new Set(commandCatalog.map(item=>item.id)).size,336);
  assert.deepEqual(commandCatalog.filter(item=>!planJarvisCommand(item.prompt).understood),[]);
});

test("calculator handles precedence, unary operators, spoken input and bounded failure",()=>{
  for(const [expression,expected] of [["2 + 3 * 4",14],["-2^2",-4],["(-2)^2",4],["2^3^2",512],["2^-3",.125],["1200 * 18%",216],["sqrt(144) + abs(-3)",15],["24 por 18",432]])assert.equal(calculate(expression),expected,expression);
  for(const expression of ["1/0","sqrt(-1)","2 ^ 9999","process.exit()","globalThis.fetch('x')","1;alert(1)","2+", "(".repeat(40)+"1"+")".repeat(40)])assert.throws(()=>calculate(expression),expression);
});

test("unit conversions enforce dimensions and distinguish binary units",()=>{
  assert.equal(convert(1,"MiB","KiB"),"1 MiB = 1,024 KiB");
  assert.equal(convert(1,"MB","KB"),"1 MB = 1,000 KB");
  assert.equal(convert(32,"fahrenheit","celsius"),"32 fahrenheit = 0 °C");
  assert.equal(convert(8,"bits","bytes"),"8 bits = 1 bytes");
  assert.throws(()=>convert(10,"kg","km"));
  assert.throws(()=>convert(-1,"kelvin","celsius"));
  assert.throws(()=>convert(1e308,"GB","bits"));
});

test("date arithmetic rejects impossible dates and handles leap years",()=>{
  assert.equal(parseDate("2028-02-29").toISOString(),"2028-02-29T12:00:00.000Z");
  for(const date of ["2026-02-29","2026-04-31","2026-13-01","yesterday"])assert.throws(()=>parseDate(date));
  assert.match(planJarvisCommand("Suma 1 día a 2028-02-28").reply,/2028-02-29/);
  assert.match(planJarvisCommand("Resta 1 día de 2026-01-01").reply,/2025-12-31/);
  assert.match(planJarvisCommand("Días entre 2026-01-01 y 2026-01-31").reply,/30 días/);
});

test("Unicode and multiline payloads survive text and JSON tools",()=>{
  const original="Hola, Nikolas. Áéñ 🚀";
  const encoded=planJarvisCommand(`Codifica Base64: ${original}`).reply;
  assert.equal(planJarvisCommand(`Decodifica Base64: ${encoded}`).reply,original);
  assert.equal(planJarvisCommand('Compacta JSON: {\n "nombre": "Nikolas; Luque", "n": 1\n}').reply,'{"nombre":"Nikolas; Luque","n":1}');
  assert.equal(planJarvisCommand("Quita duplicados: React\nKotlin\nReact").reply,"React\nKotlin");
  for(const invalid of ['Formatea JSON: {bad}','Decodifica URL: %ZZ','Decodifica Base64: !!!'])assert.equal(planJarvisCommand(invalid).understood,false);
});

test("sequences retain outputs for copy and reject unsupported steps before starting",()=>{
  const plan=planJarvisCommand("Calcula 24 * 18 >> Copia el resultado");
  assert.equal(plan.steps[0].reply,"24 * 18 = 432");
  assert.equal(plan.steps[1].actions[0].type,"copy-result");
  assert.equal(planJarvisCommand("Genera UUID >> Copia resultado").actions[0].type,"uuid");
  const invalid=planJarvisCommand("Temporizador 1 minuto >> Elimina mis archivos");
  assert.equal(invalid.understood,false);assert.deepEqual(invalid.actions,[]);
  assert.match(invalid.reply,/No he iniciado la secuencia/);
  assert.equal(planJarvisCommand(Array(9).fill("Copia el correo").join(" >> ")).understood,false);
  assert.equal(planJarvisCommand(Array(3).fill("Muéstrame React; copia correo; copia teléfono").join(" >> ")).understood,false);
});

test("timers and input have explicit bounds, and private operations remain unavailable",()=>{
  assert.equal(planJarvisCommand("Temporizador 25 minutos").actions[0].seconds,1500);
  for(const command of ["Temporizador 0 segundos","Temporizador 25 horas","x".repeat(6001),"Envía un correo sobre React","Agenda una reunión en mi cuenta","No muestres Kotlin"]) {
    assert.equal(planJarvisCommand(command).understood,false,command);
    assert.deepEqual(planJarvisCommand(command).actions,[],command);
  }
});

test("external actions prepare explicit links and calendar files without claiming a send",()=>{
  const mail=planJarvisCommand("Borrador correo: equipo@example.com | Hola & gracias | Buenos días");
  assert.match(mail.reply,/No se ha enviado/);
  assert.equal(mail.actions[0].href,"mailto:equipo@example.com?subject=Hola%20%26%20gracias&body=Buenos%20d%C3%ADas");
  assert.equal(planJarvisCommand("Borrador correo: wrong | Hola | Mensaje").understood,false);
  const event=planJarvisCommand("Evento: Entrevista | 2026-10-05 10:00 | 45");
  assert.equal(event.actions[0].start,"2026-10-05T10:00:00-05:00");
  assert.match(event.reply,/todavía no he creado ninguna cita/);
  assert.equal(planJarvisCommand("Evento: Entrevista | 2026-10-05 24:00 | 45").understood,false);
  const search=planJarvisCommand("Busca en GitHub: Kotlin & Compose");
  assert.equal(search.actions[0].href,"https://github.com/search?q=Kotlin%20%26%20Compose");
});

test("calendar export converts Peru time, escapes content and folds Unicode safely",()=>{
  const body=createCalendarFile({title:"Reunión; áéñ🚀".repeat(12)+"\nParte, dos",start:"2026-10-05T10:00:00-05:00",minutes:45},"test-id",new Date("2026-09-25T00:00:00Z"));
  assert.match(body,/DTSTART:20261005T150000Z/);assert.match(body,/DTEND:20261005T154500Z/);
  assert.match(body.replace(/\r\n /g,""),/SUMMARY:Reunión\\;/);
  assert.match(body.replace(/\r\n /g,""),/\\nParte\\, dos/);
  for(const line of body.split("\r\n"))assert.ok(new TextEncoder().encode(line).length<=75);
});

test("GitHub route only reads the fixed public account and handles upstream failures",async t=>{
  const calls=[];
  const fetchMock=t.mock.method(globalThis,"fetch",async(url,options)=>{calls.push({url,options});return Response.json([{name:"hello",description:"A public repo",language:"Kotlin"}]);});
  const request=(kind)=>new Request(`https://example.com/api/jarvis/github?kind=${kind}`);
  assert.equal((await GET(request("https://evil.example"))).status,400);
  assert.equal(calls.length,0);
  const good=await GET(request("repos"));assert.equal(good.status,200);
  assert.equal(calls[0].url,"https://api.github.com/users/davidriosl-code/repos?sort=updated&per_page=12&type=owner");
  assert.equal((await good.json()).repos[0].href,"https://github.com/davidriosl-code/hello");
  fetchMock.mock.mockImplementation(async()=>new Response("",{status:403,headers:{"x-ratelimit-remaining":"0"}}));
  assert.equal((await GET(request("repos"))).status,429);
  fetchMock.mock.mockImplementation(async()=>{throw new Error("offline");});
  assert.equal((await GET(request("profile"))).status,502);
  fetchMock.mock.mockImplementation(async()=>Response.json(null));
  assert.equal((await GET(request("profile"))).status,502);
});
