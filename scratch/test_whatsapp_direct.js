const axios = require('axios');

const API_URL = 'https://whatsapp-backend.alponix.com/api/v1/api-management';
const API_KEY_ENV = 'NUqL4rl3Bs5OXiKRkR5jnpKg0CuLesakoe2UDDVUzai1abNPaHPHfpusiLpcrDQ0';
const API_KEY_DOC = 'ovhRGfBdDwK68NQCBpPYeVu7SWuLLpAM7xobtNfW0qooTypSU4wPagWW1GJRqn9I';

async function testWithKey(keyName, apiKey) {
  console.log(`\n--- Testing with key: ${keyName} ---`);
  
  // 1. Dropdown
  try {
    const response = await axios.get(`${API_URL}/whatsapp-template-dropdown`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`${keyName} Dropdown Success:`, response.data);
  } catch (error) {
    console.error(`${keyName} Dropdown Error:`, error.response ? error.response.data : error.message);
  }

  // 2. Direct message
  try {
    const response = await axios.post(`${API_URL}/whatsapp-message`, {
      send_to: '919625613008',
      message: 'Hello from test script!'
    }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`${keyName} Direct Msg Success:`, response.data);
  } catch (error) {
    console.error(`${keyName} Direct Msg Error:`, error.response ? error.response.data : error.message);
  }
}

async function run() {
  await testWithKey('DOC_KEY', API_KEY_DOC);
  await testWithKey('ENV_KEY', API_KEY_ENV);
}

run();
