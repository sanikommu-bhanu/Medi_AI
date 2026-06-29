const aiService = require('./services/aiService');
require('dotenv').config({ path: '../.env' });

async function test() {
  try {
    const res = await aiService.chat([{ role: 'user', content: 'i have headache' }]);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
