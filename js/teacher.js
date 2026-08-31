if(sessionStorage.getItem('teminTeacher')!=='yes') location.replace('teacher-login.html');
document.getElementById('logout')?.addEventListener('click',()=>{sessionStorage.removeItem('teminTeacher');location.href='index.html'});
const advanced=document.getElementById('advanced'),panel=document.getElementById('advancedPanel');
advanced?.addEventListener('click',()=>panel.classList.toggle('hidden'));
document.getElementById('quickForm')?.addEventListener('submit',e=>{
 e.preventDefault();
 document.getElementById('teacherMessage').textContent='✨ Pilihan diterima. Enjin jana kuiz akan disambungkan dalam Build 002.';
});
document.querySelectorAll('.shortcut-grid button').forEach(b=>b.addEventListener('click',()=>alert('Fungsi ini akan aktif selepas backend pusat disambungkan.')));