const API_BASE_URL = 'http://localhost:5000/api';

let resetToken = null;

document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordCard = document.getElementById('resetPasswordCard');
    const errorCard = document.getElementById('errorCard');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');
    const loginLink2 = document.getElementById('loginLink2');
    const resetBtn = document.getElementById('resetBtn');
    const statusBox = document.getElementById('statusBox');
    const statusText = document.getElementById('statusText');

    // Initialize: Show resetPasswordCard, hide errorCard
    resetPasswordCard.style.display = 'block';
    errorCard.style.display = 'none';
    
    // Animation on load
    resetPasswordCard.style.opacity = '0';
    resetPasswordCard.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        resetPasswordCard.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        resetPasswordCard.style.opacity = '1';
        resetPasswordCard.style.transform = 'translateY(0)';
    });

    // Get token from URL
    function getTokenFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    }

    // Verify reset token
    async function verifyResetToken() {
        resetToken = getTokenFromURL();

        if (!resetToken) {
            showError('No reset token found in the URL.');
            return;
        }

        console.log(' Frontend: Token from URL:', resetToken.substring(0, 20) + '...');
        console.log(' Frontend: Token length:', resetToken.length);
        
        statusBox.className = 'status-box loading';
        statusText.textContent = 'Verifying reset link...';

        try {
            const fullUrl = `${API_BASE_URL}/auth/verify-reset-token/${resetToken}`;
            console.log(' Frontend: Making request to:', fullUrl.substring(0, 50) + '...');
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(' Frontend: Response status:', response.status);
            console.log(' Frontend: Response ok:', response.ok);
            
            // Parse response regardless of status code
            let data;
            try {
                data = await response.json();
                console.log(' Frontend: Parsed JSON:', data);
            } catch (parseError) {
                console.error(' Failed to parse response JSON:', parseError);
                showError('Error parsing server response');
                return;
            }
            
            // Check if verification was successful (status 200 and success: true)
            if (response.ok && data.success) {
                console.log(' Reset token verified for:', data.email);
                statusBox.className = 'status-box success';
                statusText.textContent = `Reset link verified for ${data.email}`;
                
                setTimeout(() => {
                    statusBox.style.display = 'none';
                    resetPasswordForm.style.display = 'block';
                }, 1500);
            } else {
                // Token verification failed
                console.log(' Token verification failed:', data.message || 'Unknown error');
                console.log(' Response status:', response.status, 'data.success:', data.success);
                showError(data.message || 'Invalid or expired reset link');
            }
        } catch (error) {
            console.error(' Network/Verification error:', error);
            console.error(' Error message:', error.message);
            console.error(' Error stack:', error.stack);
            showError('Error verifying reset link: ' + error.message);
        }
    }

    function showError(message) {
        resetPasswordCard.style.display = 'none';
        errorCard.style.display = 'block';
        document.getElementById('errorText').textContent = message;
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        const requirements = {
            len: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            spec: /\d/.test(password)
        };

        let passedCount = 0;

        // Check each requirement
        Object.keys(requirements).forEach(id => {
            const element = document.getElementById(id);
            if (requirements[id]) {
                element.classList.add('met');
                passedCount++;
            } else {
                element.classList.remove('met');
            }
        });

        // Update Strength Bar Color and Width
        const strengthBar = document.getElementById('strengthBar');
        strengthBar.style.width = (passedCount / 4) * 100 + "%";
        
        if (passedCount < 2) strengthBar.style.background = "#ff4d4d"; // Red
        else if (passedCount === 3) strengthBar.style.background = "#ffd700"; // Gold/Yellow
        else if (passedCount === 4) strengthBar.style.background = "#4CAF50"; // Green

        // Enable button only if all 4 requirements are met
        if (passedCount === 4) {
            resetBtn.disabled = false;
            resetBtn.style.opacity = "1";
            resetBtn.style.cursor = "pointer";
        } else {
            resetBtn.disabled = true;
            resetBtn.style.opacity = "0.5";
            resetBtn.style.cursor = "not-allowed";
        }

        return passedCount === 4;
    }

    // Password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    const passwordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Set up toggle functionality with proper event listeners
    if (toggleButtons.length > 0) {
        toggleButtons.forEach((toggle) => {
            toggle.style.cursor = 'pointer';
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = toggle.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    toggle.style.opacity = type === 'text' ? '0.7' : '0.5';
                }
            });
        });
    }

    // Password strength feedback - check on input
    passwordInput.addEventListener('input', () => {
        checkPasswordStrength(passwordInput.value);
    });

    // Back button
    backBtn.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // Login link
    loginLink.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    loginLink2.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // Form submission
    resetPasswordForm.onsubmit = async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!checkPasswordStrength(newPassword)) {
            alert('Password must contain all requirements: 8+ characters, uppercase, lowercase, and a number.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        // Show loading state
        resetBtn.innerHTML = "RESETTING PASSWORD...";
        resetBtn.disabled = true;
        resetBtn.style.opacity = "0.7";

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: resetToken,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                resetBtn.innerHTML = "RESET PASSWORD";
                resetBtn.disabled = false;
                resetBtn.style.opacity = "1";

                alert(result.message || 'Failed to reset password');
                return;
            }

            // Success
            console.log(' Password reset successfully');
            
            alert(' Password reset successful! You can now login with your new password.');
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'LoginPG.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            resetBtn.innerHTML = "RESET PASSWORD";
            resetBtn.disabled = false;
            resetBtn.style.opacity = "1";

            alert('Error resetting password. Please try again.');
        }
    };

    // Start verification
    verifyResetToken();
});
