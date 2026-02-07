
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('passwordCard');
    const passwordForm = document.getElementById('passwordForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');
    

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach((toggle, index) => {
        toggle.addEventListener('click', () => {
            const input = index === 0 ? passwordInput : confirmPasswordInput;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggle.style.opacity = type === 'text' ? '0.7' : '1';
        });
    });

    // Check if user data exists in session
    const userData = sessionStorage.getItem('pendingRegistration');
    if (!userData) {
        alert('Please complete the registration form first.');
        window.location.href = 'SignupPG.html';
        return;
    }

   
    card.style.opacity = '0';
    card.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

   
    backBtn.onclick = () => {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = 'SignupPG.html';
    };

    loginLink.onclick = () => {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = 'LoginPG.html';
    };

    //  Pswrd validation
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

        // Confirm password matching
        if (password.value !== confirmPassword.value) {
            confirmPassword.parentElement.classList.add('input-error');
            isValid = false;
            alert('Passwords do not match.');
        }

        if (!isValid) {
            return;
        }

        // feedback
        signupBtn.innerHTML = "Creating Account...";
        signupBtn.disabled = true;
        signupBtn.style.opacity = "0.7";

        try {
            // Get user data from the session
            const userDataObj = JSON.parse(userData);

            // Send a signup request to the backend
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

                // show the error messages
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

            
            console.log('User registered successfully:', result.user);

            // Clear session data after the registration
            sessionStorage.removeItem('pendingRegistration');

            // Show email verification message
            alert('Account created successfully!\n\nA verification link has been sent to your email. Please check your inbox and click the link to verify your email address before logging in.');

            // Redirecting to the email verification page or signup page
            setTimeout(() => {
                window.location.href = 'SignupPG.html';
            }, 2000);

        } catch (error) {
            console.error('Error:', error);
            signupBtn.innerHTML = "COMPLETE SIGNUP";
            signupBtn.disabled = false;
            signupBtn.style.opacity = "1";
            alert('Error creating account. Please try again.');
        }
    };
});
