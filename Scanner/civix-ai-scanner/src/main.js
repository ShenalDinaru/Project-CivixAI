const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFScanner = require('./scanners/pdfScanner');
const ImageScanner = require('./scanners/imageScanner');
const CompletenessChecker = require('./validators/completenessChecker');
const DataExtractor = require('./extractors/dataExtractor');
const logger = require('./utils/logger');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

class CivixAIScanner {
    constructor() {
        this.pdfScanner = new PDFScanner();
        this.imageScanner = new ImageScanner();
        this.completenessChecker = new CompletenessChecker();
        this.dataExtractor = new DataExtractor();
    }

    async scanDocument(filePath, fileType) {
        try {
            logger.info(`Scanning document: ${filePath}`);
            
            let extractedText;
            if (fileType === 'pdf') {
                extractedText = await this.pdfScanner.extractText(filePath);
            } else if (['jpg', 'jpeg', 'png', 'tiff'].includes(fileType)) {
                extractedText = await this.imageScanner.extractText(filePath);
            } else {
                throw new Error('Unsupported file type');
            }

            const validationResult = await this.completenessChecker.validate(extractedText);
            const extractedData = await this.dataExtractor.extract(extractedText);

            return {
                success: true,
                validation: validationResult,
                extractedData: extractedData,
                rawText: extractedText.substring(0, 1000) + '...'
            };

        } catch (error) {
            logger.error(`Error scanning document: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async batchScan(files) {
        const results = [];
        for (const file of files) {
            const result = await this.scanDocument(file.path, file.mimetype.split('/')[1]);
            results.push({
                filename: file.originalname,
                ...result
            });
        }
        return results;
    }
}

// Express API setup
const scanner = new CivixAIScanner();

// API Routes
app.post('/api/scan', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileType = req.file.mimetype.split('/')[1];
        const result = await scanner.scanDocument(req.file.path, fileType);
        res.json(result);
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

app.post('/api/batch-scan', upload.array('documents', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const results = await scanner.batchScan(req.files);
        res.json({ results });
    } catch (error) {
        console.error('Batch scan error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Civix AI Document Scanner',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Catch-all route for frontend SPA - MUST be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Civix AI Scanner running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
});

module.exports = CivixAIScanner;