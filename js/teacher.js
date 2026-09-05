if(sessionStorage.getItem('teminTeacher')!=='yes') location.replace('teacher-login.html');

const cfg=window.TEMIN_CONFIG;
const msg=document.getElementById('teacherMessage');
const profileMsg=document.getElementById('profileMessage');
const subject=document.getElementById('subject');
const year=document.getElementById('year');
const topic=document.getElementById('topic');
const manualTopic=document.getElementById('manualTopic');
const form=document.getElementById('quickForm');
const sourceStatus=document.getElementById('sourceStatus');
const sourceStatusText=document.getElementById('sourceStatusText');
const sourceToggle=document.getElementById('sourceToggle');
const sourceDetails=document.getElementById('sourceDetails');
const textbookLink=document.getElementById('textbookLink');
const dskpLink=document.getElementById('dskpLink');
const aiProgress=document.getElementById('aiProgress');
const aiProgressTitle=document.getElementById('aiProgressTitle');
const aiProgressText=document.getElementById('aiProgressText');
const previewSection=document.getElementById('previewSection');
const questionList=document.getElementById('questionList');
const previewMeta=document.getElementById('previewMeta');
const publishQuizBtn=document.getElementById('publishQuizBtn');
const verifyCount=document.getElementById('verifyCount');
const pilotResume=document.getElementById('pilotResume');
const pilotResumeText=document.getElementById('pilotResumeText');
const pilotResumeBtn=document.getElementById('pilotResumeBtn');

let currentSource=null;
let teacherProfile=readTeacherProfile();
let activeQuiz=null;
let activeQuestions=[];

const urlQuizId=new URLSearchParams(location.search).get('quiz');
if(urlQuizId){
  pilotResume.classList.remove('hidden');
  pilotResumeText.textContent=' Quiz '+urlQuizId+' boleh disambung tanpa mencipta draf baharu.';
}
pilotResumeBtn?.addEventListener('click',()=>resumeExistingQuiz(urlQuizId));

document.getElementById('logout')?.addEventListener('click',()=>{sessionStorage.removeItem('teminTeacher');location.href='index.html';});
const advanced=document.getElementById('advanced');
const panel=document.getElementById('advancedPanel');
advanced?.addEventListener('click',()=>panel.classList.toggle('hidden'));
sourceToggle?.addEventListener('click',()=>{sourceDetails.classList.toggle('hidden');sourceToggle.textContent=sourceDetails.classList.contains('hidden')?'Lihat sumber':'Sembunyikan';});
subject?.addEventListener('change',selectionChanged);
year?.addEventListener('change',selectionChanged);
topic?.addEventListener('change',syncTopicUI);

document.getElementById('teacherProfileForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const name=document.getElementById('teacherName').value.trim(); if(!name)return;
  const btn=e.currentTarget.querySelector('button');btn.disabled=true;profileMsg.textContent='Menyimpan profil...';
  try{const res=await post({action:'registerTeacher',teacherName:name});if(!res.ok)throw new Error(res.error||'REGISTER_FAILED');teacherProfile=res.teacher;localStorage.setItem('teminTeacherProfile',JSON.stringify(teacherProfile));applyTeacherProfile();profileMsg.textContent='';}
  catch(err){profileMsg.textContent='Profil belum dapat disimpan. Cuba lagi.';}finally{btn.disabled=false;}
});

