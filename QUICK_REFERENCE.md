# Essential Commands & Quick Reference

## 🚀 Quick Start Commands

### Windows
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file and fill it
# (See .env.instructions.txt)

# Start server
npm start
```

### macOS/Linux
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file and fill it
nano .env

# Start server
npm start
```

---

## 📦 npm Commands

```bash
# Install all dependencies
npm install

# Start the server (production mode)
npm start

# Start with auto-reload during development
npm run dev

# Check installed packages
npm list

# Update packages
npm update

# Install specific package
npm install package-name

# Uninstall package
npm uninstall package-name
```

---

## 🔥 Firebase Commands

### Firebase CLI (if using CLI)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy to Firebase
firebase deploy

# View logs
firebase functions:log
```

---

## 🧪 Testing Commands

### Health Check
```bash
# Check if server is running
curl http://localhost:5000/api/health
```

### Create Test User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "surname": "User",
    "username": "testuser123",
    "email": "test@example.com",
    "phone": "0712345678",
    "password": "TestPass123"
  }'
```

### Check Username
```bash
curl -X POST http://localhost:5000/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123"}'
```

### Check Email
```bash
curl -X POST http://localhost:5000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📂 File Navigation

```bash
# Go to project root
cd c:\Users\Odara\Desktop\Project-CivixAI

# Go to backend folder
cd backend

# List files
dir                  # Windows
ls -la               # macOS/Linux

# View package.json
type package.json    # Windows
cat package.json     # macOS/Linux

# View .env file
type .env            # Windows
cat .env             # macOS/Linux
```

---

## 🔧 Troubleshooting Commands

### Check Node.js
```bash
node --version
npm --version
```

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
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

### Kill Process on Port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Check Port Availability
```bash
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000
```

---

## 📝 Useful Environment Variables

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production

# Enable debug logs
DEBUG=*

# Firebase specific
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_DATABASE_URL=your-db-url
```

---

## 🔗 Important URLs & Links

### Firebase
- Firebase Console: https://console.firebase.google.com
- Firebase Docs: https://firebase.google.com/docs
- Realtime Database Docs: https://firebase.google.com/docs/database
- Admin SDK Docs: https://firebase.google.com/docs/admin/setup

### Development
- Localhost: http://localhost:5000
- Health Check: http://localhost:5000/api/health
- Postman: https://www.postman.com/

### Node.js & Express
- Node.js: https://nodejs.org/
- Express.js: https://expressjs.com/
- npm: https://www.npmjs.com/

---

## 📊 Common File Paths

```
Windows:
c:\Users\Odara\Desktop\Project-CivixAI\backend\package.json
c:\Users\Odara\Desktop\Project-CivixAI\backend\.env
c:\Users\Odara\Desktop\Project-CivixAI\backend\server.js

macOS/Linux:
~/Desktop/Project-CivixAI/backend/package.json
~/Desktop/Project-CivixAI/backend/.env
~/Desktop/Project-CivixAI/backend/server.js
```

---

## 🎯 Validation Rules Quick Reference

### Username
```
Pattern: /^[a-zA-Z0-9_-]{3,20}$/
- 3 to 20 characters
- Letters, numbers, underscore, hyphen only
- Must be unique
```

### Email
```
Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Valid email format
- Must be unique
```

### Phone (Sri Lanka)
```
Pattern: /^(?:\+94|0)?[7][0-9]{8}$/
- Optional field
- Starts with +94 or 0
- Then 7 followed by 8 digits
Examples: 0712345678, +94712345678
```

### Password
```
Requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
Examples: SecurePass123, Password2024
```

---

## 🔑 API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Check server status |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/check-username` | Verify username availability |
| POST | `/api/auth/check-email` | Verify email availability |

---

## 📋 Step-by-Step Setup

```
1. Create Firebase Project
   └─ https://firebase.google.com

2. Download Service Account Key
   └─ Firebase Console → Project Settings → Service Accounts

3. Create .env File
   └─ backend\.env

4. Fill Environment Variables
   └─ Copy credentials from JSON file

5. Install Dependencies
   └─ npm install

6. Start Server
   └─ npm start

7. Test Backend
   └─ curl http://localhost:5000/api/health

8. Test Sign-Up
   └─ Open SignupPG.html in browser

9. Verify Data
   └─ Firebase Console → Realtime Database
```

---

## 🎯 Success Checklist

```
Setup:
☐ Node.js installed
☐ Firebase project created
☐ Service account key downloaded
☐ .env file created with credentials
☐ npm install completed
☐ npm start succeeds

Testing:
☐ Health check returns 200
☐ Can check username availability
☐ Can check email availability
☐ Can create new user
☐ User data in Firebase
☐ Sign-up form works
☐ Password form works
☐ Validation works
☐ Error handling works
☐ Redirect works

Production:
☐ API_BASE_URL updated
☐ HTTPS enabled
☐ Firebase rules configured
☐ Error logging setup
☐ Rate limiting added
☐ Tested on multiple browsers
☐ Tested on mobile devices
```

---

## 💡 Pro Tips

1. **Keep terminal open** - See server logs in real-time
2. **Use Postman** - Easier than cURL for API testing
3. **Check Firebase Console** - Verify data is being stored
4. **Read error messages** - They tell you what's wrong
5. **Use browser DevTools** - F12 to see frontend errors
6. **Restart server** - After changing .env file
7. **Test with real data** - Not just dummy values
8. **Monitor network tab** - See API requests/responses
9. **Keep .env secure** - Never commit to git
10. **Read documentation** - Firebase docs are comprehensive

---

## 🆘 When Something Goes Wrong

### Step 1: Check Logs
```
Look at:
- Terminal output (backend logs)
- Browser console (frontend errors)
- Network tab (API calls)
- Firebase Console (database changes)
```

### Step 2: Common Issues

| Issue | Solution |
|-------|----------|
| Server won't start | Check .env file, run `npm install` |
| Cannot reach server | Ensure port 5000 is not in use |
| CORS errors | Backend has CORS, check API URL |
| Data not saving | Check Firebase rules and permissions |
| Validation failing | Review validation rules, check console |
| Username taken | Try different username |
| Email taken | Use new email address |

### Step 3: Get Help
- Read SETUP_GUIDE.md
- Check API_TESTING_GUIDE.md
- Review ARCHITECTURE.md
- Look at Firebase documentation

---

## 🎓 Learning Resources

```
Frontend:
- HTML/CSS/JavaScript fundamentals
- Fetch API for HTTP requests
- Form validation techniques

Backend:
- Node.js basics
- Express.js routing
- Middleware concepts
- Async/await

Firebase:
- Realtime Database structure
- Security Rules
- Authentication
- Admin SDK

DevOps:
- Environment variables
- CORS configuration
- API design
- Error handling
```

---

**You've got this! Start with `npm start` in the backend folder.** 🚀
