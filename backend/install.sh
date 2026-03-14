#!/bin/bash
# Installation script for CivixAI Backend

echo "🚀 CivixAI Backend Installation"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Navigate to backend folder
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "⚙️  Next steps:"
echo "1. Create a .env file in the backend folder"
echo "2. Copy credentials from Firebase service account"
echo "3. Run: npm start"
echo ""
echo "📖 See backend/SETUP_GUIDE.md for detailed instructions"
