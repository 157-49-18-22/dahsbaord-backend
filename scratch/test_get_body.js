require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const axios = require('axios');

async function test() {
  const apiURL = process.env.WHATSAPP_API_URL || 'https://whatsapp-backend.alponix.com/api/v1/api-management';
  const apiKey = process.env.WHATSAPP_API_KEY || 'NUqL4rl3Bs5OXiKRkR5jnpKg0CuLesakoe2UDDVUzai1abNPaHPHfpusiLpcrDQ0';
  
  console.log('Testing GET request WITH JSON BODY...');
  
  try {
    const res = await axios({
      method: 'GET',
      url: `${apiURL}/message-template-preview`,
      data: {
        template_name: 'order_confirmation12'
      },
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', res.status, JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Failed:', err.response?.status, err.response?.data || err.message);
  }
}

test();
