import express from 'express';
import multer from 'multer';
import { processDocuments, loadProcessedDocuments } from '../services/documentProcessor.js';
import { generateBatchEmbeddings } from '../rag/embed.js';
import vectorStore from '../rag/vectorStore.js';
import { chunkText } from '../rag/chunk.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, JPG, PNG, GIF'));
    }
  }
});

/**
 * POST /api/documents/process
 * Process uploaded documents and save as JSON files
 */
router.post('/process', upload.array('documents', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No documents provided'
      });
    }

    console.log(`Processing ${req.files.length} document(s)...`);
    const results = await processDocuments(req.files);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      processed: successful.length,
      failed: failed.length,
      results: results,
      message: `Successfully processed ${successful.length} of ${results.length} document(s)`
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/load
 * Load processed JSON documents into RAG system
 */
router.post('/load', async (req, res, next) => {
  try {
    console.log('Loading processed documents into RAG system...');

    // Load all processed JSON files
    const documents = await loadProcessedDocuments();

    if (documents.length === 0) {
      return res.json({
        success: false,
        message: 'No processed documents found',
        chunksAdded: 0
      });
    }

    // Convert documents to chunks format
    const chunks = [];
    for (const doc of documents) {
      // Chunk the text
      const textChunks = chunkText(doc.text, {
        maxChunkSize: 500,
        overlap: 50
      });

      // Create chunk objects
      for (let i = 0; i < textChunks.length; i++) {
        chunks.push({
          id: `${doc.filename}_chunk_${i}`,
          title: doc.filename,
          section: `Chunk ${i + 1} of ${textChunks.length}`,
          year: new Date(doc.processedAt).getFullYear().toString(),
          source: 'User Uploaded Document',
          text: textChunks[i]
        });
      }
    }

    console.log(`Created ${chunks.length} chunks from ${documents.length} documents`);

    // Generate embeddings for chunks
    console.log('Generating embeddings...');
    const chunksWithEmbeddings = await generateBatchEmbeddings(chunks);

    // Add to vector store
    await vectorStore.initialize();
    await vectorStore.addChunks(chunksWithEmbeddings);

    const stats = vectorStore.getStats();

    res.json({
      success: true,
      message: `Successfully loaded ${documents.length} document(s) into RAG system`,
      documentsLoaded: documents.length,
      chunksAdded: chunks.length,
      totalChunks: stats.totalChunks
    });

  } catch (error) {
    next(error);
  }
});

export default router;
