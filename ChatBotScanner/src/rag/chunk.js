/**
 * Text chunking utility for RAG system
 * Splits long documents into smaller, overlapping chunks for better retrieval
 */

/**
 * Chunk text into smaller pieces with overlap
 * 
 * @param {string} text - The text to chunk
 * @param {Object} options - Chunking options
 * @param {number} options.maxChunkSize - Maximum characters per chunk (default: 500)
 * @param {number} options.overlap - Number of characters to overlap between chunks (default: 50)
 * @returns {Array<string>} Array of text chunks
 */
export function chunkText(text, options = {}) {
  const {
    maxChunkSize = 500,
    overlap = 50
  } = options;

  if (!text || text.length === 0) {
    return [];
  }

  // If text is smaller than maxChunkSize, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    // If not the last chunk, try to break at a sentence boundary
    if (end < text.length) {
      // Look for sentence endings (., !, ?) near the end
      const sentenceEnd = Math.max(
        text.lastIndexOf('.', end),
        text.lastIndexOf('!', end),
        text.lastIndexOf('?', end),
        text.lastIndexOf('\n', end)
      );

      // If we found a sentence boundary within the last 20% of the chunk, use it
      if (sentenceEnd > start + maxChunkSize * 0.8) {
        end = sentenceEnd + 1;
      } else {
        // Otherwise, try to break at a word boundary
        const wordBoundary = text.lastIndexOf(' ', end);
        if (wordBoundary > start + maxChunkSize * 0.5) {
          end = wordBoundary;
        }
      }
    }

    // Extract chunk
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start position with overlap
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Chunk text by paragraphs
 * 
 * @param {string} text - The text to chunk
 * @param {number} maxChunksPerParagraph - Maximum chunks per paragraph (default: 3)
 * @returns {Array<string>} Array of text chunks
 */
export function chunkByParagraphs(text, maxChunksPerParagraph = 3) {
  if (!text || text.length === 0) {
    return [];
  }

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= 500) {
      chunks.push(paragraph.trim());
    } else {
      // Split long paragraphs
      const paragraphChunks = chunkText(paragraph, { maxChunkSize: 500, overlap: 50 });
      chunks.push(...paragraphChunks);
    }
  }

  return chunks;
}
