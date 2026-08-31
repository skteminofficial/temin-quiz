if(sessionStorage.getItem('teminTeacher')!=='yes') location.replace('teacher-login.html');

const cfg=window.TEMIN_CONFIG;
const msg=document.getElementById('teacherMessage');
const subject=document.getElementById('subject');
const year=document.getElementById('year');
const form=document.getElementById('quickForm');

document.getElementById('logout')?.addEventListener('click',()=>{
  sessionStorage.removeItem('teminTeacher');
  location.href='index.html';
});

const advanced=document.getElementById('advanced');
const panel=document.getElementById('advancedPanel');
advanced?.addEventListener('click',()=>panel.classList.toggle('hidden'));

async function loadConfig(){
  try{
    const res=await fetch(cfg.backendUrl+'?action=config');
    const data=await res.json();
    if(!data.ok) throw new Error('CONFIG_ERROR');

    subject.innerHTML='<option value="">Pilih subjek</option>'+
      data.subjects.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
    year.innerHTML='<option value="">Pilih tahun</option>'+
      data.years.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  }catch(err){
    msg.textContent='⚠️ Senarai sistem gagal dimuatkan. Refresh halaman.';
  }
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const button=form.querySelector('.generate');
  const payload={
    action:'createQuiz',
    teacherId:'SKTEMIN',
    subject:subject.value,
    year:year.value,
    topic:document.getElementById('topic').value.trim(),
    questionCount:Number(document.getElementById('questionCount').value),
    mode:'SMART',
    sourceType:'CURRICULUM_MASTER'
  };

  if(!payload.subject||!payload.year||!payload.topic){
    msg.textContent='Lengkapkan Subjek, Tahun dan Topik dahulu.';
    return;
  }

  button.disabled=true;
  button.textContent='⚡ MENYEDIAKAN...';
  msg.textContent='';

  try{
    const res=await fetch(cfg.backendUrl,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    });
    const data=await res.json();
    if(!data.ok) throw new Error(data.error||'CREATE_FAILED');

    msg.innerHTML=`✅ Draf kuiz berjaya diwujudkan. <b>${escapeHtml(data.quizId)}</b>`;
    form.dataset.quizId=data.quizId;
  }catch(err){
    msg.textContent='Kuiz belum dapat disimpan. Cuba lagi.';
  }finally{
    button.disabled=false;
    button.textContent='⚡ JANA KUIZ CEPAT';
  }
});

document.querySelectorAll('.shortcut-grid button').forEach(b=>b.addEventListener('click',()=>{
  alert('Modul ini akan diaktifkan selepas Quiz Engine disambungkan.');
}));

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

loadConfig();