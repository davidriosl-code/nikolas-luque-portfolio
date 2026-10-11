"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type SceneController = { setPaused: (value:boolean)=>void; dispose:()=>void };

export function SpatialExperience() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const controller=useRef<SceneController|null>(null);
  const [paused,setPaused]=useState(false);
  const pausedRef=useRef(false);
  const userPaused=useRef(false);
  useEffect(()=>{
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    let stored=false;
    try{stored=localStorage.getItem("nikolas-motion-paused")==="true";}catch{}
    const apply=(value:boolean)=>{pausedRef.current=value;setPaused(value);document.documentElement.dataset.motionPaused=String(value);controller.current?.setPaused(value);window.dispatchEvent(new Event("portfolio-motion-change"));};
    userPaused.current=stored;
    apply(stored||preference.matches);
    const change=()=>apply(preference.matches||userPaused.current);
    preference.addEventListener("change",change);
    let cancelled=false;
    import("@/lib/spatial-scene").then(({createSpatialScene})=>{
      if(cancelled||!canvas.current)return;
      controller.current=createSpatialScene(canvas.current);
      controller.current?.setPaused(pausedRef.current);
    }).catch(()=>{if(canvas.current)canvas.current.dataset.unavailable="true";});
    return()=>{cancelled=true;preference.removeEventListener("change",change);controller.current?.dispose();controller.current=null;delete document.documentElement.dataset.motionPaused;};
  },[]);
  const toggle=()=>{
    const value=!pausedRef.current;
    userPaused.current=value;
    pausedRef.current=value;setPaused(value);
    document.documentElement.dataset.motionPaused=String(value);
    controller.current?.setPaused(value);
    try{localStorage.setItem("nikolas-motion-paused",String(value));}catch{}
    window.dispatchEvent(new Event("portfolio-motion-change"));
  };
  return <>
    <div className="spatial-world" aria-hidden="true"><canvas ref={canvas} className="spatial-canvas"/></div>
    <button className="motion-control" onClick={toggle} aria-pressed={paused} aria-label={paused?"Activar animaciones":"Pausar animaciones"}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?"Activar movimiento":"Pausar movimiento"}</span></button>
  </>;
}
