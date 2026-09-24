/* js/reserver.js : page de réservation (état, panneau latéral, saisie de la plaque, contrôles) */
const s={sel:null,filter:'all',date:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),
  start:'09:00',dur:2,done:null,park:null,plate:''};
try{s.plate=fmtPlate(localStorage.getItem('resparking_plate')||'')}catch(e){}
const slotQ=()=>({date:s.date,start:s.start,dur:s.dur});
const taken=sp=>busy(sp,slotQ());
const matches=sp=>s.filter==='all'||sp.t===s.filter;

function panel(){
  const p=$('#panel');
  if(s.done){
    const r=s.done;
    p.innerHTML=`<div class="ticket"><p class="k">Réservation confirmée</p><div class="num">${r.spot}</div><p class="m">${slotLabel(r)}</p>
    ${plateHTML(r.plate)}<p class="k">Code de la barrière</p><div class="code">${r.code}</div>
    <p class="m">Total : ${eur(r.total)}. La barrière lit votre plaque, ou saisissez ce code au clavier.</p></div>
    <button class="btn ghost" data-act="again">Réserver une autre place</button>`;return;
  }
  if(!s.sel){
    const n=spots.filter(x=>!taken(x)&&matches(x)).length;
    p.innerHTML=`<h2>Choisissez votre place</h2><p class="m">Survolez le plan pour voir les prix, cliquez sur une place libre pour la réserver.</p>
    <div class="big">${n}</div><p class="m">places libres sur ce créneau</p>`;return;
  }
  const sp=byId(s.sel),R=ROWS[sp.r];
  const eq={std:'Éclairage LED, place standard',ev:'Borne de recharge 7 kW incluse',pmr:'Proche de l’entrée, accès de plain-pied'}[sp.t];
  p.innerHTML=`<p class="k">Place</p><div class="num">${sp.id}</div><span class="badge ${sp.t}">${T[sp.t]}</span>
  <div class="price">${eur(price(sp,s.dur))}</div>
  <p class="m">${eur(sp.rate)} par heure, plafonné à ${eur(sp.cap)} par jour</p>
  <dl><dt>Créneau</dt><dd>${slotLabel(slotQ())}</dd><dt>Emplacement</dt><dd>${R.where}</dd>
  <dt>Dimensions</dt><dd>${sp.t==='pmr'?'3,30':'2,50'} × 5,00 m</dd><dt>Équipement</dt><dd>${eq}</dd></dl>
  <label class="k" for="plate">Plaque d’immatriculation</label>
  <div class="plate"><span class="eu">F</span><input id="plate" value="${s.plate}" maxlength="9" placeholder="AB-123-CD" autocomplete="off" spellcheck="false"></div>
  <p class="err" id="perr" hidden></p>
  <button class="cta" data-act="book">Réserver la place ${sp.id}</button>`;
}
function render(){
  if(s.sel&&(taken(byId(s.sel))||!matches(byId(s.sel)))){s.sel=null;camHome()}
  sync3d();panel();
  document.querySelectorAll('.seg').forEach(g=>g.querySelectorAll('button').forEach(b=>
    b.setAttribute('aria-pressed',String(g.dataset.k==='dur'?+b.dataset.v===s.dur:b.dataset.v===s.filter))));
  $('#start').disabled=!s.dur;
}
function pick(sp){
  if(taken(sp)||!matches(sp))return;
  s.done=null;s.sel=sp.id;s.park=sp.id;camFocus(sp);render();
  if(innerWidth<960)$('#panel').scrollIntoView({behavior:'smooth',block:'nearest'});
}
// contrôles
const st=$('#start');
for(let i=7;i<=20;i++){const v=String(i).padStart(2,'0')+':00';st.add(new Option(v,v))}
st.value=s.start;$('#date').value=s.date;$('#date').min=s.date;
$('#date').onchange=e=>{if(e.target.value){s.date=e.target.value;s.done=null;render()}};
st.onchange=e=>{s.start=e.target.value;s.done=null;render()};
document.querySelectorAll('.seg').forEach(g=>g.onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(g.dataset.k==='dur')s.dur=+b.dataset.v;else s.filter=b.dataset.v;
  s.done=null;render();
});
// plaque : mise en forme en direct + aperçu sur la voiture 3D
$('#panel').addEventListener('input',e=>{
  if(e.target.id!=='plate')return;
  s.plate=e.target.value=fmtPlate(e.target.value);setPlate3d(s.plate);
  $('#perr').hidden=true;e.target.closest('.plate').classList.remove('bad');
});
$('#panel').onclick=e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='book'){
    const r=reserve(byId(s.sel),slotQ(),s.plate);
    if(r.error){const m=$('#perr');m.textContent=r.error;m.hidden=false;$('.plate').classList.add('bad');
      if(r.error.startsWith('Cette place'))render();return}
    try{localStorage.setItem('resparking_plate',s.plate)}catch(err){}
    s.done=r.ok;s.sel=null;camHome();
  }else{s.done=null}
  render();
};
try{init3d(new THREE.WebGLRenderer({antialias:true}))}
catch(err){$('#stage').innerHTML='<p style="color:#fff;padding:24px">Ce navigateur ne peut pas afficher la vue 3D.</p>'}
render();
