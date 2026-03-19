function showOriginWarning() {
  const allowedOrigins = ['http://localhost:5000', 'http://127.0.0.1:5000'];
  if (allowedOrigins.includes(window.location.origin)) {
    return;
  }

  const banner = document.createElement('div');
  banner.textContent = `Unexpected origin: ${window.location.origin}. Open profile/settings from http://localhost:5000 to preserve session state.`;
  banner.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    'z-index:99999',
    'padding:10px 14px',
    'background:#f59e0b',
    'color:#111827',
    'font:600 13px/1.4 Arial, sans-serif',
    'text-align:center',
    'box-shadow:0 2px 10px rgba(0,0,0,0.2)'
  ].join(';');

  document.body.prepend(banner);
}

showOriginWarning();

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

function hydrateUserSettingsDetails(user) {
  if (!user) return;

  const fullName = user.fullName || user.name || user.username || '';
  const email = user.email || '';
  const mobile = user.mobile || user.phone || user.phoneNumber || '';

  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const mobileInput = document.getElementById('mobile');
  const avatar = document.querySelector('.user-avatar');

  if (fullNameInput) {
    fullNameInput.value = fullName;
  }
  if (emailInput) {
    emailInput.value = email;
  }
  if (mobileInput) {
    mobileInput.value = mobile;
  }

  if (avatar) {
    const initialsSource = (fullName || email || 'U').trim();
    const initials = initialsSource
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
    avatar.textContent = initials || 'U';
  }
}

hydrateUserSettingsDetails(authenticatedUser);

// Toggle edit mode for input fields
function toggleEdit(fieldId) {
    const input = document.getElementById(fieldId);
    const isReadOnly = input.hasAttribute('readonly');
    
    if (isReadOnly) {
      input.removeAttribute('readonly');
      input.focus();
      input.select();
    } else {
      input.setAttribute('readonly', true);
    }
  }
  
  // Save changes function
  function saveChanges() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value;
  
    // Validation
    if (!fullName.trim()) {
      showNotification('Please enter a valid name', 'error');
      return;
    }
  
    if (!validateEmail(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
  
    if (!validatePhone(mobile)) {
      showNotification('Please enter a valid phone number', 'error');
      return;
    }
  
    // Set all fields to readonly after saving
    document.getElementById('fullName').setAttribute('readonly', true);
    document.getElementById('email').setAttribute('readonly', true);
    document.getElementById('mobile').setAttribute('readonly', true);
  
    // Simulate API call
    showNotification('Changes saved successfully!', 'success');
    
    // Here you would typically send the data to your backend
    console.log('Saving user data:', { fullName, email, mobile });
  }
  
  // Delete chat history
  function deleteChatHistory() {
    if (confirm('Are you sure you want to delete your chat history? This action cannot be undone.')) {
      showNotification('Chat history deleted successfully', 'success');
      // Here you would typically call your backend API
      console.log('Deleting chat history...');
    }
  }
  
  // Reset password
  function resetPassword() {
    const email = document.getElementById('email').value;
    if (confirm('A password reset link will be sent to ' + email + '. Continue?')) {
      showNotification('Password reset link sent to your email', 'success');
      // Here you would typically call your backend API
      console.log('Sending password reset email to:', email);
    }
  }
  
  // Delete account
  function deleteAccount() {
    const confirmation = prompt('This will permanently delete your account. Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
      showNotification('Account deletion initiated. You will receive a confirmation email.', 'warning');
      // Here you would typically call your backend API
      console.log('Initiating account deletion...');
      
      // Simulate redirect after 2 seconds
      setTimeout(() => {
        console.log('Redirecting to homepage...');
      }, 2000);
    } else if (confirmation !== null) {
      showNotification('Account deletion cancelled', 'info');
    }
  }
  
  // Email validation
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  // Phone validation
  function validatePhone(phone) {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
  
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
      max-width: 350px;
      backdrop-filter: blur(10px);
    `;
  
    // Add animation styles if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  
    document.body.appendChild(notification);
  
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Allow Enter key to save when editing
  document.addEventListener('DOMContentLoaded', () => {
    // Back button: navigate to user profile or previous page
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'user_profile.html';
        }
      });
    }

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !input.hasAttribute('readonly')) {
          saveChanges();
        }
      });
    });
  
    // Add click handlers for sidebar menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove active class from all menu items
        menuItems.forEach(mi => mi.classList.remove('active'));
        // Add active class to clicked item
        this.classList.add('active');
  
        // Get the target tab ID
        const targetTab = this.getAttribute('data-tab');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
  
        // Show the target tab content
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  
    // Language selection handler
    const languageSelect = document.getElementById('languageSelect');
    const langPopup = document.getElementById('langPopup');
  
    if (languageSelect) {
      languageSelect.addEventListener('change', function() {
        if (this.value === 'si' || this.value === 'ta') {
          langPopup.style.display = 'block';
          // Reset to English after a short delay or immediately if preferred
          // this.value = 'en'; // Optional: reset selection
        } else {
          langPopup.style.display = 'none';
        }
      });
    }
  });
  