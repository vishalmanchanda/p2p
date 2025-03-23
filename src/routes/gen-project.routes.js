const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
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
    const { projectName, requirementsText, port, host, staticFolder } = req.body;
    
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
          host
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

router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Project generation API is working'
  });
});

module.exports = router; 