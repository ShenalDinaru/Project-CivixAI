# RAG System Setup Guide

## What You Just Built: Path A (RAG System)

You now have a complete **Retrieval-Augmented Generation (RAG)** system for Sri Lankan tax knowledge. This is the industry-standard approach for domain-specific AI without training the model.

## Architecture

```
User Question
    ↓
[1] Embed Question → Vector (semantic fingerprint)
    ↓
[2] Search Vector DB → Find top 5 relevant chunks
    ↓
[3] Build Strict Prompt → "Use ONLY these sources"
    ↓
[4] Call OpenRouter (Claude/GPT) → Generate answer
    ↓
[5] Return Response → With citations & sources
```

## What's Included

### Core RAG Modules (`src/rag/`)

- **embed.js** - Converts text to embeddings (semantic fingerprints)
- **vectorStore.js** - In-memory vector database with similarity search
- **retrieve.js** - Retrieves relevant chunks for a question
- **prompt.js** - Builds strict prompts that prevent hallucination

### Services

- **ragService.js** - Orchestrates the entire RAG pipeline
- **openRouterService.js** - Updated to work with RAG context

### Data

- **tax-chunks.json** - Your knowledge base (5 example chunks included)
- **vector-store.json** - Auto-generated after setup (stores embeddings)

### Scripts

- **setupKnowledge.js** - Generates embeddings and populates vector DB

## How to Use

### Step 1: Add Your Tax Knowledge

Edit `src/data/tax-chunks.json` and add your Sri Lankan tax documents:

```json
[
  {
    "id": "unique_id",
    "title": "Tax Topic Name",
    "section": "IRD Guide - Page X",
    "year": "2024/25",
    "source": "IRD Website / Inland Revenue Act",
    "text": "The actual tax information goes here. Keep it 300-700 tokens (roughly 1-3 paragraphs). One concept per chunk."
  }
]
```

**Chunking Best Practices:**
- **Size:** 300-700 tokens per chunk (roughly 200-500 words)
- **Focus:** One concept or topic per chunk
- **Context:** Include enough context so the chunk is understandable standalone
- **Source:** Always include title, section, year, and source

### Step 2: Generate Embeddings

Run the setup script to process your chunks:

```bash
node src/scripts/setupKnowledge.js
```

This will:
1. Load your chunks from JSON
2. Generate embeddings for each chunk (using OpenAI's model)
3. Store them in the vector database
4. Create `src/data/vector-store.json`

**Note:** This can take a few minutes depending on how many chunks you have.

### Step 3: Start the Server

```bash
npm start
```

The server will:
- Load the vector database on startup
- Show "✓ RAG system ready" if successful
- Fall back to regular chat if no knowledge base exists

### Step 4: Test It

Open http://localhost:3000 and ask tax questions:

**Good questions to try:**
- "What are the APIT tax rates for 2024/25?"
- "What is the VAT registration threshold?"
- "When do I need to file my tax return?"

The AI will:
- Search your knowledge base
- Find relevant chunks
- Answer using ONLY those sources
- Cite which sources it used

## How It Works (Technical)

### When a user asks a question:

1. **Question Detection**
   - System checks if question needs tax knowledge
   - Keywords: tax, APIT, VAT, deduction, etc.

2. **Retrieval** (if needed)
   - Question → Embedding (vector)
   - Search vector DB by cosine similarity
   - Return top 5 most relevant chunks (score > 0.7)

3. **Prompt Building**
   - Create strict system prompt
   - Inject retrieved sources
   - Add critical rules: "Use ONLY these sources"

4. **Generation**
   - Call OpenRouter with low temperature (0.1)
   - AI reads sources, then answers
   - Returns response with citations

5. **Response**
   - Frontend shows answer
   - Backend includes metadata: which chunks used, relevance scores

## Check RAG Status

GET http://localhost:3000/api/chat/status

```json
{
  "success": true,
  "rag": {
    "available": true,
    "totalChunks": 5,
    "avgChunkSize": 342,
    "ready": true
  }
}
```

## Adding More Knowledge

1. Add chunks to `tax-chunks.json`
2. Re-run: `node src/scripts/setupKnowledge.js`
3. Restart server: `npm start`

That's it! The new knowledge is immediately available.

## Monitoring

Watch the console when users ask questions:

```
=== RAG Pipeline ===
User question: What are the APIT rates?...
Embedding user query...
Searching for relevant tax knowledge...
Found 3 relevant chunks (scores: 0.891, 0.847, 0.723)
Retrieved 3 relevant chunks
```

## Why This Prevents Hallucination

1. **Strict Prompt:** "Use ONLY the information in SOURCES"
2. **Source Citations:** Forces AI to cite which source
3. **Low Temperature:** 0.1 = more factual, less creative
4. **Fallback:** If no sources found, AI says "I don't know"
5. **Retrieval First:** AI never tries to answer from memory

## Limitations of Current Setup

This uses an **in-memory vector store**. For production:

### Upgrade to Pinecone (Recommended)

```bash
npm install @pinecone-database/pinecone
```

Benefits:
- Persistent storage
- Faster search
- Cloud-based
- Free tier available

### Or PostgreSQL + pgvector

Benefits:
- Self-hosted
- Part of your existing DB
- Good for large datasets

## File Structure

```
src/
├── rag/
│   ├── embed.js          # Generate embeddings
│   ├── vectorStore.js    # Vector database
│   ├── retrieve.js       # Search for relevant chunks
│   └── prompt.js         # Build RAG prompts
├── services/
│   ├── ragService.js     # Main RAG orchestration
│   └── openRouterService.js  # LLM API calls
├── data/
│   ├── tax-chunks.json   # YOUR KNOWLEDGE BASE
│   └── vector-store.json # Auto-generated embeddings
└── scripts/
    └── setupKnowledge.js # Setup script
```

## Next Steps

1. **Collect Tax Documents**
   - IRD guides (PAYE, APIT, VAT)
   - Inland Revenue Act
   - Circulars and bulletins
   - FAQs from IRD website

2. **Convert to Chunks**
   - Break documents into 300-700 token pieces
   - Each chunk = one concept
   - Add to `tax-chunks.json`

3. **Run Setup**
   - Generate embeddings
   - Test with sample questions

4. **Iterate**
   - Add more chunks as needed
   - Monitor which questions work/don't work
   - Refine chunking strategy

## Troubleshooting

**"Vector store is empty"**
- Run: `node src/scripts/setupKnowledge.js`

**"No relevant information found"**
- Question might be too specific
- Add more chunks covering that topic
- Check if question includes tax keywords

**"Embedding error"**
- Check OPENROUTER_API_KEY in .env
- Ensure you have internet connection
- Check OpenRouter API quota

**"AI ignoring sources"**
- Prompt should force citations
- Lower temperature if needed
- Check retrieved chunks are relevant

## Cost Estimate

**Embeddings:** ~$0.0001 per chunk (one-time)
**Queries:** ~$0.001 per question

**Example:** 1000 chunks + 1000 questions = ~$1.10

Very cost-effective!

## Mental Model

```
LLM = Reasoning Engine (frozen, never changes)
RAG = Knowledge Source (you control this)
Backend = Control Layer (routing, validation)
Frontend = UI (user interaction)
```

You're NOT training the model.
You're giving it a textbook to read before answering.

That's Path A. ✅
