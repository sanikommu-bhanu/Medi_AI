require('dotenv').config({ path: '.env' });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing with key starting with:', apiKey ? apiKey.substring(0, 5) : 'undefined');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const err = await res.json();
      console.error('API Error:', err);
      return;
    }
    const data = await res.json();
    console.log('Available models:');
    data.models.forEach(m => console.log(m.name, '-', m.supportedGenerationMethods.join(', ')));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkModels();