async function loadConfig(){
  try{const res=await fetch(cfg.backendUrl+'?action=config');const data=await res.json();if(!data.ok)throw new Error('CONFIG_ERROR');subject.innerHTML='<option value="">Pilih subjek</option>'+data.subjects.map(x=>`<option>${escapeHtml(x)}</option>`).join('');year.innerHTML='<option value="">Pilih tahun</option>'+data.years.map(x=>`<option>${escapeHtml(x)}</option>`).join('');}
  catch(err){msg.textContent='⚠️ Senarai sistem gagal dimuatkan. Refresh halaman.';}
}
async function loadCurriculumSource(){
  currentSource=null;sourceDetails.classList.add('hidden');sourceToggle.classList.add('hidden');sourceToggle.textContent='Lihat sumber';
  if(!subject.value||!year.value){setSourceState('idle','Pilih Subjek + Tahun dahulu.');return;}
  setSourceState('loading','Mengesan Buku Teks & DSKP rasmi...');
  try{const res=await fetch(cfg.backendUrl+'?action=curriculumSource&year='+encodeURIComponent(year.value)+'&subject='+encodeURIComponent(subject.value));const data=await res.json();if(!data.ok)throw new Error(data.error||'SOURCE_NOT_FOUND');currentSource=data;setSourceState('success','Sumber rasmi dikesan ✓');textbookLink.href=data.textbookUrl||'#';dskpLink.href=data.dskpUrl||'#';textbookLink.classList.toggle('disabled-link',!data.textbookUrl);dskpLink.classList.toggle('disabled-link',!data.dskpUrl);sourceToggle.classList.remove('hidden');}
  catch(err){setSourceState('error','Sumber rasmi belum ditemui.');}
}
function setSourceState(state,text){sourceStatus.className='source-status source-'+state;sourceStatusText.textContent=text;}
async function selectionChanged(){await Promise.all([loadCurriculumSource(),loadTopics()]);}
async function loadTopics(){
  topic.disabled=true;topic.innerHTML='<option value="">Memuatkan Unit / Topik...</option>';document.getElementById('manualTopicWrap').classList.add('hidden');
  if(!subject.value||!year.value){topic.innerHTML='<option value="">Pilih Subjek + Tahun dahulu</option>';return;}
  try{const res=await fetch(cfg.backendUrl+'?action=topics&year='+encodeURIComponent(year.value)+'&subject='+encodeURIComponent(subject.value));const data=await res.json();if(!data.ok||!Array.isArray(data.topics)||!data.topics.length)throw new Error('TOPICS_NOT_READY');topic.innerHTML='<option value="">Pilih Unit / Topik</option><option value="__ALL__">📚 SEMUA UNIT / SELURUH BUKU</option>'+data.topics.map(t=>`<option value="${escapeHtml(t.topicName)}">Unit ${escapeHtml(t.unitNo)} — ${escapeHtml(t.topicName)}</option>`).join('')+'<option value="__OTHER__">✏️ Topik lain...</option>';topic.disabled=false;}
  catch(err){topic.innerHTML='<option value="">Senarai topik belum tersedia</option><option value="__OTHER__">✏️ Taip topik sendiri sementara</option>';topic.disabled=false;}syncTopicUI();
}
function syncTopicUI(){const whole=topic.value==='__ALL__',other=topic.value==='__OTHER__';document.getElementById('manualTopicWrap').classList.toggle('hidden',!other);document.getElementById('questionCountWrap').classList.toggle('hidden',whole);document.getElementById('questionsPerTopicWrap').classList.toggle('hidden',!whole);manualTopic.required=other;}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!teacherProfile?.teacherId){document.getElementById('teacherProfileCard').classList.remove('hidden');document.getElementById('teacherName').focus();msg.textContent='Simpan profil guru dahulu.';return;}
  if(!currentSource?.ok){msg.textContent='Tunggu sehingga sumber rasmi dikesan.';return;}
  const wholeBook=topic.value==='__ALL__',manual=topic.value==='__OTHER__',selectedTopic=manual?manualTopic.value.trim():topic.value;
  if(wholeBook){msg.textContent='📚 Seluruh buku akan diaktifkan selepas pilot satu topik lulus.';return;}
  if(!subject.value||!year.value||!selectedTopic){msg.textContent='Lengkapkan Subjek, Tahun dan Topik dahulu.';return;}
  const button=form.querySelector('.generate');button.disabled=true;button.textContent='⚡ MENYEDIAKAN...';msg.textContent='';hidePreview();showProgress('Menyediakan draf kuiz...','TEMIN sedang mencipta rekod kuiz sebelum Gemini menjana soalan.');
  try{
    const create=await post({action:'createQuiz',teacherId:teacherProfile.teacherId,subject:subject.value,year:year.value,scope:'TOPIC',topic:selectedTopic,questionCount:Number(document.getElementById('questionCount').value),questionsPerTopic:'',mode:'SMART',sourceType:'CURRICULUM_MASTER'});
    if(!create.ok)throw new Error(create.error||'CREATE_FAILED');
    activeQuiz=create.quiz; form.dataset.quizId=activeQuiz.quizId||'';
    await generateForQuiz(activeQuiz.quizId,Number(document.getElementById('questionCount').value),false);
  }catch(err){console.error(err);hideProgress();msg.textContent=humanError(err.message||'CREATE_FAILED');}
  finally{button.disabled=false;button.textContent='✨ JANA KUIZ';}
});

async function resumeExistingQuiz(quizId){
  if(!quizId)return;
  msg.textContent='';hidePreview();showProgress('Membuka draf pilot...','Menyemak sama ada soalan sudah dijana.');
  try{
    const data=await getQuiz(quizId); if(!data.ok)throw new Error(data.error||'QUIZ_NOT_FOUND');
    activeQuiz=data.quiz; activeQuestions=data.questions||[]; form.dataset.quizId=quizId;
    pilotResume.classList.add('hidden');
    if(activeQuestions.length){hideProgress();renderPreview(activeQuiz,activeQuestions);msg.textContent='✅ Draf AI sedia untuk disemak.';}
    else{await generateForQuiz(quizId,Number(activeQuiz.questionCount||15),false);}
  }catch(err){hideProgress();msg.textContent=humanError(err.message);}
}

