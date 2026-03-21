const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // ✅ move here
require('dotenv').config();

const authRoutes = require('./routes/auth');
const vaultRoutes = require('./routes/vault');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === '1';

// Startup check for vault encryption configuration
if (!process.env.VAULT_ENCRYPTION_KEY || !process.env.VAULT_ENCRYPTION_KEY.trim()) {
    console.warn('⚠️  VAULT_ENCRYPTION_KEY is missing. Vault save/load endpoints will fail until it is set.');
} else {
    console.log('✅ VAULT_ENCRYPTION_KEY is configured.');
}

app.use(express.static(path.join(__dirname, '../public')));
app.use('/Resources', express.static(path.join(__dirname, '../Resources')));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Config endpoint for frontend
app.get('/config.js', (req, res) => {
    const forwardedProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const forwardedHost = req.headers['x-forwarded-host'] || req.get('host');
    const defaultScannerBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : 'http://localhost:3000';
    const envScannerBase = process.env.CHATBOT_SCANNER_URL;
    const envLooksLocal = envScannerBase && /localhost|127\.0\.0\.1/i.test(envScannerBase);
    const scannerBaseUrl = (isVercel && envLooksLocal)
        ? defaultScannerBase
        : (envScannerBase || defaultScannerBase);

    res.type('application/javascript');
    res.send(`window.APP_CONFIG = {
        chatbotUrl: '${scannerBaseUrl}/ChatbotScanner.html',
        scannerUrl: '${scannerBaseUrl}/document_uploader.html'
    };`);
});

// Default entry route for deployments where users open the root URL
app.get('/', (req, res) => {
    res.redirect('/LoginPG.html');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ message: 'CivixAI Backend is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
    });
});

if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`✓ Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
