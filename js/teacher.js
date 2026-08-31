if(sessionStorage.getItem('teminTeacher')!=='yes') location.replace('teacher-login.html');

const cfg=window.TEMIN_CONFIG;
const msg=document.getElementById('teacherMessage');
const profileMsg=document.getElementById('profileMessage');
const subject=document.getElementById('subject');
const year=document.getElementById('year');
const scope=document.getElementById('scope');
const topic=document.getElementById('topic');
const form=document.getElementById('quickForm');
const sourceStatus=document.getElementById('sourceStatus');
const sourceStatusText=document.getElementById('sourceStatusText');
const sourceToggle=document.getElementById('sourceToggle');
const sourceDetails=document.getElementById('sourceDetails');
const textbookLink=document.getElementById('textbookLink');
const dskpLink=document.getElementById('dskpLink');

let currentSource=null;
let teacherProfile=readTeacherProfile();

document.getElementById('logout')?.addEventListener('click',()=>{
  sessionStorage.removeItem('teminTeacher');
  location.href='index.html';
});

const advanced=document.getElementById('advanced');
const panel=document.getElementById('advancedPanel');
advanced?.addEventListener('click',()=>panel.classList.toggle('hidden'));

sourceToggle?.addEventListener('click',()=>{
  sourceDetails.classList.toggle('hidden');
  sourceToggle.textContent=sourceDetails.classList.contains('hidden')?'Lihat sumber':'Sembunyikan';
});

scope?.addEventListener('change',syncScopeUI);
subject?.addEventListener('change',loadCurriculumSource);
year?.addEventListener('change',loadCurriculumSource);

document.getElementById('teacherProfileForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('teacherName').value.trim();
  if(!name) return;

  const btn=e.currentTarget.querySelector('button');
  btn.disabled=true;
  profileMsg.textContent='Menyimpan profil...';

  try{
    const res=await post({action:'registerTeacher',teacherName:name});
    if(!res.ok) throw new Error(res.error||'REGISTER_FAILED');
    teacherProfile=res.teacher;
    localStorage.setItem('teminTeacherProfile',JSON.stringify(teacherProfile));
    applyTeacherProfile();
    profileMsg.textContent='';
  }catch(err){
    profileMsg.textContent='Profil belum dapat disimpan. Cuba lagi.';
  }finally{
    btn.disabled=false;
  }
});

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

async function loadCurriculumSource(){
  currentSource=null;
  sourceDetails.classList.add('hidden');
  sourceToggle.classList.add('hidden');
  sourceToggle.textContent='Lihat sumber';

  if(!subject.value||!year.value){
    setSourceState('idle','Pilih Subjek + Tahun dahulu.');
    return;
  }

  setSourceState('loading','Mengesan Buku Teks & DSKP rasmi...');

  try{
    const url=cfg.backendUrl+'?action=curriculumSource&year='+encodeURIComponent(year.value)+'&subject='+encodeURIComponent(subject.value);
    const res=await fetch(url);
    const data=await res.json();

    if(!data.ok) throw new Error(data.error||'SOURCE_NOT_FOUND');

    currentSource=data;
    setSourceState('success','Sumber rasmi dikesan ✓');

    textbookLink.href=data.textbookUrl||'#';
    dskpLink.href=data.dskpUrl||'#';
    textbookLink.classList.toggle('disabled-link',!data.textbookUrl);
    dskpLink.classList.toggle('disabled-link',!data.dskpUrl);
    sourceToggle.classList.remove('hidden');
  }catch(err){
    setSourceState('error','Sumber rasmi belum ditemui.');
  }
}

function setSourceState(state,text){
  sourceStatus.className='source-status source-'+state;
  sourceStatusText.textContent=text;
}

function syncScopeUI(){
  const whole=scope.value==='WHOLE_BOOK';
  document.getElementById('topicWrap').classList.toggle('hidden',whole);
  document.getElementById('questionCountWrap').classList.toggle('hidden',whole);
  document.getElementById('questionsPerTopicWrap').classList.toggle('hidden',!whole);
  topic.required=!whole;
  if(whole) topic.value='';
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();

  if(!teacherProfile?.teacherId){
    document.getElementById('teacherProfileCard').classList.remove('hidden');
    document.getElementById('teacherName').focus();
    msg.textContent='Simpan profil guru dahulu.';
    return;
  }

  if(!currentSource?.ok){
    msg.textContent='Tunggu sehingga sumber rasmi dikesan.';
    return;
  }

  const wholeBook=scope.value==='WHOLE_BOOK';
  const button=form.querySelector('.generate');
  const payload={
    action:'createQuiz',
    teacherId:teacherProfile.teacherId,
    subject:subject.value,
    year:year.value,
    scope:scope.value,
    topic:wholeBook?'':topic.value.trim(),
    questionCount:wholeBook?0:Number(document.getElementById('questionCount').value),
    questionsPerTopic:wholeBook?document.getElementById('questionsPerTopic').value:'',
    mode:'SMART',
    sourceType:'CURRICULUM_MASTER'
  };

  if(!payload.subject||!payload.year||(!wholeBook&&!payload.topic)){
    msg.textContent=wholeBook?'Pilih Subjek dan Tahun dahulu.':'Lengkapkan Subjek, Tahun dan Topik dahulu.';
    return;
  }

  button.disabled=true;
  button.textContent='⚡ MENYEDIAKAN...';
  msg.textContent='';

  try{
    const data=await post(payload);
    if(!data.ok) throw new Error(data.error||'CREATE_FAILED');

    const q=data.quiz||{};
    msg.innerHTML=`✅ Draf kuiz berjaya diwujudkan. <b>${escapeHtml(q.quizId||'')}</b><br><small>📚 Buku Teks & DSKP rasmi telah dipautkan.</small>`;
    form.dataset.quizId=q.quizId||'';
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

function readTeacherProfile(){
  try{return JSON.parse(localStorage.getItem('teminTeacherProfile')||'null')}catch(e){return null}
}

function applyTeacherProfile(){
  const card=document.getElementById('teacherProfileCard');
  const chip=document.getElementById('teacherChip');
  if(teacherProfile?.teacherId){
    card.classList.add('hidden');
    chip.textContent='👩‍🏫 '+teacherProfile.teacherName;
    chip.classList.remove('hidden');
  }else{
    card.classList.remove('hidden');
    chip.classList.add('hidden');
  }
}

async function post(payload){
  const res=await fetch(cfg.backendUrl,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify(payload)
  });
  return res.json();
}

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

applyTeacherProfile();
syncScopeUI();
loadConfig();
