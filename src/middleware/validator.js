const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * Middleware factory for request validation
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(errorMessage, 400, 'VALIDATION_ERROR'));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Code generation schema
  codeGeneration: Joi.object({
    prompt: Joi.string().required().max(4000),
    language: Joi.string().default('javascript'),
    comments: Joi.boolean().default(true),
    maxTokens: Joi.number().integer().min(1).max(8192).default(2048)
  }),

  // Content validation schema
  contentValidation: Joi.object({
    content: Joi.string().required().max(8000),
    criteria: Joi.array().items(Joi.string()).default(['accuracy', 'clarity', 'coherence']),
    detailed: Joi.boolean().default(true)
  }),

  // Topic research schema
  topicResearch: Joi.object({
    topic: Joi.string().required().max(500),
    depth: Joi.string().valid('basic', 'intermediate', 'advanced').default('intermediate'),
    format: Joi.string().valid('outline', 'detailed', 'comprehensive').default('detailed')
  }),

  // Content summarization schema
  summarization: Joi.object({
    content: Joi.string().required().max(16000),
    length: Joi.string().valid('short', 'medium', 'long').default('medium'),
    style: Joi.string().valid('bullet', 'paragraph', 'structured').default('paragraph')
  }),

  // Insight derivation schema
  insightDerivation: Joi.object({
    content: Joi.string().required().max(16000),
    perspective: Joi.string().default('analytical'),
    focusAreas: Joi.array().items(Joi.string()).default([])
  }),

  // SVG generation schema
  svgGeneration: Joi.object({
    description: Joi.string().required().max(1000),
    style: Joi.string().default('minimal'),
    size: Joi.object({
      width: Joi.number().integer().min(16).max(2000).default(300),
      height: Joi.number().integer().min(16).max(2000).default(300)
    }).default({ width: 300, height: 300 }),
    colors: Joi.array().items(Joi.string()).default([])
  })
};

module.exports = {
  validate,
  schemas
}; 