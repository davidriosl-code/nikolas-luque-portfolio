import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** One renderer for the entire page. HTML retains all content if WebGL is unavailable. */
export function createSpatialScene(canvas:HTMLCanvasElement) {
  let renderer:THREE.WebGLRenderer;
  try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"}); }
  catch {canvas.dataset.unavailable="true";return null;}
  const small=matchMedia("(max-width: 760px)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,small?1.15:1.5));
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  renderer.transmissionResolutionScale=.5;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,60);
  camera.position.z=10;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;
  room.dispose();pmrem.dispose();
  const chrome=new THREE.MeshPhysicalMaterial({color:0xe2d9ef,metalness:1,roughness:.14,clearcoat:1,clearcoatRoughness:.08,iridescence:.25,iridescenceIOR:1.3});
  const violet=new THREE.MeshPhysicalMaterial({color:0x784bd6,metalness:.7,roughness:.18,clearcoat:1,iridescence:.55});
  const glass=new THREE.MeshPhysicalMaterial({color:0xc9c4ff,metalness:.12,roughness:.08,transmission:.68,thickness:.7,ior:1.45,clearcoat:1});
  const rig=new THREE.Group();scene.add(rig);
  const form=new THREE.Mesh(new THREE.TorusKnotGeometry(1.48,.29,small?100:180,small?16:28,2,3),chrome);
  form.rotation.set(.6,-.2,-.4);rig.add(form);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(2.3,.033,12,128),violet);
  halo.rotation.set(.8,.5,.2);rig.add(halo);
  const glassRing=new THREE.Mesh(new THREE.TorusGeometry(2.12,.115,small?12:20,96),glass);
  glassRing.rotation.set(-.5,.2,.6);rig.add(glassRing);
  const beads:THREE.Mesh[]=[];
  const beadGeometry=new THREE.SphereGeometry(1,small?16:24,small?12:20);
  for(let i=0;i<7;i++){
    const bead=new THREE.Mesh(beadGeometry,i%3===0?glass:i%2===0?violet:chrome);
    bead.scale.setScalar(i===0?.23:.075+(i%3)*.045);rig.add(bead);beads.push(bead);
  }
  scene.add(new THREE.HemisphereLight(0xe9e9ff,0x3b144f,3));
  const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.PointLight(0x8151ff,60,18);rim.position.set(3,0,4);scene.add(rim);
  const fill=new THREE.PointLight(0x83ceff,45,15);fill.position.set(-4,-2,3);scene.add(fill);
  let frame=0,last=0,elapsed=0,paused=false,disposed=false,lost=false;
  let width=innerWidth,height=innerHeight;
  let pointerX=0,pointerY=0,rotationX=0,rotationY=0;
  let targetX=.27,targetY=.05,targetScale=1,targetOpacity=1;
  let currentX=targetX,currentY=targetY,currentScale=targetScale,currentOpacity=1;
  let positions:{top:number;height:number;kind:string}[]=[];
  const settings:Record<string,{x:number;y:number;scale:number;opacity:number}>= {
    hero:{x:.27,y:.05,scale:1,opacity:1},
    about:{x:-.39,y:.15,scale:.6,opacity:.24},
    capabilities:{x:.4,y:-.18,scale:.8,opacity:.35},
    stack:{x:.37,y:.12,scale:.85,opacity:.4},
    perspective:{x:-.32,y:.24,scale:.7,opacity:.4},
    contact:{x:.32,y:.02,scale:1.05,opacity:.9}
  };
  const measure=()=>{
    positions=[...document.querySelectorAll<HTMLElement>("[data-scene]")].map(node=>({top:node.getBoundingClientRect().top+scrollY,height:node.offsetHeight,kind:node.dataset.scene!}));
  };
  const updateTarget=()=>{
    const focus=scrollY+height*.45;
    let index=0;
    positions.forEach((p,i)=>{if(focus>=p.top)index=i;});
    const entry=positions[index];if(!entry)return;
    const a=settings[entry.kind]||settings.hero;
    const next=positions[index+1];
    const blend=next?THREE.MathUtils.smoothstep(focus,next.top-height*.25,next.top):0;
    const b=next?(settings[next.kind]||a):a;
    targetX=THREE.MathUtils.lerp(a.x,b.x,blend);targetY=THREE.MathUtils.lerp(a.y,b.y,blend);
    targetScale=THREE.MathUtils.lerp(a.scale,b.scale,blend);targetOpacity=THREE.MathUtils.lerp(a.opacity,b.opacity,blend);
    if(width<760){targetX=entry.kind==="hero"?0:targetX;targetY=entry.kind==="hero"?.3:targetY;targetScale*=.69;targetOpacity*=.8;}
  };
  const draw=(now:number)=>{
    frame=0;if(disposed||lost)return;
    const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
    if(!paused)elapsed+=dt;
    const ease=paused?1:1-Math.exp(-dt*4.5);
    currentX+=(targetX-currentX)*ease;currentY+=(targetY-currentY)*ease;currentScale+=(targetScale-currentScale)*ease;currentOpacity+=(targetOpacity-currentOpacity)*ease;
    rotationX+=((paused?0:pointerY*.17)-rotationX)*ease;
    rotationY+=((paused?0:pointerX*.25)-rotationY)*ease;
    const viewHeight=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z;
    rig.position.set(currentX*viewHeight*camera.aspect,-currentY*viewHeight,0);
    rig.scale.setScalar(currentScale);
    rig.rotation.set(rotationX,rotationY,0);
    form.rotation.set(.6+Math.sin(elapsed*.16)*.16,elapsed*.12-.2,-.4+Math.sin(elapsed*.12)*.2);
    halo.rotation.z=elapsed*.07+.2;glassRing.rotation.y=elapsed*.1+.2;
    beads.forEach((bead,i)=>{const angle=i*Math.PI*2/7+elapsed*.13;bead.position.set(Math.cos(angle)*2.55,Math.sin(angle)*2.2,Math.sin(angle*2)*.65);});
    canvas.style.opacity=String(currentOpacity);
    renderer.render(scene,camera);
    canvas.dataset.ready="true";
    if(!paused&&!document.hidden)frame=requestAnimationFrame(draw);
  };
  const wake=()=>{if(!frame&&!disposed&&!lost&&!document.hidden)frame=requestAnimationFrame(draw);};
  const resize=()=>{width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();measure();updateTarget();wake();};
  const scroll=()=>{updateTarget();wake();};
  const pointer=(event:PointerEvent)=>{if(event.pointerType!=="mouse"||paused)return;pointerX=event.clientX/width-.5;pointerY=event.clientY/height-.5;};
  const leave=()=>{pointerX=pointerY=0;};
  const visibility=()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)wake();};
  const contextLost=(event:Event)=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;canvas.dataset.ready="false";};
  const contextRestored=()=>{lost=false;last=0;wake();};
  const observer=new ResizeObserver(()=>{measure();updateTarget();wake();});observer.observe(document.body);
  window.addEventListener("resize",resize,{passive:true});window.addEventListener("scroll",scroll,{passive:true});
  window.addEventListener("pointermove",pointer,{passive:true});document.addEventListener("pointerleave",leave);
  document.addEventListener("visibilitychange",visibility);canvas.addEventListener("webglcontextlost",contextLost);canvas.addEventListener("webglcontextrestored",contextRestored);
  resize();
  return {
    setPaused(value:boolean){paused=value;cancelAnimationFrame(frame);frame=0;last=0;wake();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",resize);window.removeEventListener("scroll",scroll);window.removeEventListener("pointermove",pointer);document.removeEventListener("pointerleave",leave);document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("webglcontextlost",contextLost);canvas.removeEventListener("webglcontextrestored",contextRestored);const geometry=new Set<THREE.BufferGeometry>();scene.traverse(node=>{if(node instanceof THREE.Mesh)geometry.add(node.geometry);});geometry.forEach(g=>g.dispose());[chrome,violet,glass].forEach(m=>m.dispose());environment.dispose();renderer.dispose();}
  };
}
