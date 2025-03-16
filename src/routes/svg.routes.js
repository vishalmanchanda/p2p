const express = require('express');
const router = express.Router();
const genAIService = require('../services/gen-ai.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/svg:
 *   post:
 *     summary: Generate SVG based on description
 *     description: Uses the DeepSeek model to generate SVG code based on a description with customizable style, size, and colors
 *     tags: [SVG Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SvgGenerationRequest'
 *     responses:
 *       200:
 *         description: Successfully generated SVG
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SvgGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.svgGeneration), async (req, res, next) => {
  try {
    const { description, style, size, colors } = req.body;
    
    const result = await genAIService.generateSvg({
      description,
      style,
      size,
      colors
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 