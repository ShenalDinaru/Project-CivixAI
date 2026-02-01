// Back button functionality
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    console.log('Back button clicked');
    // Add navigation logic here
    // window.history.back();
  });
}

// Logout button functionality
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    console.log('Logout button clicked');
    if (confirm('Are you sure you want to logout?')) {
      // Perform logout
      alert('Logging out...');
      // window.location.href = '/login';
    }
  });
}

// Settings button functionality
const settingsBtn = document.querySelector('.settings-btn');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked');
    // Add navigation to settings page
    // window.location.href = '/settings';
  });
}

// Smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Optional: loading animation for avatar
const avatar = document.querySelector('.avatar');
if (avatar) {
  avatar.style.opacity = '0';
  avatar.style.transform = 'scale(0.8)';

  window.addEventListener('load', () => {
    setTimeout(() => {
      avatar.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      avatar.style.opacity = '1';
      avatar.style.transform = 'scale(1)';
    }, 100);
  });
}
