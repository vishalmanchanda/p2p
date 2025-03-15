const request = require('supertest');
const app = require('../index');
const deepseekService = require('../services/deepseek.service');

// Mock the deepseekService
jest.mock('../services/deepseek.service');

describe('Code Generation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate code successfully', async () => {
    // Mock the generateCode method
    deepseekService.generateCode.mockResolvedValue({
      code: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
      language: 'javascript',
      model: 'deepseek-coder'
    });

    const response = await request(app)
      .post('/api/generate/code')
      .send({
        prompt: 'Create a function that calculates the Fibonacci sequence',
        language: 'javascript',
        comments: true,
        maxTokens: 2048
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('code');
    expect(response.body.data).toHaveProperty('language', 'javascript');
    expect(response.body.data).toHaveProperty('model', 'deepseek-coder');
    
    expect(deepseekService.generateCode).toHaveBeenCalledWith({
      prompt: 'Create a function that calculates the Fibonacci sequence',
      language: 'javascript',
      comments: true,
      maxTokens: 2048
    });
  });

  it('should return validation error for missing prompt', async () => {
    const response = await request(app)
      .post('/api/generate/code')
      .send({
        language: 'javascript',
        comments: true,
        maxTokens: 2048
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(deepseekService.generateCode).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    // Mock the generateCode method to throw an error
    deepseekService.generateCode.mockRejectedValue(new Error('Service error'));

    const response = await request(app)
      .post('/api/generate/code')
      .send({
        prompt: 'Create a function that calculates the Fibonacci sequence',
        language: 'javascript',
        comments: true,
        maxTokens: 2048
      });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('message', 'Service error');
  });
}); 