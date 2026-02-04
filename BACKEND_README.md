# CivixAI Backend & Frontend Integration

## 📚 Overview

This project implements a complete sign-up system for CivixAI with:
- **Frontend**: HTML/JavaScript sign-up and password setup pages
- **Backend**: Node.js + Express server with Firebase integration
- **Database**: Firebase Realtime Database for user data storage
- **Authentication**: Firebase Authentication for secure user accounts

## 🎯 Features

✅ User registration with email & username validation
✅ Unique username/email checking
✅ Secure password setup with strength validation
✅ Firebase Realtime Database storage
✅ Complete error handling and user feedback
✅ Responsive design with smooth animations
✅ Input validation on both client and server side

## 📦 Project Structure

```
Project-CivixAI/
│
├── frontend/
│   ├── SignupPG.html              # Sign-up form
│   ├── SignupPG_Script.js         # Sign-up logic + API calls
│   ├── password_setup.html        # Password setup form
│   ├── PasswordSetup_Script.js    # Password setup logic + API calls
│   ├── LoginPG_Styles.css
│   ├── LandingPG_Styles.css
│   └── Resources/                 # Images and media
│
├── backend/
│   ├── config/
│   │   └── firebase.js            # Firebase initialization
│   ├── routes/
│   │   └── auth.js                # Authentication routes
│   ├── utils/
│   │   └── validation.js          # Input validation
│   ├── server.js                  # Express server
│   ├── package.json               # Dependencies
│   ├── .env.example               # Environment template
│   ├── .env.instructions.txt      # Setup guide
│   ├── .gitignore
│   └── SETUP_GUIDE.md             # Detailed setup docs
│
├── INTEGRATION_QUICK_START.md      # Quick reference
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Firebase project account

### Installation

#### 1. Firebase Setup
1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Enable Realtime Database
3. Create a service account key from Project Settings
4. Download the JSON file with credentials

#### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Fill in your Firebase credentials from step 1

# Start the server
npm start
```

Server will run on `http://localhost:5000`

#### 3. Frontend Setup
- No installation needed!
- Just open `SignupPG.html` in your browser
- Make sure backend is running before testing

## 🔌 API Endpoints

### POST /api/auth/signup
Create a new user account

**Request:**
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

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "unique-user-id",
    "firstName": "John",
    "surname": "Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "fieldName": "Error details"
  }
}
```

### POST /api/auth/check-username
Verify username availability

**Request:** `{ "username": "johndoe" }`
**Response:** `{ "success": true, "available": true }`

### POST /api/auth/check-email
Verify email availability

**Request:** `{ "email": "john@example.com" }`
**Response:** `{ "success": true, "available": true }`

### GET /api/health
Server health check

**Response:** `{ "message": "CivixAI Backend is running" }`

## 📋 Data Validation

### Validation Rules

| Field | Requirements |
|-------|--------------|
| First Name | Required, text only |
| Surname | Required, text only |
| Username | 3-20 chars, alphanumeric + underscore/hyphen, must be unique |
| Email | Valid email format, must be unique |
| Phone | Optional, Sri Lanka format (0712345678 or +94712345678) |
| Password | Min 8 chars, uppercase, lowercase, number required |

## 🔐 Security

- **Client-side validation**: Fast feedback to users
- **Server-side validation**: Prevents malicious submissions
- **Firebase Authentication**: Secure user credential storage
- **Database rules**: Access control via Firebase Security Rules
- **Password hashing**: Firebase Auth handles encryption
- **CORS enabled**: Secure cross-origin requests

## 💾 Database Schema

### Users Collection
```
/users/{uid}
{
  "uid": "user-unique-id",
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "createdAt": "2024-02-04T10:30:00Z",
  "lastUpdated": "2024-02-04T10:30:00Z"
}
```

### Username Index
```
/usernames/{username} → uid
```

This allows quick username availability checks.

## 🧪 Testing

### Manual Testing
1. Start backend: `npm start`
2. Open `SignupPG.html` in browser
3. Fill in form with test data
4. Submit and check console for responses
5. Verify data in Firebase Console

### Test Cases
- ✅ Valid user registration
- ✅ Duplicate username rejection
- ✅ Duplicate email rejection
- ✅ Invalid email format rejection
- ✅ Invalid phone format rejection
- ✅ Weak password rejection
- ✅ Password mismatch rejection

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Node.js installation
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Check .env file exists and has correct values
```

### "Cannot find module" errors
```bash
npm install
```

### Firebase connection errors
- Verify .env file has correct credentials
- Check Firebase console for real-time database URL
- Ensure project has Realtime Database enabled

### CORS errors
- Backend already handles CORS
- Check API_BASE_URL in frontend scripts
- Ensure backend is running on port 5000

### Data not saving to Firebase
- Check Firebase Security Rules
- Verify database has read/write permissions
- Check Firebase Console logs for errors

## 📈 Production Deployment

Before deploying:

1. **Update API URLs**
   - Change `http://localhost:5000` to production URL
   - Update in `SignupPG_Script.js` and `PasswordSetup_Script.js`

2. **Environment Setup**
   - Use secure .env configuration
   - Never commit .env to git

3. **Security**
   - Enable HTTPS
   - Update CORS origins
   - Set up rate limiting
   - Enable Firebase Security Rules

4. **Testing**
   - Test on multiple browsers
   - Test on mobile devices
   - Verify all validations work

5. **Monitoring**
   - Set up error logging
   - Monitor API performance
   - Track signup success rates

## 📚 Documentation

- **[INTEGRATION_QUICK_START.md](INTEGRATION_QUICK_START.md)** - Quick reference guide
- **[backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md)** - Detailed setup instructions
- **[Firebase Docs](https://firebase.google.com/docs)** - Firebase documentation
- **[Express.js Docs](https://expressjs.com/)** - Express framework docs
- **[Node.js Docs](https://nodejs.org/)** - Node.js documentation

## 🔗 Next Steps

1. **Test the sign-up flow** with test data
2. **Create login page** using Firebase Client SDK
3. **Add email verification** before account activation
4. **Build user dashboard** to display profile
5. **Implement password reset** functionality
6. **Add profile update** endpoints
7. **Enable social login** (Google, GitHub, etc.)

## 💡 Tips

- Use Firebase Console to monitor real-time database changes
- Check browser console (F12) for frontend errors
- Use server logs to debug backend issues
- Test with different data to verify all validations
- Keep .env file safe and never commit to git

## 📞 Support Resources

- **Firebase Console**: https://console.firebase.google.com
- **Firebase Documentation**: https://firebase.google.com/docs
- **Express.js Guide**: https://expressjs.com/
- **Firebase Admin SDK**: https://firebase.google.com/docs/database/admin/start
- **REST API Testing**: Postman (https://www.postman.com/)

## ✅ Verification Checklist

- [ ] Node.js installed
- [ ] Firebase project created
- [ ] Service account key downloaded
- [ ] .env file created in backend folder
- [ ] Dependencies installed (`npm install`)
- [ ] Backend running without errors
- [ ] Frontend pages open correctly
- [ ] Sign-up flow completes successfully
- [ ] Data appears in Firebase Console
- [ ] Error messages display properly

---

**Happy coding! 🚀 Your CivixAI backend is ready!**
