import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CHUNKS_FILENAME = 'ird_sri_lanka_tax_chart_2025_2026_chunks.jsonl';

const extractAssessmentYear = (value = '') => {
  const match = String(value).match(/\b(20\d{2}[/-]20\d{2}|20\d{2}[/-]\d{2})\b/);
  return match ? match[1] : null;
};

const normalizeChunk = (chunk, index, sourcePath) => {
  const title = chunk.title || chunk.document_title || 'IRD Sri Lanka Tax Chart 2025/2026';
  const sectionParts = [chunk.section, chunk.subsection].filter(Boolean);
  const year =
    chunk.year ||
    extractAssessmentYear(chunk.document_title) ||
    extractAssessmentYear(chunk.text) ||
    chunk.source_last_updated ||
    null;

  return {
    id: chunk.id || chunk.chunk_id || `chunk_${index + 1}`,
    chunk_id: chunk.chunk_id || chunk.id || `chunk_${index + 1}`,
    title,
    section: sectionParts.join(' - ') || null,
    year,
    source: chunk.source || chunk.source_url || path.basename(sourcePath),
    source_url: chunk.source_url || null,
    source_last_updated: chunk.source_last_updated || null,
    document_id: chunk.document_id || null,
    jurisdiction: chunk.jurisdiction || null,
    currency: chunk.currency || null,
    text: chunk.text
  };
};

const parseJsonl = (rawText) => rawText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
    }
  });

export const resolveKnowledgeChunksPath = (baseDir) => {
  const configuredFile = process.env.KNOWLEDGE_CHUNKS_FILE || DEFAULT_CHUNKS_FILENAME;
  return path.isAbsolute(configuredFile)
    ? configuredFile
    : path.join(baseDir, '../data', configuredFile);
};

export const loadKnowledgeChunks = async (baseDir) => {
  const chunksPath = resolveKnowledgeChunksPath(baseDir);
  const rawText = await fs.readFile(chunksPath, 'utf-8');
  const extension = path.extname(chunksPath).toLowerCase();

  let parsedChunks;
  if (extension === '.jsonl') {
    parsedChunks = parseJsonl(rawText);
  } else if (extension === '.json') {
    parsedChunks = JSON.parse(rawText);
  } else {
    throw new Error(`Unsupported chunk file format: ${extension || 'unknown'}`);
  }

  if (!Array.isArray(parsedChunks)) {
    throw new Error('Knowledge chunk file must contain an array or JSONL records');
  }

  const normalizedChunks = parsedChunks
    .map((chunk, index) => normalizeChunk(chunk, index, chunksPath))
    .filter((chunk) => typeof chunk.text === 'string' && chunk.text.trim().length > 0);

  return {
    chunksPath,
    chunks: normalizedChunks
  };
};
