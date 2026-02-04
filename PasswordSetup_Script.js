// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('passwordCard');
    const passwordForm = document.getElementById('passwordForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');

    // Check if user data exists in session
    const userData = sessionStorage.getItem('pendingRegistration');
    if (!userData) {
        alert('Please complete the registration form first.');
        window.location.href = 'SignupPG.html';
        return;
    }

    // 1. SMOOTH ENTRANCE
    card.style.opacity = '0';
    card.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // 2. NAVIGATION
    backBtn.onclick = () => {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = 'SignupPG.html';
    };

    loginLink.onclick = () => {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = 'LoginPG.html';
    };

    // 3. PASSWORD VALIDATION & SUBMISSION
    passwordForm.onsubmit = async (e) => {
        e.preventDefault();

        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const signupBtn = document.getElementById('signupBtn');

        let isValid = true;

        // Reset Styles
        document.querySelectorAll('.input-group-wrapper').forEach(el => el.classList.remove('input-error'));

        // Password validation
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordPattern.test(password.value)) {
            password.parentElement.classList.add('input-error');
            isValid = false;
            alert('Password must be at least 8 characters with uppercase, lowercase, and a number.');
        }

        // Confirm password match
        if (password.value !== confirmPassword.value) {
            confirmPassword.parentElement.classList.add('input-error');
            isValid = false;
            alert('Passwords do not match.');
        }

        if (!isValid) {
            return;
        }

        // VISUAL FEEDBACK
        signupBtn.innerHTML = "Creating Account...";
        signupBtn.disabled = true;
        signupBtn.style.opacity = "0.7";

        try {
            // Get user data from session
            const userDataObj = JSON.parse(userData);

            // Send signup request to backend
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...userDataObj,
                    password: password.value
                })
            });

            const result = await response.json();

            if (!response.ok) {
                signupBtn.innerHTML = "COMPLETE SIGNUP";
                signupBtn.disabled = false;
                signupBtn.style.opacity = "1";

                // Display specific error messages
                if (result.errors) {
                    Object.keys(result.errors).forEach(field => {
                        const inputElement = document.getElementById(field);
                        if (inputElement) {
                            inputElement.parentElement.classList.add('input-error');
                        }
                    });
                    alert(Object.values(result.errors).join('\n'));
                } else {
                    alert(result.message || 'Registration failed. Please try again.');
                }
                return;
            }

            // Success!
            console.log('User registered successfully:', result.user);

            // Clear session data
            sessionStorage.removeItem('pendingRegistration');

            // Show success message
            alert('Account created successfully! You can now login.');

            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'LoginPG.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            signupBtn.innerHTML = "COMPLETE SIGNUP";
            signupBtn.disabled = false;
            signupBtn.style.opacity = "1";
            alert('Error creating account. Please try again.');
        }
    };
});
