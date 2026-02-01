document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('verifyCard');
    const otpInputs = document.querySelectorAll('.otp-input');
    const backBtn = document.getElementById('backBtn');
    const displayEmail = document.getElementById('displayEmail');

    // 1. SMOOTH ENTRANCE (Consistent with Signup)
    card.style.opacity = '0';
    card.style.transform = 'translateY(25px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // Load email from sessionStorage if available
    const pendingData = JSON.parse(sessionStorage.getItem('pendingRegistration'));
    if (pendingData && pendingData.email) {
        displayEmail.textContent = pendingData.email;
    }

    // 2. OTP AUTO-FOCUS LOGIC
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // 3. NAVIGATION
  backBtn.onclick = () => {
    // Force navigation to the Landing Page
    window.location.href = 'LandingPG.html'; 
};

    document.getElementById('changeEmail').onclick = () => {
        window.location.href = 'SignupPG.html';
    };

    // 4. TIMER LOGIC
    let timeLeft = 59;
    const timerElement = document.getElementById('timer');
    const countdown = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(countdown);
            timerElement.innerHTML = "<span class='reg-link'>Resend Now</span>";
        } else {
            timerElement.innerHTML = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        }
        timeLeft -= 1;
    }, 1000);

    // 5. FORM SUBMISSION
    document.getElementById('verifyForm').onsubmit = (e) => {
        e.preventDefault();
        const code = Array.from(otpInputs).map(i => i.value).join('');
        
        if (code.length === 4) {
            const btn = document.getElementById('verifyBtn');
            btn.innerHTML = "Verifying...";
            btn.disabled = true;

            setTimeout(() => {
                // Redirect to successful registration or dashboard
                window.location.href = 'PasswordPG.html'; 
            }, 1500);
        } else {
            alert("Please enter the full 4-digit code.");
        }
    };
});