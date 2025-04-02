require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    // Using Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",  // Updated model name
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: question }]
      }]
    });

    const response = await result.response;
    res.json({ answer: response.text() });

  } catch (error) {
    console.error('Gemini Error:', error);
    
    let errorMessage = 'Failed to process question';
    if (error.status === 404) {
      errorMessage = 'Model not found. Ensure you have access to gemini-2.0-flash';
    } else if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key - check your .env file';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));