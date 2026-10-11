"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionEvent = { resultIndex: number; results: { length: number; [key: number]: { isFinal: boolean; [key: number]: { transcript: string } } } };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null; onstart: (() => void) | null;
  start: () => void; abort: () => void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useJarvisVoice({ onCommand, onWake }: { onCommand: (text: string) => void; onWake: () => void }) {
  const [supported, setSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [wakeEnabled, setWakeState] = useState(false);
  const [voiceEnabled, setVoiceState] = useState(true);
  const [partial, setPartial] = useState("");
  const [note, setNote] = useState("");
  const analyser = useRef<AnalyserNode | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const generation = useRef(0);
  const speechGeneration = useRef(0);
  const wake = useRef(false);
  const voice = useRef(true);
  const busy = useRef(false);
  const alive = useRef(true);
  const restarting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandCallback = useRef(onCommand); commandCallback.current = onCommand;
  const wakeCallback = useRef(onWake); wakeCallback.current = onWake;
  const startRef = useRef<(mode: "wake" | "command") => void>(() => undefined);

  const haltRecognition = useCallback(() => {
    generation.current++;
    if(restarting.current) clearTimeout(restarting.current); restarting.current = null;
    const current = recognition.current; recognition.current = null;
    if(current) { current.onresult=null; current.onend=null; current.onerror=null; current.onstart=null; try { current.abort(); } catch {} }
    analyser.current = null;
    stream.current?.getTracks().forEach(track=>track.stop()); stream.current=null;
    const audio=context.current; context.current=null; if(audio&&audio.state!=="closed") void audio.close().catch(()=>undefined);
    if(alive.current) { setListening(false); setStarting(false); setPartial(""); }
  }, []);
  const stopSpeech = useCallback(() => {
    speechGeneration.current++;
    if(typeof window!=="undefined"&&"speechSynthesis" in window) window.speechSynthesis.cancel();
    if(alive.current) setSpeaking(false);
  }, []);
  const suspend = useCallback(() => { haltRecognition(); stopSpeech(); }, [haltRecognition,stopSpeech]);
  const stopAll = useCallback(() => { wake.current=false; busy.current=false; setWakeState(false); suspend(); }, [suspend]);
  const resumeWake = useCallback(() => {
    if(wake.current&&!document.hidden&&!busy.current&&alive.current) {
      if(restarting.current) clearTimeout(restarting.current);
      restarting.current=setTimeout(()=>{restarting.current=null;if(wake.current&&!busy.current&&!document.hidden)startRef.current("wake");},650);
    }
  }, []);

  const start = useCallback((mode: "wake" | "command") => {
    suspend(); setNote("");
    const speechWindow = window as VoiceWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if(!Constructor) { setNote("Este navegador no admite reconocimiento de voz. Puedes usar todas las órdenes por texto."); wake.current=false;setWakeState(false);return; }
    if(document.hidden) return;
    const epoch=generation.current;
    const current=new Constructor(); recognition.current=current;
    current.lang="es-PE"; current.continuous=mode==="wake"; current.interimResults=true;
    let handled=false; let failed=false;
    setStarting(true);
    current.onstart=()=>{
      if(epoch!==generation.current)return;
      setListening(true);setStarting(false);
      // Recognition and the optional visual meter have separate browser lifecycles.
      // If a late permission result arrives after stop, its tracks are closed immediately.
      if(navigator.mediaDevices?.getUserMedia) void navigator.mediaDevices.getUserMedia({audio:true}).then(async media=>{
        if(epoch!==generation.current||!alive.current){media.getTracks().forEach(track=>track.stop());return;}
        stream.current=media;
        try {
          const audio=new AudioContext();context.current=audio;
          const meter=audio.createAnalyser();meter.fftSize=256;meter.smoothingTimeConstant=.75;
          audio.createMediaStreamSource(media).connect(meter);analyser.current=meter;
          if(audio.state==="suspended")await audio.resume();
        } catch { /* Speech recognition still works without a visual audio meter. */ }
      }).catch(()=>undefined);
    };
    current.onresult=event=>{
      if(epoch!==generation.current||handled)return;
      for(let i=event.resultIndex;i<event.results.length;i++){
        const result=event.results[i]; const transcript=result[0].transcript.trim();
        if(mode==="wake") {
          const call=/\b(?:jarvis|yarvis|yervis|j[aá]rvis)\b[,.:\s]*/i.exec(transcript);
          if(!call)continue;
          wakeCallback.current();
          const command=transcript.slice(call.index+call[0].length).trim();setPartial(command||"A tu servicio…");
          if(result.isFinal){handled=true;haltRecognition();if(command){busy.current=true;commandCallback.current(command);}else startRef.current("command");return;}
        } else {
          setPartial(transcript);
          if(result.isFinal&&transcript){handled=true;haltRecognition();busy.current=true;commandCallback.current(transcript);return;}
        }
      }
    };
    current.onerror=event=>{
      if(epoch!==generation.current)return;
      if(event.error==="no-speech"&&mode==="wake")return;
      failed=true;const errors:Record<string,string>={"not-allowed":"El navegador no autorizó el micrófono. Habilita su permiso o escribe la orden.","service-not-allowed":"El servicio de dictado no está disponible aquí.","audio-capture":"No hay un micrófono disponible.",network:"No se pudo conectar con el servicio de dictado. Activa la escucha de nuevo cuando vuelva la conexión.","no-speech":"No detecté una orden. Puedes intentarlo otra vez."};
      setNote(errors[event.error]??"La escucha se detuvo. Puedes continuar por texto.");
      if(event.error!=="no-speech"){wake.current=false;setWakeState(false);}
      haltRecognition();
    };
    current.onend=()=>{
      if(epoch!==generation.current)return;
      haltRecognition();
      if(!handled&&!failed){if(mode==="command")setNote("No recibí una orden completa.");resumeWake();}
    };
    try{current.start();}catch{haltRecognition();wake.current=false;setWakeState(false);setNote("No se pudo iniciar la voz. Puedes seguir por escrito.");}
  },[suspend,haltRecognition,resumeWake]);
  startRef.current=start;

  const setWake = useCallback((enabled:boolean)=>{
    wake.current=enabled;setWakeState(enabled);busy.current=false;
    if(enabled)start("wake");else haltRecognition();
  },[start,haltRecognition]);
  const setVoice = useCallback((enabled:boolean)=>{voice.current=enabled;setVoiceState(enabled);if(!enabled){stopSpeech();busy.current=false;resumeWake();}},[stopSpeech,resumeWake]);
  const beginCommand = useCallback(()=>{busy.current=false;wakeCallback.current();start("command");},[start]);
  const beginWork = useCallback(()=>{busy.current=true;suspend();},[suspend]);
  const finish = useCallback((text:string)=>{
    haltRecognition();stopSpeech();
    const complete=()=>{busy.current=false;if(alive.current)setSpeaking(false);resumeWake();};
    if(!voice.current||!("speechSynthesis" in window)||document.hidden){complete();return;}
    const epoch=++speechGeneration.current;const utterance=new SpeechSynthesisUtterance(text.slice(0,1400));
    utterance.lang="es-PE";utterance.rate=1.04;utterance.pitch=.9;
    const available=window.speechSynthesis.getVoices();const selected=available.find(item=>item.lang==="es-PE")??available.find(item=>item.lang.startsWith("es"));if(selected)utterance.voice=selected;
    utterance.onstart=()=>{if(epoch===speechGeneration.current&&alive.current){setSpeaking(true);}};
    utterance.onend=()=>{if(epoch===speechGeneration.current)complete();};
    utterance.onerror=()=>{if(epoch===speechGeneration.current){setNote("La respuesta está disponible por escrito; no se pudo reproducir la voz.");complete();}};
    window.speechSynthesis.speak(utterance);
  },[haltRecognition,stopSpeech,resumeWake]);
  const cancelSpeaking=useCallback(()=>{stopSpeech();busy.current=false;resumeWake();},[stopSpeech,resumeWake]);
  const cancelCommand=useCallback(()=>{haltRecognition();busy.current=false;resumeWake();},[haltRecognition,resumeWake]);

  useEffect(()=>{
    alive.current=true;const speechWindow=window as VoiceWindow;
    setSupported(Boolean(speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition));setSpeechSupported("speechSynthesis" in window);
    const hide=()=>{if(document.hidden){stopAll();setNote("Escucha pausada al salir de la página. Actívala cuando regreses.");}};
    document.addEventListener("visibilitychange",hide);window.addEventListener("pagehide",stopAll);
    return()=>{alive.current=false;wake.current=false;haltRecognition();stopSpeech();document.removeEventListener("visibilitychange",hide);window.removeEventListener("pagehide",stopAll);};
  },[haltRecognition,stopSpeech,stopAll]);
  return {supported,speechSupported,listening,starting,speaking,wakeEnabled,voiceEnabled,partial,note,analyser,setWake,setVoice,beginCommand,beginWork,finish,stopAll,cancelSpeaking,cancelCommand,resumeWake};
}
