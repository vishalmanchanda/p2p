const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseek.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /validate/content:
 *   post:
 *     summary: Validate and review content
 *     description: Uses the DeepSeek model to validate and review content based on specified criteria
 *     tags: [Content Validation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContentValidationRequest'
 *     responses:
 *       200:
 *         description: Successfully validated content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentValidationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.contentValidation), async (req, res, next) => {
  try {
    const { content, criteria, detailed } = req.body;
    
    const result = await deepseekService.validateContent({
      content,
      criteria,
      detailed
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