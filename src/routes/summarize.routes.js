const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseek.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /summarize:
 *   post:
 *     summary: Summarize content
 *     description: Uses the DeepSeek model to summarize content with customizable length and style
 *     tags: [Content Summarization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SummarizationRequest'
 *     responses:
 *       200:
 *         description: Successfully summarized content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SummarizationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.summarization), async (req, res, next) => {
  try {
    const { content, length, style } = req.body;
    
    const result = await deepseekService.summarizeContent({
      content,
      length,
      style
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