# System Architecture & Data Flow

## 📊 Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│  │   SignupPG.html             │  │  password_setup.html     │ │
│  │  (Sign-up Form)             │  │  (Password Setup Form)   │ │
│  └──────────┬──────────────────┘  └──────────┬───────────────┘ │
│             │                                 │                 │
│  ┌──────────▼──────────────────┐  ┌──────────▼───────────────┐ │
│  │ SignupPG_Script.js          │  │ PasswordSetup_Script.js │ │
│  │ - Form validation           │  │ - Password validation   │ │
│  │ - API calls                 │  │ - Complete registration │ │
│  └──────────┬──────────────────┘  └──────────┬───────────────┘ │
│             │                                 │                 │
│             └────────────────┬────────────────┘                 │
│                              │                                   │
│                    HTTP Requests (JSON)                         │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                    CORS Enabled Connection
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                   http://localhost:5000                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Express.js Application                     │   │
│  │                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ ROUTES       │  │ MIDDLEWARE   │  │ VALIDATION  │  │   │
│  │  ├──────────────┤  ├──────────────┤  ├─────────────┤  │   │
│  │  │ /auth/signup │  │ CORS         │  │ Email       │  │   │
│  │  │ /auth/check- │  │ Body Parser  │  │ Username    │  │   │
│  │  │   username   │  │ Error        │  │ Phone       │  │   │
│  │  │ /auth/check- │  │ Handling     │  │ Password    │  │   │
│  │  │   email      │  │              │  │             │  │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └────────────┬──────────────────────┬────────────────────┘   │
│               │                      │                         │
│               │                      │                         │
│       ┌───────▼──────┐       ┌──────▼────────────┐            │
│       │  Firebase    │       │  Firebase Auth   │            │
│       │  Realtime DB │       │  (User accounts) │            │
│       └───────┬──────┘       └──────┬───────────┘            │
└──────────────┼──────────────────────┼──────────────────────────┘
               │                      │
               │   Network (HTTPS)    │
               │                      │
        ┌──────▼──────────────────────▼────────┐
        │     Firebase Cloud Services          │
        │  (Google-managed Infrastructure)    │
        └─────────────────────────────────────┘
```

## 🔄 User Registration Flow

```
START
  │
  ▼
┌─────────────────────────┐
│ User Opens SignupPG.html│
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ Fills Registration Form: │
│ - First Name             │
│ - Surname                │
│ - Username               │
│ - Email                  │
│ - Phone (Optional)       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Frontend Validation:     │
│ - Email format           │
│ - Phone format           │
│ - Required fields        │
└──────────┬───────────────┘
           │
       ┌───┴─────┐
       │ Invalid? │
       └─┬────┬──┘
         │    │
      YES│    │NO
         │    │
      ┌──▼┐  │
      │MSG│  │
      └──┬┘  │
         │   │
         │   ▼
         │  ┌─────────────────────────┐
         │  │ Check Username Via API  │
         │  │ POST /check-username    │
         │  └────────┬────────────────┘
         │           │
         │       ┌───┴────┐
         │       │ Taken? │
         │       └─┬───┬──┘
         │         │   │
         │      YES│   │NO
         │         │   │
         │      ┌──▼┐  │
         │      │MSG│  │
         │      └──┬┘  │
         │         │   │
         │         │   ▼
         │         │  ┌──────────────────────┐
         │         │  │ Check Email Via API  │
         │         │  │ POST /check-email    │
         │         │  └────────┬─────────────┘
         │         │           │
         │         │       ┌───┴────┐
         │         │       │Taken?  │
         │         │       └─┬───┬──┘
         │         │         │   │
         │         │      YES│   │NO
         │         │         │   │
         │         │      ┌──▼┐  │
         │         │      │MSG│  │
         │         │      └──┬┘  │
         │         │         │   │
         └─────────┴─────────┼───┤
                             │   │
                             ▼   │
                    ┌─────────────────────┐
                    │ All Valid?          │
                    └─┬─────────────────┬─┘
                      │                 │
                   NO │                 │ YES
                      │                 │
                  ┌───▼┐                │
                  │ERR │                │
                  └───┬┘                │
                      │                 │
                      │                 ▼
                      │        ┌──────────────────────────┐
                      │        │ Save Data to SessionStor │
                      │        │ Redirect to:             │
                      │        │ password_setup.html      │
                      │        └────────┬─────────────────┘
                      │                 │
                      │                 ▼
                      │        ┌──────────────────────────┐
                      │        │ User Enters Password     │
                      │        │ - Create password        │
                      │        │ - Confirm password       │
                      │        └────────┬─────────────────┘
                      │                 │
                      │                 ▼
                      │        ┌──────────────────────────┐
                      │        │ Validate Password:       │
                      │        │ - Length >= 8           │
                      │        │ - Has uppercase          │
                      │        │ - Has lowercase          │
                      │        │ - Has number             │
                      │        │ - Matches confirm        │
                      │        └────────┬─────────────────┘
                      │                 │
                      │         ┌───────┴────────┐
                      │         │ Valid?         │
                      │         └────┬──────┬───┘
                      │              │      │
                      │           NO │      │ YES
                      │              │      │
                      │           ┌──▼┐    │
                      │           │ERR│    │
                      │           └──┬┘    │
                      │              │     │
                      └──────────────┼─────┤
                                     │     │
                                     │     ▼
                            ┌────────────────────────────┐
                            │ Send Complete Data to      │
                            │ Backend:                   │
                            │ POST /auth/signup          │
                            └────────┬───────────────────┘
                                     │
                                     ▼
                            ┌────────────────────────────┐
                            │ Backend Validation         │
                            │ (Server-side checks)       │
                            └────────┬───────────────────┘
                                     │
                            ┌────────┴────────┐
                            │ All Valid?      │
                            └─┬──────────┬───┘
                              │          │
                           NO │          │ YES
                              │          │
                           ┌──▼┐        │
                           │ERR│        │
                           └──┬┘        │
                              │         │
                              │         ▼
                              │  ┌──────────────────┐
                              │  │ Create User in   │
                              │  │ Firebase Auth    │
                              │  └────────┬─────────┘
                              │           │
                              │           ▼
                              │  ┌──────────────────┐
                              │  │ Store User Data  │
                              │  │ in Realtime DB   │
                              │  └────────┬─────────┘
                              │           │
                              │           ▼
                              │  ┌──────────────────┐
                              │  │ Create Username  │
                              │  │ Index Entry      │
                              │  └────────┬─────────┘
                              │           │
                              │           ▼
                              │  ┌──────────────────┐
                              │  │ Return Success   │
                              │  │ Response         │
                              │  └────────┬─────────┘
                              │           │
                              └───────────┼────────────┐
                                          │            │
                                          ▼            ▼
                                  ┌────────────────────────┐
                                  │ Clear Session Data     │
                                  │ Show Success Message   │
                                  │ Redirect to LoginPG.ht │
                                  └──────────┬─────────────┘
                                             │
                                             ▼
                                           END
