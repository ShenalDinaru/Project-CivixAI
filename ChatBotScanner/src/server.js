import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeRAG } from './services/ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/upload', express.static(path.join(__dirname, '../../FE_DocumentUpload')));
app.use('/Resources', express.static(path.join(__dirname, '../../Resources')));


// routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Chatbot.html'));
});

app.get('/Chatbot.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Chatbot.html'));
});

app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);



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