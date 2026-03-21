import fs from 'fs/promises';
import path from 'path';

const CHUNK_FILE_PATTERN = /_chunks\.(jsonl|json)$/i;

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

const parseConfiguredPaths = (configuredValue, dataDir) => configuredValue
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => (path.isAbsolute(entry) ? entry : path.join(dataDir, entry)));

const loadChunkFile = async (filePath) => {
  const rawText = await fs.readFile(filePath, 'utf-8');
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.jsonl') {
    return parseJsonl(rawText);
  }

  if (extension === '.json') {
    return JSON.parse(rawText);
  }

  throw new Error(`Unsupported chunk file format: ${extension || 'unknown'}`);
};

export const resolveKnowledgeChunkPaths = async (baseDir) => {
  const dataDir = path.join(baseDir, '../data');
  const configuredFiles = process.env.KNOWLEDGE_CHUNKS_FILE;

  if (configuredFiles) {
    return parseConfiguredPaths(configuredFiles, dataDir);
  }

  const directoryEntries = await fs.readdir(dataDir);

  return directoryEntries
    .filter((entry) => CHUNK_FILE_PATTERN.test(entry))
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => path.join(dataDir, entry));
};

export const loadKnowledgeChunks = async (baseDir) => {
  const chunkPaths = await resolveKnowledgeChunkPaths(baseDir);

  if (chunkPaths.length === 0) {
    throw new Error('No knowledge chunk files were found in src/data');
  }

  const normalizedChunks = [];
  let globalIndex = 0;

  for (const chunkPath of chunkPaths) {
    const parsedChunks = await loadChunkFile(chunkPath);

    if (!Array.isArray(parsedChunks)) {
      throw new Error(`Knowledge chunk file must contain an array or JSONL records: ${path.basename(chunkPath)}`);
    }

    const fileChunks = parsedChunks
      .map((chunk) => {
        const normalizedChunk = normalizeChunk(chunk, globalIndex, chunkPath);
        globalIndex += 1;
        return normalizedChunk;
      })
      .filter((chunk) => typeof chunk.text === 'string' && chunk.text.trim().length > 0);

    normalizedChunks.push(...fileChunks);
  }

  return {
    chunkPaths,
    chunks: normalizedChunks
  };
};
