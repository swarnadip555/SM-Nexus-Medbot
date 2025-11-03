const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a helpful medical assistant chatbot. You provide general health information, answer medical questions, and offer health advice. 

Important guidelines:
- Provide accurate, helpful medical information
- Always remind users that you're not a replacement for professional medical advice
- For serious symptoms, recommend consulting a healthcare professional
- Be empathetic and supportive
- Keep responses clear and concise
- If unsure, acknowledge limitations

Remember: You provide information only, not diagnoses or treatment plans.`;

const chatSessions = new Map();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured' 
      });
    }

    console.log('📩 Message:', message);

    let chatHistory = chatSessions.get(sessionId) || [];
    
    // ✅ USE GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });

    const conversationContext = chatHistory.length > 0 
      ? chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\n'
      : '';

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${conversationContext}User: ${message}\nAssistant:`;

    console.log('🤖 Calling Gemini 2.5 Flash...');
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const botReply = response.text();

    console.log('✅ Got response from Gemini');

    chatHistory.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: botReply, timestamp: new Date().toISOString() }
    );

    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    chatSessions.set(sessionId, chatHistory);

    res.json({
      reply: botReply,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
});

app.post('/api/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
  }
  res.json({ success: true, message: 'Chat history cleared' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('✅ Server running on http://localhost:' + PORT);
  console.log('✅ Health check: http://localhost:' + PORT + '/health');
  console.log('✅ Frontend: ' + path.join(__dirname, '../frontend'));
  console.log('✅ API Key: Configured');
  console.log('✅ Model: Gemini 2.5 Flash');
  console.log('========================================');
});