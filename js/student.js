const joinForm=document.getElementById('joinForm');const joinMessage=document.getElementById('joinMessage');
joinForm?.addEventListener('submit',e=>{e.preventDefault();const code=document.getElementById('classCode').value.trim().toUpperCase();joinMessage.textContent=code?`Kod ${code} diterima. Backend sesi akan disambung dalam build seterusnya.`:'Masukkan kod kelas dahulu.'});
document.querySelector('[data-demo="self"]')?.addEventListener('click',()=>alert('Self Learning akan disambungkan kepada Bank Kuiz dalam build seterusnya.'));
