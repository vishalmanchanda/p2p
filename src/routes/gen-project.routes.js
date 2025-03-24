const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // Adding regular fs module for createWriteStream
const generateProjectService = require('../services/generate-project');
const { validate, schemas } = require('../middleware/validator');
const { ApiError } = require('../middleware/errorHandler');

// Define validation schema for project generation
if (!schemas.projectGeneration) {
  schemas.projectGeneration = require('joi').object({
    projectName: require('joi').string().required().min(1).max(50)
      .pattern(/^[a-zA-Z0-9-_]+$/)
      .messages({
        'string.empty': 'Project name is required',
        'string.min': 'Project name must be at least 1 character',
        'string.max': 'Project name must be at most 50 characters',
        'string.pattern.base': 'Project name can only contain letters, numbers, hyphens, and underscores',
        'any.required': 'Project name is required'
      }),
    requirementsText: require('joi').string().required().min(10).max(5000)
      .messages({
        'string.empty': 'Requirements text is required',
        'string.min': 'Requirements text must be at least 10 characters',
        'string.max': 'Requirements text must be at most 5000 characters',
        'any.required': 'Requirements text is required'
      }),
    port: require('joi').number().integer().min(1024).max(65535).default(3002)
      .messages({
        'number.base': 'Port must be a number',
        'number.integer': 'Port must be an integer',
        'number.min': 'Port must be at least 1024',
        'number.max': 'Port must be at most 65535'
      }),
    host: require('joi').string().default('localhost')
      .messages({
        'string.base': 'Host must be a string'
      }),
    staticFolder: require('joi').string().default('static')
      .messages({
        'string.base': 'Static folder must be a string'
      }),
    useLLM: require('joi').boolean().default(false)
      .messages({
        'boolean.base': 'useLLM must be a boolean'
      })
  });
}

// Define validation schema for entity configurations
if (!schemas.entityConfigs) {
  schemas.entityConfigs = require('joi').object({
    requirementsText: require('joi').string().required().min(10).max(5000)
      .messages({
        'string.empty': 'Requirements text is required',
        'string.min': 'Requirements text must be at least 10 characters',
        'string.max': 'Requirements text must be at most 5000 characters',
        'any.required': 'Requirements text is required'
      }),
    port: require('joi').number().integer().min(1024).max(65535).default(3002)
      .messages({
        'number.base': 'Port must be a number',
        'number.integer': 'Port must be an integer',
        'number.min': 'Port must be at least 1024',
        'number.max': 'Port must be at most 65535'
      }),
    host: require('joi').string().default('localhost')
      .messages({
        'string.base': 'Host must be a string'
      }),
    useLLM: require('joi').boolean().default(false)
      .messages({
        'boolean.base': 'useLLM must be a boolean'
      })
  });
}

// Define validation schema for scenario generation
if (!schemas.scenarioGeneration) {
  schemas.scenarioGeneration = require('joi').object({
    projectName: require('joi').string().required().min(1).max(50)
      .pattern(/^[a-zA-Z0-9-_]+$/)
      .messages({
        'string.empty': 'Project name is required',
        'string.min': 'Project name must be at least 1 character',
        'string.max': 'Project name must be at most 50 characters',
        'string.pattern.base': 'Project name can only contain letters, numbers, hyphens, and underscores',
        'any.required': 'Project name is required'
      }),
    scenarioDescription: require('joi').string().required().min(10).max(5000)
      .messages({
        'string.empty': 'Scenario description is required',
        'string.min': 'Scenario description must be at least 10 characters',
        'string.max': 'Scenario description must be at most 5000 characters',
        'any.required': 'Scenario description is required'
      }),
    scenarioName: require('joi').string().required().min(1).max(50)
      .pattern(/^[a-zA-Z0-9-_ ]+$/)
      .messages({
        'string.empty': 'Scenario name is required',
        'string.min': 'Scenario name must be at least 1 character',
        'string.max': 'Scenario name must be at most 50 characters',
        'string.pattern.base': 'Scenario name can only contain letters, numbers, hyphens, underscores, and spaces',
        'any.required': 'Scenario name is required'
      })
  });
}

