import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeRAG } from './services/ragService.js';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Chatbot.html'));
});

app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.APP_CONFIG = {
    homeUrl: '${process.env.SCANNER_URL || "http://localhost:3000"}/home.html'
  };`);
});

// Error handling middleware
app.use(errorHandler);

// Initialize RAG system and start server
async function startServer() {
  console.log('Initializing RAG system...');
  await initializeRAG();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();