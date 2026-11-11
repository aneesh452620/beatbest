import React, { useEffect, useRef, useState } from 'react';
import { FINISHES } from './cart.mjs';

export default function ProductScene({finish=FINISHES[0],progress=0,reduced=false,kind='hero',onReady,onImages}) {
  const canvas=useRef(), api=useRef(), values=useRef({progress,finish,reduced}), pointer=useRef({x:0,y:0});
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const labels=useRef(); values.current={progress,finish,reduced};
  useEffect(()=>{let alive=true,frame,observer,resizeObserver,visible=true;let lastFinish,lastKey='';
    import('./model.js').then(({createScene})=>{
      if(!alive)return;
      try {const scene=createScene(canvas.current,values.current.finish);api.current=scene;
      if(onImages){scene.renderer.setSize(1000,850,false);scene.camera.aspect=1000/850;scene.camera.updateProjectionMatrix();
        const shots=[{angle:.7,tilt:-.17,zoom:.94},{angle:-.95,tilt:.18,zoom:1.1},{angle:1.3,tilt:0,zoom:1.9,macro:1}];
        const images=shots.map(config=>{scene.render(config);return canvas.current.toDataURL('image/webp',.88)});onImages(images);scene.resize();
      }
      const draw=()=>{if(!alive)return;frame=requestAnimationFrame(draw);if(!visible)return;
        const {progress:p,finish:f,reduced:r}=values.current;const mobile=window.innerWidth<760;
        const key=[p,f.id,r,window.innerWidth,window.innerHeight,pointer.current.x,pointer.current.y].join('|');if(key===lastKey)return;lastKey=key;
        if(f!==lastFinish){scene.model.setFinish(f);lastFinish=f;}
        const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
        const orbit=smooth(.1,.27,p),macroIn=smooth(.30,.38,p),macroOut=smooth(.46,.54,p),separate=smooth(.54,.66,p),assemble=smooth(.81,.93,p);
        const macro=macroIn*(1-macroOut);const explosion=separate*(1-assemble);
        const settings=kind==='hero'?{angle:.6+orbit*.55-macro*.18-explosion*.42,tilt:-.15+orbit*.15,zoom:mobile?(1-explosion*.15):(1+macro*.72-explosion*.18),macro:mobile?0:macro,explode:explosion,offset:mobile?0:1.1*(1-macro*.7),mobile,parallaxX:r?0:pointer.current.x*.035,parallaxY:r?0:pointer.current.y*.022}:{angle:.68,tilt:-.16,zoom:mobile?1.12:1.03,mobile};
        scene.render(settings);
        if(labels.current){const anchors=[scene.model.anchors.shell,scene.model.anchors.cushion,scene.model.anchors.band];[...labels.current.children].forEach((el,i)=>{const pos=scene.project(anchors[i]);el.style.left=`${pos.x}px`;el.style.top=`${pos.y}px`;});}
      };
      resizeObserver=new ResizeObserver(()=>{scene.resize();lastKey='';});resizeObserver.observe(canvas.current);
      observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'});observer.observe(canvas.current);
      setReady(true);onReady?.();draw();
      }catch(err){console.error('Product render unavailable',err);setFailed(true);}
    }).catch(()=>setFailed(true));
    return()=>{alive=false;cancelAnimationFrame(frame);observer?.disconnect();resizeObserver?.disconnect();api.current?.dispose();};
  },[]);
  const exploded=progress>.62&&progress<.84;
  return <div className={`product-scene ${kind}`} onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-rect.left)/rect.width-.5,y:(e.clientY-rect.top)/rect.height-.5};}} onPointerLeave={()=>pointer.current={x:0,y:0}}>
    {(!ready||failed)&&<div className="product-placeholder" role="img" aria-label="Outline preview of Beatbest over-ear headphones"><div className="preview-band"/><div className="preview-cup left"/><div className="preview-cup right"/><span>{failed?'3D preview unavailable — explore the finishes below':'Preparing your perspective'}</span></div>}
    <canvas ref={canvas} className={ready?'is-ready':''} aria-label={`Three-dimensional Beatbest 01 headphones in ${finish.name}`} role="img"/>
    {kind==='hero'&&<div ref={labels} className={`part-labels ${exploded?'visible':''}`} aria-hidden={!exploded}><div className="part-label shell-label"><i/><span>01 / Aluminum shell</span></div><div className="part-label cushion-label"><i/><span>02 / Sculpted cushion</span></div><div className="part-label band-label"><i/><span>03 / Padded headband</span></div></div>}
  </div>;
}
