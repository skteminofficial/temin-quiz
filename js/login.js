const form=document.getElementById('pinForm');
const msg=document.getElementById('pinMessage');
const btn=form?.querySelector('button[type="submit"]');

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const pin=document.getElementById('pin').value.trim();
  if(!pin){ msg.textContent='Masukkan PIN Guru.'; return; }

  btn.disabled=true;
  btn.textContent='Menyemak...';
  msg.textContent='';

  try{
    const res=await fetch(window.TEMIN_CONFIG.backendUrl,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'validatePin',pin})
    });
    const data=await res.json();

    if(data.ok){
      sessionStorage.setItem('teminTeacher','yes');
      location.href='teacher.html';
    }else{
      msg.textContent='PIN tidak tepat. Cuba lagi.';
      document.getElementById('pin').value='';
    }
  }catch(err){
    msg.textContent='Backend tidak dapat dihubungi. Cuba lagi.';
  }finally{
    btn.disabled=false;
    btn.textContent='Masuk →';
  }
});