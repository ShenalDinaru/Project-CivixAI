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

// Validate username
const validateUsername = (username) => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
};

// Validate required fields
const validateSignupData = (data) => {
    const errors = {};

    if (!data.firstName || !data.firstName.trim()) {
        errors.firstName = 'First name is required';
    }

    if (!data.surname || !data.surname.trim()) {
        errors.surname = 'Surname is required';
    }

    if (!data.username || !data.username.trim()) {
        errors.username = 'Username is required';
    } else if (!validateUsername(data.username)) {
        errors.username = 'Username must be 3-20 characters (alphanumeric, underscore, hyphen)';
    }

    if (!data.email || !data.email.trim()) {
        errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
        errors.email = 'Invalid email format';
    }

    if (data.phone && !validatePhone(data.phone)) {
        errors.phone = 'Invalid phone number format';
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
    validateSignupData
};
