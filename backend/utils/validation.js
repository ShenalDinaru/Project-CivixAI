const validator = require('validator');

// Validate email format
const validateEmail = (email) => {
    return validator.isEmail(email);
};

// Validate phone number (Sri Lanka format)
const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return true; // Optional field
    const phonePattern = /^(?:\+94|0)?[7][0-9]{8}$/;
    return phonePattern.test(phone);
};

// Validate first name - only letters, no spaces or hyphens
const validateFirstName = (firstName) => {
    return /^[a-zA-Z]+$/.test(firstName);
};

// Validate surname - only letters, no spaces or hyphens
const validateSurname = (surname) => {
    return /^[a-zA-Z]+$/.test(surname);
};

// Validate username - only letters, no spaces or hyphens
const validateUsername = (username) => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z]+$/.test(username);
};

// Validate password - must have 8-20 characters, 1 uppercase, 1 lowercase, 1 number or special character
const validatePassword = (password) => {
    if (!password) return false;
    
    const checks = {
        length: password.length >= 8 && password.length <= 20,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numberOrSpecial: /[0-9!@#$%^&*]/.test(password)
    };
    
    // All 4 checks must be true
    return checks.length && checks.uppercase && checks.lowercase && checks.numberOrSpecial;
};

// Validate required fields
const validateSignupData = (data) => {
    const errors = {};

    if (!data.firstName || !data.firstName.trim()) {
        errors.firstName = 'First name is required';
    } else if (!validateFirstName(data.firstName.trim())) {
        errors.firstName = 'First name can only contain letters (no spaces or hyphens)';
    }

    if (!data.surname || !data.surname.trim()) {
        errors.surname = 'Surname is required';
    } else if (!validateSurname(data.surname.trim())) {
        errors.surname = 'Surname can only contain letters (no spaces or hyphens)';
    }

    if (!data.username || !data.username.trim()) {
        errors.username = 'Username is required';
    } else if (!validateUsername(data.username.trim())) {
        errors.username = 'Username must be 3-20 letters only (no spaces or hyphens)';
    }

    if (!data.email || !data.email.trim()) {
        errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
        errors.email = 'Invalid email format';
    }

    if (data.phone && !validatePhone(data.phone)) {
        errors.phone = 'Invalid phone number format';
    }

    if (!data.password || !data.password.trim()) {
        errors.password = 'Password is required';
    } else if (!validatePassword(data.password)) {
        errors.password = 'Password must contain: 8-20 characters, 1 uppercase letter, 1 lowercase letter, and 1 number or special character';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

module.exports = {
    validateEmail,
    validatePhone,
    validateUsername,
    validatePassword,
    validateSignupData
};
