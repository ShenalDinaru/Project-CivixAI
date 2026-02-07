
const API_BASE_URL = 'http://localhost:5000/api';

// ELEMENTS
const askNowBtn = document.getElementById('askNowBtn');
const backBtn = document.getElementById('backBtn');
const registerLink = document.getElementById('registerLink');
const loginForm = document.getElementById('loginForm');
const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('passwordField');

// Pswrd visibbility
togglePassword.addEventListener('click', () => {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    
    
    togglePassword.style.opacity = type === 'text' ? '0.7' : '1';
});


askNowBtn.addEventListener('mouseenter', () => {                 
    askNowBtn.style.transform = "scale(1.05)";
    askNowBtn.style.filter = "brightness(1.2)";
});

askNowBtn.addEventListener('mouseleave', () => {
    askNowBtn.style.transform = "scale(1)";
    askNowBtn.style.filter = "brightness(1)";
});


backBtn.onclick = () => {
    window.location.href = 'LandingPG.html';
};

registerLink.onclick = () => {
    window.location.href = 'SignupPG.html';
};

// Login form submit
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const emailInput = loginForm.querySelector('input[type="email"]');
    const passwordInput = document.getElementById('passwordField');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Reset errors
    document.querySelectorAll('.input-group-wrapper').forEach(el => el.classList.remove('input-error'));

    // Validation
    if (!email || !password) {
        emailInput.parentElement.classList.add('input-error');
        passwordInput.parentElement.classList.add('input-error');
        alert('Please enter email and password');
        return;
    }

    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        emailInput.parentElement.classList.add('input-error');
        alert('Please enter a valid email address');
        return;
    }

    // Visual feedback
    const originalBtnText = askNowBtn.innerHTML;
    askNowBtn.innerHTML = "Logging in...";
    askNowBtn.disabled = true;
    askNowBtn.style.opacity = "0.7";

    try {
        // Send login request to backend
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            askNowBtn.innerHTML = originalBtnText;
            askNowBtn.disabled = false;
            askNowBtn.style.opacity = "1";

            // Handle unverified email specially
            if (result.error === 'UNVERIFIED_EMAIL' || !result.emailVerified) {
                const resendChoice = confirm(
                    `Your email has not been verified yet. Please check your email for a verification link.\n\nWould you like us to resend the verification email?`
                );
                
                if (resendChoice) {
                    // Store email for resend
                    sessionStorage.setItem('pendingVerificationEmail', email);
                    try {
                        const resendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email })
                        });
                        
                        const resendResult = await resendResponse.json();
                        if (resendResult.success) {
                            alert('Verification email has been resent. Please check your inbox.');
                        } else {
                            alert(resendResult.message || 'Failed to resend verification email');
                        }
                    } catch (resendError) {
                        console.error('Resend error:', resendError);
                        alert('Error resending verification email');
                    }
                }
                return;
            }

            // Show failed error message
            alert(result.message || 'Login failed. Please check your credentials.');
            
            // Error styling
            if (!result.success && result.message.includes('email')) {
                emailInput.parentElement.classList.add('input-error');
            } else {
                passwordInput.parentElement.classList.add('input-error');
            }
            return;
        }

        // Store user data and redirect
        console.log('✅ Login successful:', result.user);
        
       
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        sessionStorage.setItem('userUID', result.user.uid);

        // Show success positive message
        askNowBtn.innerHTML = "Logged in!";
        
        // Redirect to chat or dashboard
        setTimeout(() => {
            window.location.href = 'chat.html'; 
        }, 800);

    } catch (error) {
        console.error('Login error:', error);
        askNowBtn.innerHTML = originalBtnText;
        askNowBtn.disabled = false;
        askNowBtn.style.opacity = "1";
        alert('Connection error. Please check if the server is running and try again.');
    }
};