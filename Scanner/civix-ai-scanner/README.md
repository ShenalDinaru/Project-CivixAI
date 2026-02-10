# Civix AI Document Scanner

A modern web application for scanning, validating, and extracting data from documents (PDF, JPG, PNG, TIFF).

## Features

- 📄 **Document Upload**: Drag & drop or browse files
- 🔍 **Document Validation**: Check document completeness
- 📊 **Data Extraction**: Extract structured data from documents
- 📦 **Batch Processing**: Process multiple documents at once
- 📷 **Camera Capture**: Capture documents using your device camera
- 🎨 **Modern Dark UI**: Beautiful glassmorphism design with dark theme

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install express multer
   ```

   Or if you need additional OCR libraries:
   ```bash
   npm install express multer pdf-parse tesseract.js
   ```

2. **Create required directories:**
   ```bash
   mkdir uploads
   ```

## Running the Application

### Option 1: Using Node.js (Backend + Frontend)

1. **Start the server:**
   ```bash
   node src/main.js
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

### Option 2: Frontend Only (Static Files)

If you just want to view the frontend without the backend:

1. **Using Python:**
   ```bash
   cd public
   python -m http.server 8000
   ```
   Then open `http://localhost:8000`

2. **Using Node.js http-server:**
   ```bash
   npm install -g http-server
   cd public
   http-server -p 8000
   ```

3. **Using VS Code Live Server:**
   - Install "Live Server" extension
   - Right-click on `index.html` → "Open with Live Server"

## Project Structure

```
civix-ai-scanner/
├── public/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── script.js        # JavaScript logic
│   ├── style.css        # Styling
│   └── test.html        # Test file
├── src/                 # Backend source code
│   ├── main.js          # Express server
│   ├── scanners/        # Document scanning modules
│   ├── validators/      # Validation logic
│   ├── extractors/      # Data extraction
│   └── utils/           # Utility functions
├── config/              # Configuration files
├── uploads/             # Uploaded files (created automatically)
└── README.md            # This file
```

## API Endpoints

- `POST /api/scan` - Scan a single document
- `POST /api/batch-scan` - Scan multiple documents
- `GET /api/health` - Health check endpoint

## Configuration

Update the API endpoint in `public/script.js` if your backend runs on a different port:

```javascript
apiEndpoint: 'http://localhost:3000/api'
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

1. **Port already in use:**
   - Change the port in `src/main.js`: `const PORT = process.env.PORT || 3000;`

2. **CORS errors:**
   - Make sure the frontend and backend are on the same origin, or configure CORS in `src/main.js`

3. **File upload fails:**
   - Check that the `uploads/` directory exists and has write permissions

4. **Font not loading:**
   - The Plus Jakarta Sans font loads from Google Fonts. Ensure you have an internet connection.

## Development

To modify the application:

1. **Frontend:** Edit files in `public/`
2. **Backend:** Edit files in `src/`
3. **Styling:** Modify `public/style.css`

## License

This project is for educational purposes.
