const axios = require('axios');

/**
 * Check if the local  model is running
 * @returns {Promise<{isRunning: boolean, availableModels: string[]}>} - Status and available models
 */
async function isModelRunning() {
  try {
    const response = await axios.get(`${process.env.DEEPSEEK_API_URL}/api/tags`);
    
    // Get list of available models
    const models = response.data?.models || [];
    const modelNames = models.map(m => m.name);
    
    // Check if the model exists in the list of available models
    const modelExists = models.some(model => model.name === process.env.DEEPSEEK_MODEL);
    
    if (!modelExists) {
      console.warn(`Warning: Model '${process.env.DEEPSEEK_MODEL}' not found in available models.`);
      if (modelNames.length > 0) {
        console.warn('Available models:', modelNames.join(', '));
      } else {
        console.warn('No models are currently available. You need to pull some models first.');
      }
    }
    
    return { 
      isRunning: true,
      availableModels: modelNames
    };
  } catch (error) {
    let errorMessage = 'Error connecting to local  model: ';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage += `Connection refused to ${process.env.DEEPSEEK_API_URL}`;
    } else if (error.response) {
      errorMessage += `Server responded with status ${error.response.status}`;
    } else {
      errorMessage += error.message;
    }
    
    console.error(errorMessage);
    return { 
      isRunning: false,
      availableModels: []
    };
  }
}

/**
 * Check if the model is running and exit if not
 */
async function checkModelOrExit() {
  console.log('Checking if local  model is running...');
  
  const { isRunning, availableModels } = await isModelRunning();
  
  if (!isRunning) {
    console.error('\n❌ Error: Local  model is not running.');
    console.error('\nTroubleshooting steps:');
    console.error('1. Make sure Ollama is running with: ollama serve');
    console.error('2. Check if you can access the Ollama UI at: http://127.0.0.1:11434/');
    console.error('3. Try using the explicit IPv4 address in .env: DEEPSEEK_API_URL=http://127.0.0.1:11434');
    console.error('4. Check if there are any firewalls blocking the connection');
    console.error('5. Verify Ollama is listening on the correct port with: lsof -i :11434');
    console.error(`\nYou can pull the model with: ollama pull ${process.env.DEEPSEEK_MODEL}`);
    process.exit(1);
  }
  
  const modelExists = availableModels.includes(process.env.DEEPSEEK_MODEL);
  
  if (!modelExists) {
    if (availableModels.length > 0) {
      console.warn(`\n⚠️ Warning: Model '${process.env.DEEPSEEK_MODEL}' not found, but other models are available.`);
      console.warn('Available models:', availableModels.join(', '));
      console.warn(`\nYou can pull the requested model with: ollama pull ${process.env.DEEPSEEK_MODEL}`);
      console.warn(`\nContinuing with available model '${availableModels[0]}'...`);
      process.env.DEEPSEEK_MODEL = availableModels[0];
    } else {
      console.error(`\n❌ Error: No models available. You need to pull at least one model.`);
      console.error(`You can pull the requested model with: ollama pull ${process.env.DEEPSEEK_MODEL}`);
      process.exit(1);
    }
  }
  
  console.log(`✅ Local  model '${process.env.DEEPSEEK_MODEL}' is running.`);
}

module.exports = {
  isModelRunning,
  checkModelOrExit
}; 