// Define validation schema for mock data generation
if (!schemas.mockDataGeneration) {
  schemas.mockDataGeneration = require('joi').object({
    projectName: require('joi').string().required().min(1).max(50)
      .pattern(/^[a-zA-Z0-9-_]+$/)
      .messages({
        'string.empty': 'Project name is required',
        'string.min': 'Project name must be at least 1 character',
        'string.max': 'Project name must be at most 50 characters',
        'string.pattern.base': 'Project name can only contain letters, numbers, hyphens, and underscores',
        'any.required': 'Project name is required'
      }),
    recordsPerEntity: require('joi').number().integer().min(1).max(100).default(5)
      .messages({
        'number.base': 'Records per entity must be a number',
        'number.integer': 'Records per entity must be an integer',
        'number.min': 'Records per entity must be at least 1',
        'number.max': 'Records per entity must be at most 100'
      }),
    useLLM: require('joi').boolean().default(true)
      .messages({
        'boolean.base': 'useLLM must be a boolean'
      })
  });
}

/**
 * @swagger
 * /generate/project:
 *   post:
 *     summary: Generate a JSON-Server based project structure
 *     description: Creates a complete project structure with JSON-Server configuration, mock data generation, and static files based on the requirements provided
 *     tags: [Project Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - requirementsText
 *             properties:
 *               projectName:
 *                 type: string
 *                 description: Name for the project (will be used for the directory name)
 *                 example: e-commerce-api
 *               requirementsText:
 *                 type: string
 *                 description: Detailed requirements for entities and their relationships
 *                 example: "Create a project with User and Product entities. User has fields: name, email, password. Product has fields: title, price, description, category."
 *               port:
 *                 type: integer
 *                 description: Port number for JSON-Server
 *                 default: 3002
 *                 example: 3002
 *               host:
 *                 type: string
 *                 description: Host for JSON-Server
 *                 default: localhost
 *                 example: localhost
 *               staticFolder:
 *                 type: string
 *                 description: Name of the static folder
 *                 default: static
 *                 example: static
 *               useLLM:
 *                 type: boolean
 *                 description: Whether to use AI/LLM for entity config generation (false uses rule-based generator)
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Successfully generated project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Project generated successfully"
 *                     projectPath:
 *                       type: string
 *                       example: "/path/to/generated/project"
 *                     projectName:
 *                       type: string
 *                       example: "e-commerce-api"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.projectGeneration), async (req, res, next) => {
  try {
    const { projectName, requirementsText, port, host, staticFolder, useLLM } = req.body;
    
    console.log(`Starting project generation for "${projectName}"`);
    
    // Set a timeout in case generateProject gets stuck
    const timeout = setTimeout(() => {
      console.error('Project generation timed out after 60 seconds');
      return next(new ApiError('Project generation timed out', 504, 'PROJECT_GENERATION_TIMEOUT'));
    }, 60000); // 60 second timeout
    
    try {
      // Generate the project structure
      const projectPath = await generateProjectService.generateProject(
        projectName, 
        requirementsText, 
        port, 
        staticFolder, 
        host
      );
      console.log(`Project structure created at: ${projectPath}`);
      
      try {
        // Generate entity configurations based on requirements
        console.log('Generating entity configurations...');
        await generateProjectService.generateEntityConfigs(
          projectPath, 
          requirementsText, 
          port, 
          host,
          useLLM
        );
        console.log('Entity configurations generated successfully');
      } catch (entityConfigError) {
        console.error('Error generating entity configs:', entityConfigError);
        // If entity config fails, we'll still return success but log the error
        // This prevents the entire operation from failing if only this part fails
      }
      
      // Clear the timeout since we're done
      clearTimeout(timeout);
      
      res.status(200).json({
        success: true,
        data: {
          message: `Project "${projectName}" has been generated successfully.`,
          projectPath,
          projectName
        }
      });
    } catch (error) {
      // Clear the timeout if there's an error
      clearTimeout(timeout);
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error generating project:', error);
    next(new ApiError(`Failed to generate project: ${error.message}`, 500, 'PROJECT_GENERATION_ERROR'));
  }
});

/**
 * @swagger
 * /generate/project/list:
 *   get:
 *     summary: List all generated projects
 *     description: Returns a list of all projects that have been generated
 *     tags: [Project Generation]
 *     responses:
 *       200:
 *         description: Successfully retrieved project list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: e-commerce-api
 *                           path:
 *                             type: string
 *                             example: /path/to/generated/project
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/list', async (req, res, next) => {
  try {
    const projectsDir = path.resolve(process.cwd());
    
    try {
      // Check if directory exists
      await fs.access(projectsDir);
    } catch (error) {
      // If directory doesn't exist, return empty list
      return res.status(200).json({
        success: true,
        data: {
          projects: []
        }
      });
    }
    
    // Get all directories in the projects directory
    const items = await fs.readdir(projectsDir, { withFileTypes: true });
    
    // Filter only directories that contain a package.json with our generated project structure
    const projects = [];
    
    for (const item of items) {
      if (item.isDirectory()) {
        const projectPath = path.join(projectsDir, item.name);
        const packageJsonPath = path.join(projectPath, 'package.json');
        
        try {
          await fs.access(packageJsonPath);
          // Check if this is our generated project structure by looking for specific files
          const hasStaticFolder = await fs.access(path.join(projectPath, 'static')).then(() => true).catch(() => false);
          const hasDbFolder = await fs.access(path.join(projectPath, 'db')).then(() => true).catch(() => false);
          
          if (hasStaticFolder && hasDbFolder) {
            projects.push({
              name: item.name,
              path: projectPath
            });
          }
        } catch (err) {
          // Not a project with package.json, skip
          continue;
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        projects
      }
    });
  } catch (error) {
    next(new ApiError('Failed to list projects', 500, 'PROJECT_LIST_ERROR'));
  }
});

/**
 * @swagger
 * /generate/project/download/{projectName}:
 *   get:
 *     summary: Download a generated project as a ZIP file
 *     description: Creates a ZIP archive of the generated project and sends it for download
 *     tags: [Project Generation]
 *     parameters:
 *       - name: projectName
 *         in: path
 *         required: true
 *         description: Name of the project to download
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project ZIP file
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/download/:projectName', async (req, res, next) => {
  try {
    const { projectName } = req.params;
    const projectPath = path.resolve(process.cwd(), projectName);
    
    // Check if project exists
    try {
      await fs.access(projectPath);
    } catch (error) {
      return next(new ApiError(`Project "${projectName}" not found`, 404, 'PROJECT_NOT_FOUND'));
    }
    
    // Create a temporary directory for the zip file
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
    }
    
    // Path for the zip file
    const zipFilePath = path.join(tempDir, `${projectName}.zip`);
    
    // Use archiver to create a zip file
    const archiver = require('archiver');
    const output = fsSync.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle output stream close
    output.on('close', () => {
      console.log(`Zip created: ${zipFilePath} (${archive.pointer()} bytes)`);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${projectName}.zip`);
      
      // Send the file
      res.sendFile(zipFilePath, (err) => {
        if (err) {
          next(new ApiError('Error sending file', 500, 'FILE_SEND_ERROR'));
        }
        
        // Delete the zip file after sending
        setTimeout(async () => {
          try {
            await fs.unlink(zipFilePath);
            console.log(`Deleted temporary zip file: ${zipFilePath}`);
          } catch (error) {
            console.error('Error deleting temporary zip file:', error);
          }
        }, 5000);
      });
    });
    
    // Handle archiver errors
    archive.on('error', (err) => {
      throw new Error(`Zip error: ${err.message}`);
    });
    
    // Pipe archive data to the output file
    archive.pipe(output);
    
    // Add all files in the project directory to the archive
    archive.directory(projectPath, projectName);
    
    // Finalize the archive (write the zip)
    await archive.finalize();
  } catch (error) {
    console.error('Error creating project zip:', error);
    next(new ApiError(`Failed to create project zip: ${error.message}`, 500, 'ZIP_CREATION_ERROR'));
  }
});

/**
 * @swagger
 * /generate/project/entity-configs:
 *   post:
 *     summary: Generate entity configurations based on requirements
 *     description: Generates entity configurations JavaScript code using AI or rule-based approach
 *     tags: [Project Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirementsText
 *             properties:
 *               requirementsText:
 *                 type: string
 *                 description: Detailed requirements for entities and their relationships
 *                 example: "Create a project with User and Product entities. User has fields: name, email, password. Product has fields: title, price, description, category."
 *               port:
 *                 type: integer
 *                 description: Port number for JSON-Server
 *                 default: 3002
 *                 example: 3002
 *               host:
 *                 type: string
 *                 description: Host for JSON-Server
 *                 default: localhost
 *                 example: localhost
 *               useLLM:
 *                 type: boolean
 *                 description: Whether to use AI/LLM for entity config generation (false uses rule-based generator)
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Successfully generated entity configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     entityConfigs:
 *                       type: string
 *                       example: "const userConfig = {...};\n\nconst configuredEntities = [...];"
 *                     entities:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "User"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/entity-configs', validate(schemas.entityConfigs), async (req, res, next) => {
  try {
    const { requirementsText, port = 3002, host = 'localhost', useLLM = false } = req.body;
    
    console.log(`Generating entity configurations for requirements`);
    
    // Use the entityConfigGenerator directly
    const entityConfigGenerator = require('../utils/entity-config-generator');
    const genAIService = require('../services/gen-ai.service');
    
    try {
      let entityConfigs;
      let entities = [];
      
      if (useLLM) {
        // Use LLM to generate entity configurations
        try {
          console.log('Using LLM to generate entity configurations');
          // Call the AI service
          const response = await Promise.race([
            genAIService.generateCode({
              prompt: `Generate JavaScript code for entity configurations based on these requirements: ${requirementsText}

The output should be in this format:
const entityConfig = {
  entityName: 'entityNamePlural in lowercase',
  title: 'Entity Title',
  apiBaseUrl: 'http://${host}:${port}',
  itemsPerPage: 10,
  attributes: [
    { 
      name: 'attributeName', 
      label: 'Attribute Label', 
      type: 'text|number|email|date|select|checkbox|textarea', 
      required: true|false,
      // Additional properties based on type:
      // For number: min, max, step, prefix
      // For select: options array with value/label pairs
      // For checkbox: checkboxLabel
      // For any: helpText, hideInTable
    }
  ]
};

Finally, export all configs in an array like this:
const configuredEntities = [{name: 'entityName', config: entityConfig}, ...];
`,
              language: 'javascript',
              comments: false,
              maxTokens: 4096
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI service timeout')), 60000)
            )
          ]);
          
          if (response && (response.text || response.code || response.content)) {
            entityConfigs = response.text || response.code || response.content;
          } else if (typeof response === 'string') {
            entityConfigs = response;
          } else {
            throw new Error('Unable to extract valid code from AI response');
          }
          
          // Extract entity names from the generated code (simple regex approach)
          const entityRegex = /const\s+(\w+)Config\s*=/g;
          let match;
          while ((match = entityRegex.exec(entityConfigs)) !== null) {
            const configName = match[1];
            // Convert camelCase to Capitalized
            const entityName = configName.charAt(0).toUpperCase() + configName.slice(1);
            entities.push(entityName);
          }
          
          if (entities.length === 0) {
            // Fallback entity extraction from requirements
            const extractedEntities = entityConfigGenerator.extractEntitiesFromRequirements(requirementsText);
            entities = extractedEntities.map(entity => entity.name);
          }
          
        } catch (llmError) {
          console.error('Error generating entity configs with LLM:', llmError);
          console.log('Falling back to rule-based generator');
          // Fallback to rule-based
          entityConfigs = entityConfigGenerator.generateEntityConfigsCode(requirementsText, port, host);
          
          // Extract entities
          const extractedEntities = entityConfigGenerator.extractEntitiesFromRequirements(requirementsText);
          entities = extractedEntities.map(entity => entity.name);
        }
      } else {
        // Use rule-based generator
        console.log('Using rule-based generator for entity configurations');
        entityConfigs = entityConfigGenerator.generateEntityConfigsCode(requirementsText, port, host);
        
        // Extract entities
        const extractedEntities = entityConfigGenerator.extractEntitiesFromRequirements(requirementsText);
        entities = extractedEntities.map(entity => entity.name);
      }
      
      // Return the generated entity configurations
      res.status(200).json({
        success: true,
        data: {
          entityConfigs,
          entities
        }
      });
    } catch (error) {
      console.error('Error generating entity configurations:', error);
      next(new ApiError(`Failed to generate entity configurations: ${error.message}`, 500, 'ENTITY_CONFIG_GENERATION_ERROR'));
    }
  } catch (error) {
    console.error('Error processing request:', error);
    next(new ApiError(`Error processing request: ${error.message}`, 500, 'REQUEST_PROCESSING_ERROR'));
  }
});

/**
 * @swagger
 * /generate/project/scenario:
 *   post:
 *     summary: Generate a scenario HTML page for a project
 *     description: Creates a custom HTML page for a given scenario that uses the generated entity APIs
 *     tags: [Project Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - scenarioDescription
 *               - scenarioName
 *             properties:
 *               projectName:
 *                 type: string
 *                 description: Name of the existing project
 *                 example: e-commerce-api
 *               scenarioDescription:
 *                 type: string
 *                 description: Detailed description of the scenario (workflow)
 *                 example: "Create a dashboard that shows the count of products by category, with a form to add new products and a table to view all users."
 *               scenarioName:
 *                 type: string
 *                 description: Name for the scenario (used for file naming and navbar entry)
 *                 example: Dashboard
 *     responses:
 *       200:
 *         description: Successfully generated scenario page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Scenario page generated successfully"
 *                     scenarioPath:
 *                       type: string
 *                       example: "/path/to/generated/scenario.html"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/scenario', validate(schemas.scenarioGeneration), async (req, res, next) => {
  try {
    const { projectName, scenarioDescription, scenarioName } = req.body;
    
    // Check if project exists
    const projectPath = path.resolve(process.cwd(), projectName);
    try {
      await fs.access(projectPath);
    } catch (error) {
      return next(new ApiError(`Project "${projectName}" not found`, 404, 'PROJECT_NOT_FOUND'));
    }
    
    // Check if static folder exists
    const staticPath = path.join(projectPath, 'static');
    try {
      await fs.access(staticPath);
    } catch (error) {
      return next(new ApiError(`Static folder not found in project "${projectName}"`, 404, 'STATIC_FOLDER_NOT_FOUND'));
    }
    
    // Read entity-configs.js file to understand the entities
    const entityConfigsPath = path.join(staticPath, 'entity-configs.js');
    let entityConfigsContent;
    try {
      entityConfigsContent = await fs.readFile(entityConfigsPath, 'utf-8');
    } catch (error) {
      return next(new ApiError(`Failed to read entity configurations for project "${projectName}"`, 500, 'ENTITY_CONFIG_READ_ERROR'));
    }
    
    // Generate the scenario HTML
    const genAIService = require('../services/gen-ai.service');
    console.log(`Generating scenario page for "${scenarioName}"`);
    
    try {
      // Use AI service to generate scenario HTML
      const prompt = `Generate an HTML page for a scenario called "${scenarioName}" with the following description: "${scenarioDescription}"

This page will be part of a JSON-Server project that has the following entity configurations:
${entityConfigsContent}

IMPORTANT: The page should use the common navbar structure of the project by including it like this:
  
Add the following to the head section of the HTML file:
  <!-- PLUGINS CSS STYLE -->
  <link rel="stylesheet" href="plugins/bootstrap/bootstrap.min.css">
  <link rel="stylesheet" href="plugins/themify-icons/themify-icons.css">
  <link rel="stylesheet" href="plugins/slick/slick.css">
  <link rel="stylesheet" href="plugins/slick/slick-theme.css">
  <link rel="stylesheet" href="plugins/fancybox/jquery.fancybox.min.css">
  <link rel="stylesheet" href="plugins/aos/aos.css">

  <!-- CUSTOM CSS -->
  <link href="css/style.css" rel="stylesheet">

Add the following to the body section of the HTML file:
<!-- Include Navbar Script -->
<div id="navbar-container"></div>
<script src="js/include-navbar.js"></script>

The HTML should:
1. Use Bootstrap 5 for styling
2. Use Font Awesome 6 for icons
3. Use jQuery for AJAX calls and DOM manipulation
4. Include a full working implementation of the scenario
5. Make API calls to the entity endpoints as defined in the entity configurations
6. Include proper error handling for all API calls
7. Have a clean, modern design with responsive layout

Each entity has standard REST endpoints at:
- GET /{entityName} - Gets all records
- GET /{entityName}/{id} - Gets a single record by ID
- POST /{entityName} - Creates a new record
- PUT /{entityName}/{id} - Updates a record
- DELETE /{entityName}/{id} - Deletes a record

The code should be fully functional without needing any additional libraries or dependencies.
Ensure the code handles all API calls properly with loading states and error handling.

The page should follow the same structure as other pages in the project, with included navbar at the top.
The final HTML file must be a complete standalone file with all necessary CSS and JavaScript included.`;

      console.log('Sending prompt to AI service:', prompt);

      const scenarioHtmlResponse = await Promise.race([
        genAIService.generateCode({
          prompt,
          language: 'html',
          comments: true,
          maxTokens: 8192
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI service timeout')), 240000)
        )
      ]);
      
      let scenarioHtml;
      if (scenarioHtmlResponse && (scenarioHtmlResponse.text || scenarioHtmlResponse.code || scenarioHtmlResponse.content)) {
        scenarioHtml = scenarioHtmlResponse.text || scenarioHtmlResponse.code || scenarioHtmlResponse.content;
      } else if (typeof scenarioHtmlResponse === 'string') {
        scenarioHtml = scenarioHtmlResponse;
      } else {
        throw new Error('Unable to extract valid HTML from AI response');
      }
      
      // Save the scenario HTML file
      const filename = scenarioName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.html';
      const scenarioPath = path.join(staticPath,'theme1', filename);
      await fs.writeFile(scenarioPath, scenarioHtml);
      
      // Update index.html to add the scenario to the navbar
      await updateNavbar(projectPath, scenarioName, filename);
      
      res.status(200).json({
        success: true,
        data: {
          message: `Scenario page "${scenarioName}" has been generated successfully.`,
          scenarioPath,
          scenarioFilename: filename
        }
      });
    } catch (error) {
      console.error('Error generating scenario HTML:', error);
      return next(new ApiError(`Failed to generate scenario HTML: ${error.message}`, 500, 'SCENARIO_GENERATION_ERROR'));
    }
  } catch (error) {
    console.error('Error in scenario generation endpoint:', error);
    next(new ApiError(`Failed to generate scenario: ${error.message}`, 500, 'SCENARIO_GENERATION_ERROR'));
  }
});

/**
 * Update the project's index.html to add the new scenario to the navbar
 * @param {string} projectPath - Path to the project
 * @param {string} scenarioName - Name of the scenario
 * @param {string} filename - Filename of the scenario HTML
 */
