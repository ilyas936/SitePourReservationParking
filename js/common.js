/* js/common.js : données, tarifs, plaque d'immatriculation et stockage (chargé en premier) */
const $=q=>document.querySelector(q);
const eur=n=>n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const T={std:'Standard',ev:'Borne électrique',pmr:'Accessible PMR'};
const K=.036; // échelle du plan (pixels du plan -> unités 3D)
const ROWS={
  A:{y:30,rate:3.5,cap:22,dir:-1,where:'Face à l’entrée, sous auvent'},
  B:{y:200,rate:2.8,cap:16,dir:1,where:'Milieu du parking'},
  C:{y:300,rate:2.2,cap:12,dir:-1,where:'Fond du parking, la plus économique'}};
const spots=[];
for(const r of 'ABC')for(let i=0;i<10;i++){
  const t=(r==='A'&&i<2)?'pmr':(i>=8&&r!=='C')?'ev':'std',R=ROWS[r],x=100+i*70;
  spots.push({id:r+(i+1),r,i,t,cx:(x+35-450)*K,cz:(R.y+50-235)*K,rate:R.rate+(t==='ev'?.8:0),cap:R.cap+(t==='ev'?4:0)});
}
const byId=id=>spots.find(x=>x.id===id);
function h(str){let n=2166136261;for(const c of str){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0)%100}

/* Plaque au format SIV : AB-123-CD (mise en forme automatique pendant la saisie) */
const fmtPlate=raw=>{const v=String(raw).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
  return[v.slice(0,2),v.slice(2,5),v.slice(5,7)].filter(Boolean).join('-')};
const isPlate=p=>/^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(p);
const plateHTML=p=>isPlate(p)?`<div class="plate"><span class="eu">F</span><span class="txt">${p}</span></div>`:'';

/* Stockage local (navigateur). À remplacer par un vrai backend plus tard. */
const DB={
  all(){try{return JSON.parse(localStorage.getItem('resparking')||'[]')}catch(e){return[]}},
  save(v){try{localStorage.setItem('resparking',JSON.stringify(v))}catch(e){}}};

/* Créneaux : q = {date:'2026-09-24', start:'09:00', dur:2}  (dur 0 = journée 7h-22h) */
const span=q=>{const a=+String(q.start).slice(0,2);return q.dur?[a,a+q.dur]:[7,22]};
const overlap=(a,b)=>a.date===b.date&&span(a)[0]<span(b)[1]&&span(b)[0]<span(a)[1];
const busy=(sp,q)=>h(q.date+q.start+q.dur+sp.id)<30||DB.all().some(r=>r.spot===sp.id&&overlap(r,q)); // 1er test = occupation simulée
const price=(sp,dur)=>dur?Math.min(dur*sp.rate,sp.cap):sp.cap;
const slotLabel=q=>{
  const d=new Date(q.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  return q.dur?`${d}, de ${q.start} à ${String((+String(q.start).slice(0,2)+q.dur)%24).padStart(2,'0')}:00`:d+', toute la journée'};

function reserve(sp,q,plate){
  if(!isPlate(plate))return{error:'Plaque invalide. Format attendu : AB-123-CD.'};
  const all=DB.all();
  if(all.some(r=>r.plate===plate&&overlap(r,q)))return{error:'Cette plaque a déjà une réservation sur ce créneau.'};
  if(busy(sp,q))return{error:'Cette place vient d’être prise.'};
  const r={id:Date.now(),code:'RSP-'+(Math.floor(Math.random()*9000)+1000),spot:sp.id,date:q.date,start:q.start,dur:q.dur,plate,total:price(sp,q.dur)};
  all.push(r);DB.save(all);return{ok:r};
}
