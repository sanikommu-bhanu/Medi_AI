const fetch = require('node-fetch');

class AIService {
  constructor() {
    this.providers = ['gemini', 'openrouter', 'huggingface', 'fallback'];
    this.currentProvider = null;
  }

  async chat(messages, systemPrompt = '', userContext = {}) {
    const formattedMessages = this.formatMessages(messages, systemPrompt, userContext);
    let lastError = null;

    for (const provider of this.providers) {
      try {
        const response = await this.callProvider(provider, formattedMessages, systemPrompt);
        if (response) {
          this.currentProvider = provider;
          return { text: response, provider };
        }
      } catch (err) {
        console.warn(`Provider ${provider} failed:`, err.message);
        lastError = err.message;
        continue;
      }
    }
    
    if (lastError && !lastError.includes('No ') && !lastError.includes('API key')) {
      return {
        text: `I'm sorry, my AI provider is currently experiencing issues. Error: ${lastError}`,
        provider: 'fallback'
      };
    }

    return {
      text: this.getFallbackResponse(messages),
      provider: 'fallback'
    };
  }

  formatMessages(messages, systemPrompt, userContext) {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  }

  async callProvider(provider, messages, systemPrompt) {
    switch (provider) {
      case 'gemini':
        return await this.callGemini(messages, systemPrompt);
      case 'openrouter':
        return await this.callOpenRouter(messages, systemPrompt);
      case 'huggingface':
        return await this.callHuggingFace(messages, systemPrompt);
      case 'fallback':
        return null;
      default:
        return null;
    }
  }

  async callGemini(messages, systemPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('No Gemini API key');

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
    }
    contents.push(...messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  async callOpenRouter(messages, systemPrompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OpenRouter API key');

    const formattedMessages = [];
    if (systemPrompt) formattedMessages.push({ role: 'system', content: systemPrompt });
    
    for (const m of messages) {
      formattedMessages.push({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.parts?.[0]?.text || m.content
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'CareBot Health AI'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: formattedMessages,
        max_tokens: 1024
      })
    });

    if (!response.ok) throw new Error('OpenRouter API error');
    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  }

  async callHuggingFace(messages, systemPrompt) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('No HuggingFace API key');

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.parts?.[0]?.text || '';

    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) throw new Error('HuggingFace API error');
    const data = await response.json();
    return Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  }

  getFallbackResponse(messages) {
    const lastMsg = messages[messages.length - 1];
    const content = (lastMsg?.content || '').toLowerCase();
    
    const responses = {
      symptom: "I understand you're experiencing some symptoms. Based on what you've described, I recommend monitoring these symptoms closely. If they persist for more than 48 hours or worsen, please consult with your healthcare provider immediately. In the meantime, ensure you're staying hydrated and getting adequate rest. Would you like me to schedule an appointment with your doctor?",
      appointment: "I can help you schedule an appointment. Based on your health profile, I'd recommend seeing a specialist. Would you prefer an in-person visit or a telehealth consultation? I can check availability for the next available slots.",
      medication: "Medication management is crucial for your health. Remember to take your medications at the prescribed times and never skip doses without consulting your doctor. I can set up reminders for you. Would you like me to add a medication reminder?",
      report: "I've analyzed your medical report. The key findings show important health metrics that we should discuss with your healthcare provider. I'll summarize the critical points and flag any values outside normal ranges.",
      default: "I'm CareBot, your AI health assistant. I'm here to help you manage your health journey. I can help with symptom analysis, appointment scheduling, medication reminders, and interpreting your health reports. To connect me with a live AI model, please add your free API key (Gemini, OpenRouter, or HuggingFace) to the .env file. How can I assist you today?"
    };

    for (const [key, response] of Object.entries(responses)) {
      if (content.includes(key)) return response;
    }
    return responses.default;
  }

  buildHealthSystemPrompt(userProfile, aiMemory) {
    const profile = userProfile || {};
    const memory = aiMemory || [];
    
    let prompt = `You are CareBot, an advanced AI health assistant. You are empathetic, knowledgeable, and proactive.

Your capabilities:
- Analyze health symptoms and provide preliminary assessments
- Help schedule and manage medical appointments
- Track and remind about medications
- Interpret medical reports and lab results
- Provide personalized health insights and recommendations
- Remember context from previous conversations

User Profile:
- Name: ${profile.full_name || 'User'}
- Age: ${profile.date_of_birth ? this.calculateAge(profile.date_of_birth) : 'Unknown'}
- Blood Type: ${profile.blood_type || 'Unknown'}
- Allergies: ${profile.allergies || 'None reported'}
- Chronic Conditions: ${profile.chronic_conditions || 'None reported'}

${memory.length > 0 ? `Previous context from memory:\n${memory.map(m => `- ${m.key}: ${m.value}`).join('\n')}` : ''}

Guidelines:
1. Always recommend consulting healthcare professionals for serious symptoms
2. Ask clarifying questions to better understand the user's situation
3. Be empathetic and supportive
4. Provide actionable advice
5. Remember and reference previous conversation context
6. If symptoms seem severe or life-threatening, immediately recommend emergency services
7. **SYMPTOM CHECKER FLOW**: If the user reports feeling unwell or having symptoms, you MUST follow this structured 4-step flow one question at a time:
   - Step 1: Ask "What specific symptoms are you experiencing?"
   - Step 2: Ask "How long have you been experiencing these symptoms?"
   - Step 3: Ask "On a scale of 1-10, how severe is the discomfort?"
   - Step 4: Ask "Do you have any other conditions or are you taking any new medications?"
   - Final Step: Provide a preliminary assessment and a clear recommendation (e.g., rest, see a doctor, or emergency).
   DO NOT ask all questions at once. Ask one, wait for the response, then ask the next.
8. If the user simply says "hi", "hello", or offers a casual greeting, respond back with a friendly, natural greeting and ask how you can assist them today.

IMPORTANT: You are not a replacement for professional medical care. Always emphasize the importance of consulting real healthcare providers.`;

    return prompt;
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async analyzeReport(reportText, reportType) {
    const systemPrompt = `You are a medical AI assistant specialized in analyzing medical reports. 
    Provide a structured analysis including:
    1. Summary of findings
    2. Key values and whether they're within normal range
    3. Potential concerns or areas to monitor
    4. Recommendations
    5. Questions to ask the doctor
    
    Be thorough but clear. Format your response as JSON with keys: summary, keyFindings (array), concerns (array), recommendations (array), doctorQuestions (array).`;

    const messages = [{
      role: 'user',
      content: `Please analyze this ${reportType || 'medical'} report:\n\n${reportText}`
    }];

    const result = await this.chat(messages, systemPrompt);
    
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
    
    return {
      summary: result.text,
      keyFindings: ['Analysis complete - see full report'],
      concerns: [],
      recommendations: ['Please review with your healthcare provider'],
      doctorQuestions: ['Discuss these findings at your next appointment']
    };
  }
}

module.exports = new AIService();