async function updateNavbar(projectPath, scenarioName, filename) {
  const indexPath = path.join(projectPath, 'static', 'index.html');
  
  try {
    // Check if index.html exists
    await fs.access(indexPath);
    
    // Read the index.html file
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    
    // Check if the project uses a menu configuration array
    if (indexContent.includes('const menuConfig =')) {
      // Find the menuConfig array
      const menuConfigRegex = /(const\s+menuConfig\s*=\s*\[)([\s\S]*?)(\];)/m;
      const menuConfigMatch = indexContent.match(menuConfigRegex);
      
      if (menuConfigMatch) {
        // Check if the scenario is already in the menu
        if (!indexContent.includes(`name: '${scenarioName}'`)) {
          // Add the scenario to the menu
          const scenarioMenuItem = `    { name: '${scenarioName}', icon: 'fa-diagram-project', url: '${filename}' },`;
          
          // Insert the new menu item before the closing bracket
          const updatedMenuConfig = `${menuConfigMatch[1]}${menuConfigMatch[2]}${scenarioMenuItem}\n${menuConfigMatch[3]}`;
          indexContent = indexContent.replace(menuConfigRegex, updatedMenuConfig);
          
          // Write the updated content back to the file
          await fs.writeFile(indexPath, indexContent);
        }
      }
    } else {
      console.log('Could not find menuConfig array in index.html, skipping navbar update');
    }
    
    // Also update navbar-config.json if it exists
    const navbarConfigPath = path.join(projectPath, 'static', 'theme1', 'config', 'navbar-config.json');
    try {
      await fs.access(navbarConfigPath);
      
      // Read navbar config
      const navbarConfigContent = await fs.readFile(navbarConfigPath, 'utf-8');
      const navbarConfig = JSON.parse(navbarConfigContent);
      
      // Check if the scenario is already in the menu
      const existingEntry = navbarConfig.menus.find(menu => menu.title === scenarioName);
      
      if (!existingEntry) {
        // Create new menu entry
        const newMenuItem = {
          title: scenarioName,
          url: filename,
          varname: scenarioName.toLowerCase().replace(/[^a-z0-9]/g, '')
        };
        
        // Add to menus array
        navbarConfig.menus.push(newMenuItem);
        
        // Write updated config back to file
        await fs.writeFile(navbarConfigPath, JSON.stringify(navbarConfig, null, 4));
        console.log(`Added "${scenarioName}" to navbar-config.json`);
      }
    } catch (navbarError) {
      console.error('Error updating navbar-config.json:', navbarError);
      // If the directory doesn't exist, create it and add a basic navbar config
      if (navbarError.code === 'ENOENT') {
        try {
          // Create config directory if it doesn't exist
          const configDir = path.join(projectPath, 'static', 'config');
          await fs.mkdir(configDir, { recursive: true });
          
          // Create a basic navbar config
          const navbarConfig = {
            brand: {
              url: "index.html",
              logo: "images/logo.png",
              alt: "logo"
            },
            menus: [
              {
                title: "Home",
                url: "index.html",
                varname: "home",
                active: true
              },
              {
                title: "Entities",
                url: "crud.html",
                varname: "entities"
              },
              {
                title: scenarioName,
                url: filename,
                varname: scenarioName.toLowerCase().replace(/[^a-z0-9]/g, '')
              }
            ]
          };
          
          // Write the config file
          await fs.writeFile(navbarConfigPath, JSON.stringify(navbarConfig, null, 4));
          console.log(`Created navbar-config.json with "${scenarioName}" entry`);
        } catch (createError) {
          console.error('Error creating navbar-config.json:', createError);
        }
      }
    }
  } catch (error) {
    console.error('Error updating navbar:', error);
    // We'll continue even if navbar update fails
  }
}

