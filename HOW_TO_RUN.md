# How to Run CivixAI Document Processing System

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **OpenRouter API Key** (for chatbot functionality)

## Step 1: Set Up Environment Variables

1. Navigate to the `ChatBot` folder:
   ```bash
   cd ChatBot
   ```

2. Create a `.env` file in the `ChatBot` folder with the following content:
   ```
   PORT=3000
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

   **Note:** Replace `your_openrouter_api_key_here` with your actual OpenRouter API key.
   You can get one from: https://openrouter.ai/

## Step 2: Install Dependencies (if not already done)

```bash
cd ChatBot
npm install
```

## Step 3: Start the Backend Server

Open a terminal/command prompt and run:

```bash
cd ChatBot
npm start
```

Or for development with auto-reload:

```bash
cd ChatBot
npm run dev
```

You should see:
```
Initializing RAG system...
Loaded X chunks from vector store
✓ RAG initialized with X knowledge chunks
Server is running on port 3000
```

## Step 4: Open the Document Upload Page

1. Open your web browser
2. Navigate to the document upload page:
   - **Option 1:** Open `FE_DocumentUpload/document_uploader.html` directly in your browser
   - **Option 2:** Use a local server (recommended):
     ```bash
     # In a new terminal, navigate to project root
     # Using Python (if installed):
     python -m http.server 8000
     
     # Or using Node.js http-server (install first: npm install -g http-server):
     http-server -p 8000
     ```
     Then open: `http://localhost:8000/FE_DocumentUpload/document_uploader.html`

## Step 5: Using the Application

### Upload Documents:
1. Click "Browse / Scan Files" or drag & drop documents
2. Supported formats: PDF, DOCX, TXT, JPG, PNG, GIF
3. Wait for text extraction to complete (shows "Text Extracted & Verified")

### Scan Documents:
1. Click "Browse / Scan Files" → "Scan Document"
2. Allow camera access when prompted
3. Capture the document
4. Click "Proceed" to go to upload page

### Process Documents:
1. After uploading/scanning, click "Proceed" button
2. In the modal, ensure "Analyze in Chatbot" is enabled
3. Click "Proceed to Chat"
4. Documents will be:
   - Extracted (text from PDF/DOCX/images)
   - Saved as JSON files in `ChatBot/processed/` folder
   - Loaded into the RAG system
   - Embedded and ready for chatbot queries

### Chat with Documents:
1. After processing, you'll be redirected to the chatbot
2. The chatbot will say: "I understood your all document all gone through each of your document and then say as how may i help you"
3. Ask questions about your uploaded documents!

## Troubleshooting

### Server won't start:
- Check if port 3000 is already in use
- Verify `.env` file exists and has `OPENROUTER_API_KEY`
- Make sure all dependencies are installed: `npm install`

### Documents not processing:
- Check browser console for errors (F12)
- Verify backend server is running on port 3000
- Check `ChatBot/processed/` folder for generated JSON files

### Scanner not working:
- Ensure camera permissions are granted in browser
- Use HTTPS or localhost (some browsers require this for camera access)

### Chatbot not responding:
- Verify OpenRouter API key is correct in `.env`
- Check backend server logs for API errors
- Ensure RAG system initialized successfully

## File Structure

```
Project-CivixAI/
├── ChatBot/                 # Backend server
│   ├── src/
│   │   ├── server.js        # Main server file
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── rag/             # RAG system
│   ├── public/              # Chatbot frontend
│   ├── processed/           # Generated JSON files (created automatically)
│   └── .env                 # Environment variables (create this)
│
├── FE_DocumentUpload/        # Document upload page
│   └── document_uploader.html
│
└── FE_ScannerUpload/         # Scanner page
    └── scanner_and_upload.html
```

## API Endpoints

- `POST /api/documents/process` - Process uploaded documents
- `POST /api/documents/load` - Load processed documents into RAG
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/status` - Get RAG system status

## Notes

- The `processed` folder is created automatically when documents are processed
- Each document is saved as a JSON file with the same name as the original file
- Documents are chunked and embedded for efficient retrieval
- The RAG system automatically uses uploaded documents when answering questions
