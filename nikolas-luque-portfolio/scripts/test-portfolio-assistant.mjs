import test from "node:test";
import assert from "node:assert/strict";
import { planPortfolioCommand } from "../lib/portfolio-assistant.ts";

test("voice accents, assistant name and two ordered actions", () => {
  const plan = planPortfolioCommand("J.A.R.V.I.S., muéstrame Kotlin y copia el correo");
  assert.equal(plan.understood, true);
  assert.deepEqual(plan.actions.map(({type,target}) => ({type,target})), [
    { type:"stack", target:"android" }, { type:"copy", target:"email" },
  ]);
});
test("explicit sequential navigation retains order", () => {
  const plan = planPortfolioCommand("Muéstrame React y luego muéstrame Kotlin");
  assert.deepEqual(plan.actions.map(action => action.target), ["web", "android"]);
});
test("external links are prepared, never silently opened or sent", () => {
  const plan = planPortfolioCommand("Copia el teléfono y abre GitHub");
  assert.deepEqual(plan.actions.map(action => action.type), ["copy", "link"]);
  assert.equal(plan.actions[1].target, "github");
});
test("an unsupported step prevents the whole sequence from executing", () => {
  const plan = planPortfolioCommand("Muéstrame React; elimina mis archivos");
  assert.equal(plan.understood, false);
  assert.deepEqual(plan.actions, []);
  assert.match(plan.reply, /No he iniciado la secuencia/);
});
test("negated commands and mail requests cannot become page actions", () => {
  for (const text of ["No muestres Kotlin", "Envía un correo sobre React", "Agenda una reunión sobre Django", "Borra mis archivos y muéstrame Kotlin"]) {
    assert.deepEqual(planPortfolioCommand(text).actions, [], text);
    assert.equal(planPortfolioCommand(text).understood, false, text);
  }
});
test("knowledge questions explain skills without claiming actions", () => {
  const plan = planPortfolioCommand("¿Qué sabe de Docker?");
  assert.equal(plan.actions.length, 0);
  assert.match(plan.reply, /fundamentos/i);
  assert.doesNotMatch(plan.reply, /experto|avanzado/i);
});
test("unknown input does not masquerade as an AI response", () => {
  const plan = planPortfolioCommand("Cuál es la temperatura del sol");
  assert.equal(plan.understood, false);
  assert.equal(plan.actions.length, 0);
  assert.match(plan.reply, /modo de comandos/);
});
test("connector inventory is truthful and distinct from portfolio tools", () => {
  const plan = planPortfolioCommand("¿Qué herramientas tienes?");
  assert.equal(plan.connections, true);
  assert.match(plan.reply, /no están configurados/);
  assert.equal(plan.actions.length, 0);
});
test("ambiguous requests cannot select an arbitrary area", () => {
  const plan = planPortfolioCommand("Muéstrame React y Kotlin");
  assert.equal(plan.understood, false);
  assert.equal(plan.actions.length, 0);
});
test("bounded input and sequence length", () => {
  assert.equal(planPortfolioCommand("a".repeat(1201)).understood, false);
  assert.equal(planPortfolioCommand("Muéstrame React; muéstrame Django; copia correo; copia teléfono; abre GitHub").understood, false);
});
test("all advertised sections and skill groups resolve", () => {
  for (const [command, target] of [["Muéstrame el valor diferencial","valor-diferencial"],["Llévame a contacto","contacto"],["Ve al inicio","inicio"],["Muéstrame SQL","datos"],["Muéstrame Docker","flujo"],["Muéstrame Photoshop","herramientas"],["Muéstrame Django","backend"],["Muéstrame el stack","stack"]]) {
    assert.equal(planPortfolioCommand(command).actions[0]?.target, target, command);
  }
});
