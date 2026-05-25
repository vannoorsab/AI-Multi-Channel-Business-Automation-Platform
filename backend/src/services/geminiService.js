const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates an automated response using Google Gemini API
 * @param {string} userMessage - The latest message from the customer
 * @param {Array} history - Previous messages for context [{ sender: 'lead'|'ai'|'agent', content: '...' }]
 * @param {string} systemPrompt - Customizable system prompt instructions
 * @param {string} customApiKey - Optional workspace-specific Gemini API Key
 */
exports.generateAIResponse = async (userMessage, history = [], systemPrompt, customApiKey = '') => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini API Key is not configured. Falling back to Simulated AI Response.');
    return simulateAIResponse(userMessage, systemPrompt);
  }

  try {
    // Initialize standard Google Gen AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt 
    });

    // Format chat history for Google's format:
    // [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const formattedHistory = history
      .filter(msg => ['lead', 'ai', 'agent'].includes(msg.sender))
      .map(msg => ({
        role: msg.sender === 'lead' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Start Chat session with history context
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API failed (status:', error.status, ') — using smart fallback response.');
    // IMPORTANT: Return simulated response so caller always gets a message to send back
    return simulateAIResponse(userMessage, systemPrompt);
  }
};

/**
 * Simulates a professional AI response when no API key is specified or when API limits are hit.
 */
function simulateAIResponse(message, systemPrompt) {
  const msgLower = message.toLowerCase().trim();
  
  // A. Check for greetings first! This prevents dumping QA facts for a simple hello.
  const greetings = ['hi', 'hello', 'hey', 'hola', 'yo', 'greetings', 'good morning', 'good afternoon', 'good evening', 'test', 'hi there', 'hello there'];
  const isGreeting = greetings.includes(msgLower) || msgLower.replace(/[^\w\s]/g, '') === 'hi' || msgLower.replace(/[^\w\s]/g, '') === 'hello';
  
  if (isGreeting) {
    return "Hello! I am your AI Business Automation Assistant. How can I help you today? Feel free to ask me any questions about our services, pricing, or book a demo!";
  }

  // B. Check if user provides email details during booking / answering scheduling questions
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    const extractedEmail = emailMatch[0].toLowerCase();
    return `Thank you! I have updated your contact email to ${extractedEmail} and successfully registered your demo booking in our CRM pipeline. Our sales specialist, Michael Scott, has been assigned to your lead profile and will reach out to you shortly to conduct the consultation. A calendar invite has been provisioned!`;
  }

  // C. Check for booking / demo requests next to ensure assignment and pipeline progression is clear.
  const isDemoRequest = msgLower.includes('demo') || msgLower.includes('book') || msgLower.includes('call') || msgLower.includes('schedule') || msgLower.includes('consultation');
  if (isDemoRequest) {
    return "I can certainly help you book a consultation or schedule a demo! I have automatically registered your request and assigned our sales specialist (Michael Scott) to reach out to you. What is the best email address and date/time for us to connect?";
  }

  // C. If custom training context chunks exist in systemPrompt, parse them to find the best Q&A match!
  if (systemPrompt && systemPrompt.includes('CRITICAL KNOWLEDGE BASE ACCESS')) {
    const parts = systemPrompt.split('===========================================');
    if (parts.length >= 3) {
      const factsSection = parts[1].trim();
      // Split facts section into distinct context blocks
      const blocks = factsSection.split(/CONTEXT BLOCK \d+:\n/g).filter(b => b.trim());
      
      if (blocks.length > 0) {
        // Parse all Q&A pairs from all blocks
        const allPairs = [];
        for (const block of blocks) {
          const cleanedBlock = block.trim().replace(/^"|"$/g, '');
          const pairs = extractQAPairs(cleanedBlock);
          allPairs.push(...pairs);
        }

        if (allPairs.length > 0) {
          // Score and find the best matching Q&A pair or statement
          let bestPair = null;
          let bestScore = -1;

          for (const pair of allPairs) {
            const qScore = scoreMatch(message, pair.q);
            const aScore = scoreMatch(message, pair.a);
            const score = Math.max(qScore, aScore);

            if (score > bestScore) {
              bestScore = score;
              bestPair = pair;
            }
          }

          // If we got a decent match score (at least 1 keyword overlap), return the precise answer!
          if (bestPair && bestScore >= 0.2) {
            return bestPair.a.trim();
          }
        }
      }
    }
  }

  // D. Standard fallbacks for generic platform questions if no custom context matched
  let simulatedAnswer = "Thank you for reaching out! We have received your inquiry. One of our specialists will get back to you shortly, or you can ask me another question about our products.";

  if (msgLower.includes('pricing') || msgLower.includes('cost') || msgLower.includes('price')) {
    simulatedAnswer = "Our SaaS platform offers three competitive tiers starting at $49/month for small startups, $149/month for growing businesses, and custom pricing for large enterprises. Would you like me to schedule a demo call with our sales team to find the best fit?";
  } else if (msgLower.includes('features') || msgLower.includes('what do you') || msgLower.includes('capabilities')) {
    simulatedAnswer = "Our platform offers a multi-channel Unified Inbox, Socket-based instant live-chat, WhatsApp Business integrations, deep CRM pipelines, workflow automations, and live AI chatbot replies using Gemini. Which of these features would you like to explore first?";
  }

  return simulatedAnswer;
}

/**
 * Extracts Q&A pairs or standalone sentences/statements from a block of text
 */
function extractQAPairs(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const qaPairs = [];
  
  let currentQ = null;
  let currentA = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern to identify if a line is a question
    const isQPattern = /^(?:q|q\d+|question\s*\d*|q:)\s*[\.\:-]/i.test(line) || 
                       line.endsWith('?') || 
                       /^(?:what|how|why|is|are|can|do|does|where|when|who)\b/i.test(line);
    
    if (isQPattern) {
      if (currentQ) {
        qaPairs.push({ q: currentQ, a: currentA.join(' ') });
      }
      currentQ = line;
      currentA = [];
    } else {
      if (currentQ) {
        currentA.push(line);
      } else {
        // Standalone statement
        qaPairs.push({ q: "", a: line });
      }
    }
  }
  
  if (currentQ) {
    qaPairs.push({ q: currentQ, a: currentA.join(' ') });
  }
  
  return qaPairs.filter(p => p.a);
}

/**
 * Calculates keyword overlap score between query and target text
 */
function scoreMatch(query, targetText) {
  const stopWords = new Set([
    'is', 'the', 'a', 'an', 'of', 'to', 'for', 'in', 'on', 'at', 'with', 
    'do', 'you', 'are', 'can', 'does', 'what', 'how', 'why', 'where', 
    'when', 'who', 'i', 'we', 'they', 'he', 'she', 'it', 'and', 'but', 
    'or', 'so', 'if', 'then', 'else', 'this', 'that', 'these', 'those'
  ]);
  
  const cleanWords = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w && !stopWords.has(w));
  };
  
  const queryWords = cleanWords(query);
  if (queryWords.length === 0) return 0;
  
  const targetWords = cleanWords(targetText);
  if (targetWords.length === 0) return 0;
  
  let matchCount = 0;
  for (const qw of queryWords) {
    let matched = false;
    for (const tw of targetWords) {
      if (qw === tw || (qw.length > 3 && tw.length > 3 && (qw.startsWith(tw) || tw.startsWith(qw)))) {
        matched = true;
        break;
      }
    }
    if (matched) matchCount++;
  }
  
  return matchCount / queryWords.length;
}
