

function getAuthenticatedUser() {
  const rawUser = sessionStorage.getItem('currentUser');
  const userUID = sessionStorage.getItem('userUID');

  if (!rawUser || !userUID) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    if (!user || typeof user !== 'object') {
      return null;
    }
    return user;
  } catch (error) {
    console.warn('Unable to parse current user from sessionStorage.', error);
    return null;
  }
}

function enforceAuth() {
  const user = getAuthenticatedUser();
  if (!user) {
    window.location.replace('LoginPG.html');
    return null;
  }
  return user;
}

const authenticatedUser = enforceAuth();

function getUserDisplayName(user) {
  return user.fullName || user.name || user.username || 'User';
}

function getUserEmail(user) {
  return user.email || '';
}

function getUserMobile(user) {
  return user.mobile || user.phone || user.phoneNumber || '';
}

function hydrateProfileDetails(user) {
  if (!user) return;

  const displayName = getUserDisplayName(user);
  const email = getUserEmail(user);
  const mobile = getUserMobile(user);

  const profileName = document.querySelector('.profile-name');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const mobileInput = document.getElementById('mobile');

  if (profileName) {
    profileName.textContent = displayName;
  }
  if (fullNameInput) {
    fullNameInput.value = displayName;
  }
  if (emailInput) {
    emailInput.value = email;
  }
  if (mobileInput) {
    mobileInput.value = mobile;
  }
}

hydrateProfileDetails(authenticatedUser);

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
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('userUID');
      window.location.replace('LoginPG.html');
    }
  });
}

function goToUserSettings() {
  window.location.href = 'user_settings.html';
}

const openSettingsBtn = document.getElementById('openSettingsBtn');
if (openSettingsBtn) {
  openSettingsBtn.addEventListener('click', goToUserSettings);
}

const userSettingsMenuItem = document.getElementById('userSettingsMenuItem');
if (userSettingsMenuItem) {
  userSettingsMenuItem.addEventListener('click', goToUserSettings);
  userSettingsMenuItem.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToUserSettings();
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
