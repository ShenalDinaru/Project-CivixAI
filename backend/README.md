# CivixAI Backend

Node.js backend for CivixAI with Firebase Firestore database integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json` in the `backend` folder

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Update the `GOOGLE_APPLICATION_CREDENTIALS` path if needed

### 4. Run the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Signup
- **Endpoint:** `POST /api/signup`
- **Body:**
```json
{
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+94712345678"
}
```
- **Required Fields:** surname, username, email
- **Response:** Returns `{ success: true, userId: "email" }` on success

### Health Check
- **Endpoint:** `GET /health`
- **Response:** `{ status: "Backend is running" }`

## Database Structure (Firestore)

### Collection: `users`
Document ID: email (lowercased)

Fields:
- `firstName` (string) - User's first name
- `surname` (string) - User's surname
- `username` (string, unique) - Username
- `email` (string, unique) - User's email
- `phone` (string) - User's phone number
- `createdAt` (timestamp) - Account creation date
- `updatedAt` (timestamp) - Last update date

## Error Handling

- **400**: Missing required fields or invalid format
- **409**: Email already registered or username taken
- **500**: Server error

## Security Notes

- Keep `serviceAccountKey.json` secure and never commit to Git
- Add `.gitignore` entry for sensitive files
- Use HTTPS in production
- Implement rate limiting for signup endpoint
