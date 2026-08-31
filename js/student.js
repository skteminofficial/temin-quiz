const cfg=window.TEMIN_CONFIG;
const params=new URLSearchParams(location.search),mode=params.get('mode');
const self=document.getElementById('selfPanel'),live=document.getElementById('livePanel');
const studentSubject=document.getElementById('studentSubject');
const studentYear=document.getElementById('studentYear');

if(mode==='self'){
  live.classList.add('hidden');
  document.getElementById('studentTitle').textContent='Pilih Cabaran Kamu!';
}
if(mode==='live'){
  self.classList.add('hidden');
  document.getElementById('studentTitle').textContent='Masuk Kelas!';
  document.getElementById('studentIntro').textContent='Masukkan kod yang diberi oleh guru.';
}

async function loadConfig(){
  try{
    const res=await fetch(cfg.backendUrl+'?action=config');
    const data=await res.json();
    if(!data.ok) return;
    studentSubject.innerHTML=data.subjects.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
    studentYear.innerHTML=data.years.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  }catch(e){}
}

document.getElementById('joinForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const code=document.getElementById('classCode').value.trim().toUpperCase();
  const msg=document.getElementById('joinMessage');
  if(!code){msg.textContent='Masukkan kod kelas dahulu.';return;}

  msg.textContent='Menyemak kod...';
  try{
    const res=await fetch(cfg.backendUrl+'?action=session&code='+encodeURIComponent(code));
    const data=await res.json();
    msg.textContent=data.ok
      ? `✅ Sesi ${data.classCode} ditemui. Skrin daftar murid akan diaktifkan dalam fasa seterusnya.`
      : 'Kod kelas tidak dijumpai atau sesi belum aktif.';
  }catch(e){
    msg.textContent='Sistem tidak dapat dihubungi. Cuba lagi.';
  }
});

document.querySelector('.demo')?.addEventListener('click',()=>{
  alert('Bank Kuiz Self Learning akan diaktifkan selepas Quiz Engine siap.');
});

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
loadConfig();