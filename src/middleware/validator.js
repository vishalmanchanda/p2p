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
  }),

  // Prototype generation schema
  prototypeGeneration: Joi.object({
    scenario: Joi.string().required().min(10).max(1000)
      .description('Detailed description of the scenario for the prototype'),
    name: Joi.string().required().min(3).max(50)
      .description('Name for the prototype (will be used for the directory name)'),
    features: Joi.array().items(Joi.string()).default([])
      .description('Specific features to include in the prototype')
  }),
  
  // Prototype builder schema for section-based generation
  prototypeBuilder: Joi.object({
    scenario: Joi.string().required().min(10).max(1000)
      .description('Detailed description of the scenario for the prototype'),
    name: Joi.string().required().min(3).max(50)
      .description('Name for the prototype (will be used for the directory name)'),
    sections: Joi.array().items(
      Joi.object({
        id: Joi.string().required().pattern(/^[a-z0-9-]+$/)
          .description('Unique identifier for the section (used in the HTML)'),
        type: Joi.string().required()
          .description('Type of section (e.g., header, main, features, footer)'),
        description: Joi.string().required().min(10).max(500)
          .description('Detailed description of what this section should contain')
      })
    ).min(1).required()
      .description('Array of sections to generate for the prototype'),
    features: Joi.array().items(Joi.string()).default([])
      .description('Specific features to include in the prototype')
  }),
  
  // Section generation schema
  sectionGeneration: Joi.object({
    scenario: Joi.string().required().min(10).max(1000)
      .description('Detailed description of the scenario for the prototype'),
    name: Joi.string().required().min(3).max(50)
      .description('Name for the prototype (will be used for the directory name)'),
    section: Joi.object({
      id: Joi.string().required().pattern(/^[a-z0-9-]+$/)
        .description('Unique identifier for the section (used in the HTML)'),
      type: Joi.string().required()
        .description('Type of section (e.g., header, main, features, footer)'),
      description: Joi.string().required().min(10).max(500)
        .description('Detailed description of what this section should contain')
    }).required()
      .description('Section configuration to generate'),
    features: Joi.array().items(Joi.string()).default([])
      .description('Specific features to include in the section')
  }),

  // JDL generation schema
  jdlGeneration: Joi.object({
    requirements: Joi.string().required().min(10).max(5000)
      .description('Detailed requirements for the entity model'),
    name: Joi.string().required().min(3).max(50)
      .description('Name for the JDL file (will be used for the file name)'),
    options: Joi.object({
      includeApplicationConfig: Joi.boolean().default(false)
        .description('Whether to include application configuration in the JDL'),
      microserviceNames: Joi.array().items(Joi.string()).default([])
        .description('Names of microservices to define entities for'),
      databaseType: Joi.string().valid('sql', 'mongodb', 'cassandra', 'couchbase', 'neo4j').default('sql')
        .description('Database type to use')
    }).default({})
      .description('Additional options for JDL generation')
  }),

  // JDL to JSON conversion schema
  jdlToJson: Joi.object({
    jdlContent: Joi.string().required().messages({
      'string.empty': 'JDL content is required',
      'any.required': 'JDL content is required'
    }),
    name: Joi.string().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
    options: Joi.object({
      recordsPerEntity: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Records per entity must be a number',
        'number.integer': 'Records per entity must be an integer',
        'number.min': 'Records per entity must be at least 1',
        'number.max': 'Records per entity must be at most 100'
      })
    }).default({})
  }),

  // JDL from requirements to JSON schema
  jdlFromRequirementsToJson: Joi.object({
    requirements: Joi.string().required().messages({
      'string.empty': 'Requirements are required',
      'any.required': 'Requirements are required'
    }),
    name: Joi.string().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
    jdlOptions: Joi.object({
      databaseType: Joi.string().valid('sql', 'mongodb', 'cassandra', 'couchbase').default('sql')
    }).default({}),
    jsonOptions: Joi.object({
      recordsPerEntity: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Records per entity must be a number',
        'number.integer': 'Records per entity must be an integer',
        'number.min': 'Records per entity must be at least 1',
        'number.max': 'Records per entity must be at most 100'
      })
    }).default({})
  }),

  // Prototype JSON Server schema
  prototypeJsonServer: Joi.object({
    jdlContent: Joi.string().required().messages({
      'string.empty': 'JDL content is required',
      'any.required': 'JDL content is required'
    }),
    scenario: Joi.string().required().min(10).max(1000).messages({
      'string.empty': 'Scenario is required',
      'string.min': 'Scenario must be at least 10 characters',
      'string.max': 'Scenario must be at most 1000 characters',
      'any.required': 'Scenario is required'
    }),
    name: Joi.string().required().min(3).max(50).messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 50 characters',
      'any.required': 'Name is required'
    }),
    options: Joi.object({
      jsonOptions: Joi.object({
        recordsPerEntity: Joi.number().integer().min(1).max(100).default(10).messages({
          'number.base': 'Records per entity must be a number',
          'number.integer': 'Records per entity must be an integer',
          'number.min': 'Records per entity must be at least 1',
          'number.max': 'Records per entity must be at most 100'
        })
      }).default({}),
      features: Joi.array().items(Joi.string()).default([])
        .description('Specific features to include in the prototype')
    }).default({})
  }),

  // Prototype JSON Server from JDL file schema
  prototypeJsonServerFromJdl: Joi.object({
    scenario: Joi.string().required().min(10).max(1000).messages({
      'string.empty': 'Scenario is required',
      'string.min': 'Scenario must be at least 10 characters',
      'string.max': 'Scenario must be at most 1000 characters',
      'any.required': 'Scenario is required'
    }),
    name: Joi.string().min(3).max(50).messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 50 characters'
    }),
    options: Joi.object({
      jsonOptions: Joi.object({
        recordsPerEntity: Joi.number().integer().min(1).max(100).default(10).messages({
          'number.base': 'Records per entity must be a number',
          'number.integer': 'Records per entity must be an integer',
          'number.min': 'Records per entity must be at least 1',
          'number.max': 'Records per entity must be at most 100'
        })
      }).default({}),
      features: Joi.array().items(Joi.string()).default([])
        .description('Specific features to include in the prototype')
    }).default({})
  }),

  // Prototype JSON Server from requirements schema
  prototypeJsonServerFromRequirements: Joi.object({
    requirements: Joi.string().required().min(10).max(5000).messages({
      'string.empty': 'Requirements are required',
      'string.min': 'Requirements must be at least 10 characters',
      'string.max': 'Requirements must be at most 5000 characters',
      'any.required': 'Requirements are required'
    }),
    scenario: Joi.string().required().min(10).max(1000).messages({
      'string.empty': 'Scenario is required',
      'string.min': 'Scenario must be at least 10 characters',
      'string.max': 'Scenario must be at most 1000 characters',
      'any.required': 'Scenario is required'
    }),
    name: Joi.string().required().min(3).max(50).messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 50 characters',
      'any.required': 'Name is required'
    }),
    options: Joi.object({
      jsonOptions: Joi.object({
        recordsPerEntity: Joi.number().integer().min(1).max(100).default(10).messages({
          'number.base': 'Records per entity must be a number',
          'number.integer': 'Records per entity must be an integer',
          'number.min': 'Records per entity must be at least 1',
          'number.max': 'Records per entity must be at most 100'
        })
      }).default({}),
      features: Joi.array().items(Joi.string()).default([])
        .description('Specific features to include in the prototype')
    }).default({})
  })
};

module.exports = {
  validate,
  schemas
}; 