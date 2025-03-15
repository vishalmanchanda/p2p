const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseek.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/code:
 *   post:
 *     summary: Generate code based on a prompt
 *     description: Uses the DeepSeek model to generate code based on the provided requirements
 *     tags: [Code Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CodeGenerationRequest'
 *     responses:
 *       200:
 *         description: Successfully generated code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CodeGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.codeGeneration), async (req, res, next) => {
  try {
    const { prompt, language, comments, maxTokens } = req.body;
    
    const result = await deepseekService.generateCode({
      prompt,
      language,
      comments,
      maxTokens
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