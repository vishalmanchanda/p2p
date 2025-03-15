require('dotenv').config();
const axios = require('axios');

/**
 * Test the local DeepSeek model
 */
async function testLocalModel() {
  console.log('Testing connection to local DeepSeek model...');
  console.log(`URL: ${process.env.DEEPSEEK_API_URL}`);
  console.log(`Model: ${process.env.DEEPSEEK_MODEL}`);
  
  try {
    // First, check if the model is available
    console.log('\nChecking Ollama server status...');
    const tagsResponse = await axios.get(`${process.env.DEEPSEEK_API_URL}/api/tags`);
    console.log('✅ Successfully connected to Ollama server');
    
    console.log('\nAvailable models:');
    const models = tagsResponse.data?.models || [];
    if (models.length === 0) {
      console.warn('⚠️ No models found. You may need to pull some models first.');
    } else {
      models.forEach(model => {
        console.log(`- ${model.name}`);
      });
    }
    
    const modelExists = models.some(model => model.name === process.env.DEEPSEEK_MODEL);
    if (!modelExists) {
      console.warn(`\n⚠️ Warning: Model '${process.env.DEEPSEEK_MODEL}' not found in available models.`);
      console.warn(`You need to pull it with: ollama pull ${process.env.DEEPSEEK_MODEL}`);
      console.warn('Attempting to continue with test using an available model...');
      
      // Try to use an available model for testing
      if (models.length > 0) {
        const availableModel = models[0].name;
        console.log(`Using available model '${availableModel}' for testing...`);
        process.env.DEEPSEEK_MODEL = availableModel;
      } else {
        throw new Error('No models available for testing');
      }
    } else {
      console.log(`\n✅ Model '${process.env.DEEPSEEK_MODEL}' is available`);
    }
    
    // Test a simple completion
    console.log('\nTesting a simple completion...');
    const requestBody = {
      model: process.env.DEEPSEEK_MODEL,
      prompt: 'System: You are a helpful assistant.\n\nUser: Say hello and introduce yourself in one sentence.\n\nAssistant: ',
      stream: false
    };
    
    console.log(`Sending request to ${process.env.DEEPSEEK_API_URL}/api/generate...`);
    const response = await axios.post(`${process.env.DEEPSEEK_API_URL}/api/generate`, requestBody);
    
    console.log('\nResponse:');
    console.log(response.data.response);
    
    console.log('\n✅ Test completed successfully!');
    console.log('The local DeepSeek model is working correctly.');
    console.log('You can now start the API with: npm run dev');
  } catch (error) {
    console.error('\n❌ Error testing local DeepSeek model:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`Connection refused to ${process.env.DEEPSEEK_API_URL}`);
      console.error('\nTroubleshooting steps:');
      console.error('1. Make sure Ollama is running with: ollama serve');
      console.error('2. Check if you can access the Ollama UI at: http://localhost:11434/');
      console.error('3. Try using the explicit IPv4 address in .env: DEEPSEEK_API_URL=http://127.0.0.1:11434');
      console.error('4. Check if there are any firewalls blocking the connection');
      console.error('5. Verify Ollama is listening on the correct port with: lsof -i :11434');
    } else if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    console.error('\nPlease make sure Ollama is running and the model is available.');
    console.error('You can start Ollama with: ollama serve');
    console.error(`You can pull the model with: ollama pull ${process.env.DEEPSEEK_MODEL}`);
    
    process.exit(1);
  }
}

// Run the test
testLocalModel(); 