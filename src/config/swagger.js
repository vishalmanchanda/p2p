const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DeepSeek Express API',
      version: '1.0.0',
      description: 'API for interacting with the DeepSeek AI model',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/deepseek-express-api',
        email: 'your-email@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
              },
            },
          },
        },
        CodeGenerationRequest: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: {
              type: 'string',
              description: 'The requirements for the code to be generated',
              example: 'Create a function that calculates the Fibonacci sequence',
            },
            language: {
              type: 'string',
              description: 'The programming language for the generated code',
              default: 'javascript',
              example: 'javascript',
            },
            comments: {
              type: 'boolean',
              description: 'Whether to include comments in the generated code',
              default: true,
              example: true,
            },
            maxTokens: {
              type: 'integer',
              description: 'Maximum number of tokens in the response',
              default: 2048,
              example: 2048,
            },
          },
        },
        CodeGenerationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The generated code without explanatory text or <think> tags',
                  example: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
                },
                language: {
                  type: 'string',
                  example: 'javascript',
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        ContentValidationRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'The content to be validated',
              example: 'Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans.',
            },
            criteria: {
              type: 'array',
              description: 'Criteria for validation',
              default: ['accuracy', 'clarity', 'coherence'],
              items: {
                type: 'string',
              },
              example: ['accuracy', 'clarity', 'coherence'],
            },
            detailed: {
              type: 'boolean',
              description: 'Whether to provide detailed feedback',
              default: true,
              example: true,
            },
          },
        },
        ContentValidationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                review: {
                  type: 'string',
                  example: 'The content is accurate and clearly explains the concept of artificial intelligence...',
                },
                criteria: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['accuracy', 'clarity', 'coherence'],
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        TopicResearchRequest: {
          type: 'object',
          required: ['topic'],
          properties: {
            topic: {
              type: 'string',
              description: 'The topic to research',
              example: 'Artificial Intelligence in Healthcare',
            },
            depth: {
              type: 'string',
              description: 'Depth of research',
              enum: ['basic', 'intermediate', 'advanced'],
              default: 'intermediate',
              example: 'intermediate',
            },
            format: {
              type: 'string',
              description: 'Format of results',
              enum: ['outline', 'detailed', 'comprehensive'],
              default: 'detailed',
              example: 'detailed',
            },
          },
        },
        TopicResearchResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                research: {
                  type: 'string',
                  example: 'Artificial Intelligence in Healthcare\n\n1. Introduction\n...',
                },
                topic: {
                  type: 'string',
                  example: 'Artificial Intelligence in Healthcare',
                },
                depth: {
                  type: 'string',
                  example: 'intermediate',
                },
                format: {
                  type: 'string',
                  example: 'detailed',
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        SummarizationRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'The content to be summarized',
              example: 'Artificial intelligence (AI) is intelligence demonstrated by machines...',
            },
            length: {
              type: 'string',
              description: 'Length of summary',
              enum: ['short', 'medium', 'long'],
              default: 'medium',
              example: 'medium',
            },
            style: {
              type: 'string',
              description: 'Style of summary',
              enum: ['bullet', 'paragraph', 'structured'],
              default: 'paragraph',
              example: 'paragraph',
            },
          },
        },
        SummarizationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  example: 'AI refers to intelligence demonstrated by machines, contrasting with natural intelligence in humans and animals...',
                },
                length: {
                  type: 'string',
                  example: 'medium',
                },
                style: {
                  type: 'string',
                  example: 'paragraph',
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        InsightDerivationRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'The content to analyze',
              example: 'The global AI market was valued at $62.35 billion in 2020...',
            },
            perspective: {
              type: 'string',
              description: 'Perspective for analysis',
              default: 'analytical',
              example: 'analytical',
            },
            focusAreas: {
              type: 'array',
              description: 'Specific areas to focus on',
              default: [],
              items: {
                type: 'string',
              },
              example: ['trends', 'opportunities'],
            },
          },
        },
        InsightDerivationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                insights: {
                  type: 'string',
                  example: 'The AI market is experiencing rapid growth with a CAGR of 40.2%...',
                },
                perspective: {
                  type: 'string',
                  example: 'analytical',
                },
                focusAreas: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['trends', 'opportunities'],
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        SvgGenerationRequest: {
          type: 'object',
          required: ['description'],
          properties: {
            description: {
              type: 'string',
              description: 'Description of the SVG to generate',
              example: 'A mountain landscape with a sunset',
            },
            style: {
              type: 'string',
              description: 'Style of the SVG',
              default: 'minimal',
              example: 'minimal',
            },
            size: {
              type: 'object',
              description: 'Size of the SVG in pixels',
              default: { width: 300, height: 300 },
              properties: {
                width: {
                  type: 'integer',
                  example: 300,
                },
                height: {
                  type: 'integer',
                  example: 200,
                },
              },
            },
            colors: {
              type: 'array',
              description: 'Specific colors to use',
              default: [],
              items: {
                type: 'string',
              },
              example: ['#ff7700', '#0077ff'],
            },
          },
        },
        SvgGenerationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                svg: {
                  type: 'string',
                  example: '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">...</svg>',
                },
                style: {
                  type: 'string',
                  example: 'minimal',
                },
                size: {
                  type: 'object',
                  properties: {
                    width: {
                      type: 'integer',
                      example: 300,
                    },
                    height: {
                      type: 'integer',
                      example: 200,
                    },
                  },
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        PrototypeGenerationRequest: {
          type: 'object',
          required: ['scenario', 'name'],
          properties: {
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A task management application for remote teams with project tracking and time management features',
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'TaskMaster',
            },
            features: {
              type: 'array',
              description: 'Specific features to include in the prototype',
              default: [],
              items: {
                type: 'string',
              },
              example: ['Task board', 'Time tracking', 'Team chat', 'File sharing'],
            },
          },
        },
        PrototypeGenerationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'HTML prototype for "TaskMaster" has been generated successfully.',
                },
                scenario: {
                  type: 'string',
                  example: 'A task management application for remote teams with project tracking and time management features',
                },
                filePath: {
                  type: 'string',
                  example: '/path/to/public/taskmaster/index.html',
                },
                url: {
                  type: 'string',
                  example: '/public/taskmaster/index.html',
                },
                model: {
                  type: 'string',
                  example: 'deepseek-r1:8b',
                },
              },
            },
          },
        },
        PrototypeBuilderRequest: {
          type: 'object',
          required: ['scenario', 'name', 'sections'],
          properties: {
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A task management application for remote teams with project tracking and time management features',
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'TaskMaster',
            },
            sections: {
              type: 'array',
              description: 'Array of sections to generate for the prototype',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique identifier for the section (used in the HTML)',
                    example: 'header',
                  },
                  type: {
                    type: 'string',
                    description: 'Type of section (e.g., header, main, features, footer)',
                    example: 'header',
                  },
                  description: {
                    type: 'string',
                    description: 'Detailed description of what this section should contain',
                    example: 'A responsive navigation header with logo, menu items, and a login button',
                  },
                },
              },
              example: [
                {
                  id: 'header',
                  type: 'header',
                  description: 'A responsive navigation header with logo, menu items, and a login button',
                },
                {
                  id: 'main',
                  type: 'main',
                  description: 'Main content area with task board showing tasks in different columns (To Do, In Progress, Done)',
                },
                {
                  id: 'features',
                  type: 'features',
                  description: 'Feature highlights section with icons and short descriptions of key features',
                },
                {
                  id: 'footer',
                  type: 'footer',
                  description: 'Footer with copyright, links, and contact information',
                },
              ],
            },
            features: {
              type: 'array',
              description: 'Specific features to include in the prototype',
              default: [],
              items: {
                type: 'string',
              },
              example: ['Task board', 'Time tracking', 'Team chat', 'File sharing'],
            },
          },
        },
        PrototypeBuilderResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'HTML prototype for "TaskMaster" has been generated successfully.',
                },
                scenario: {
                  type: 'string',
                  example: 'A task management application for remote teams with project tracking and time management features',
                },
                sections: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['header', 'main', 'features', 'footer'],
                },
                filePath: {
                  type: 'string',
                  example: '/path/to/public/taskmaster/index.html',
                },
                url: {
                  type: 'string',
                  example: '/public/taskmaster/index.html',
                },
              },
            },
          },
        },
        SectionGenerationRequest: {
          type: 'object',
          required: ['scenario', 'name', 'section'],
          properties: {
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A task management application for remote teams with project tracking and time management features',
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'TaskMaster',
            },
            section: {
              type: 'object',
              description: 'Section configuration to generate',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the section (used in the HTML)',
                  example: 'header',
                },
                type: {
                  type: 'string',
                  description: 'Type of section (e.g., header, main, features, footer)',
                  example: 'header',
                },
                description: {
                  type: 'string',
                  description: 'Detailed description of what this section should contain',
                  example: 'A responsive navigation header with logo, menu items, and a login button',
                },
              },
            },
            features: {
              type: 'array',
              description: 'Specific features to include in the section',
              default: [],
              items: {
                type: 'string',
              },
              example: ['Task board', 'Time tracking', 'Team chat', 'File sharing'],
            },
          },
        },
        SectionGenerationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Section "header" for "TaskMaster" has been generated successfully.',
                },
                scenario: {
                  type: 'string',
                  example: 'A task management application for remote teams with project tracking and time management features',
                },
                section: {
                  type: 'string',
                  example: 'header',
                },
                filePath: {
                  type: 'string',
                  example: '/path/to/public/taskmaster/header.html',
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Validation error: "prompt" is required',
                  code: 'VALIDATION_ERROR',
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Internal Server Error',
                  code: 'INTERNAL_SERVER_ERROR',
                },
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Too Many Requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  message: 'Too many requests, please try again later.',
                  code: 'RATE_LIMIT_EXCEEDED',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 