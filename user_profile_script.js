/**
 * User Profile page – loads logged-in user from session, edit profile, logout.
 * Expects sessionStorage keys: userDisplayName, userFullName, userEmail, userMobile
 * (or falls back to demo data if not set, e.g. when opened standalone).
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    displayName: 'userDisplayName',
    fullName: 'userFullName',
    email: 'userEmail',
    mobile: 'userMobile'
  };

  const DEFAULT_USER = {
    displayName: 'User',
    fullName: 'Peter Davidson',
    email: 'pd@gmail.com',
    mobile: '+941212313141'
  };

  function getStoredUser() {
    const displayName = sessionStorage.getItem(STORAGE_KEYS.displayName);
    const fullName = sessionStorage.getItem(STORAGE_KEYS.fullName);
    const email = sessionStorage.getItem(STORAGE_KEYS.email);
    const mobile = sessionStorage.getItem(STORAGE_KEYS.mobile);
    if (displayName || fullName || email || mobile) {
      return {
        displayName: displayName || DEFAULT_USER.displayName,
        fullName: fullName || DEFAULT_USER.fullName,
        email: email || DEFAULT_USER.email,
        mobile: mobile || DEFAULT_USER.mobile
      };
    }
    return { ...DEFAULT_USER };
  }

  function saveUser(user) {
    sessionStorage.setItem(STORAGE_KEYS.displayName, user.displayName);
    sessionStorage.setItem(STORAGE_KEYS.fullName, user.fullName);
    sessionStorage.setItem(STORAGE_KEYS.email, user.email);
    sessionStorage.setItem(STORAGE_KEYS.mobile, user.mobile);
  }

  function renderProfile(user) {
    const displayNameEl = document.getElementById('userDisplayName');
    const fullNameEl = document.getElementById('detailFullName');
    const emailEl = document.getElementById('detailEmail');
    const mobileEl = document.getElementById('detailMobile');
    if (displayNameEl) displayNameEl.textContent = user.displayName || 'User';
    if (fullNameEl) fullNameEl.textContent = user.fullName || '—';
    if (emailEl) emailEl.textContent = user.email || '—';
    if (mobileEl) mobileEl.textContent = user.mobile || '—';
  }

  function openEditForm(user) {
    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    const phoneInput = document.getElementById('editPhone');
    if (nameInput) nameInput.value = user.fullName || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.mobile || '';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const backBtn = document.getElementById('backBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const cancelBtn = document.getElementById('cancelBtn');
  const editForm = document.getElementById('editForm');

  let currentUser = getStoredUser();
  renderProfile(currentUser);

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
        window.history.back();
      } else {
        window.location.href = 'home.html';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (!confirm('Are you sure you want to log out?')) return;
      sessionStorage.removeItem(STORAGE_KEYS.displayName);
      sessionStorage.removeItem(STORAGE_KEYS.fullName);
      sessionStorage.removeItem(STORAGE_KEYS.email);
      sessionStorage.removeItem(STORAGE_KEYS.mobile);
      window.location.href = 'home.html';
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function () {
      openEditForm(currentUser);
      modal.setAttribute('aria-hidden', 'false');
    });
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const form = e.target;
      const fullName = (form.name && form.name.value) ? form.name.value.trim() : '';
      const email = (form.email && form.email.value) ? form.email.value.trim() : '';
      const mobile = (form.phone && form.phone.value) ? form.phone.value.trim() : '';

      currentUser = {
        displayName: fullName ? fullName.split(/\s+/)[0] : currentUser.displayName,
        fullName: fullName || currentUser.fullName,
        email: email || currentUser.email,
        mobile: mobile || currentUser.mobile
      };
      saveUser(currentUser);
      renderProfile(currentUser);
      closeModal();
    });
  }
})();
