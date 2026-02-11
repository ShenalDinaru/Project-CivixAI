const API_BASE_URL = 'http://localhost:5000/api';

// Get verification token from URL
function getTokenFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
}

// Show specific state
function showState(state) {
    document.getElementById('loadingState').style.display = state === 'loading' ? 'block' : 'none';
    document.getElementById('successState').style.display = state === 'success' ? 'block' : 'none';
    document.getElementById('errorState').style.display = state === 'error' ? 'block' : 'none';
    document.getElementById('expiredState').style.display = state === 'expired' ? 'block' : 'none';
}

// Verify email
async function verifyEmail() {
    const token = getTokenFromURL();

    if (!token) {
        showState('error');
        document.getElementById('errorMessage').textContent = 'No verification token found in the URL.';
        document.getElementById('errorDetails').textContent = 'Invalid verification link.';
        return;
    }

    showState('loading');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email-token/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Mark email as verified in database
            const email = data.email;
            const updateResponse = await fetch(`${API_BASE_URL}/auth/mark-email-verified`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            showState('success');
            console.log(' Email verified:', email);
        } else {
            if (data.message && data.message.includes('expired')) {
                showState('expired');
            } else {
                showState('error');
                document.getElementById('errorMessage').textContent = data.message || 'Verification failed';
                document.getElementById('errorDetails').textContent = data.message || 'Invalid verification link.';
            }
        }
    } catch (error) {
        console.error('Verification error:', error);
        showState('error');
        document.getElementById('errorMessage').textContent = 'An error occurred during verification.';
        document.getElementById('errorDetails').textContent = error.message;
    }
}

// Resend verification email
async function resendVerificationEmail() {
    const email = prompt('Please enter your email address:');
    if (!email) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert('Verification email sent! Please check your inbox.');
            showState('loading');
        } else {
            alert(data.message || 'Failed to resend verification email');
        }
    } catch (error) {
        console.error('Resend error:', error);
        alert('Error resending verification email');
    }
}

// Start verification when page loads
window.addEventListener('DOMContentLoaded', verifyEmail);
