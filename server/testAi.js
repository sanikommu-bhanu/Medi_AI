const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const contents = [{ role: 'user', parts: [{ text: 'i have headache' }] }];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
      })
    }
  );
  
  if (!response.ok) {
    const err = await response.json();
    console.error(err);
  } else {
    const data = await response.json();
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
  }
}
test();
