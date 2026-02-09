require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Enhanced CORS configuration - allows ANY website to use the bot
const corsOptions = {
  origin: '*',  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve embed script with proper headers
app.get('/embed.js', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'embed.js'));
});

// API route using OpenRouter (free tier)
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  try {
    // Build messages array with system prompt
    const chatMessages = [
      {
        role: 'system',
        content: 'You are a helpful, friendly AI assistant for a website. You help users navigate and answer questions about the site. Be concise, professional, and warm. Keep responses to 1-2 sentences when possible.'
      },
      ...messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Delegate AI Assistant'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: chatMessages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return res.status(response.status).json({ error: 'Failed to get response' });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    res.json({
      content: data.choices[0].message.content,
      usage: data.usage || {}
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Delegate AI Assistant running at http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) {
    console.log('⚠️  Warning: OPENROUTER_API_KEY not set in .env file');
    console.log('📍 Get your free API key at: https://openrouter.ai/keys');
  }
});
