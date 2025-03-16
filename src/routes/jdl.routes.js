const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jdlGeneratorService = require('../services/jdl-generator.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/jdl:
 *   post:
 *     summary: Generate JHipster Domain Language (JDL) from requirements
 *     description: Generates JDL entity definitions and relationships based on natural language requirements. The generated JDL can be used with JHipster to scaffold a full application.
 *     tags: [JDL Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JdlGenerationRequest'
 *     responses:
 *       200:
 *         description: Successfully generated JDL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JdlGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.jdlGeneration), async (req, res, next) => {
  try {
    const { requirements, name, options } = req.body;
    
    const result = await jdlGeneratorService.generateJdl({
      requirements,
      name,
      options
    });
    
    // Validate the generated JDL
    const validationResult = await jdlGeneratorService.validateJdl(result.content);
    
    res.status(200).json({
      success: true,
      data: {
        ...result,
        validation: validationResult
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/jdl/{name}:
 *   get:
 *     summary: Get a previously generated JDL file
 *     description: Retrieves a previously generated JDL file by name.
 *     tags: [JDL Generation]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the JDL file
 *     responses:
 *       200:
 *         description: Successfully retrieved JDL file
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: JDL file not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filePath = path.join(process.cwd(), 'public', 'jdl', `${sanitizedName}.jdl`);
    
    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: `JDL file "${name}" not found`,
          code: 'JDL_FILE_NOT_FOUND'
        }
      });
    }
    
    // Read the JDL file
    const jdlContent = await fs.readFile(filePath, 'utf8');
    
    // Set content type to plain text for better display in browser
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(jdlContent);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/jdl/list:
 *   get:
 *     summary: List all generated JDL files
 *     description: Returns a list of all JDL files that have been generated.
 *     tags: [JDL Generation]
 *     responses:
 *       200:
 *         description: Successfully retrieved JDL file list
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
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: e-commerce
 *                           url:
 *                             type: string
 *                             example: /public/jdl/e-commerce.jdl
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/list/all', async (req, res, next) => {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'jdl');
    
    try {
      // Check if directory exists
      await fs.access(dirPath);
    } catch (error) {
      // If directory doesn't exist, create it and return empty list
      await fs.mkdir(dirPath, { recursive: true });
      return res.status(200).json({
        success: true,
        data: {
          files: []
        }
      });
    }
    
    // Get all JDL files in the directory
    const files = await fs.readdir(dirPath);
    const jdlFiles = files
      .filter(file => file.endsWith('.jdl'))
      .map(file => ({
        name: file.replace('.jdl', ''),
        url: `/public/jdl/${file}`
      }));
    
    res.status(200).json({
      success: true,
      data: {
        files: jdlFiles
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 