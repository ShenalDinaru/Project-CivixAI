const API_BASE_URL = 'http://localhost:5000/api';



document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach Button Listeners 
    const attachListener = (id, action) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', action);
    };

    // Login Redirects
    attachListener('btnGoLogin', () => window.location.href = 'LoginPG.html');
    attachListener('btnBackLogin', () => window.location.href = 'LoginPG.html');
    
    // Signup Redirects
    attachListener('btnRetrySignup', () => {
        sessionStorage.removeItem('registeredEmail');
        window.location.href = 'SignupPG.html';
    });
    attachListener('btnBackSignup', () => {
        sessionStorage.removeItem('registeredEmail');
        window.location.href = 'SignupPG.html';
    });
    
    // Action Buttons
    attachListener('btnResendEmail', resendVerificationEmail);

    // 2. Start Verification Process
    verifyEmail();
});




function getTokenFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
}

function showState(stateName) {
    // Hide all states first
    const states = ['loadingState', 'pendingState', 'successState', 'errorState', 'expiredState'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show the requested state with animation reset
    const activeEl = document.getElementById(stateName + 'State');
    if (activeEl) {
        activeEl.style.display = 'block';
        activeEl.style.animation = 'none';
        activeEl.offsetHeight; 
        activeEl.style.animation = 'elementFadeUp 0.6s ease-out forwards';
    }
}

async function verifyEmail() {
    const token = getTokenFromURL();
    const registeredEmail = sessionStorage.getItem('registeredEmail');

    // If no token and just signed up, show pending state
    if (!token && registeredEmail) {
        showState('pending');
        return;
    }

    if (!token) {
        showState('error');
        updateText('errorMessage', 'No verification token found.');
        updateText('errorDetails', 'Please check the link in your email.');
        return;
    }

    showState('loading');

    try {
        // Use the query parameter route instead of URL parameter
        const response = await fetch(`${API_BASE_URL}/auth/verify_email?token=${token}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.removeItem('registeredEmail');
            showState('success');
            console.log('Success: Email verified for', data.email);
        } else {
            // Handle Expired Error
            if (data.message && data.message.toLowerCase().includes('expired')) {
                showState('expired');
            } else {
                showState('error');
                updateText('errorMessage', data.message || 'Verification failed');
                updateText('errorDetails', 'The link is invalid or corrupted.');
            }
        }
    } catch (error) {
        console.error('Network/Server Error:', error);
        showState('error');
        updateText('errorMessage', 'Connection Error');
        updateText('errorDetails', 'Please check your internet connection and try again.');
    }
}

async function resendVerificationEmail() {
    let email = sessionStorage.getItem('registeredEmail');
    
    if (!email) {
        email = prompt('Please enter your email address to resend the link:');
    }
    
    if (!email) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert('Verification email sent! Please check your inbox.');
        } else {
            alert(data.message || 'Failed to resend verification email.');
        }
    } catch (error) {
        console.error('Resend Error:', error);
        alert('Error communicating with the server.');
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}