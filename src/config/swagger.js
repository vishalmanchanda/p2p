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
        url: 'http://localhost:3005/api',
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
        JdlGenerationRequest: {
          type: 'object',
          required: ['requirements', 'name'],
          properties: {
            requirements: {
              type: 'string',
              description: 'Detailed requirements for the entity model',
              example: 'Create an e-commerce application with Product, Order, Customer, and Review entities. Products have a name, description, price, and category. Orders have a date, status, and total amount. Customers have a name, email, and address. Reviews have a rating and comment.',
            },
            name: {
              type: 'string',
              description: 'Name for the JDL file (will be used for the file name)',
              example: 'e-commerce',
            },
            options: {
              type: 'object',
              description: 'Additional options for JDL generation',
              properties: {
                includeApplicationConfig: {
                  type: 'boolean',
                  description: 'Whether to include application configuration in the JDL',
                  default: false,
                  example: false,
                },
                microserviceNames: {
                  type: 'array',
                  description: 'Names of microservices to define entities for',
                  default: [],
                  items: {
                    type: 'string',
                  },
                  example: ['productservice', 'orderservice'],
                },
                databaseType: {
                  type: 'string',
                  description: 'Database type to use',
                  enum: ['sql', 'mongodb', 'cassandra', 'couchbase', 'neo4j'],
                  default: 'sql',
                  example: 'sql',
                },
              },
            },
          },
        },
        JdlGenerationResponse: {
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
                  example: 'JDL for "e-commerce" has been generated successfully.',
                },
                name: {
                  type: 'string',
                  example: 'e-commerce',
                },
                filePath: {
                  type: 'string',
                  example: '/path/to/public/jdl/e-commerce.jdl',
                },
                url: {
                  type: 'string',
                  example: '/public/jdl/e-commerce.jdl',
                },
                content: {
                  type: 'string',
                  description: 'The generated JDL content',
                  example: 'entity Product {\n  name String required,\n  description TextBlob,\n  price BigDecimal required min(0),\n  category String\n}\n\nentity Order {\n  date ZonedDateTime required,\n  status String required,\n  totalAmount BigDecimal required min(0)\n}\n\nrelationship OneToMany {\n  Customer to Order\n}',
                },
                validation: {
                  type: 'object',
                  properties: {
                    isValid: {
                      type: 'boolean',
                      example: true,
                    },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      example: [],
                    },
                  },
                },
              },
            },
          },
        },
        JdlToJsonRequest: {
          type: 'object',
          required: ['jdlContent', 'name'],
          properties: {
            jdlContent: {
              type: 'string',
              description: 'JDL content to convert to JSON Server format',
              example: 'entity Blog { name String required }'
            },
            name: {
              type: 'string',
              description: 'Name for the generated JSON file',
              example: 'blog-app'
            },
            options: {
              type: 'object',
              properties: {
                recordsPerEntity: {
                  type: 'integer',
                  description: 'Number of records to generate per entity',
                  default: 10,
                  example: 5
                }
              }
            }
          }
        },
        JdlToJsonResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the generated JSON file',
                  example: '/Users/username/project/public/blog-app/db.json'
                },
                url: {
                  type: 'string',
                  description: 'URL to access the generated JSON file',
                  example: '/public/blog-app/db.json'
                },
                entities: {
                  type: 'array',
                  description: 'List of entities included in the generated JSON',
                  items: {
                    type: 'string'
                  },
                  example: ['Blog', 'Post', 'Comment']
                }
              }
            }
          }
        },
        JdlFromRequirementsToJsonRequest: {
          type: 'object',
          required: ['requirements', 'name'],
          properties: {
            requirements: {
              type: 'string',
              description: 'Requirements for generating JDL',
              example: 'Create a blog application with User, Blog, Post, and Comment entities'
            },
            name: {
              type: 'string',
              description: 'Name for the generated files',
              example: 'blog-app'
            },
            jdlOptions: {
              type: 'object',
              properties: {
                databaseType: {
                  type: 'string',
                  enum: ['sql', 'mongodb', 'cassandra', 'couchbase'],
                  default: 'sql',
                  description: 'Type of database to use'
                }
              }
            },
            jsonOptions: {
              type: 'object',
              properties: {
                recordsPerEntity: {
                  type: 'integer',
                  description: 'Number of records to generate per entity',
                  default: 10,
                  example: 5
                }
              }
            }
          }
        },
        PrototypeJsonServerRequest: {
          type: 'object',
          required: ['jdlContent', 'scenario', 'name'],
          properties: {
            jdlContent: {
              type: 'string',
              description: 'JDL content to use for generating the prototype',
              example: 'entity Blog { name String required }'
            },
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A blog application with user management, post creation, and commenting features'
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'blog-app'
            },
            options: {
              type: 'object',
              properties: {
                jsonOptions: {
                  type: 'object',
                  properties: {
                    recordsPerEntity: {
                      type: 'integer',
                      description: 'Number of records to generate per entity',
                      default: 10,
                      example: 5
                    }
                  }
                },
                features: {
                  type: 'array',
                  description: 'Specific features to include in the prototype',
                  items: {
                    type: 'string'
                  },
                  example: ['Dark mode', 'Responsive design', 'Search functionality']
                }
              }
            }
          }
        },
        PrototypeJsonServerFromJdlRequest: {
          type: 'object',
          required: ['scenario'],
          properties: {
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A blog application with user management, post creation, and commenting features'
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'blog-app'
            },
            options: {
              type: 'object',
              properties: {
                jsonOptions: {
                  type: 'object',
                  properties: {
                    recordsPerEntity: {
                      type: 'integer',
                      description: 'Number of records to generate per entity',
                      default: 10,
                      example: 5
                    }
                  }
                },
                features: {
                  type: 'array',
                  description: 'Specific features to include in the prototype',
                  items: {
                    type: 'string'
                  },
                  example: ['Dark mode', 'Responsive design', 'Search functionality']
                }
              }
            }
          }
        },
        PrototypeJsonServerFromRequirementsRequest: {
          type: 'object',
          required: ['requirements', 'scenario', 'name'],
          properties: {
            requirements: {
              type: 'string',
              description: 'Detailed requirements for the entity model',
              example: 'Create a blog application with User, Blog, Post, and Comment entities. Users have a username, email, and bio. Blogs have a name, handle, and description. Posts have a title, content, date, and tags. Comments have content and a date.'
            },
            scenario: {
              type: 'string',
              description: 'Detailed description of the scenario for the prototype',
              example: 'A blog application with user management, post creation, and commenting features'
            },
            name: {
              type: 'string',
              description: 'Name for the prototype (will be used for the directory name)',
              example: 'blog-app'
            },
            options: {
              type: 'object',
              properties: {
                jsonOptions: {
                  type: 'object',
                  properties: {
                    recordsPerEntity: {
                      type: 'integer',
                      description: 'Number of records to generate per entity',
                      default: 10,
                      example: 5
                    }
                  }
                },
                features: {
                  type: 'array',
                  description: 'Specific features to include in the prototype',
                  items: {
                    type: 'string'
                  },
                  example: ['Dark mode', 'Responsive design', 'Search functionality']
                }
              }
            }
          }
        },
        PrototypeJsonServerResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Prototype with JSON Server integration for "blog-app" has been generated successfully.'
                },
                name: {
                  type: 'string',
                  example: 'blog-app'
                },
                scenario: {
                  type: 'string',
                  example: 'A blog application with user management, post creation, and commenting features'
                },
                entities: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['User', 'Blog', 'Post', 'Comment']
                },
                directoryPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app'
                },
                staticPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/static'
                },
                jdlPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/data.jdl'
                },
                dbJsonPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/db.json'
                },
                indexHtmlPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/static/index.html'
                },
                startScriptPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/start-server.sh'
                },
                url: {
                  type: 'string',
                  example: '/public/blog-app/static/index.html'
                },
                startCommand: {
                  type: 'string',
                  example: 'cd /path/to/public/blog-app && npx json-server db.json -p 3001 -s static'
                }
              }
            }
          }
        },
        PrototypeJsonServerInfo: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'blog-app'
                },
                directoryPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app'
                },
                jdlPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/data.jdl'
                },
                dbJsonPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/db.json'
                },
                indexHtmlPath: {
                  type: 'string',
                  example: '/path/to/public/blog-app/static/index.html'
                },
                url: {
                  type: 'string',
                  example: '/public/blog-app/static/index.html'
                },
                startCommand: {
                  type: 'string',
                  example: 'cd /path/to/public/blog-app && npx json-server db.json -p 3001 -s static'
                },
                entities: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['User', 'Blog', 'Post', 'Comment']
                }
              }
            }
          }
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