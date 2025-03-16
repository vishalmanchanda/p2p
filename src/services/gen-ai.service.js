const axios = require('axios');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Service for interacting with the local DeepSeek model
 */
class GenAIService {
  constructor( llmName = 'deepseek') {
    
    this.pickModelAccessDetails(llmName);
    
    // Initialize axios instance with common config
    console.log('Initializing axios instance with API URL:', this.apiUrl);
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.error || error.message || 'DeepSeek API error';
        const code = 'DEEPSEEK_API_ERROR';
        
        throw new ApiError(message, statusCode, code);
      }
    );
  }

  pickModelAccessDetails(llmName) {
    if (llmName === 'deepseek') {
      this.apiKey = process.env.DEEPSEEK_API_KEY;
      this.apiUrl = process.env.DEEPSEEK_API_URL || 'http://127.0.0.1:11434';
      this.model = process.env.DEEPSEEK_MODEL || 'deepseek-r1:8b';
      
      // Debug log
      console.log('DeepSeek API URL:', this.apiUrl);
      
      // Ensure the URL is properly formatted
      if (this.apiUrl && !this.apiUrl.endsWith('/')) {
        this.apiUrl = this.apiUrl + '/';
      }
    } else if (llmName === 'ollama') {
      this.apiKey = process.env.OLLAMA_API_KEY;
      this.apiUrl = process.env.OLLAMA_API_URL;
      this.model = process.env.OLLAMA_MODEL;
    } else if (llmName === 'gemini') {
      this.apiKey = process.env.GEMINI_API_KEY;
      this.apiUrl = process.env.GEMINI_API_URL;
      this.model = process.env.GEMINI_MODEL;
    } else if (llmName === 'anthropic') {
      this.apiKey = process.env.ANTHROPIC_API_KEY;
      this.apiUrl = process.env.ANTHROPIC_API_URL;
      this.model = process.env.ANTHROPIC_MODEL;
    } else {
      throw new Error(`Unsupported LLM: ${llmName}`);
    }
  }

  /**
   * Generate a completion from the local DeepSeek model
   * @param {Object} params - Parameters for the completion
   * @returns {Promise<Object>} - The completion response
   */
  async generateCompletion(params) {
    // Format for local Ollama API
    const requestBody = {
      model: this.model,
      prompt: this._formatPrompt(params.messages),
      stream: false,
      options: {
        temperature: params.temperature || 0.7,
        top_p: params.top_p || 0.9,
        max_tokens: params.max_tokens || 2048
      }
    };
    
    const response = await this.client.post('/api/generate', requestBody);
    
    // Transform the response to match our expected format
    return {
      choices: [
        {
          message: {
            content: response.data.response
          }
        }
      ],
      model: this.model
    };
  }

  /**
   * Format messages array into a single prompt string
   * @param {Array} messages - Array of message objects
   * @returns {String} - Formatted prompt string
   */
  _formatPrompt(messages) {
    let prompt = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }
    
    prompt += 'Assistant: ';
    return prompt;
  }

  /**
   * Generate code based on a prompt
   * @param {Object} params - Code generation parameters
   * @returns {Promise<Object>} - Generated code
   */
  async generateCode({ prompt, language, comments, maxTokens }) {
    const systemPrompt = `You are an expert programmer. Generate ${language} code based on the following requirements. ${comments ? 'Include helpful comments.' : 'Minimize comments.'} The code should be production-ready, efficient, and follow best practices.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.2 // Lower temperature for more deterministic code generation
    });
    
    // Filter out <think> tags from the response
    let code = response.choices[0].message.content;
    code = this._removeThinkTags(code);
    
    return {
      code,
      language,
      model: response.model
    };
  }
  
  /**
   * Remove <think> tags and their content from the response
   * @param {string} text - The text to process
   * @returns {string} - The text without <think> tags and their content
   */
  _removeThinkTags(text) {
    // Remove <think>...</think> blocks (case insensitive)
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    
    // Extract just the code from code blocks if present
    // This regex will match code blocks with or without language specification
    const codeBlockRegex = /```(?:\w*\n|\n)?([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    
    if (match && match[1]) {
      // Return just the code inside the code block
      return match[1].trim();
    }
    
    // If no code block is found, return the filtered text
    return text;
  }

  /**
   * Validate and review content
   * @param {Object} params - Content validation parameters
   * @returns {Promise<Object>} - Validation results
   */
  async validateContent({ content, criteria, detailed }) {
    const criteriaStr = criteria.join(', ');
    const systemPrompt = `You are a content reviewer. Evaluate the following content based on these criteria: ${criteriaStr}. ${detailed ? 'Provide detailed feedback for each criterion.' : 'Provide concise feedback.'} Be objective and constructive.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      max_tokens: 2048,
      temperature: 0.3
    });
    
    return {
      review: response.choices[0].message.content,
      criteria,
      model: response.model
    };
  }

  /**
   * Perform topic research
   * @param {Object} params - Topic research parameters
   * @returns {Promise<Object>} - Research results
   */
  async researchTopic({ topic, depth, format }) {
    const systemPrompt = `You are a research assistant. Conduct ${depth} research on the following topic and present it in ${format} format. Include key concepts, important details, and relevant insights.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Research topic: ${topic}` }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });
    
    return {
      research: response.choices[0].message.content,
      topic,
      depth,
      format,
      model: response.model
    };
  }

  /**
   * Summarize content
   * @param {Object} params - Summarization parameters
   * @returns {Promise<Object>} - Summarized content
   */
  async summarizeContent({ content, length, style }) {
    const systemPrompt = `You are a summarization expert. Create a ${length} summary of the following content in ${style} style. Capture the main points and key insights.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      max_tokens: 2048,
      temperature: 0.4
    });
    
    return {
      summary: response.choices[0].message.content,
      length,
      style,
      model: response.model
    };
  }

  /**
   * Derive insights from content
   * @param {Object} params - Insight derivation parameters
   * @returns {Promise<Object>} - Derived insights
   */
  async deriveInsights({ content, perspective, focusAreas }) {
    const focusAreasStr = focusAreas.length > 0 ? `Focus on these areas: ${focusAreas.join(', ')}.` : '';
    const systemPrompt = `You are an insights analyst with a ${perspective} perspective. Analyze the following content and extract meaningful insights. ${focusAreasStr} Provide actionable takeaways and highlight patterns or trends.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      max_tokens: 2048,
      temperature: 0.5
    });
    
    return {
      insights: response.choices[0].message.content,
      perspective,
      focusAreas,
      model: response.model
    };
  }

  /**
   * Generate SVG based on description
   * @param {Object} params - SVG generation parameters
   * @returns {Promise<Object>} - Generated SVG
   */
  async generateSvg({ description, style, size, colors }) {
    const colorsStr = colors.length > 0 ? `Use these colors: ${colors.join(', ')}.` : 'Use appropriate colors.';
    const systemPrompt = `You are an SVG designer. Create an SVG image based on the following description in ${style} style. The image should be ${size.width}x${size.height} pixels. ${colorsStr} Return only valid SVG code without any explanation.`;
    
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });
    
    // Extract SVG code from the response
    const svgCode = response.choices[0].message.content.trim();
    
    return {
      svg: svgCode,
      style,
      size,
      model: response.model
    };
  }
}

module.exports = new GenAIService(); 