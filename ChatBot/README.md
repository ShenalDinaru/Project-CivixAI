# CivixAI - Personal AI Tax Assistant with RAG

A Node.js backend API for an intelligent Sri Lankan tax assistant chatbot powered by OpenRouter API with **Retrieval-Augmented Generation (RAG)** for accurate, hallucination-free responses.

## 🚀 What's New: RAG System (Path A)

This system uses **RAG (Retrieval-Augmented Generation)** - the industry-standard way to build domain-specific AI without training the model:

- ✅ **No Model Training** - Keep AI frozen, inject knowledge at runtime
- ✅ **No Hallucinations** - AI only uses provided sources
- ✅ **Always Current** - Update knowledge by adding chunks
- ✅ **Source Citations** - Every answer cites where it came from
- ✅ **Sri Lankan Tax Specific** - Trained on IRD guides, Acts, circulars

### How It Works

```
User Question
    ↓
Embed Question (semantic search)
    ↓
Find Relevant Tax Chunks (top 5)
    ↓
Build Strict Prompt ("Use ONLY these sources")
    ↓
Call OpenRouter (Claude/GPT)
    ↓
Return Answer + Citations
```

## Features

- **RAG System** - Retrieval-Augmented Generation for accurate answers
- **Vector Search** - Semantic similarity search through tax knowledge
- **Source Citations** - Every answer references specific tax documents
- **Smart Fallback** - Uses RAG for tax questions, regular chat for general queries
- Express.js REST API
- OpenRouter API integration
- Conversation history support for contextual discussions
- Error handling middleware
- CORS enabled for frontend integration
- Environment-based configuration
- Specialized Sri Lankan tax guidance

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenRouter API key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your OpenRouter API key to the `.env` file:
```
PORT=3000
OPESetup RAG Knowledge Base

### Step 1: Add Your Tax Knowledge

Edit `src/data/tax-chunks.json` with Sri Lankan tax information:

```json
[
  {
    "id": "apit_001",
    "title": "APIT Rates 2024/25",
    "section": "IRD Guide - Page 12",
    "year": "2024/25",
    "source": "Inland Revenue Department",
    "text": "APIT for resident employees is charged at progressive rates..."
  }
]
```

**See [CHUNKING_GUIDE.md](CHUNKING_GUIDE.md) for detailed instructions on creating chunks.**

### Step 2: Generate Embeddings

Run the setup script to process your tax knowledge:

```bash
npm run setup-knowledge
```

This will:
- Load chunks from JSON
- Generate embeddings (semantic fingerprints)
- Store in vector database
- Take 1-5 minutes depending on chunk count

### Step 3: Verify Setup

```bash
npm start
```
Check RAG Status
```
GET /api/chat/status
```

**Response:**
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

### 
You should see:
```
✓ RAG system ready
✓ RAG initialized with 5 knowledge chunks
```

If you see "⚠️ RAG system not available", run the setup script first.
According to Source 1, APIT rates for resident individuals in 2024/25 are: First Rs. 1,200,000 annually - 0%, Next Rs. 1,200,000 - 6%, Next Rs. 1,200,000 - 12%, Next Rs. 1,200,000 - 18%, Exceeding Rs. 4,800,000 - 24%",
  "model": "openai/gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 450,
    "completion_tokens": 85,
    "total_tokens": 535
  },
  "rag": {
    "used": true,
    "chunks": 3,
    "sources": [
      {
        "title": "APIT Tax Rates 2024/25",
       /
├── public/               # Frontend UI
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── src/
│   ├── server.js        # Main server with RAG initialization
│   ├── config/
│   ├── controllers/
│   │   └── chatController.js  # Updated with RAG
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── chatRoutes.js      # Added /status endpoint
│   ├── services/
│   │   ├── ragService.js      # RAG orchestration
│   │   └── openRouterService.js
│   ├── rag/                   # ← NEW: RAG system
│   │   ├── embed.js
│   │   ├── vectorStore.js
│   │   ├── retrieve.js
│   │   └── prompt.js
│   ├── data/                  # ← NEW: Knowledge base
│   │   ├── tax-chunks.json    # Add your chunks here
│   │   └── vector-store.json  # Auto-generated
│   └── scripts/               # ← NEW: Setup scripts
│       └── setupKnowledge.js
├── .env
├── package.json
├── README.md
├── RAG_GUIDE.md              # ← NEW: RAG explanation
└── CHUNKING_GUIDE.md         # ← NEW: How to create chunks
**NOT training the model. Instead:**
1. Store tax knowledge as "chunks" with embeddings
2. When user asks, find relevant chunks
3. Give AI the chunks and say "use ONLY these"
4. AI reads and answers from sources only

**Benefits:**
- No hallucinations
- Always citable
- Easy to update
- Cost-effective

### Project Structure

```
src/
├── rag/
│   ├── embed.js          # Generate embeddings
│   ├── vectorStore.js    # Vector database (in-memory)
│   ├── retrieve.js       # Search for relevant chunks
│   └── prompt.js         # Build RAG prompts
├── services/
│   ├── ragService.js     # RAG orchestration
│   └── openRouterService.js
├── data/
│   ├── tax-chunks.json   # YOUR KNOWLEDGE BASE ← Add chunks here
│   └── vector-store.json # Auto-generated embeddings
└── scripts/
    └── setupKnowledge.js # Setup script