```

## 🗄️ Database Structure

```
Firebase Realtime Database
│
├── /users
│   └── {uid}
│       ├── uid: "abc123..."
│       ├── firstName: "John"
│       ├── surname: "Doe"
│       ├── username: "johndoe"
│       ├── email: "john@example.com"
│       ├── phone: "0712345678"
│       ├── createdAt: "2024-02-04T10:30:00Z"
│       └── lastUpdated: "2024-02-04T10:30:00Z"
│
└── /usernames
    └── {username}
        └── uid: "abc123..."

Firebase Authentication
│
└── Users
    └── {uid}
        ├── email: "john@example.com"
        ├── password: (hashed)
        └── metadata...
```

## 📡 API Request/Response Flow

### Registration Request
```
Client                          Server                      Firebase
  │                               │                            │
  │─── POST /auth/signup ────────>│                            │
  │    (user data + password)     │                            │
  │                               │─── Validate all ───────────┤
  │                               │                            │
  │                               │─── Create Auth User ──────>│
  │                               │<── Return UID ────────────│
  │                               │                            │
  │                               │─── Store User Data ──────>│
  │                               │<── Success ───────────────│
  │                               │                            │
  │                               │─── Create Username Index ─>│
  │                               │<── Success ───────────────│
  │                               │                            │
  │<──── 201 Created ────────────│                            │
  │    (success response)         │                            │
  │                               │                            │
```

### Username Check Request
```
Client                          Server                      Firebase
  │                               │                            │
  │─ POST /check-username ──────>│                            │
  │   (username)                  │─── Query /usernames ──────>│
  │                               │<── Check exists ──────────│
  │<──── 200 OK ────────────────│                            │
  │   (available: true/false)     │                            │
  │                               │                            │
```

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│ Client-Side Security                │
├─────────────────────────────────────┤
│ • HTML5 input validation             │
│ • Client-side format checking        │
│ • HTTPS enforced (in production)     │
│ • No sensitive data in localStorage  │
└────────────────────┬────────────────┘
                     │
┌────────────────────▼────────────────┐
│ Network Security                    │
├─────────────────────────────────────┤
│ • CORS enabled (controlled origins)  │
│ • Content-Type validation            │
│ • HTTPS/SSL (in production)          │
│ • Rate limiting (optional)           │
└────────────────────┬────────────────┘
                     │
┌────────────────────▼────────────────┐
│ Server-Side Security                │
├─────────────────────────────────────┤
│ • Input validation & sanitization    │
│ • SQL injection prevention           │
│ • XSS prevention                     │
│ • Error handling & logging           │
└────────────────────┬────────────────┘
                     │
┌────────────────────▼────────────────┐
│ Database Security                   │
├─────────────────────────────────────┤
│ • Firebase Security Rules            │
│ • User authentication checks         │
│ • Encrypted connections              │
│ • Access control (UID-based)         │
└─────────────────────────────────────┘
```

## 📊 Data Validation Pipeline

```
Raw Input
    │
    ▼
┌──────────────────────────┐
│ Client-Side Validation   │
│ - Format checks          │
│ - Required fields        │
│ - Real-time feedback     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Network Transmission     │
│ - HTTPS (production)     │
│ - CORS headers           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Server Input Validation  │
│ - Email format           │
│ - Username rules         │
│ - Phone format           │
│ - Required fields        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Business Logic Check     │
│ - Duplicate check        │
│ - Username availability  │
│ - Email availability     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Firebase Validation      │
│ - Auth rules             │
│ - Database rules         │
│ - Constraints            │
└──────────┬───────────────┘
           │
           ▼
    Stored Safely
```

## 🚀 Performance Considerations

```
Action                    Time      Location
─────────────────────────────────────────────────
Client validation         0-50ms    Browser
Network request           50-500ms  Internet
Server processing         50-200ms  Backend
Firebase writes           100-300ms Firebase
Total                     200-1050ms User

Optimization:
- Cache username/email checks
- Batch Firebase operations
- Minimize network requests
- Use CDN for static files
```

## 📈 Scalability Plan

```
Phase 1: Current (Development)
├── Single Node.js server
├── Firebase Realtime DB
└── Direct API calls

Phase 2: Production
├── Load balancing
├── Database caching
└── API rate limiting

Phase 3: Enterprise
├── Microservices
├── Database replication
├── Advanced monitoring
└── Geographic distribution
```

---

**This architecture ensures security, scalability, and reliability!** 🎯
