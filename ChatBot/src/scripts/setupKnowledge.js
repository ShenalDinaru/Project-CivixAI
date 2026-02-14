/**
 * Setup script to initialize the RAG system
 * 
 * This script:
 * 1. Loads tax chunks from JSON
 * 2. Generates embeddings for each chunk
 * 3. Stores them in the vector database
 * 
 * Run this once after adding new tax knowledge:
 * node src/scripts/setupKnowledge.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateBatchEmbeddings } from '../rag/embed.js';
import vectorStore from '../rag/vectorStore.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupKnowledge() {
  try {
    console.log('=== CivixAI Knowledge Base Setup ===\n');

    // Step 1: Load chunks from JSON
    console.log('Step 1: Loading tax knowledge chunks...');
    const chunksPath = path.join(__dirname, '../data/tax-chunks.json');
    const chunksData = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(chunksData);

    if (chunks.length === 0) {
      console.error('\n❌ Error: tax-chunks.json is empty!');
      console.log('\nPlease add your Sri Lankan tax knowledge chunks to:');
      console.log(chunksPath);
      console.log('\nExpected format:');
      console.log(`[
  {
    "id": "apit_001",
    "title": "APIT Rates 2024/25",
    "section": "IRD Guide - Page 12",
    "year": "2024/25",
    "source": "IRD Website",
    "text": "APIT for resident employees is charged at progressive rates..."
  }
]`);
      process.exit(1);
    }

    console.log(`✓ Loaded ${chunks.length} chunks\n`);

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
    console.log('2. Ask tax questions - the AI will use your knowledge base');
    console.log('3. Add more chunks to tax-chunks.json and re-run this script\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. OPENROUTER_API_KEY is set in your .env file');
    console.error('2. tax-chunks.json exists and contains valid JSON');
    console.error('3. You have internet connection for API calls\n');
    process.exit(1);
  }
}

// Run the setup
setupKnowledge();
