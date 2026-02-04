# API Testing Guide

This guide shows how to test the CivixAI backend APIs using Postman, cURL, or browser fetch.

## Prerequisites
- Backend running on `http://localhost:5000`
- Postman (optional) - https://www.postman.com/downloads/

## 1. Check Server Health

### Using cURL
```bash
curl http://localhost:5000/api/health
```

### Using Browser Fetch
```javascript
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log(data))
```

### Expected Response
```json
{
  "message": "CivixAI Backend is running"
}
```

---

## 2. Check Username Availability

### Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe"}'
```

### Using Postman
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/check-username`
- **Body** (JSON):
```json
{
  "username": "johndoe"
}
```

### Using Browser Fetch
```javascript
fetch('http://localhost:5000/api/auth/check-username', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'johndoe' })
})
.then(res => res.json())
.then(data => console.log(data))
```

### Response (Available)
```json
{
  "success": true,
  "available": true
}
```

### Response (Taken)
```json
{
  "success": true,
  "available": false
}
```

---

## 3. Check Email Availability

### Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
```

### Using Postman
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/check-email`
- **Body** (JSON):
```json
{
  "email": "john@example.com"
}
```

### Expected Response
```json
{
  "success": true,
  "available": true
}
```

---

## 4. Register New User (Complete Sign-Up)

### Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "surname": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "0712345678",
    "password": "SecurePass123"
  }'
```

### Using Postman
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/signup`
- **Body** (JSON):
```json
{
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "SecurePass123"
}
```

### Using Browser Fetch
```javascript
fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    surname: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '0712345678',
    password: 'SecurePass123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "abc123def456...",
    "firstName": "John",
    "surname": "Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Error Response Examples

**Duplicate Username (400)**
```json
{
  "success": false,
  "message": "Username already taken"
}
```

**Duplicate Email (400)**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "firstName": "First name is required",
    "email": "Invalid email format"
  }
}
```

**Weak Password (400)**
```json
{
  "success": false,
  "message": "Password is too weak. Use at least 6 characters."
}
```

---

## Test Scenarios

### Scenario 1: Successful Registration
```json
{
  "firstName": "Alice",
  "surname": "Smith",
  "username": "alice_smith",
  "email": "alice@example.com",
  "phone": "0723456789",
  "password": "AlicePass123"
}
```
**Expected**: ✅ Success (201)

### Scenario 2: Weak Password
```json
{
  "firstName": "Bob",
  "surname": "Johnson",
  "username": "bob_j",
  "email": "bob@example.com",
  "phone": "0734567890",
  "password": "weak"
}
```
**Expected**: ❌ Error - Password too weak (400)

### Scenario 3: Invalid Email
```json
{
  "firstName": "Charlie",
  "surname": "Brown",
  "username": "charlie_b",
  "email": "not-an-email",
  "phone": "0745678901",
  "password": "CharliePass123"
}
```
**Expected**: ❌ Error - Invalid email (400)

### Scenario 4: Invalid Phone
```json
{
  "firstName": "David",
  "surname": "Lee",
  "username": "david_l",
  "email": "david@example.com",
  "phone": "123456",
  "password": "DavidPass123"
}
```
**Expected**: ❌ Error - Invalid phone format (400)

### Scenario 5: Missing Required Fields
```json
{
  "firstName": "Eve",
  "surname": "Wilson",
  "email": "eve@example.com",
  "phone": "0756789012",
  "password": "EvePass123"
}
```
**Expected**: ❌ Error - Username is required (400)

---

## Password Requirements

✅ Valid: `SecurePass123`, `MyPassword2024`, `TestPass99`
❌ Invalid: `weak`, `12345678`, `password`

Requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

---

## Phone Number Format (Sri Lanka)

✅ Valid: `0712345678`, `+94712345678`, `0723456789`
❌ Invalid: `1234567890`, `0612345678`, `071234567`

Format:
- Starts with 0 or +94
- Followed by 7
- Followed by 8 digits

---

## Import to Postman

1. Open Postman
2. Click "Import" (top-left)
3. Select "Link"
4. Paste this (or create manually):

```
Collection Name: CivixAI API

Requests:
1. Health Check
   - GET: http://localhost:5000/api/health

2. Check Username
   - POST: http://localhost:5000/api/auth/check-username
   - Body: {"username":"johndoe"}

3. Check Email
   - POST: http://localhost:5000/api/auth/check-email
   - Body: {"email":"john@example.com"}

4. Sign Up
   - POST: http://localhost:5000/api/auth/signup
   - Body: Full user object with password
```

---

## Troubleshooting

### "Cannot reach server"
```bash
# Check if backend is running
curl http://localhost:5000/api/health
```

### "Network error in Postman"
- Ensure backend is running: `npm start`
- Check port 5000 is available

### "CORS error"
- Backend has CORS enabled
- Check browser console for details
- Verify frontend is accessing correct URL

### Firebase errors
- Check .env file has correct credentials
- Verify Firebase project exists
- Check database rules

---

## Performance Testing

### Test multiple rapid requests
```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/check-username \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\"}"
  echo ""
done
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - User created successfully |
| 400 | Bad Request - Validation error |
| 500 | Server Error - Unexpected error |

---

## Tips

✅ Always include `Content-Type: application/json` header
✅ Test with Postman for easier debugging
✅ Check browser console (F12) for errors
✅ Verify data in Firebase Console
✅ Use meaningful usernames and emails for testing

---

**Ready to test? Start with the Health Check endpoint!** ✨
