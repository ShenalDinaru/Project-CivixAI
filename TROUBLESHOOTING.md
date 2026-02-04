# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. Server Won't Start

#### Error: "Cannot find module 'express'"
**Cause:** Dependencies not installed
**Solution:**
```bash
cd backend
npm install
npm start
```

#### Error: "FIREBASE_PROJECT_ID is undefined"
**Cause:** .env file missing or not loaded
**Solution:**
1. Check if .env file exists in backend folder
2. Verify it has correct format:
   ```
   PORT=5000
   FIREBASE_PROJECT_ID=your-id
   FIREBASE_PRIVATE_KEY=your-key
   FIREBASE_CLIENT_EMAIL=your-email
   FIREBASE_DATABASE_URL=your-url
   ```
3. Restart server: `npm start`

#### Error: "Port 5000 is already in use"
**Cause:** Another process using port 5000
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### Error: "Cannot find module 'firebase-admin'"
**Cause:** Firebase not installed
**Solution:**
```bash
npm install firebase-admin
npm start
```

### 2. Firebase Connection Issues

#### Error: "Cannot read property 'database' of undefined"
**Cause:** Firebase not initialized properly
**Solution:**
1. Check .env file has all Firebase credentials
2. Verify credentials are correct (from service account JSON)
3. Restart server

#### Error: "Permission denied" in Firebase
**Cause:** Firebase Security Rules not set correctly
**Solution:**
1. Go to Firebase Console → Realtime Database → Rules
2. Paste these rules:
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           ".read": "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       },
       "usernames": {
         "$username": {
           ".read": true,
           ".write": false
         }
       }
     }
   }
   ```
3. Click Publish

#### Error: "Invalid credentials"
**Cause:** Service account key is wrong
**Solution:**
1. Delete current .env file
2. Go to Firebase Console → Project Settings → Service Accounts
3. Generate new private key
4. Copy all fields exactly as shown
5. Create new .env file with correct values

### 3. Frontend Issues

#### Error: "Cannot POST /api/auth/signup"
**Cause:** Backend not running
**Solution:**
1. Open terminal/command prompt
2. Navigate to backend folder: `cd backend`
3. Start server: `npm start`
4. Wait for message: "✓ Server running on http://localhost:5000"

#### Error: "Failed to fetch" or "NetworkError"
**Cause:** Backend not accessible
**Solution:**
```bash
# Test if server is running
curl http://localhost:5000/api/health

# If it fails, backend isn't running
npm start
```

#### Error: "CORS error" in browser console
**Cause:** CORS configuration issue (rare - already enabled)
**Solution:**
1. Check browser console for full error message
2. Ensure API_BASE_URL in frontend is correct:
   - Should be: `http://localhost:5000/api`
3. Restart backend server

#### Form validation not working
**Cause:** JavaScript not loaded or error in script
**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify SignupPG_Script.js is included in HTML:
   ```html
   <script src="SignupPG_Script.js"></script>
   ```
4. Check file exists and is in correct location

### 4. Data Storage Issues

#### Data not appearing in Firebase
**Cause:** Sign-up didn't complete successfully
**Solution:**
1. Check browser console for errors
2. Check terminal/server logs
3. Verify Firebase rules are correct
4. Check if user reached password page

#### "Email already registered" error
**Cause:** Email exists in database
**Solution:**
1. Use different email address
2. Or check Firebase Console to delete test data:
   - Realtime Database → Look for user entry
   - Click the trash icon to delete

#### "Username already taken" error
**Cause:** Username exists in database
**Solution:**
1. Use different username
2. Or delete test user from Firebase Console

### 5. Validation Issues

#### "Invalid email format" error
**Cause:** Email doesn't match required pattern
**Solution:**
- Use valid email: `name@example.com`
- Not valid: `name@`, `@example.com`, `nameexample.com`

#### "Invalid phone format" error
**Cause:** Phone number doesn't match Sri Lanka format
**Solution:**
- Valid: `0712345678` or `+94712345678`
- Not valid: `1234567890`, `071234567`, `0612345678`
- Phone is optional - can leave blank

#### "Password too weak" error
**Cause:** Password doesn't meet requirements
**Solution:**
Requirements:
- ✅ At least 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)

Examples that work:
- ✅ SecurePass123
- ✅ MyPassword2024
- ✅ Test@Pass99

Examples that don't work:
- ❌ weak123 (no uppercase)
- ❌ UPPERCASE123 (no lowercase)
- ❌ NoNumbers (no number)
- ❌ Short1 (too short)

#### "Passwords do not match"
**Cause:** Password and confirm password are different
**Solution:**
- Type passwords slowly and carefully
- Make sure CAPS LOCK is off
- Use password field visibility toggle if available

### 6. npm Issues

#### Error: "npm not found"
**Cause:** Node.js/npm not installed
**Solution:**
1. Download Node.js: https://nodejs.org/
2. Install it (includes npm)
3. Restart terminal/command prompt
4. Try: `npm --version`

#### Error: "node_modules corrupted"
**Cause:** Installation interrupted or corrupted
**Solution:**
```bash
# Delete node_modules
rmdir /s node_modules      # Windows
rm -rf node_modules        # macOS/Linux

# Delete package-lock.json
del package-lock.json      # Windows
rm package-lock.json       # macOS/Linux

# Reinstall
npm install
```

