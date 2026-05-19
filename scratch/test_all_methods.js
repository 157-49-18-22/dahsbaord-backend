require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const axios = require('axios');

async function probe(method) {
  const apiURL = process.env.WHATSAPP_API_URL || 'https://whatsapp-backend.alponix.com/api/v1/api-management';
  const apiKey = process.env.WHATSAPP_API_KEY || 'NUqL4rl3Bs5OXiKRkR5jnpKg0CuLesakoe2UDDVUzai1abNPaHPHfpusiLpcrDQ0';
  
  console.log(`--- Probing ${method} ---`);
  try {
    const res = await axios({
      method: method,
      url: `${apiURL}/message-template-preview`,
      data: method === 'POST' || method === 'PUT' || method === 'PATCH' ? { template_name: 'order_confirmation12' } : undefined,
      params: method === 'GET' ? { template_name: 'order_confirmation12' } : undefined,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`${method} Success Status:`, res.status);
    console.log(`${method} Response:`, JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log(`${method} Failed Status:`, err.response?.status);
    console.log(`${method} Failed Data:`, err.response?.data || err.message);
  }
}

async function run() {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'];
  for (const m of methods) {
    await probe(m);
  }
}

run();
