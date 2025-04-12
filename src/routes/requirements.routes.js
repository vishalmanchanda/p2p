const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validator');
const requirementsService = require('../services/requirements-generator');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs/promises');
const fetch = require('node-fetch');

// Define validation schema for structured requirements generation
if (!schemas.structuredRequirementsGeneration) {
  schemas.structuredRequirementsGeneration = require('joi').object({
    basicRequirements: require('joi').string().required().min(10).max(5000)
      .messages({
        'string.empty': 'Basic requirements text is required',
        'string.min': 'Basic requirements text must be at least 10 characters',
        'string.max': 'Basic requirements text must be at most 5000 characters',
        'any.required': 'Basic requirements text is required'
      }),
    modelName: require('joi').string().default('deepseek-r1:8b')
      .messages({
        'string.base': 'Model name must be a string'
      })
  });
}

// Define validation schema for structured requirements enhancement
if (!schemas.structuredRequirementsEnhancement) {
  schemas.structuredRequirementsEnhancement = require('joi').object({
    structuredRequirements: require('joi').object().required()
      .messages({
        'object.base': 'Structured requirements must be a valid object',
        'any.required': 'Structured requirements are required'
      }),
    enhancementPrompt: require('joi').string().required().min(5).max(1000)
      .messages({
        'string.empty': 'Enhancement prompt is required',
        'string.min': 'Enhancement prompt must be at least 5 characters',
        'string.max': 'Enhancement prompt must be at most 1000 characters',
        'any.required': 'Enhancement prompt is required'
      }),
    modelName: require('joi').string().default('deepseek-r1:8b')
      .messages({
        'string.base': 'Model name must be a string'
      })
  });
}

// Define validation schema for saving requirements
if (!schemas.saveRequirements) {
  schemas.saveRequirements = require('joi').object({
    fileName: require('joi').string().required().min(1).max(100)
      .pattern(/^[a-zA-Z0-9-_]+\.json$/)
      .messages({
        'string.empty': 'File name is required',
        'string.min': 'File name must be at least 1 character',
        'string.max': 'File name must be at most 100 characters',
        'string.pattern.base': 'File name must end with .json and contain only letters, numbers, hyphens, and underscores',
        'any.required': 'File name is required'
      }),
    requirements: require('joi').object().required()
      .messages({
        'object.base': 'Requirements must be a valid object',
        'any.required': 'Requirements are required'
      }),
    entityConfigsFileName: require('joi').string().required().min(1).max(100)
      .pattern(/^[a-zA-Z0-9-_]+\.js$/)
      .messages({
        'string.empty': 'Entity configs file name is required',
        'string.min': 'Entity configs file name must be at least 1 character',
        'string.max': 'Entity configs file name must be at most 100 characters',
        'string.pattern.base': 'Entity configs file name must end with .js and contain only letters, numbers, hyphens, and underscores',
        'any.required': 'Entity configs file name is required'
      }),
    entityConfigs: require('joi').string().required()
      .messages({
        'string.empty': 'Entity configs are required',
        'string.base': 'Entity configs must be a string',
        'any.required': 'Entity configs are required'
      })
  });
}