async function generateForQuiz(quizId,count,overwrite){
  showProgress('Gemini sedang menjana '+count+' soalan...','Soalan akan disimpan terus dalam QUESTIONS sebagai AI_DRAFT. Proses ini mungkin mengambil sedikit masa.');
  const gen=await post({action:'generateQuizAI',quizId,questionCount:count,difficulty:'MIXED',overwrite:!!overwrite});
  if(!gen.ok)throw new Error(gen.error||'AI_GENERATION_FAILED');
  const fresh=await getQuiz(quizId);if(!fresh.ok)throw new Error(fresh.error||'QUIZ_RELOAD_FAILED');
  activeQuiz=fresh.quiz;activeQuestions=fresh.questions||gen.questions||[];hideProgress();renderPreview(activeQuiz,activeQuestions);msg.innerHTML=`✅ <b>${escapeHtml(activeQuestions.length)} soalan Draf AI berjaya dijana.</b> Semak di bahagian Preview & Edit.`;previewSection.scrollIntoView({behavior:'smooth',block:'start'});
}

async function getQuiz(quizId){const res=await fetch(cfg.backendUrl+'?action=quiz&quizId='+encodeURIComponent(quizId));return res.json();}
function showProgress(title,text){aiProgressTitle.textContent=title;aiProgressText.textContent=text;aiProgress.classList.remove('hidden');}
function hideProgress(){aiProgress.classList.add('hidden');}
function hidePreview(){previewSection.classList.add('hidden');questionList.innerHTML='';}

function renderPreview(quiz,questions){
  activeQuestions=[...questions].sort((a,b)=>Number(a.questionNo||0)-Number(b.questionNo||0));
  previewMeta.innerHTML=`<span class="meta-pill">${escapeHtml(quiz.subject||'')}</span><span class="meta-pill">${escapeHtml(quiz.year||'')}</span><span class="meta-pill">${escapeHtml(quiz.topic||'')}</span><span class="meta-pill">${activeQuestions.length} soalan</span><span class="meta-pill">${escapeHtml(quiz.quizId||'')}</span>`;
  questionList.innerHTML=activeQuestions.map(renderQuestionCard).join('');
  questionList.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>saveQuestionCard(b.dataset.save,false)));
  questionList.querySelectorAll('[data-verify]').forEach(b=>b.addEventListener('click',()=>saveQuestionCard(b.dataset.verify,true)));
  questionList.querySelectorAll('[data-regen]').forEach(b=>b.addEventListener('click',()=>{alert('Jana semula satu soalan akan masuk Build 002.5.1. Untuk pilot ini, edit soalan terus atau jana semula keseluruhan selepas semakan.');}));
  previewSection.classList.remove('hidden');updateVerifyCount();
}
function renderQuestionCard(q){
  const id=escapeHtml(q.questionId),verified=String(q.reviewStatus)==='VERIFIED';
  return `<article class="question-card" data-card="${id}"><div class="question-top"><span class="q-number">Soalan ${Number(q.questionNo||0)}</span><div class="q-badges"><span class="q-badge">${escapeHtml(q.difficulty||'MIXED')}</span><span class="q-badge">${escapeHtml(q.questionType||'TEXT')}</span><span class="q-badge ${verified?'verified':''}">${verified?'✅ DISAHKAN':'🧠 AI_DRAFT'}</span></div></div><div class="edit-grid"><label class="wide">Soalan<textarea data-field="questionText">${escapeHtml(q.questionText||'')}</textarea></label>${['A','B','C','D'].map(k=>`<label class="option-row"><span class="option-label">${k}</span><input data-field="option${k}" value="${escapeAttr(q['option'+k]||'')}"></label>`).join('')}<label>Jawapan Betul<select data-field="correctOption">${['A','B','C','D'].map(k=>`<option ${String(q.correctOption)===k?'selected':''}>${k}</option>`).join('')}</select></label><label>Aras<select data-field="difficulty">${['EASY','MEDIUM','HARD','MIXED'].map(k=>`<option ${String(q.difficulty).toUpperCase()===k?'selected':''}>${k}</option>`).join('')}</select></label><label class="wide">Penerangan<textarea data-field="explanation">${escapeHtml(q.explanation||'')}</textarea></label>${q.imagePrompt?`<label class="wide">Prompt Visual<textarea data-field="imagePrompt">${escapeHtml(q.imagePrompt)}</textarea></label>`:''}</div><div class="question-actions"><button class="mini-btn save" type="button" data-save="${id}">💾 Simpan</button><button class="mini-btn verify" type="button" data-verify="${id}">✅ Guru Sahkan</button><button class="mini-btn secondary" type="button" data-regen="${id}">♻️ Jana Semula Soalan Ini</button></div></article>`;
}
async function saveQuestionCard(questionId,verify){
  const card=questionList.querySelector(`[data-card="${cssEscape(questionId)}"]`);if(!card)return;
  const btn=card.querySelector(verify?'[data-verify]':'[data-save]');btn.disabled=true;const old=btn.textContent;btn.textContent=verify?'Mengesahkan...':'Menyimpan...';
  const payload={action:'updateQuestion',questionId};card.querySelectorAll('[data-field]').forEach(el=>payload[el.dataset.field]=el.value);if(verify)payload.reviewStatus='VERIFIED';
  try{const res=await post(payload);if(!res.ok)throw new Error(res.error||'UPDATE_FAILED');const idx=activeQuestions.findIndex(q=>q.questionId===questionId);if(idx>=0)activeQuestions[idx]=res.question;renderPreview(activeQuiz,activeQuestions);msg.textContent=verify?'✅ Soalan telah disahkan guru.':'✅ Perubahan soalan disimpan.';}
  catch(err){msg.textContent='Perubahan belum dapat disimpan. Cuba lagi.';btn.disabled=false;btn.textContent=old;}
}
function updateVerifyCount(){const done=activeQuestions.filter(q=>String(q.reviewStatus)==='VERIFIED').length;verifyCount.textContent=`${done}/${activeQuestions.length} soalan disahkan`;publishQuizBtn.disabled=!activeQuestions.length;}
publishQuizBtn?.addEventListener('click',async()=>{
  if(!activeQuiz?.quizId)return;const verified=activeQuestions.filter(q=>String(q.reviewStatus)==='VERIFIED').length;
  if(verified<activeQuestions.length&&!confirm(`${activeQuestions.length-verified} soalan belum ditanda Guru Sahkan. Teruskan terbitkan kuiz ini?`))return;
  publishQuizBtn.disabled=true;publishQuizBtn.textContent='MENERBITKAN...';
  try{const res=await post({action:'publishQuiz',quizId:activeQuiz.quizId});if(!res.ok)throw new Error(res.error||'PUBLISH_FAILED');activeQuiz=res.quiz||activeQuiz;msg.innerHTML=`🎉 <b>Kuiz ${escapeHtml(activeQuiz.quizId)} telah diterbitkan.</b>`;previewSection.scrollIntoView({behavior:'smooth',block:'start'});}
  catch(err){msg.textContent=humanError(err.message);}
  finally{publishQuizBtn.disabled=false;publishQuizBtn.textContent='✅ SAHKAN & TERBITKAN';}
});

