"use client";
import { useEffect, useRef, type RefObject } from "react";

export function JarvisHud({ listening, speaking, busy, analyser }: { listening:boolean; speaking:boolean; busy:boolean; analyser:RefObject<AnalyserNode|null> }) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const activity=useRef({listening,speaking,busy});activity.current={listening,speaking,busy};
  useEffect(()=>{
    const element=canvas.current;if(!element)return;const context=element.getContext("2d");if(!context)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");let frame=0;let size=0;let previous=0;
    const bins=new Uint8Array(128);
    const resize=()=>{size=element.getBoundingClientRect().width;const dpr=Math.min(window.devicePixelRatio||1,1.5);element.width=Math.round(size*dpr);element.height=Math.round(size*dpr);context.setTransform(dpr,0,0,dpr,0,0);};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    const draw=(time:number)=>{
      frame=requestAnimationFrame(draw);if(document.hidden||time-previous<32)return;previous=time;
      const t=reduced.matches?0:time*.001;const c=size/2;const r=size*.34;const active=activity.current;
      context.clearRect(0,0,size,size);
      const cyan=active.speaking?"#c6f58b":"#82e0e7";
      const glow=context.createRadialGradient(c,c,r*.15,c,c,r*1.38);glow.addColorStop(0,active.listening?"#64e1ed15":"#805ebc12");glow.addColorStop(.65,"#72cadd07");glow.addColorStop(1,"#72cadd00");context.fillStyle=glow;context.fillRect(0,0,size,size);
      context.save();context.translate(c,c);
      for(let ring=0;ring<5;ring++){
        context.save();context.rotate(t*(ring%2?-.07:.09));context.strokeStyle=ring===2?cyan:"#9e88bf69";context.lineWidth=ring===2?1.4:.6;context.beginPath();context.arc(0,0,r*(.66+ring*.12),ring%2?.4:0,Math.PI*(ring===2?1.7:1.95));context.stroke();context.restore();
      }
      for(let i=0;i<96;i++){
        const angle=i*Math.PI*2/96;const major=i%8===0;const radius=r*1.15;
        context.strokeStyle=major?"#82e0e7a0":"#aa93ca45";context.lineWidth=major?1.5:.8;
        context.beginPath();context.moveTo(Math.cos(angle)*radius,Math.sin(angle)*radius);context.lineTo(Math.cos(angle)*(radius+(major?10:4)),Math.sin(angle)*(radius+(major?10:4)));context.stroke();
      }
      if(analyser.current&&active.listening)analyser.current.getByteFrequencyData(bins);else bins.fill(0);
      for(let i=0;i<64;i++){
        const angle=i*Math.PI*2/64-Math.PI/2;const amplitude=active.listening?bins[i]/255:active.speaking&&!reduced.matches?(Math.sin(t*5+i*.7)+1)*.21:active.busy&&!reduced.matches?(Math.sin(t*3-i*.2)+1)*.08:.035;
        const start=r*.78;const length=3+amplitude*r*.27;
        context.strokeStyle=active.listening||active.speaking?cyan:"#a59aba80";context.lineWidth=2;context.beginPath();context.moveTo(Math.cos(angle)*start,Math.sin(angle)*start);context.lineTo(Math.cos(angle)*(start+length),Math.sin(angle)*(start+length));context.stroke();
      }
      context.save();context.rotate(-t*.16);context.setLineDash([2,9]);context.strokeStyle="#c6f58b66";context.beginPath();context.arc(0,0,r*.59,0,Math.PI*2);context.stroke();context.restore();
      const inner=context.createRadialGradient(0,0,0,0,0,r*.5);inner.addColorStop(0,active.speaking?"#c6f58b20":"#80e0e71f");inner.addColorStop(1,"#0e111b00");context.fillStyle=inner;context.beginPath();context.arc(0,0,r*.5,0,Math.PI*2);context.fill();
      context.strokeStyle="#82e0e740";context.lineWidth=.8;for(const direction of [-1,1]){context.beginPath();context.moveTo(direction*r*.4,0);context.lineTo(direction*r*.23,0);context.moveTo(0,direction*r*.4);context.lineTo(0,direction*r*.23);context.stroke();}
      context.restore();
    };
    frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[analyser]);
  return <canvas ref={canvas} className="hud-canvas" aria-hidden="true"/>;
}
