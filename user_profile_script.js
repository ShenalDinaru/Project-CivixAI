// Simple interactivity for modal and logout
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const modal = document.getElementById('modal');
const cancelBtn = document.getElementById('cancelBtn');
const editForm = document.getElementById('editForm');

logoutBtn.addEventListener('click', ()=>{
  // placeholder action
  if(confirm('Are you sure you want to log out?')){
    alert('Logged out (demo). Redirecting to homepage...');
    window.location.href = '/';
  }
});

settingsBtn.addEventListener('click', ()=>{
  modal.setAttribute('aria-hidden','false');
});

cancelBtn.addEventListener('click', ()=>{
  modal.setAttribute('aria-hidden','true');
});

editForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = new FormData(editForm);
  const name = data.get('name');
  const email = data.get('email');
  const phone = data.get('phone');

  // apply changes to the page (demo)
  document.querySelector('.name').textContent = name || 'User';
  const rows = document.querySelectorAll('.detail-row');
  if(rows[0]) rows[0].querySelector('dd').textContent = email === 'pd@gmail.com' ? 'Peter Davidson' : name;
  // close modal
  modal.setAttribute('aria-hidden','true');
  alert('Profile saved (demo)');
});
