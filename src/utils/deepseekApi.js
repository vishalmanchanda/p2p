const axios = require('axios');

// Initialize environment variables if not already done
if (!process.env.DEEPSEEK_API_URL) {
  process.env.DEEPSEEK_API_URL = 'http://127.0.0.1:11434';
}

if (!process.env.DEEPSEEK_MODEL) {
  process.env.DEEPSEEK_MODEL = 'deepseek-r1:8b';
}

// Log the API URL when the module is imported
console.log(' API URL:', process.env.DEEPSEEK_API_URL);

/**
 * Get a configured axios instance for the deepseek API
 * @returns {import('axios').AxiosInstance} - Configured axios instance
 */
function getDeepseekApi() {
  const apiUrl = process.env.DEEPSEEK_API_URL;
  console.log('Initializing axios instance with API URL:', apiUrl + '/');
  
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 180000 // 2 minute timeout
  });
  
  // Add request interceptor to log requests (uncomment for debugging)
  // instance.interceptors.request.use(config => {
  //   console.log(`${config.method.toUpperCase()} ${config.url}`);
  //   return config;
  // });
  
  return instance;
}

module.exports = {
  getDeepseekApi
}; 