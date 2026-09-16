const http = require('http');

const payload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "123",
    changes: [{
      value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: "123", phone_number_id: "123" },
        contacts: [{ profile: { name: "Test User" }, wa_id: "9999999999" }],
        messages: [{
          from: "9999999999",
          id: "wamid.test_123",
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: "text",
          text: { body: "Hello from local test" }
        }]
      }
    }]
  }]
};

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/whatsapp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', console.error);
req.write(JSON.stringify(payload));
req.end();
