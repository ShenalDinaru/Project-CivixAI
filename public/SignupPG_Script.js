
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('signupCard');
    const signupForm = document.getElementById('signupForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');

    
    card.style.opacity = '0';
    card.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    
    backBtn.onclick = () => {
        window.location.href = 'LandingPG.html';
    };

    loginLink.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // Validation
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName');
        const surname = document.getElementById('surname');
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const nextBtn = document.getElementById('nextBtn');
        let isValid = true;

        // Reset errors
        document.querySelectorAll('.input-group-wrapper').forEach(el => el.classList.remove('input-error'));

        // First Name Validation - only letters, no spaces or hyphens
        if (!firstName.value.trim()) {
            firstName.parentElement.classList.add('input-error');
            alert('First name is required');
            isValid = false;
        } else if (!/^[a-zA-Z]+$/.test(firstName.value.trim())) {
            firstName.parentElement.classList.add('input-error');
            alert('First name can only contain letters (no spaces or hyphens)');
            isValid = false;
        }

        // Surname Validation - only letters, no spaces or hyphens
        if (!surname.value.trim()) {
            surname.parentElement.classList.add('input-error');
            alert('Surname is required');
            isValid = false;
        } else if (!/^[a-zA-Z]+$/.test(surname.value.trim())) {
            surname.parentElement.classList.add('input-error');
            alert('Surname can only contain letters (no spaces or hyphens)');
            isValid = false;
        }

        // Username Validation - only letters, no spaces or hyphens
        if (!username.value.trim()) {
            username.parentElement.classList.add('input-error');
            alert('Username is required');
            isValid = false;
        } else if (username.value.trim().length < 3 || username.value.trim().length > 20) {
            username.parentElement.classList.add('input-error');
            alert('Username must be 3-20 characters');
            isValid = false;
        } else if (!/^[a-zA-Z]+$/.test(username.value.trim())) {
            username.parentElement.classList.add('input-error');
            alert('Username can only contain letters (no spaces or hyphens)');
            isValid = false;
        }

        // Email Validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            email.parentElement.classList.add('input-error');
            alert('Invalid email format');
            isValid = false;
        }

        // Phone Validation 
        const phoneValue = phone.value.trim();
        if (phoneValue !== "") {
            const phonePattern = /^(?:\+94|0)?[7][0-9]{8}$/; 
            if (!phonePattern.test(phoneValue)) {
                phone.parentElement.classList.add('input-error');
                isValid = false;
                alert("Please enter a valid phone number.");
            }
        }

        if (isValid) {
            
            const userData = {
                firstName: firstName.value.trim(),
                surname: surname.value.trim(),
                username: username.value.trim(),
                email: email.value.trim(),
                phone: phone.value.trim()
            };

            // Save data in teperly
            sessionStorage.setItem('pendingRegistration', JSON.stringify(userData));

            
            nextBtn.innerHTML = "Saving Details...";
            nextBtn.disabled = true;
            nextBtn.style.opacity = "0.7";

            try {
                // Send data to backend
                const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: userData.username })
                });

                const usernameCheckResult = await response.json();

                if (!usernameCheckResult.available) {
                    nextBtn.innerHTML = "NEXT >";
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = "1";
                    username.parentElement.classList.add('input-error');
                    alert('Username already taken. Please choose another.');
                    return;
                }

                // Check email availability
                const emailCheckResponse = await fetch(`${API_BASE_URL}/auth/check-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: userData.email })
                });

                const emailCheckResult = await emailCheckResponse.json();

                if (!emailCheckResult.available) {
                    nextBtn.innerHTML = "NEXT >";
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = "1";
                    email.parentElement.classList.add('input-error');
                    alert('Email already registered. Please use another email or login.');
                    return;
                }

                // All checks passed, redirect to password setup
                setTimeout(() => {
                    window.location.href = 'PasswordPG.html'; 
                }, 800);
            } catch (error) {
                console.error('Error:', error);
                nextBtn.innerHTML = "NEXT >";
                nextBtn.disabled = false;
                nextBtn.style.opacity = "1";
                alert('Error checking availability. Please try again.');
            }
        }
    };
});