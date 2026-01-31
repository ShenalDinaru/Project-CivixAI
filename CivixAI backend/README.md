# CivixAI Backend - Personal AI Tax Assistant

A Node.js backend API for an intelligent tax assistant chatbot powered by OpenRouter API.

## Features

- Express.js REST API
- OpenRouter API integration with tax-specific system instructions
- Conversation history support for contextual discussions
- Error handling middleware
- CORS enabled for frontend integration
- Environment-based configuration
- Specialized tax guidance and information

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
OPENROUTER_API_KEY=your_actual_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

## Running the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

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
