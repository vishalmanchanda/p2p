const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const prototypeBuilderService = require('../services/prototype-builder.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/prototype-builder:
 *   post:
 *     summary: Generate HTML prototype by assembling sections
 *     description: Builds a complete HTML prototype by generating and assembling multiple sections. Each section is created individually using the LLM and then combined into a final HTML file.
 *     tags: [Prototype Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrototypeBuilderRequest'
 *     responses:
 *       200:
 *         description: Successfully generated HTML prototype
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeBuilderResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.prototypeBuilder), async (req, res, next) => {
  try {
    const { scenario, name, sections, features } = req.body;
    
    const result = await prototypeBuilderService.buildPrototype({
      scenario,
      name,
      sections,
      features
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/prototype-builder/section:
 *   post:
 *     summary: Generate a single section for an HTML prototype
 *     description: Generates a single section of an HTML prototype based on the provided description. The section is saved as a separate file that can be later assembled into a complete prototype.
 *     tags: [Prototype Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionGenerationRequest'
 *     responses:
 *       200:
 *         description: Successfully generated section
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SectionGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/section', validate(schemas.sectionGeneration), async (req, res, next) => {
  try {
    const { scenario, name, section, features } = req.body;
    
    const result = await prototypeBuilderService.generateSection({
      scenario,
      name,
      section,
      features
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/prototype-builder/{name}/sections:
 *   get:
 *     summary: List all generated sections for a prototype
 *     description: Returns a list of all sections that have been generated for a specific prototype.
 *     tags: [Prototype Generation]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the prototype
 *     responses:
 *       200:
 *         description: Successfully retrieved sections
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
 *                     name:
 *                       type: string
 *                       example: TaskMaster
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['header', 'main', 'features', 'footer']
 *       404:
 *         description: Prototype not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:name/sections', async (req, res, next) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dirPath = path.join(process.cwd(), 'public', sanitizedName);
    
    try {
      // Check if directory exists
      await fs.access(dirPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Prototype "${name}" not found`,
          code: 'PROTOTYPE_NOT_FOUND'
        }
      });
    }
    
    // Get all HTML files in the directory
    const files = await fs.readdir(dirPath);
    const sections = files
      .filter(file => file.endsWith('.html') && file !== 'index.html')
      .map(file => file.replace('.html', ''));
    
    res.status(200).json({
      success: true,
      data: {
        name,
        sections
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 