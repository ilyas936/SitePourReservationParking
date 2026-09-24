/* js/mes-reservations.js : retrouver et annuler ses réservations avec sa plaque (utilise common.js) */
const inp=$('#plate'),list=$('#list');
try{inp.value=fmtPlate(localStorage.getItem('resparking_plate')||'')}catch(e){}
function draw(){
  const p=inp.value;
  if(!isPlate(p)){list.innerHTML='<p class="m">Saisissez votre plaque pour retrouver vos réservations.</p>';return}
  const mine=DB.all().filter(r=>r.plate===p).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  list.innerHTML=mine.length?mine.map(r=>`<div class="res"><div class="num sm">${r.spot}</div>
    <div><strong>${slotLabel(r)}</strong><p class="m">Code ${r.code}, ${eur(r.total)}</p></div>
    <button class="btn ghost" data-id="${r.id}">Annuler</button></div>`).join('')
    :'<p class="m">Aucune réservation pour cette plaque.</p>';
}
inp.addEventListener('input',()=>{inp.value=fmtPlate(inp.value);draw()});
list.addEventListener('click',e=>{
  const b=e.target.closest('[data-id]');if(!b)return;
  DB.save(DB.all().filter(r=>String(r.id)!==b.dataset.id));draw();
});
draw();
