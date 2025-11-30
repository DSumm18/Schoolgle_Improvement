console.log('🧪 Testing Ed API Endpoint\n');

const testMessage = {
  messages: [
    { role: 'user', content: 'What does Ofsted look for in reading?' }
  ],
  context: {
    organizationId: 'demo',
    schoolName: 'Test School',
    page: 'quality-of-education'
  }
};

console.log('Sending request to Ed API...\n');

try {
  const response = await fetch('http://localhost:3000/api/ed/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testMessage)
  });

  if (!response.ok) {
    const error = await response.text();
    console.log('❌ API Error:', response.status, error);
  } else {
    const data = await response.json();
    
    console.log('✅ Ed API Response Received!\n');
    console.log('='.repeat(70));
    console.log(data.response);
    console.log('='.repeat(70));
    
    if (data.metadata) {
      console.log(`\nModel: ${data.metadata.model}`);
      console.log(`Tokens: ${data.metadata.tokens}`);
      console.log(`Cost: $${data.metadata.cost.toFixed(5)}`);
    }
    
    console.log('\n✅ Ed API integration working!');
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}
