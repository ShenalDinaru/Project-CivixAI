// ELEMENTS
const askNowBtn = document.getElementById('askNowBtn');
const backBtn = document.getElementById('backBtn');
const registerLink = document.getElementById('registerLink');
const loginForm = document.getElementById('loginForm');
const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('passwordField');

// PASSWORD VISIBILITY TOGGLE
togglePassword.addEventListener('click', () => {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
});

// HOVER EFFECTS (Shared with Landing Page)
askNowBtn.addEventListener('mouseenter', () => {                 
    askNowBtn.style.transform = "scale(1.05)";
    askNowBtn.style.filter = "brightness(1.2)";
});

askNowBtn.addEventListener('mouseleave', () => {
    askNowBtn.style.transform = "scale(1)";
    askNowBtn.style.filter = "brightness(1)";
});

// NAVIGATION REDIRECTS
backBtn.onclick = () => {
    window.location.href = 'LandingPG.html';
};

registerLink.onclick = () => {
    window.location.href = 'signup.html';
};

loginForm.onsubmit = (e) => {
    e.preventDefault(); 
    // Add validation here
    window.location.href = 'chat.html'; 
};
