const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('forgotPasswordCard');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // Animation on load
    card.style.opacity = '0';
    card.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // Back button
    backBtn.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // Login link
    loginLink.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // Form submission
    forgotPasswordForm.onsubmit = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();

        // Reset messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Reset error styling
        document.querySelectorAll('.input-group-wrapper').forEach(el => el.classList.remove('input-error'));

        // Validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            emailInput.parentElement.classList.add('input-error');
            errorMessage.textContent = 'Please enter a valid email address';
            errorMessage.style.display = 'block';
            return;
        }

        // Show loading state
        submitBtn.innerHTML = "Sending Email...";
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";

        try {
            // Send forgot password request
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                submitBtn.innerHTML = "SEND RESET LINK";
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";

                errorMessage.textContent = result.message || 'Failed to send reset email';
                errorMessage.style.display = 'block';
                return;
            }

            // Success
            console.log('✅ Reset email sent:', email);
            
            successMessage.style.display = 'block';
            forgotPasswordForm.style.display = 'none';
            
            // Reset button after showing success
            submitBtn.innerHTML = "SEND RESET LINK";
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";

            // Optionally redirect back to login after a delay
            setTimeout(() => {
                // Uncomment to auto-redirect
                // window.location.href = 'LoginPG.html';
            }, 3000);

        } catch (error) {
            console.error('Error:', error);
            submitBtn.innerHTML = "SEND RESET LINK";
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";

            errorMessage.textContent = 'Connection error. Please check if the server is running.';
            errorMessage.style.display = 'block';
        }
    };
});
