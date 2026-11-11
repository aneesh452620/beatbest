import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function grainTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#999'; ctx.fillRect(0,0,256,256);
  for (let y=0; y<256; y++) { const v=125+Math.sin(y*78.233)*18; ctx.fillStyle=`rgb(${v},${v},${v})`; ctx.fillRect(0,y,256,1); }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS=texture.wrapT=THREE.RepeatWrapping; texture.repeat.set(2,3); return texture;
}
function bandGeometry(radius, thickness, width) {
  const vertices=[], indices=[]; const n=80;
  for(let i=0;i<=n;i++) { const a=Math.PI*i/n; for(const [r,z] of [[radius-thickness/2,-width/2],[radius+thickness/2,-width/2],[radius+thickness/2,width/2],[radius-thickness/2,width/2]]) vertices.push(Math.cos(a)*r, Math.sin(a)*r*1.14+.05,z); }
  for(let i=0;i<n;i++) for(let j=0;j<4;j++) {const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4; indices.push(a,b,d,b,c,d);}
  indices.push(0,2,1,0,3,2,n*4,n*4+1,n*4+2,n*4,n*4+2,n*4+3);
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
function oval(width,height,depth,hole=false) {
  const s=new THREE.Shape(); s.absellipse(0,0,width/2,height/2,0,Math.PI*2,false,0);
  if(hole) {const p=new THREE.Path(); p.absellipse(0,0,width*.31,height*.33,0,Math.PI*2,true,0);s.holes.push(p);}
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:hole?.09:.055,bevelThickness:hole?.09:.055,curveSegments:56}); g.translate(0,0,-depth/2); g.rotateY(Math.PI/2); return g;
}
export function createHeadphones(finish) {
  const root=new THREE.Group(), parts=[];
  const grain=grainTexture();
  const metal=new THREE.MeshStandardMaterial({color:finish.shell,metalness:.87,roughness:.29,bumpMap:grain,bumpScale:.012});
  const pad=new THREE.MeshStandardMaterial({color:finish.pad,metalness:.03,roughness:.9,bumpMap:grain,bumpScale:.006});
  const dark=new THREE.MeshStandardMaterial({color:'#242723',roughness:.84});
  const edge=new THREE.MeshStandardMaterial({color:'#d3d4d0',metalness:1,roughness:.21});
  const orange=new THREE.MeshStandardMaterial({color:'#c35127',metalness:.3,roughness:.4});
  const mesh=(geo,mat,parent=root)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const band=mesh(bandGeometry(1.62,.095,.57),metal);
  const lining=mesh(bandGeometry(1.505,.13,.49),pad);
  parts.push({node:band,base:band.position.clone(),axis:new THREE.Vector3(0,.65,0)});
  parts.push({node:lining,base:lining.position.clone(),axis:new THREE.Vector3(0,.25,0)});
  const anchors={};
  for(const side of [-1,1]) {
    const cup=new THREE.Group();root.add(cup);cup.position.set(side*1.57,-.62,0);cup.rotation.z=side*.075;
    const yoke=mesh(new THREE.BoxGeometry(.12,.68,.16),edge); yoke.position.set(side*1.6,-.16,0);
    const pivot=mesh(new THREE.CylinderGeometry(.13,.13,.16,40),metal);pivot.rotation.z=Math.PI/2;pivot.position.set(side*1.65,-.4,0);
    const shell=mesh(oval(1.36,1.88,.27),metal,cup);shell.position.x=side*.16;
    const seam=mesh(oval(1.39,1.91,.032),dark,cup);seam.position.x=-side*.015;
    const rim=mesh(oval(1.40,1.93,.038),edge,cup);rim.position.x=-side*.06;
    const driver=mesh(oval(1.23,1.72,.05),dark,cup);driver.position.x=-side*.12;
    const cushion=mesh(oval(1.29,1.8,.21,true),pad,cup);cushion.position.x=-side*.29;
    const grille=mesh(oval(.75,1.13,.02),dark,cup);grille.position.x=-side*.23;
    for(let j=0;j<9;j++) {const line=mesh(new THREE.BoxGeometry(.006,.014,.57-Math.abs(j-4)*.024),new THREE.MeshStandardMaterial({color:'#51534d',roughness:.85}),cup);line.position.set(-side*.246,(j-4)*.095,0);}
    const button=mesh(new THREE.CylinderGeometry(.073,.073,.052,32),side===1?orange:metal,cup);button.rotation.x=Math.PI/2;button.position.set(side*.17,-.38,.665);
    const slot=mesh(new THREE.BoxGeometry(.08,.034,.012),dark,cup);slot.position.set(side*.12,-.63,.60);
    const mark=mesh(new THREE.BoxGeometry(.004,.045,.24),dark,cup);mark.position.set(side*.355,-.35,.06);
    for(const [node,dist] of [[shell,1.15],[seam,.82],[rim,.65],[driver,.34],[cushion,-.66],[grille,-.32]]) parts.push({node,base:node.position.clone(),axis:new THREE.Vector3(side*dist,0,0)});
    // Small fixtures remain attached to the shell throughout the reveal.
    for(const node of [button,slot,mark]) parts.push({node,base:node.position.clone(),axis:new THREE.Vector3(side*1.15,0,0)});
    if(side===1) { anchors.shell=shell;anchors.cushion=cushion;anchors.driver=driver; }
  }
  anchors.band=band;
  return {root,parts,anchors,setFinish(f){metal.color.set(f.shell);pad.color.set(f.pad);},explode(amount){parts.forEach(p=>p.node.position.copy(p.base).addScaledVector(p.axis,amount));}};
}

export function createScene(canvas,finish,{staticView=false}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;environment.dispose();pmrem.dispose();
  const ambient=new THREE.HemisphereLight('#fffdf6','#8c8980',2.5);scene.add(ambient);
  const light=new THREE.DirectionalLight('#fff9ee',5);light.position.set(3,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-6;light.shadow.camera.right=6;light.shadow.camera.top=6;light.shadow.camera.bottom=-6;light.shadow.normalBias=.03;light.shadow.radius=5;scene.add(light);
  const fill=new THREE.DirectionalLight('#e1e8ee',2.2);fill.position.set(-4,2,-3);scene.add(fill);
  const model=createHeadphones(finish);scene.add(model.root);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-2.05;ground.receiveShadow=true;scene.add(ground);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d');const grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(55,48,38,.24)');grad.addColorStop(1,'rgba(55,48,38,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const contactTexture=new THREE.CanvasTexture(shadowCanvas);const contact=new THREE.Mesh(new THREE.PlaneGeometry(5.6,3.3),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-2.04;scene.add(contact);
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  resize();
  function render({angle=.65,zoom=1,explode=0,tilt=-.13,offset=0,parallaxX=0,parallaxY=0,mobile=false,macro=0}={}) {
    model.explode(explode);model.root.rotation.set(.06+parallaxY,angle+parallaxX,tilt);
    model.root.position.set(offset,0,0);
    const distance=(mobile?11.3:10.8)/zoom;camera.position.set(0,1.5,distance);camera.lookAt(macro*.75,.15-macro*.55,0);camera.updateMatrixWorld();renderer.render(scene,camera);
  }
  function project(node){const v=new THREE.Vector3();node.getWorldPosition(v);v.project(camera);return {x:(v.x+1)*canvas.clientWidth/2,y:(1-v.y)*canvas.clientHeight/2};}
  function dispose(){scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose();}});env.dispose();contactTexture.dispose();renderer.dispose();}
  return {renderer,scene,camera,model,render,resize,project,dispose};
}