/**
 * @swagger
 * /generate/project/mock-data:
 *   post:
 *     summary: Generate mock data for entities in a project
 *     description: Creates realistic mock data for all entities defined in the project using LLM or Faker
 *     tags: [Project Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *             properties:
 *               projectName:
 *                 type: string
 *                 description: Name of the existing project
 *                 example: e-commerce-api
 *               recordsPerEntity:
 *                 type: integer
 *                 description: Number of records to generate per entity
 *                 default: 5
 *                 example: 5
 *               useLLM:
 *                 type: boolean
 *                 description: Whether to use LLM for data generation (true) or use Faker.js (false)
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: Successfully generated mock data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Mock data generated successfully"
 *                     dbFilePath:
 *                       type: string
 *                       example: "/path/to/db.json"
 *                     entities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "users"
 *                           count:
 *                             type: integer
 *                             example: 5
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/mock-data', validate(schemas.mockDataGeneration), async (req, res, next) => {
  try {
    const { projectName, recordsPerEntity = 5, useLLM = true } = req.body;
    
    // Check if project exists
    const projectPath = path.resolve(process.cwd(), projectName);
    try {
      await fs.access(projectPath);
    } catch (error) {
      return next(new ApiError(`Project "${projectName}" not found`, 404, 'PROJECT_NOT_FOUND'));
    }
    
    // Load entity configurations from file
    const entityConfigsPath = path.join(projectPath, 'static', 'entity-configs.js');
    let entityConfigsContent;
    try {
      entityConfigsContent = await fs.readFile(entityConfigsPath, 'utf-8');
    } catch (error) {
      return next(new ApiError(`Entity configurations not found for project "${projectName}"`, 404, 'ENTITY_CONFIGS_NOT_FOUND'));
    }
    
    // Create temporary file to require the entity configurations
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore if directory exists
    }
    
    const tempFilePath = path.join(tempDir, `_temp_config_${Date.now()}.js`);
    try {
      // Add module.exports to the entity configurations
      await fs.writeFile(tempFilePath, entityConfigsContent + '\nmodule.exports = { configuredEntities };');
       
       // Load the configurations
       const entityConfigs = require(tempFilePath).configuredEntities;
      
      // Set up generator options
      const options = {
        recordsPerEntity,
        outputFile: path.join(projectPath, 'db', 'db.json')
      };
      
      let mockData;
      
      if (useLLM) {
        // Use LLM for mock data generation
        console.log(`Using LLM to generate ${recordsPerEntity} records per entity`);
        const genAIService = require('../services/gen-ai.service');
        
        // Prepare mockData object structure
        mockData = {};
        
        // Process each entity
        for (const entity of entityConfigs) {
          const entityName = entity.config.entityName;
          console.log(`Generating mock data for ${entityName} using LLM...`);
          
          // Build a prompt for each entity
          const attributesDescription = entity.config.attributes
            .map(attr => `- ${attr.name} (${attr.type}${attr.required ? ', required' : ''}): ${attr.label}`)
            .join('\n');
          
          const prompt = `Generate ${recordsPerEntity} realistic mock data records for a "${entity.name}" entity with the following attributes:

${attributesDescription}

Each record should have an "id" field (integer starting from 1) and values for all the attributes.
The data should be realistic and appropriate for each field type.
Return the data as a valid JSON array without any explanation.`;
          
          try {
            // Call LLM to generate data
            const response = await Promise.race([
              genAIService.generateCode({
                prompt,
                language: 'json',
                comments: false,
                maxTokens: 4096
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI service timeout')), 60000)
              )
            ]);
            
            let generatedData;
            
            // Extract the data from the response
            if (response && (response.text || response.code || response.content)) {
              generatedData = response.text || response.code || response.content;
            } else if (typeof response === 'string') {
              generatedData = response;
            } else {
              throw new Error(`Unable to extract valid JSON from AI response for ${entityName}`);
            }
            
            // Clean up the response to extract just the JSON array
            generatedData = generatedData.trim();
            if (generatedData.startsWith('```json')) {
              generatedData = generatedData.substring(7);
            }
            if (generatedData.startsWith('```')) {
              generatedData = generatedData.substring(3);
            }
            if (generatedData.endsWith('```')) {
              generatedData = generatedData.substring(0, generatedData.length - 3);
            }
            
            // Parse the JSON data
            const entityData = JSON.parse(generatedData);
            
            // Store in mockData object
            mockData[entityName] = entityData;
            
            console.log(`Generated ${entityData.length} records for ${entityName}`);
          } catch (error) {
            console.error(`Error generating mock data for ${entityName}:`, error);
            // Create empty array if generation fails
            mockData[entityName] = [];
          }
        }
      } else {
        // Use the built-in mock data generator (Faker.js)
        console.log(`Using Faker.js to generate ${recordsPerEntity} records per entity`);
        
        // Import the mock data generator from templates
        const mockDataGeneratorModule = require(path.join(__dirname, '..', 'templates', 'mock', 'mock-data-generator.js'));
        
        // Generate the mock data
        const generator = new mockDataGeneratorModule.MockDataGenerator(entityConfigs, options);
        mockData = await generator.generateMockData();
      }
      
      // Write the mock data to db.json
      const dbFilePath = path.join(projectPath, 'db', 'db.json');
      await fs.writeFile(dbFilePath, JSON.stringify(mockData, null, 2));
      
      // Prepare the response with entity counts
      const entities = Object.keys(mockData).map(entityName => ({
        name: entityName,
        count: mockData[entityName].length
      }));
      
      res.status(200).json({
        success: true,
        data: {
          message: `Mock data generated successfully using ${useLLM ? 'LLM' : 'Faker.js'}`,
          dbFilePath,
          entities
        }
      });
    } catch (error) {
      console.error('Error generating mock data:', error);
      return next(new ApiError(`Failed to generate mock data: ${error.message}`, 500, 'MOCK_DATA_GENERATION_ERROR'));
    } finally {
      // Clean up temporary file
      try {
        if (fsSync.existsSync(tempFilePath)) {
          fsSync.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error in mock data generation endpoint:', error);
    next(new ApiError(`Failed to process request: ${error.message}`, 500, 'REQUEST_PROCESSING_ERROR'));
  }
});

router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Project generation API is working'
  });
});

module.exports = router; 