document.querySelectorAll('.shortcut-grid button').forEach(b=>b.addEventListener('click',()=>alert('Modul ini akan diaktifkan selepas Quiz Engine disambungkan.')));
function readTeacherProfile(){try{return JSON.parse(localStorage.getItem('teminTeacherProfile')||'null')}catch(e){return null}}
function applyTeacherProfile(){const card=document.getElementById('teacherProfileCard'),chip=document.getElementById('teacherChip');if(teacherProfile?.teacherId){card.classList.add('hidden');chip.textContent='👩‍🏫 '+teacherProfile.teacherName;chip.classList.remove('hidden');}else{card.classList.remove('hidden');chip.classList.add('hidden');}}
async function post(payload){const res=await fetch(cfg.backendUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});return res.json();}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#096;');}
function cssEscape(v){return (window.CSS&&CSS.escape)?CSS.escape(v):String(v).replace(/([ #;?%&,.+*~\\':"!^$\[\]()=>|\/])/g,'\\$1');}
function humanError(code){const map={GEMINI_API_KEY_NOT_CONFIGURED:'⚠️ GEMINI_API_KEY belum ditemui di Script Properties.',WHOLE_BOOK_AI_NOT_YET_ENABLED:'📚 Seluruh buku belum dibuka untuk pilot 002.5.',QUESTIONS_ALREADY_EXIST:'⚠️ Draf ini sudah mempunyai soalan. Gunakan Preview yang sedia ada.',GEMINI_HTTP_ERROR:'⚠️ Gemini tidak dapat menjana soalan. Semak Execution log Apps Script.',TEACHER_VERIFICATION_REQUIRED:'⚠️ Semua soalan Pendidikan Islam/Bahasa Arab mesti disahkan guru sebelum diterbitkan.',NO_QUESTIONS:'⚠️ Kuiz belum mempunyai soalan.'};return map[code]||'⚠️ '+(code||'Proses belum berjaya. Cuba lagi.');}

applyTeacherProfile();loadConfig();
if(urlQuizId){setTimeout(()=>resumeExistingQuiz(urlQuizId),700);}