```

### Adding More Knowledge

1. Add chunks to `src/data/tax-chunks.json`
2. Run `npm run setup-knowledge`
3. Restart server

That's it! New knowledge is immediately available.

### Monitoring RAG

Watch the console when users ask questions:

```
=== RAG Pipeline ===
User question: What are the APIT rates?...
Embedding user query...
Searching for relevant tax knowledge...
Found 3 relevant chunks (scores: 0.891, 0.847, 0.723)
```

## Documentation

- **[RAG_GUIDE.md](RAG_GUIDE.md)** - Complete RAG system explanation
- **[CHUNKING_GUIDE.md](CHUNKING_GUIDE.md)** - How to create tax knowledge chunks

## Troubleshooting

**"Vector store is empty"**
```bash
npm run setup-knowledge
```

**"No relevant information found"**
- Add more chunks covering that topic
- Check if question includes tax keywords (tax, APIT, VAT, etc.)

**"Embedding error"**
- Verify OPENROUTER_API_KEY in .env
- Check internet connection
- Ensure API quota available

## Cost Estimate

- **Embeddings:** ~$0.0001 per chunk (one-time)
- **Queries:** ~$0.001 per question

**Example:** 1000 chunks + 1000 questions ≈ $1.10

Very cost-effective compared to fine-tuning!

## Upgrading to Production

Current setup uses in-memory vector store. For production:

### Option 1: Pinecone (Recommended)
```bash
npm install @pinecone-database/pinecone
```
- Cloud-based
- Fast
- Free tier available

### Option 2: PostgreSQL + pgvector
- Self-hosted
- Part of existing database
- Good for large datasets

## Project Structure (Complete)

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Frontend UI

The project includes a beautiful, responsive web interface. Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

The UI features:
- Modern, responsive chat interface
- Real-time conversation with the AI tax assistant
- Conversation history tracking
- Typing indicators
- Mobile-friendly design

## API Endpoints

### Health Check
```
GET /
```

### Send Chat Message
```
POST /api/chat/message
```

**Request Body:**
```json
{
  "message": "What tax deductions can I claim for home office expenses?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Can you help me with my taxes?"
    },
    {
      "role": "assistant",
      "content": "Of course! I'm CivixAI, your personal tax assistant. I can help you understand tax deductions, credits, filing requirements, and more. What specific tax questions do you have?"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "For home office expenses, you may be able to claim deductions if you use part of your home exclusively and regularly for business. This can include a portion of your rent/mortgage, utilities, insurance, and repairs. There are two methods: the simplified method ($5 per square foot, up to 300 sq ft) or the regular method (calculating actual expenses). However, the rules vary based on whether you're self-employed or an employee. I recommend consulting with a tax professional to ensure you're claiming deductions correctly for your specific situation.",
  "model": "openai/gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Project Structure

```
CivixAI backend/
├── src/
│   ├── controllers/
│   │   └── chatController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── chatRoutes.js
│   ├── services/
│   │   └── openRouterService.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## Available Models

You can use any model supported by OpenRouter. Some popular options:
- `openai/gpt-3.5-turbo`
- `openai/gpt-4`
- `anthropic/claude-2`
- `meta-llama/llama-2-70b-chat`

Change the model in your `.env` file.

## License

ISC