/**
 * @swagger
 * /generate/requirements/structured:
 *   post:
 *     summary: Generate structured requirements from basic requirements
 *     description: Takes basic requirements text and converts it into structured requirements covering personas, goals, features, data, workflows, and constraints
 *     tags: [Requirements Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basicRequirements
 *             properties:
 *               basicRequirements:
 *                 type: string
 *                 description: Basic requirements text provided by the user
 *                 example: "Build a task management system for small teams. It should allow users to create, assign, and track tasks."
 *               modelName:
 *                 type: string
 *                 description: Name of the LLM model to use
 *                 default: deepseek-r1:8b
 *                 example: deepseek-r1:8b
 *     responses:
 *       200:
 *         description: Successfully generated structured requirements
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
 *                     personas:
 *                       type: array
 *                       items:
 *                         type: object
 *                     goals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     coreFeatures:
 *                       type: array
 *                       items:
 *                         type: object
 *                     keyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                     workflows:
 *                       type: array
 *                       items:
 *                         type: object
 *                     constraints:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/structured', validate(schemas.structuredRequirementsGeneration), async (req, res, next) => {
  try {
    const { basicRequirements, modelName } = req.body;
    
    console.log(`Generating structured requirements from basic requirements`);
    
    // Set a timeout in case the generation gets stuck
    const timeout = setTimeout(() => {
      console.error('Structured requirements generation timed out after 60 seconds');
      return next(new ApiError('Structured requirements generation timed out', 504, 'REQUIREMENTS_GENERATION_TIMEOUT'));
    }, 180000); // 60 second timeout
    
    try {
      // Generate structured requirements
      const result = await requirementsService.generateStructuredRequirements(
        basicRequirements,
        modelName
      );
      
      // Clear the timeout since we got a response
      clearTimeout(timeout);
      
      if (!result.success) {
        return next(new ApiError(result.error.message, 500, 'REQUIREMENTS_GENERATION_FAILED'));
      }
      
      res.status(200).json(result);
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/requirements/enhance:
 *   post:
 *     summary: Enhance structured requirements based on user feedback
 *     description: Takes existing structured requirements and a user feedback prompt to enhance or modify the requirements
 *     tags: [Requirements Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - structuredRequirements
 *               - enhancementPrompt
 *             properties:
 *               structuredRequirements:
 *                 type: object
 *                 description: The existing structured requirements object
 *               enhancementPrompt:
 *                 type: string
 *                 description: User's feedback or enhancement request
 *                 example: "Add more details about mobile user requirements and security constraints"
 *               modelName:
 *                 type: string
 *                 description: Name of the LLM model to use
 *                 default: deepseek-r1:8b
 *                 example: deepseek-r1:8b
 *     responses:
 *       200:
 *         description: Successfully enhanced structured requirements
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
 *                     personas:
 *                       type: array
 *                       items:
 *                         type: object
 *                     goals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     coreFeatures:
 *                       type: array
 *                       items:
 *                         type: object
 *                     keyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                     workflows:
 *                       type: array
 *                       items:
 *                         type: object
 *                     constraints:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/enhance', validate(schemas.structuredRequirementsEnhancement), async (req, res, next) => {
  try {
    const { structuredRequirements, enhancementPrompt, modelName } = req.body;
    
    console.log(`Enhancing structured requirements based on user feedback`);
    
    // Set a timeout in case the enhancement gets stuck
    const timeout = setTimeout(() => {
      console.error('Structured requirements enhancement timed out after 60 seconds');
      return next(new ApiError('Structured requirements enhancement timed out', 504, 'REQUIREMENTS_ENHANCEMENT_TIMEOUT'));
    }, 60000); // 60 second timeout
    
    try {
      // Enhance structured requirements
      const result = await requirementsService.enhanceStructuredRequirements(
        structuredRequirements,
        enhancementPrompt,
        modelName
      );
      
      // Clear the timeout since we got a response
      clearTimeout(timeout);
      
      if (!result.success) {
        return next(new ApiError(result.error.message, 500, 'REQUIREMENTS_ENHANCEMENT_FAILED'));
      }
      
      res.status(200).json(result);
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /save-requirements:
 *   post:
 *     summary: Save requirements and entity configurations
 *     description: Saves the provided requirements to a JSON file and entity configurations to a JS file
 *     tags: [Requirements Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - requirements
 *               - entityConfigsFileName
 *               - entityConfigs
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the requirements file to save (must end with .json)
 *                 example: my-requirements.json
 *               requirements:
 *                 type: object
 *                 description: The requirements object to save
 *               entityConfigsFileName:
 *                 type: string
 *                 description: Name of the entity configs file to save (must end with .js)
 *                 example: my-requirements-entity-configs.js
 *               entityConfigs:
 *                 type: string
 *                 description: The entity configurations code to save
 *     responses:
 *       200:
 *         description: Successfully saved files
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
 *                       example: "Files saved successfully"
 *                     requirementsPath:
 *                       type: string
 *                       example: "/public/requirements/my-requirements.json"
 *                     entityConfigsPath:
 *                       type: string
 *                       example: "/public/requirements/my-requirements-entity-configs.js"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/save-requirements', validate(schemas.saveRequirements), async (req, res, next) => {
  try {
    const { fileName, requirements, entityConfigsFileName, entityConfigs } = req.body;
    
    // Create the directory if it doesn't exist
    const dirPath = path.join(process.cwd(), 'public', 'requirements');
    await fs.mkdir(dirPath, { recursive: true });
    
    // Save the requirements to a JSON file
    const requirementsPath = path.join(dirPath, fileName);
    await fs.writeFile(requirementsPath, JSON.stringify(requirements, null, 2));

    // Save the entity configurations to a JS file
    const entityConfigsPath = path.join(dirPath, entityConfigsFileName);
    await fs.writeFile(entityConfigsPath, entityConfigs);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Files saved successfully',
        requirementsPath: `/public/requirements/${fileName}`,
        entityConfigsPath: `/public/requirements/${entityConfigsFileName}`
      }
    });
  } catch (error) {
    console.error('Error saving files:', error);
    next(new ApiError(`Failed to save files: ${error.message}`, 500, 'FILES_SAVE_ERROR'));
  }
});

/**
 * @swagger
 * /generate/requirements/list-recommendations:
 *   post:
 *     summary: Generate UI recommendations based on requirements
 *     description: Takes structured requirements and generates UI recommendations including pages, components, and workflows
 *     tags: [Requirements Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirements
 *             properties:
 *               requirements:
 *                 type: object
 *                 description: The structured requirements object containing personas, goals, features, etc.
 *                 properties:
 *                   personas:
 *                     type: array
 *                     items:
 *                       type: object
 *                   goals:
 *                     type: array
 *                     items:
 *                       type: object
 *                   coreFeatures:
 *                     type: array
 *                     items:
 *                       type: object
 *                   keyData:
 *                     type: object
 *                   workflows:
 *                     type: array
 *                     items:
 *                       type: object
 *                   constraints:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Successfully generated recommendations
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
 *                     pages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           features:
 *                             type: array
 *                             items:
 *                               type: string
 *                           technology:
 *                             type: string
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           features:
 *                             type: array
 *                             items:
 *                               type: string
 *                           technology:
 *                             type: string
 *                     workflows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           features:
 *                             type: array
 *                             items:
 *                               type: string
 *                           technology:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/list-recommendations', async (req, res) => {
    try {
        const { requirements } = req.body;

        if (!requirements) {
            return res.status(400).json({
                success: false,
                error: { message: 'Requirements data is required' }
            });
        }

        // Set a timeout for the generation
        const timeout = setTimeout(() => {
            console.error('Recommendations generation timed out after 60 seconds');
            return res.status(504).json({
                success: false,
                error: { message: 'Recommendations generation timed out' }
            });
        }, 60000);

        try {
            // Prepare the prompt for the LLM
            const prompt = `Given the following application requirements, suggest appropriate UI components, pages, and workflows. Focus on modern, user-friendly designs and best practices.

Requirements:
${JSON.stringify(requirements, null, 2)}

Please provide recommendations in the following format:
{
    "pages": [
        {
            "title": "Page name",
            "description": "Brief description of the page's purpose",
            "features": ["Key feature 1", "Key feature 2"],
            "technology": "Recommended technology stack"
        }
    ],
    "components": [
        {
            "title": "Component name",
            "description": "Brief description of the component's purpose",
            "features": ["Feature 1", "Feature 2"],
            "technology": "Recommended technology stack"
        }
    ],
    "workflows": [
        {
            "title": "Workflow name",
            "description": "Brief description of the workflow",
            "features": ["Step 1", "Step 2"],
            "technology": "Recommended technology stack"
        }
    ]
}

Focus on:
1. Dashboard layouts and visualizations for data-heavy features
2. Form designs and input components for data entry
3. Navigation and menu structures
4. List and table components for data display
5. Modal and dialog components for user interactions
6. Workflow wizards and step-by-step guides
7. Search and filter components
8. Notification and alert systems

Return ONLY the JSON object without any additional text or explanation.`;

            // Call the LLM to generate recommendations
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-r1:8b',
                    prompt: prompt,
                    stream: false,
                    format: 'json'
                })
            });

            // Clear the timeout since we got a response
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`LLM API error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // The LLM response is in result.response
            let recommendations;
            try {
                // Try to parse the response as JSON
                recommendations = JSON.parse(result.response);
            } catch (parseError) {
                console.error('Failed to parse LLM response as JSON:', result.response);
                throw new Error('Failed to parse recommendations from LLM');
            }

            // Validate the recommendations structure
            if (!recommendations || typeof recommendations !== 'object') {
                throw new Error('Invalid recommendations format from LLM');
            }

            // Ensure each section exists with proper structure
            const validatedRecommendations = {
                pages: Array.isArray(recommendations.pages) ? recommendations.pages : [],
                components: Array.isArray(recommendations.components) ? recommendations.components : [],
                workflows: Array.isArray(recommendations.workflows) ? recommendations.workflows : []
            };

            return res.json({
                success: true,
                data: validatedRecommendations
            });
        } catch (error) {
            // Clear the timeout in case of error
            clearTimeout(timeout);
            throw error;
        }
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

/**
 * @swagger
 * /generate-code-for-recommendation:
 *   post:
 *     summary: Generate code for a UI component or page
 *     description: Takes a recommendation and requirements to generate code for a specific UI component or page
 *     tags: [Requirements Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendation
 *               - type
 *               - requirements
 *             properties:
 *               recommendation:
 *                 type: object
 *                 description: The recommendation object for which to generate code
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *                   technology:
 *                     type: string
 *               type:
 *                 type: string
 *                 description: Type of code to generate (page, component, or workflow)
 *                 enum: [page, component, workflow]
 *               requirements:
 *                 type: object
 *                 description: The structured requirements object
 *     responses:
 *       200:
 *         description: Successfully generated code
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
 *                     code:
 *                       type: string
 *                       description: The generated code
 *                     extension:
 *                       type: string
 *                       description: The recommended file extension
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/generate-code-for-recommendation', async (req, res) => {
    try {
        const { recommendation, type, requirements } = req.body;

        if (!recommendation || !type || !requirements) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recommendation, type, and requirements data are required' }
            });
        }

        if (!['page', 'component', 'workflow'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Type must be one of: page, component, workflow' }
            });
        }

        // Set a timeout for the generation
        const timeout = setTimeout(() => {
            console.error('Code generation timed out after 60 seconds');
            return res.status(504).json({
                success: false,
                error: { message: 'Code generation timed out' }
            });
        }, 60000);

        try {
            // Prepare the prompt for code generation
            const prompt = `Generate code for a ${type} based on the following recommendation and requirements:

Recommendation:
${JSON.stringify(recommendation, null, 2)}

Application Requirements:
${JSON.stringify(requirements, null, 2)}

Please provide the code in the following format:
{
    "code": "// The actual code here",
    "extension": "appropriate file extension (js, jsx, ts, tsx, vue, etc.)"
}

Use modern best practices and include:
1. Proper imports and dependencies
2. Component structure and styling
3. State management if needed
4. Error handling
5. Loading states
6. Responsive design
7. Accessibility features
8. Comments explaining complex logic`;

            // Call the LLM to generate code
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-r1:8b',
                    prompt: prompt,
                    format: 'json'
                })
            });

            // Clear the timeout since we got a response
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`LLM API error! status: ${response.status}`);
            }

            const result = await response.json();
            const generatedCode = JSON.parse(result.response);

            return res.json({
                success: true,
                data: generatedCode
            });
        } catch (error) {
            // Clear the timeout in case of error
            clearTimeout(timeout);
            throw error;
        }
    } catch (error) {
        console.error('Error generating code:', error);
        return res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

module.exports = router; 