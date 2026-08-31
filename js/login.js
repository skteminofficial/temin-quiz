const form=document.getElementById('pinForm'),msg=document.getElementById('pinMessage');
form?.addEventListener('submit',e=>{
 e.preventDefault();
 const pin=document.getElementById('pin').value.trim();
 if(pin==='2050'){
   sessionStorage.setItem('teminTeacher','yes');
   location.href='teacher.html';
 }else{
   msg.textContent='PIN tidak tepat. Cuba lagi.';
   document.getElementById('pin').value='';
 }
});