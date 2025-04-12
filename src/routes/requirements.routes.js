const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validator');
const requirementsService = require('../services/requirements-generator');
const { ApiError } = require('../middleware/errorHandler');

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
    }, 60000); // 60 second timeout
    
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

module.exports = router; 