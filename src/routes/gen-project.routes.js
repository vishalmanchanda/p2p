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
              setTimeout(() => reject(new Error('AI service timeout')), 30000)
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

router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Project generation API is working'
  });
});

module.exports = router; 