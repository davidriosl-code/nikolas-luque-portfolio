"use client";

import { useEffect } from "react";
import { advanceSpring, settleSpring, springValue, type SpringValue } from "@/lib/material-spring";

type Body = { node: HTMLElement; kind: string; x: SpringValue; y: SpringValue; rx: SpringValue; ry: SpringValue; scale: SpringValue };
const selector = ".portrait-scene,.capability-card,.tool-tile,.depth-card,.hero-actions .button,.round-link,.nav-contact,.floating-label,.contact-buttons .button,.hero-jarvis,.contact-circle";

export function MaterialMotion() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const isStill = () => reduced.matches || document.documentElement.dataset.motionPaused === "true";
    const bodies = new Map<HTMLElement, Body>();
    const active = new Set<Body>();
    const ripples = new Set<Animation>();
    let frame = 0, previous = 0, disposed = false;
    const tablist = document.querySelector<HTMLElement>(".stack-tab-list");
    const pill = tablist?.querySelector<HTMLElement>(".stack-active-pill");
    const tab = { x: springValue(), y: springValue(), width: springValue(), height: springValue() };
    let tabMoving = false, tabReady = false;
    let hoveredBody: Body | undefined;

    const writeBody = (body: Body) => {
      body.node.style.setProperty("--physics-x", `${body.x.value.toFixed(3)}px`);
      body.node.style.setProperty("--physics-y", `${body.y.value.toFixed(3)}px`);
      body.node.style.setProperty("--physics-rx", `${body.rx.value.toFixed(3)}deg`);
      body.node.style.setProperty("--physics-ry", `${body.ry.value.toFixed(3)}deg`);
      body.node.style.setProperty("--physics-scale", body.scale.value.toFixed(4));
    };
    const writeTab = () => {
      if (!pill) return;
      pill.style.transform = `translate3d(${tab.x.value}px,${tab.y.value}px,0)`;
      pill.style.width = `${Math.max(1, tab.width.value)}px`;
      pill.style.height = `${Math.max(1, tab.height.value)}px`;
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = previous ? (now - previous) / 1000 : 1 / 60;
      previous = now;
      for (const body of active) {
        let moving = false;
        for (const key of ["x", "y", "rx", "ry", "scale"] as const) moving = advanceSpring(body[key], dt, key === "scale" ? 340 : 190, key === "scale" ? 25 : 18) || moving;
        writeBody(body);
        if (!moving || !body.node.isConnected) active.delete(body);
      }
      if (tabMoving) {
        tabMoving = Object.values(tab).map(value => advanceSpring(value, dt, 280, 25)).some(Boolean);
        writeTab();
      }
      if ((active.size || tabMoving) && !document.hidden && !isStill()) frame = requestAnimationFrame(tick);
      else previous = 0;
    };
    const wake = () => { if (!frame && !disposed && !isStill() && !document.hidden) frame = requestAnimationFrame(tick); };
    const settleAll = () => {
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      for (const body of bodies.values()) {
        body.x.target = body.y.target = body.rx.target = body.ry.target = 0; body.scale.target = 1;
        [body.x, body.y, body.rx, body.ry, body.scale].forEach(settleSpring); writeBody(body);
      }
      Object.values(tab).forEach(settleSpring); writeTab(); tabMoving = false; active.clear();
      ripples.forEach(animation => animation.cancel()); ripples.clear();
    };
    const refresh = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach(node => {
        if (bodies.has(node)) return;
        const kind = node.matches(".portrait-scene") ? "portrait" : node.matches(".capability-card,.tool-tile,.depth-card") ? "card" : "button";
        node.dataset.physics = kind;
        bodies.set(node, { node, kind, x: springValue(), y: springValue(), rx: springValue(), ry: springValue(), scale: springValue(1) });
      });
      for (const [node, body] of bodies) if (!node.isConnected) { bodies.delete(node); active.delete(body); }
    };
    const updateTab = () => {
      const selected = tablist?.querySelector<HTMLElement>("[role=tab][data-state=active]");
      if (!selected || !pill || !tablist) return;
      tab.x.target = selected.offsetLeft; tab.y.target = selected.offsetTop;
      tab.width.target = selected.offsetWidth; tab.height.target = selected.offsetHeight;
      if (!tabReady || isStill()) { Object.values(tab).forEach(settleSpring); writeTab(); }
      else { tabMoving = true; wake(); }
      tabReady = true; tablist.dataset.motionReady = "true";
    };
    const reset = (body: Body) => {
      body.x.target = body.y.target = body.rx.target = body.ry.target = 0; body.scale.target = 1;
      active.add(body); wake();
    };
    const bodyFor = (target: EventTarget | null) => target instanceof Element ? bodies.get(target.closest<HTMLElement>(selector)!) : undefined;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || isStill()) return;
      const body = bodyFor(event.target);
      if (hoveredBody && hoveredBody !== body) reset(hoveredBody);
      hoveredBody = body;
      if (!body) return;
      const bounds = body.node.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
      if (body.kind === "portrait") { body.rx.target = -y * 10; body.ry.target = x * 12; body.x.target = x * 5; body.y.target = y * 5; }
      else if (body.kind === "card") { body.rx.target = -y * 8; body.ry.target = x * 10; body.y.target = -8; }
      else { body.x.target = x * 9; body.y.target = y * 7 - 2; }
      active.add(body); wake();
    };
    const leave = (event: PointerEvent) => {
      const body = bodyFor(event.target);
      if (body && !(event.relatedTarget instanceof Node && body.node.contains(event.relatedTarget))) reset(body);
    };
    const ripple = (node: HTMLElement, clientX?: number, clientY?: number) => {
      if (isStill() || !node.matches("a,button")) return;
      const box = node.getBoundingClientRect(), size = Math.hypot(box.width, box.height) * 2;
      const circle = document.createElement("span");
      circle.className = "material-ripple"; circle.setAttribute("aria-hidden", "true");
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${(clientX === undefined ? box.width / 2 : clientX - box.left) - size / 2}px`;
      circle.style.top = `${(clientY === undefined ? box.height / 2 : clientY - box.top) - size / 2}px`;
      node.appendChild(circle);
      const animation = circle.animate([{ transform: "scale(0)", opacity: .2 }, { transform: "scale(1)", opacity: 0 }], { duration: 600, easing: "cubic-bezier(.2,0,0,1)" });
      ripples.add(animation);
      const finish = () => { circle.remove(); ripples.delete(animation); };
      animation.onfinish = finish; animation.oncancel = finish;
    };
    const press = (event: PointerEvent) => {
      if (isStill()) return;
      const body = bodyFor(event.target);
      if (body && body.kind === "button") { body.scale.target = .95; active.add(body); wake(); }
      const node = event.target instanceof Element ? event.target.closest<HTMLElement>("a[data-physics],button[data-physics],.stack-trigger,.desktop-nav a") : null;
      if (node) ripple(node, event.clientX, event.clientY);
    };
    const release = () => { for (const body of bodies.values()) if (body.scale.target !== 1) { body.scale.target = 1; active.add(body); } wake(); };
    const key = (event: KeyboardEvent) => {
      if (event.repeat || !["Enter", " "].includes(event.key)) return;
      const body = bodyFor(event.target);
      if (body?.kind === "button" && !isStill()) { body.scale.target = .96; active.add(body); ripple(body.node); wake(); }
    };
    const visibility = () => { if (document.hidden) settleAll(); else { updateTab(); wake(); } };
    const preference = () => { settleAll(); updateTab(); };
    refresh(); updateTab();
    const changes = new MutationObserver(records => {
      if (records.some(record => record.type === "childList" && [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && !node.classList.contains("material-ripple")))) refresh();
      if (records.some(record => record.type === "attributes" && record.target instanceof Element && record.target.matches(".stack-trigger"))) updateTab();
    });
    changes.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] });
    const resize = new ResizeObserver(updateTab); if (tablist) resize.observe(tablist);
    document.fonts?.ready.then(() => { if (!disposed) updateTab(); });
    document.addEventListener("pointermove", move, { passive: true }); document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("pointerdown", press, { passive: true }); document.addEventListener("pointerup", release); document.addEventListener("pointercancel", release);
    document.addEventListener("keydown", key); document.addEventListener("keyup", release);
    document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", preference);
    window.addEventListener("portfolio-motion-change", preference);
    return () => {
      disposed = true; settleAll(); changes.disconnect(); resize.disconnect();
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerout", leave); document.removeEventListener("pointerdown", press); document.removeEventListener("pointerup", release); document.removeEventListener("pointercancel", release);
      document.removeEventListener("keydown", key); document.removeEventListener("keyup", release); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", preference);window.removeEventListener("portfolio-motion-change", preference);
      for (const node of bodies.keys()) delete node.dataset.physics;
    };
  }, []);
  return null;
}
