const msg=document.getElementById('teacherMessage');const labels={create:'Cipta Kuiz',mine:'Kuiz Saya',bank:'Bank Sekolah',live:'Mulakan Sesi'};
document.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{msg.textContent=`${labels[btn.dataset.tool]||'Modul'} akan disambungkan kepada backend TEMIN Kuiz dalam build seterusnya.`;}));
