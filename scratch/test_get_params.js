require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const axios = require('axios');

async function testParam(key) {
  const apiURL = process.env.WHATSAPP_API_URL || 'https://whatsapp-backend.alponix.com/api/v1/api-management';
  const apiKey = process.env.WHATSAPP_API_KEY || 'NUqL4rl3Bs5OXiKRkR5jnpKg0CuLesakoe2UDDVUzai1abNPaHPHfpusiLpcrDQ0';
  
  console.log(`--- Testing key: "${key}" ---`);
  try {
    const res = await axios.get(`${apiURL}/message-template-preview`, {
      params: { [key]: 'order_confirmation12' },
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Key "${key}" Success:`, res.status, JSON.stringify(res.data, null, 2));
    return true;
  } catch (err) {
    console.log(`Key "${key}" Failed:`, err.response?.status, err.response?.data || err.message);
    return false;
  }
}

async function run() {
  const keys = ['template_name', 'template', 'name', 'templateName', 'template_identifier'];
  for (const k of keys) {
    const success = await testParam(k);
    if (success) break;
  }
}

run();
