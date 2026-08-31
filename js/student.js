const params=new URLSearchParams(location.search),mode=params.get('mode');
const self=document.getElementById('selfPanel'),live=document.getElementById('livePanel');
if(mode==='self'){live.classList.add('hidden');document.getElementById('studentTitle').textContent='Pilih Cabaran Kamu!';}
if(mode==='live'){self.classList.add('hidden');document.getElementById('studentTitle').textContent='Masuk Kelas!';document.getElementById('studentIntro').textContent='Masukkan kod yang diberi oleh guru.';}
document.getElementById('joinForm')?.addEventListener('submit',e=>{
 e.preventDefault();const code=document.getElementById('classCode').value.trim().toUpperCase(),msg=document.getElementById('joinMessage');
 msg.textContent=code?`Kod ${code} diterima. Sambungan sesi sebenar akan aktif dalam Build 002.`:'Masukkan kod kelas dahulu.';
});
document.querySelector('.demo')?.addEventListener('click',()=>alert('Bank Kuiz Self Learning akan disambungkan dalam Build 002.'));