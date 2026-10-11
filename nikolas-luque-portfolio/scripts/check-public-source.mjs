import {execFileSync} from "node:child_process";
import {readFileSync,statSync} from "node:fs";
const files=[...new Set(execFileSync("git",["ls-files","-c","-o","--exclude-standard","-z"],{encoding:"utf8"}).split("\0").filter(Boolean))];
const patterns=[/sk-proj-[A-Za-z0-9_-]{20,}/,/nvapi-[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const blocked=files.filter(file=>{
  if(/(?:^|\/)(?:\.env(?:\..+)?|\.dev\.vars(?:\..+)?)$/.test(file)&&!file.endsWith(".example"))return true;
  if(/(?:^|\/)(?:\.openai|\.wrangler|\.sites-runtime)(?:\/|$)/.test(file))return true;
  if(!/\.(?:tsx?|[cm]?js|json|md|ya?ml|css|txt|example)$/.test(file)||statSync(file).size>3_000_000)return false;
  return patterns.some(pattern=>pattern.test(readFileSync(file,"utf8")));
});
if(blocked.length){console.error("Revisar estos archivos antes de publicar (valores ocultos):\n"+blocked.join("\n"));process.exit(1);}
console.log(`Revisados ${files.length} archivos: sin secretos reconocidos ni configuración privada del alojamiento.`);
