document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('signupCard');
    const signupForm = document.getElementById('signupForm');
    const backBtn = document.getElementById('backBtn');
    const loginLink = document.getElementById('loginLink');

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
        window.location.href = 'LandingPG.html';
    };

    loginLink.onclick = () => {
        window.location.href = 'LoginPG.html';
    };

    // 3. VALIDATION & DATA HANDLING
    signupForm.onsubmit = (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName');
        const surname = document.getElementById('surname');
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        let isValid = true;

        // Reset Styles
        document.querySelectorAll('.input-group-wrapper').forEach(el => el.classList.remove('input-error'));

        // Email Validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            email.parentElement.classList.add('input-error');
            isValid = false;
        }

        // Phone Validation (Optional field)
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
            // PREPARE USER DATA
            const userData = {
                firstName: firstName.value,
                surname: surname.value,
                username: username.value,
                email: email.value,
                phone: phone.value
            };

            // VISUAL FEEDBACK
            const nextBtn = document.getElementById('nextBtn');
            nextBtn.innerHTML = "Saving Details...";
            nextBtn.disabled = true;
            nextBtn.style.opacity = "0.7";

            // SEND DATA TO BACKEND
            fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store user data in sessionStorage for password setup
                    sessionStorage.setItem('pendingRegistration', JSON.stringify(userData));
                    // REDIRECT TO PASSWORD SETUP
                    setTimeout(() => {
                        window.location.href = 'password_setup.html'; 
                    }, 1200);
                } else {
                    alert('Error: ' + (data.error || 'Failed to save details'));
                    nextBtn.innerHTML = "Next";
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = "1";
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error: Unable to connect to server. Make sure backend is running on port 3000.');
                nextBtn.innerHTML = "Next";
                nextBtn.disabled = false;
                nextBtn.style.opacity = "1";
            });
        }
    };
});