/* js/scene3d.js : vue 3D (Three.js r128). Utilise : common.js + s, taken(), matches(), pick() de reserver.js */
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const COL=['#8fa3bf','#c7d1e0','#5c6f8a','#a25b6a','#d8b26a'];
let sync3d=()=>{},camHome=()=>{},camFocus=()=>{},setPlate3d=()=>{};

function init3d(R3){
  const stage=$('#stage'),scene=new THREE.Scene(),cam3=new THREE.PerspectiveCamera(38,1,.5,220),el=R3.domElement;
  R3.setPixelRatio(Math.min(devicePixelRatio,2));R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;
  stage.insertBefore(el,stage.firstChild);
  const std=(c,r=.8,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const box=(w,hh,d,mat,x,y,z,parent=scene)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),mat);m.position.set(x,y,z);parent.add(m);return m};
  scene.add(new THREE.HemisphereLight(0xcfe0ff,0x141c2b,.85));
  const sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(10,22,12);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:14,bottom:-14,near:1,far:60});scene.add(sun);
  box(900*K+2,.3,470*K+2,std('#0b1220'),0,-.55,0);
  box(900*K,.4,470*K,std('#1b2536',.95),0,-.2,0).receiveShadow=true;
  // marquage des places
  const paint=new THREE.MeshBasicMaterial({color:0xffffff}),line=(x,z,w,d)=>box(w,.02,d,paint,x,.012,z);
  spots.forEach(sp=>{line(sp.cx-1.26,sp.cz,.07,3.6);line(sp.cx,sp.cz+ROWS[sp.r].dir*1.75,2.52,.07);if(sp.i===9)line(sp.cx+1.26,sp.cz,.07,3.6)});
  // voie de circulation
  const X0=-14.76,X1=14.4,Z1=-2.52,Z2=7.2,dashM=new THREE.MeshBasicMaterial({color:0xffb020,transparent:true,opacity:.6});
  const dashes=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.floor(L/.9),ang=Math.atan2(bx-ax,bz-az);
    for(let i=0;i<n;i++){const t=(i+.5)/n;box(.08,.02,.45,dashM,ax+(bx-ax)*t,.014,az+(bz-az)*t).rotation.y=ang}};
  dashes(X0,Z1,X1,Z1);dashes(X1,Z1,X1,Z2);dashes(X1,Z2,X0,Z2);
  const ash=new THREE.Shape();ash.moveTo(-.4,-.32);ash.lineTo(.4,0);ash.lineTo(-.4,.32);
  const amat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,side:THREE.DoubleSide});
  const arrow=(x,z,a)=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.ShapeGeometry(ash),amat);m.rotation.x=-Math.PI/2;g.add(m);g.position.set(x,.02,z);g.rotation.y=a;scene.add(g)};
  [-6,0,6].forEach(x=>{arrow(x,Z1+.55,0);arrow(x,Z2-.55,Math.PI)});arrow(X1+.55,2.4,-Math.PI/2);
  // lampadaires et barrière
  [[-13.9,-5.5],[13.9,5]].forEach(([x,z])=>{
    box(.16,4.4,.16,std('#2a3547'),x,2.2,z);
    const b=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshBasicMaterial({color:0xffe2a8}));b.position.set(x,4.5,z);scene.add(b);
    const l=new THREE.PointLight(0xffd39a,.9,20);l.position.set(x,4.3,z);scene.add(l)});
  const barrier=new THREE.Group();barrier.position.set(-15.1,1,-1.05);scene.add(barrier);
  box(.35,1.1,.35,std('#2a3547'),-15.1,.55,-1.05);box(.12,.12,2.4,std('#ffb020'),0,0,-1.25,barrier);
  // voitures
  const cg={body:new THREE.BoxGeometry(1.7,.55,2.9),cab:new THREE.BoxGeometry(1.45,.5,1.5),wh:new THREE.CylinderGeometry(.32,.32,.25,14).rotateZ(Math.PI/2)};
  const glass=std('#0b1220',.15,.6),tire=std('#07090d');
  function makeCar(col){
    const g=new THREE.Group(),m=std(col,.35,.35),b=new THREE.Mesh(cg.body,m),c=new THREE.Mesh(cg.cab,glass);
    b.position.y=.56;c.position.set(0,1.08,-.1);g.add(b,c);
    [[-.86,.98],[.86,.98],[-.86,-.98],[.86,-.98]].forEach(([x,z])=>{const w=new THREE.Mesh(cg.wh,tire);w.position.set(x,.32,z);g.add(w)});
    g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData.mat=m;return g}
  function label(sp){
    const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d');
    x.textAlign='center';x.fillStyle='#fff';x.font='700 44px Figtree,system-ui,sans-serif';x.fillText(sp.id,64,48);
    if(sp.t!=='std'){x.font='700 24px Figtree,system-ui,sans-serif';x.fillStyle=sp.t==='ev'?'#19d3a2':'#7fa8ff';x.fillText(sp.t==='ev'?'EV':'PMR',64,82)}
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.05),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
    m.rotation.x=-Math.PI/2;return m}
  const pads=[];
  spots.forEach(sp=>{
    const R=ROWS[sp.r],pm=new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,opacity:.06,depthWrite:false,emissive:'#ffffff',emissiveIntensity:0});
    const pad=new THREE.Mesh(new THREE.BoxGeometry(2.4,.06,3.44),pm);pad.position.set(sp.cx,.03,sp.cz);pad.userData.sp=sp;scene.add(pad);pads.push(pad);
    const car=makeCar('#8fa3bf');car.position.set(sp.cx,0,sp.cz+R.dir*.3);car.visible=false;scene.add(car);
    const lab=label(sp);lab.position.set(sp.cx,.075,sp.cz-R.dir*1.45);scene.add(lab);
    sp.o={pad,car,lab,op:.06,free:true};
  });
  // voiture du visiteur + sa plaque (mise à jour pendant la saisie)
  const hero=makeCar('#f4f7fb');hero.visible=false;scene.add(hero);let heroA=null,barGoal=0,hover=null;
  const pc=document.createElement('canvas');pc.width=256;pc.height=56;const px=pc.getContext('2d'),ptex=new THREE.CanvasTexture(pc);
  const plateMesh=new THREE.Mesh(new THREE.PlaneGeometry(.62,.136),new THREE.MeshBasicMaterial({map:ptex,side:THREE.DoubleSide}));
  plateMesh.position.y=.5;plateMesh.visible=false;hero.add(plateMesh);
  setPlate3d=t=>{
    px.clearRect(0,0,256,56);px.fillStyle='#fff';px.fillRect(0,0,256,56);px.fillStyle='#0b3ea8';px.fillRect(0,0,34,56);
    px.fillStyle='#fff';px.font='700 15px sans-serif';px.textAlign='center';px.fillText('F',17,48);
    px.fillStyle='#111';px.font='800 34px Figtree,sans-serif';px.fillText(t||'',145,40);ptex.needsUpdate=true;plateMesh.visible=!!t};
  // caméra
  const cam={th:0,ph:.9,r:26,tx:0,tz:0},goal={...cam};
  const homeR=()=>Math.min(56,26*Math.max(1,1.6/cam3.aspect));
  const fit=()=>{const w=stage.clientWidth,hh=stage.clientHeight;R3.setSize(w,hh);cam3.aspect=w/hh;cam3.updateProjectionMatrix()};
  camHome=()=>{goal.th=Math.round(goal.th/6.2832)*6.2832;goal.ph=.9;goal.r=homeR();goal.tx=0;goal.tz=0};
  camFocus=sp=>{goal.tx=sp.cx;goal.tz=sp.cz;goal.r=Math.max(13,homeR()*.5)};
  fit();camHome();
  if(reduce)Object.assign(cam,goal);else Object.assign(cam,{th:-1.3,ph:.3,r:goal.r*1.7});
  new ResizeObserver(fit).observe(stage);
  // interactions
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2(),tip=$('#tip'),tagEl=$('#tag'),vp=new THREE.Vector3();
  const zoom=f=>{goal.r=Math.min(60,Math.max(9,goal.r*f))};
  function at(e){const r=el.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(v2,cam3);const hit=ray.intersectObjects(pads)[0];return hit?hit.object.userData.sp:null}
  function setHover(sp,e){
    hover=sp;
    if(!sp){tip.hidden=true;el.style.cursor='grab';return}
    const free=!taken(sp)&&matches(sp);el.style.cursor=free?'pointer':'not-allowed';
    tip.textContent=taken(sp)?`${sp.id} : occupée sur ce créneau`:`${sp.id} : ${eur(price(sp,s.dur))} (${T[sp.t]})`;
    const r=stage.getBoundingClientRect();tip.style.left=(e.clientX-r.left)+'px';tip.style.top=(e.clientY-r.top)+'px';tip.hidden=false}
  const ptr=new Map();let moved=0;
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;el.style.cursor='grabbing';setHover(null,e)});
  el.addEventListener('pointermove',e=>{
    const p=ptr.get(e.pointerId);
    if(!p){if(e.pointerType==='mouse')setHover(at(e),e);return}
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(ptr.size===1){goal.th-=dx*.006;goal.ph=Math.min(1.35,Math.max(.25,goal.ph-dy*.005));moved+=Math.abs(dx)+Math.abs(dy)}
    else if(ptr.size===2){const o=[...ptr.entries()].find(([k])=>k!==e.pointerId)[1];
      const d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);if(d1>0)zoom(d0/d1);moved+=9}
    p.x=e.clientX;p.y=e.clientY});
  const up=e=>{if(ptr.size===1&&ptr.has(e.pointerId)&&moved<6&&e.type==='pointerup'){const sp=at(e);if(sp)pick(sp)}ptr.delete(e.pointerId);el.style.cursor='grab'};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('pointerleave',e=>{if(!ptr.size)setHover(null,e)});
  el.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.0012))},{passive:false});
  $('#reset').onclick=()=>camHome();
  // état -> scène
  sync3d=()=>{
    spots.forEach(sp=>{
      const o=sp.o,t=taken(sp),sel=s.sel===sp.id,dim=!matches(sp),m=o.pad.material;
      const base={std:['#ffffff',.06],ev:['#19d3a2',.4],pmr:['#4d8bff',.45]}[sp.t];
      m.color.set(sel?'#ffb020':base[0]);m.emissive.set(sel?'#ffb020':'#ffffff');
      o.op=t&&!sel?0:sel?.95:dim?base[1]*.2:base[1];o.free=!t&&!dim;
      o.car.visible=t&&!sel;o.car.userData.mat.color.set(COL[h(s.date+s.start+sp.id+'c')%5]);
      o.lab.material.opacity=t&&!sel?.4:dim?.3:.95;
    });
    barGoal=s.done?1.35:0;
    if(s.sel){
      const sp=byId(s.sel),R=ROWS[sp.r];hero.visible=true;tagEl.hidden=false;tagEl.textContent=eur(price(sp,s.dur));
      setPlate3d(s.plate);plateMesh.position.z=-R.dir*1.47;plateMesh.rotation.y=-R.dir<0?Math.PI:0;
      if(s.park===s.sel){
        heroA={x:sp.cx,z0:sp.cz-R.dir*5.5,z1:sp.cz+R.dir*.3,t0:reduce?-1e9:performance.now()};
        hero.position.set(heroA.x,0,heroA.z0);s.park=null}
      else if(!heroA)hero.position.set(sp.cx,0,sp.cz+R.dir*.3);
    }else{hero.visible=false;heroA=null;tagEl.hidden=true}
  };
  let last=performance.now();
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;
    const a=1-Math.exp(-dt*3.5),k=Math.min(1,dt*14);
    for(const n in cam)cam[n]+=(goal[n]-cam[n])*a;
    const sn=Math.sin(cam.ph);
    cam3.position.set(cam.tx+cam.r*sn*Math.sin(cam.th),cam.r*Math.cos(cam.ph),cam.tz+cam.r*sn*Math.cos(cam.th));
    cam3.lookAt(cam.tx,0,cam.tz);
    pads.forEach(p=>{
      const sp=p.userData.sp,o=sp.o,m=p.material,hv=hover===sp&&o.free,sel=s.sel===sp.id;
      p.position.y+=((sel?.08:hv?.1:.03)-p.position.y)*k;
      m.opacity+=((hv?Math.max(o.op,.5):o.op)-m.opacity)*k;
      m.emissiveIntensity+=((sel?.5:hv?.35:0)-m.emissiveIntensity)*k;
    });
    if(heroA){
      const t=Math.min(1,(now-heroA.t0)/800),e=1-Math.pow(1-t,3);
      hero.position.set(heroA.x,0,heroA.z0+(heroA.z1-heroA.z0)*e);hero.rotation.y=(1-e)*.3;
      if(t>=1)heroA=null;
    }
    barrier.rotation.x+=(barGoal-barrier.rotation.x)*Math.min(1,dt*4);
    if(s.sel){const sp=byId(s.sel);vp.set(sp.cx,2.4,sp.cz).project(cam3);
      tagEl.style.left=((vp.x*.5+.5)*stage.clientWidth)+'px';tagEl.style.top=((-vp.y*.5+.5)*stage.clientHeight)+'px'}
    R3.render(scene,cam3);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
