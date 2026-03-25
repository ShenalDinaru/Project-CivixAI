/**
 * Setup script to initialize the RAG system
 * 
 * This script:
 * 1. Loads civic knowledge chunks from JSON
 * 2. Generates embeddings for each chunk
 * 3. Stores them in the vector database
 * 
 * Run this once after adding or updating civic knowledge:
 * node src/scripts/setupKnowledge.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { generateBatchEmbeddings } from '../rag/embed.js';
import vectorStore from '../rag/vectorStore.js';
import { loadKnowledgeChunks } from '../utils/knowledgeLoader.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupKnowledge() {
  try {
    console.log('=== CivixAI Knowledge Base Setup ===\n');

    // Step 1: Load chunks from knowledge file
    console.log('Step 1: Loading civic knowledge chunks...');
    const { chunkPaths, chunks } = await loadKnowledgeChunks(__dirname);

    if (chunks.length === 0) {
      console.error('\n❌ Error: knowledge chunk file is empty!');
      console.log('\nPlease add your Sri Lankan civic knowledge chunks to src/data as *_chunks.jsonl or *_chunks.json files.');
      console.log('\nExpected format:');
      console.log(`{"chunk_id":"ird_tax_chart_2025_2026_001","document_title":"IRD Sri Lanka Tax Chart 2025/2026","section":"Advanced Personal Income Tax","subsection":"Employer remittance note","source_url":"https://www.ird.gov.lk/...","source_last_updated":"2025-08-28","text":"Employers are required to remit APIT..."}`);
      process.exit(1);
    }

    console.log(`✓ Loaded ${chunks.length} chunks from ${chunkPaths.length} file(s)`);
    chunkPaths.forEach((chunkPath) => {
      console.log(`  - ${path.basename(chunkPath)}`);
    });
    console.log('');

    // Step 2: Generate embeddings
    console.log('Step 2: Generating embeddings (this may take a few minutes)...');
    const chunksWithEmbeddings = await generateBatchEmbeddings(chunks);
    console.log(`✓ Generated embeddings for ${chunksWithEmbeddings.length} chunks\n`);

    // Step 3: Initialize and populate vector store
    console.log('Step 3: Storing in vector database...');
    await vectorStore.initialize();
    
    // Clear existing data and add new chunks
    await vectorStore.clear();
    await vectorStore.addChunks(chunksWithEmbeddings);

    const stats = vectorStore.getStats();
    console.log(`✓ Stored ${stats.totalChunks} chunks in vector database\n`);

    console.log('=== Setup Complete! ===');
    console.log(`\nYour RAG system is ready with ${stats.totalChunks} knowledge chunks.`);
    console.log('Average chunk size:', stats.avgTextLength, 'characters\n');

    console.log('Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Ask civic questions - the AI will use your knowledge base');
    console.log('3. Add or update *_chunks.jsonl files in src/data and re-run this script\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. OPENROUTER_API_KEY is set in your .env file');
    console.error('2. The configured chunk file exists and contains valid JSON or JSONL');
    console.error('3. You have internet connection for API calls\n');
    process.exit(1);
  }
}

// Run the setup
setupKnowledge();
