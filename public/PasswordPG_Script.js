document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('passwordCard');
    const passInput = document.getElementById('pass');
    const confirmInput = document.getElementById('confirm');
    const strengthBar = document.getElementById('strengthBar');
    const submitBtn = document.getElementById('submitBtn');
    
    // Icon symbols
    const viewIcon = '👁️';
    const hideIcon = '🙈'; 
    const API_BASE_URL = `${window.location.origin}/api`;

    // 1. Smooth Entry Animation
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // 2. Navigation
    document.getElementById('backBtn').onclick = () => {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = 'SignupPG.html';
    };

    // 3. Visibility Toggle Logic
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.onclick = () => {
            const input = document.getElementById(icon.dataset.target);
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = hideIcon;
                icon.style.opacity = '1';
            } else {
                input.type = 'password';
                icon.textContent = viewIcon;
                icon.style.opacity = '0.5';
            }
        };
    });

    // 4. Validation & Strength Meter (3 of 4 Rule)
    const reqs = {
        len: v => v.length >= 8 && v.length <= 20,
        upper: v => /[A-Z]/.test(v),
        lower: v => /[a-z]/.test(v),
        spec: v => /[0-9!@#$%^&*]/.test(v)
    };

    passInput.oninput = () => {
        let passedCount = 0;
        const value = passInput.value;

        // Check each requirement
        Object.keys(reqs).forEach(id => {
            const element = document.getElementById(id);
            if (reqs[id](value)) {
                element.classList.add('met');
                passedCount++;
            } else {
                element.classList.remove('met');
            }
        });

        // Update Strength Bar Color and Width
        strengthBar.style.width = (passedCount / 4) * 100 + "%";
        
        if (passedCount < 2) strengthBar.style.background = "#ff4d4d"; // Red
        else if (passedCount === 3) strengthBar.style.background = "#ffd700"; // Gold/Yellow
        else if (passedCount === 4) strengthBar.style.background = "#4CAF50"; // Green

        // Final Validation: Enable button only if all 4 conditions are met
        if (passedCount === 4) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.5";
            submitBtn.style.cursor = "not-allowed";
        }
    };

    // 5. Submit Flow
    document.getElementById('passwordForm').onsubmit = async (e) => {
        e.preventDefault();
        
        // Final password match check
        if (passInput.value !== confirmInput.value) {
            alert("Passwords do not match!");
            return;
        }
        
        // Get pending registration from sessionStorage
        const pendingRegistration = sessionStorage.getItem('pendingRegistration');
        if (!pendingRegistration) {
            alert("Session expired. Please sign up again.");
            window.location.href = 'SignupPG.html';
            return;
        }

        const userData = JSON.parse(pendingRegistration);
        const signupData = {
            ...userData,
            password: passInput.value
        };

        submitBtn.innerHTML = "CREATING ACCOUNT...";
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });

            const result = await response.json();

            if (result.success) {
                // Store email for verification page
                sessionStorage.setItem('registeredEmail', result.user.email);
                sessionStorage.removeItem('pendingRegistration');
                
                // Redirect to email verification
                setTimeout(() => {
                    window.location.href = 'verify_email.html';
                }, 1500);
            } else {
                submitBtn.innerHTML = "SIGN UP";
                submitBtn.disabled = false;
                alert(result.message || 'Error creating account. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            submitBtn.innerHTML = "SIGN UP";
            submitBtn.disabled = false;
            alert('Error connecting to server. Please try again.');
        }
    };
});