#### Error: "npm ERR! 404"
**Cause:** Package not found on npm registry
**Solution:**
- Check package name spelling
- Check internet connection
- Try: `npm cache clean --force`

### 7. Environment & Path Issues

#### Error: "ENOENT: no such file or directory"
**Cause:** File path is wrong or file doesn't exist
**Solution:**
1. Check you're in correct directory: `cd backend`
2. List files: `ls` or `dir`
3. Check file names exactly

#### Error: ".env not found"
**Cause:** .env file doesn't exist
**Solution:**
1. Create .env file in backend folder (same location as package.json)
2. Copy content from .env.example
3. Fill in your Firebase credentials
4. Save file
5. Restart server

---

## 🧪 Testing Tips

### How to verify server is running
```bash
curl http://localhost:5000/api/health
```
Should return:
```json
{"message":"CivixAI Backend is running"}
```

### How to test sign-up endpoint
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test",
    "surname":"User",
    "username":"testuser123",
    "email":"test@example.com",
    "phone":"0712345678",
    "password":"TestPass123"
  }'
```

### How to check username
```bash
curl -X POST http://localhost:5000/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123"}'
```

### How to monitor logs
- Keep terminal open while server is running
- You'll see all requests logged
- Red text usually means errors
- Green text means success

---

## 📊 Diagnostic Checklist

When troubleshooting, check:

```
Node.js & npm
□ Node.js installed: node --version
□ npm installed: npm --version
□ In backend folder: cd backend
□ package.json exists: dir package.json (or ls package.json)

Dependencies
□ node_modules exists: dir node_modules (or ls node_modules)
□ npm install succeeded: npm install
□ All packages installed: npm list

Environment
□ .env file exists: dir .env (or ls .env)
□ .env has correct format
□ .env has all 4 Firebase variables
□ FIREBASE_PRIVATE_KEY has \n characters

Firebase
□ Project exists: https://console.firebase.google.com
□ Realtime Database enabled
□ Security Rules configured
□ Service account key downloaded
□ Credentials match .env file

Server
□ No other app on port 5000
□ npm start runs without errors
□ "Server running" message appears
□ curl http://localhost:5000/api/health works

Frontend
□ SignupPG.html opens in browser
□ password_setup.html exists
□ Console shows no JavaScript errors
□ Network tab shows API requests
```

---

## 🔍 How to Debug

### Step 1: Check Terminal Output
- Look for error messages
- Red text indicates problems
- Read the full message

### Step 2: Check Browser Console
- Press F12
- Go to Console tab
- Look for red error messages
- Check Network tab for API calls

### Step 3: Check Firebase Console
- Go to firebase.google.com
- Check Realtime Database
- Look for user data
- Check Authentication section

### Step 4: Use Postman
- Test API endpoints directly
- See exact request and response
- No frontend complications
- Easier to diagnose issues

### Step 5: Check Logs
```bash
# Restart with verbose logging
DEBUG=* npm start

# This shows detailed information
```

---

## 💬 Error Message Guide

| Error | Likely Cause | Quick Fix |
|-------|-------------|-----------|
| Cannot find module | npm install needed | `npm install` |
| FIREBASE_PROJECT_ID undefined | Missing .env | Create .env file |
| Port 5000 in use | Another app using port | Kill process or change port |
| Cannot reach server | Backend not running | `npm start` |
| CORS error | Rare - check URL | Verify API_BASE_URL |
| Username taken | Username exists | Use different username |
| Email taken | Email exists | Use different email |
| Invalid password | Weak password | Follow password rules |
| Invalid phone | Wrong format | Use 0712345678 format |
| Permission denied | Firebase rules | Check security rules |

---

## 📞 When All Else Fails

1. **Delete and start fresh**
   ```bash
   # Delete everything and reinstall
   rmdir /s node_modules      # Windows
   rm -rf node_modules        # macOS/Linux
   rm .env
   npm install
   # Create new .env with correct values
   npm start
   ```

2. **Check Firebase Console**
   - Verify project exists
   - Check database rules
   - Verify service account

3. **Review documentation**
   - Read SETUP_GUIDE.md
   - Check API_TESTING_GUIDE.md
   - Review ARCHITECTURE.md

4. **Simplify testing**
   - Test with Postman
   - Test with cURL
   - Use browser DevTools

5. **Check file paths**
   - Verify you're in correct directory
   - Check all files exist
   - Verify file contents

---

## ✨ Quick Recovery Steps

### For any issue:
1. Stop server (Ctrl+C)
2. Check errors in terminal
3. Check browser console (F12)
4. Verify .env file
5. Restart server: `npm start`
6. Test health endpoint
7. Try again

### Still not working?
1. Delete .env
2. Create new one with credentials
3. `npm install`
4. `npm start`
5. Test again

### Last resort:
1. Delete node_modules
2. Delete package-lock.json
3. `npm install`
4. Verify .env
5. `npm start`

---

**Most issues resolve by:**
1. Restarting the server
2. Checking the .env file
3. Running npm install again
4. Clearing cache: `npm cache clean --force`

**You've got this! 💪**
