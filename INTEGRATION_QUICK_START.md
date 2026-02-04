# Quick Start Guide - CivixAI Backend + Frontend Integration

## 📋 What's Been Created

### Backend (Node.js + Firebase)
- ✅ Express server with CORS enabled
- ✅ Firebase Realtime Database integration
- ✅ Sign-up API endpoint with validation
- ✅ Username and email availability checks
- ✅ User data stored in Firebase with proper schema

### Frontend Updates
- ✅ Updated sign-up form to check availability via backend
- ✅ New password setup page (password_setup.html)
- ✅ Complete sign-up flow with backend integration

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Firebase Project
1. Visit https://firebase.google.com
2. Create a new project
3. Enable "Realtime Database"
4. Download service account key (Project Settings → Service Accounts)

### Step 2: Set Up Backend
```bash
cd backend
npm install
```

### Step 3: Configure Environment
1. Create `.env` file in the `backend` folder
2. Copy credentials from Firebase service account:
   ```
   PORT=5000
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="your-private-key-with-\n-for-newlines"
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
   ```

### Step 4: Configure Firebase Rules
Paste this in Firebase Console → Realtime Database → Rules:
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

### Step 5: Start Server
```bash
npm start
```
Server runs on `http://localhost:5000`

---

## 📁 File Structure

```
Project-CivixAI/
├── backend/                    # ← NEW
│   ├── config/
│   │   └── firebase.js
│   ├── routes/
│   │   └── auth.js
│   ├── utils/
│   │   └── validation.js
│   ├── server.js
│   ├── package.json
│   ├── .env                   # ← You create this
│   ├── .env.example
│   ├── .gitignore
│   └── SETUP_GUIDE.md
│
├── SignupPG.html              # ← Updated
├── SignupPG_Script.js         # ← Updated
├── password_setup.html        # ← NEW
├── PasswordSetup_Script.js    # ← NEW
├── LoginPG_Styles.css
├── LandingPG_Styles.css
├── README.md
└── Resources/
```

---

## 🔄 Sign-Up Flow

```
User fills form (SignupPG.html)
    ↓
Frontend validates input
    ↓
Checks username availability (Backend API)
    ↓
Checks email availability (Backend API)
    ↓
Redirects to password_setup.html
    ↓
User enters password
    ↓
Sends complete registration to backend
    ↓
Backend creates Firebase Auth user
    ↓
Backend stores user data in Realtime Database
    ↓
Redirects to LoginPG.html
```

---

## 📊 Data Stored in Firebase

### User Profile
```
/users/{uid}
{
  "uid": "abc123...",
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "createdAt": "2024-02-04T10:30:00Z",
  "lastUpdated": "2024-02-04T10:30:00Z"
}
```

### Username Index (for quick lookup)
```
/usernames/johndoe → "abc123..."
```

---

## 🧪 Testing the System

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Open Sign-Up Page
- Open `SignupPG.html` in your browser

### 3. Fill Form & Submit
- Try a new username
- Try a new email
- Password: Must have uppercase, lowercase, number (min 8 chars)

### 4. Check Firebase Console
- View stored data in Realtime Database
- Verify user created in Authentication

---

## 🔐 Validation Rules

| Field | Rules |
|-------|-------|
| First Name | Required |
| Surname | Required |
| Username | 3-20 chars, alphanumeric + underscore/hyphen, unique |
| Email | Valid format, unique |
| Phone | Optional, Sri Lanka format (0712345678) |
| Password | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |

---

## 🐛 Common Issues & Fixes

### "Cannot POST /api/auth/signup"
- Backend not running
- Run `npm start` in backend folder

### "FIREBASE_PROJECT_ID is undefined"
- `.env` file missing or incorrect
- Restart server after creating `.env`

### "Username already taken"
- Username exists in database
- Try different username

### "Email already registered"
- Email exists in database
- Check Firebase Console → Authentication

### Blank page after sign up
- Open browser console (F12)
- Check for errors
- Verify backend URL in scripts

---

## 📈 Next Steps

1. **Test the complete flow** - Sign up a test user
2. **Create login page** - Use Firebase Client SDK
3. **Add email verification** - Send verification emails
4. **User dashboard** - Show user profile after login
5. **Password reset** - Implement forgot password feature

---

## 📚 Documentation

- **Backend Setup**: `backend/SETUP_GUIDE.md`
- **Firebase**: https://firebase.google.com/docs
- **Express.js**: https://expressjs.com/
- **Node.js**: https://nodejs.org/

---

## ✅ Checklist Before Production

- [ ] Test sign-up flow completely
- [ ] Update `API_BASE_URL` to production URL
- [ ] Enable HTTPS on backend
- [ ] Set proper Firebase Security Rules
- [ ] Add email verification
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

---

**You're all set! Start with `npm start` in the backend folder.** 🎉
