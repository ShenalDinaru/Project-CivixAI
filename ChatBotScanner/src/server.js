import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeRAG } from './services/ragService.js';
import './config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === '1';
let ragInitPromise;

function ensureRAGInitialized() {
  if (!ragInitPromise) {
    console.log('Initializing RAG system...');
    ragInitPromise = initializeRAG().catch((error) => {
      console.error('RAG initialization failed:', error.message);
      return false;
    });
  }

  return ragInitPromise;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // ChatBotScanner/public
app.use(express.static(path.join(__dirname, '../../public'))); // root public (uploader, scanner)
app.use('/Resources', express.static(path.join(__dirname, '../../Resources'))); // shared icons


// routes

// Scanner chatbot route  
app.get('/ChatbotScanner.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/ChatbotScanner.html'));
});

app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/documents', documentRoutes);



// Error handling middleware
app.use(errorHandler);

// Local runtime: initialize and listen on a port
if (!isVercel) {
  ensureRAGInitialized().finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
}

export default app;