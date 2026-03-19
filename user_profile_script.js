// Back button: navigate to previous page or home
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'home.html';
    }
  });
}

// Logout button
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      // Perform logout – replace with your auth logic
      // window.location.href = '/login';
      alert('Logging out...');
    }
  });
}

// Smooth scroll
document.documentElement.style.scrollBehavior = 'smooth';

// Optional: subtle load animation for profile avatar
const profileAvatar = document.querySelector('.profile-avatar');
if (profileAvatar) {
  profileAvatar.style.opacity = '0';
  profileAvatar.style.transform = 'scale(0.9)';
  window.addEventListener('load', () => {
    setTimeout(() => {
      profileAvatar.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      profileAvatar.style.opacity = '1';
      profileAvatar.style.transform = 'scale(1)';
    }, 100);
  });
}
