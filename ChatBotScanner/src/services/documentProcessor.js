import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// pdf2json is CommonJS, use createRequire to import it
const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = process.env.VERCEL === '1';

// Path to processed folder
const PROCESSED_DIR = isVercel
  ? path.join('/tmp', 'civixai-processed')
  : path.join(__dirname, '../../processed');

/**
 * Ensure processed directory exists
 */
async function ensureProcessedDir() {
  try {
    await fs.access(PROCESSED_DIR);
  } catch {
    await fs.mkdir(PROCESSED_DIR, { recursive: true });
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(buffer) {
  try {
    console.log(`Starting PDF extraction (buffer size: ${buffer.length} bytes)...`);
    
    return new Promise((resolve, reject) => {
      // Set a timeout of 2 minutes for PDF parsing
      const timeout = setTimeout(() => {
        reject(new Error('PDF parsing timeout: Process took longer than 2 minutes. The PDF might be too large or complex.'));
      }, 120000); // 2 minutes
      
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on('pdfParser_dataError', (err) => {
        clearTimeout(timeout);
        console.error('PDF parsing error:', err);
        reject(new Error(`PDF parsing error: ${err.parserError || err.message || 'Unknown error'}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          clearTimeout(timeout);
          console.log(`PDF parsed successfully. Pages: ${pdfData.Pages?.length || 0}`);
          
          // Extract text from all pages
          let fullText = '';
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page, pageIndex) => {
              if (page.Texts) {
                page.Texts.forEach((textItem) => {
                  if (textItem.R) {
                    textItem.R.forEach((run) => {
                      if (run.T) {
                        try {
                          // Decode URI-encoded text
                          fullText += decodeURIComponent(run.T) + ' ';
                        } catch (decodeError) {
                          // If decode fails, use the text as-is
                          fullText += run.T + ' ';
                        }
                      }
                    });
                  }
                });
                fullText += '\n';
              }
              if ((pageIndex + 1) % 10 === 0) {
                console.log(`Processed ${pageIndex + 1} pages...`);
              }
            });
          }
          
          const extractedText = fullText.trim();
          console.log(`PDF extraction complete. Extracted ${extractedText.length} characters.`);
          resolve(extractedText);
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error(`Failed to extract text: ${error.message}`));
        }
      });
      
      // Parse the PDF buffer
      try {
        pdfParser.parseBuffer(buffer);
      } catch (parseError) {
        clearTimeout(timeout);
        reject(new Error(`Failed to start PDF parsing: ${parseError.message}`));
      }
    });
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(buffer) {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  } catch (error) {
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Extract text from text file
 */
async function extractTextFromTXT(buffer) {
  return buffer.toString('utf-8');
}

/**
 * Process a single document and extract text
 */
export async function processDocument(file, options = {}) {
  const { originalname, buffer, mimetype } = file;
  const fileExtension = path.extname(originalname).toLowerCase();
  const { persistToDisk = !isVercel } = options;
  
  let extractedText = '';

  try {
    console.log(`Processing document: ${originalname} (${(buffer.length / 1024 / 1024).toFixed(2)} MB, type: ${mimetype || fileExtension})`);
    
    // Determine file type and extract text accordingly
    if (mimetype === 'application/pdf' || fileExtension === '.pdf') {
      console.log('Extracting text from PDF...');
      extractedText = await extractTextFromPDF(buffer);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileExtension === '.docx'
    ) {
      console.log('Extracting text from DOCX...');
      extractedText = await extractTextFromDOCX(buffer);
    } else if (
      mimetype === 'application/msword' ||
      fileExtension === '.doc'
    ) {
      // For .doc files, we'd need a different library, but for now return error
      throw new Error('DOC files are not supported. Please convert to DOCX or PDF.');
    } else if (
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(mimetype) ||
      ['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)
    ) {
      console.log('Extracting text from image using OCR...');
      extractedText = await extractTextFromImage(buffer);
    } else if (mimetype === 'text/plain' || fileExtension === '.txt') {
      console.log('Reading text file...');
      extractedText = await extractTextFromTXT(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimetype || fileExtension}`);
    }

    // Clean up extracted text
    extractedText = extractedText.trim();
    
    console.log(`Text extraction complete. Extracted ${extractedText.length} characters, ${extractedText.split(/\s+/).filter(w => w.length > 0).length} words.`);

    if (!extractedText) {
      throw new Error('No text could be extracted from the document');
    }

    // Create JSON structure
    const fileName = path.parse(originalname).name;
    const jsonData = {
      filename: originalname,
      processedAt: new Date().toISOString(),
      text: extractedText,
      metadata: {
        originalName: originalname,
        fileType: mimetype || fileExtension,
        textLength: extractedText.length,
        wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length
      }
    };

    const jsonFileName = `${fileName}.json`;
    let jsonFilePath = null;

    if (persistToDisk) {
      console.log(`Saving processed document as JSON: ${jsonFileName}`);
      await ensureProcessedDir();
      jsonFilePath = path.join(PROCESSED_DIR, jsonFileName);
      await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } else {
      console.log(`Skipping processed document disk write for ${jsonFileName} in serverless mode`);
    }

    return {
      success: true,
      filename: originalname,
      jsonFileName,
      jsonFilePath,
      textLength: extractedText.length,
      wordCount: jsonData.metadata.wordCount,
      document: jsonData
    };

  } catch (error) {
    return {
      success: false,
      filename: originalname,
      error: error.message
    };
  }
}

/**
 * Process multiple documents
 */
export async function processDocuments(files, options = {}) {
  const results = [];
  
  for (const file of files) {
    const result = await processDocument(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Load processed JSON files into RAG system
 */
export async function loadProcessedDocuments() {
  try {
    await ensureProcessedDir();
    const files = await fs.readdir(PROCESSED_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const documents = [];
    for (const jsonFile of jsonFiles) {
      const filePath = path.join(PROCESSED_DIR, jsonFile);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      documents.push(data);
    }

    return documents;
  } catch (error) {
    throw new Error(`Failed to load processed documents: ${error.message}`);
  }
}

/**
 * Get list of processed documents
 */
export async function getProcessedDocumentsList() {
  try {
    await ensureProcessedDir();
    const files = await fs.readdir(PROCESSED_DIR);
    return files.filter(f => f.endsWith('.json')).map(f => ({
      filename: f,
      path: path.join(PROCESSED_DIR, f)
    }));
  } catch (error) {
    return [];
  }
}
