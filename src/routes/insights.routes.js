const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseek.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /derive/insights:
 *   post:
 *     summary: Derive insights from content
 *     description: Uses the DeepSeek model to derive insights from content with customizable perspective and focus areas
 *     tags: [Insight Derivation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsightDerivationRequest'
 *     responses:
 *       200:
 *         description: Successfully derived insights
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsightDerivationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.insightDerivation), async (req, res, next) => {
  try {
    const { content, perspective, focusAreas } = req.body;
    
    const result = await deepseekService.deriveInsights({
      content,
      perspective,
      focusAreas
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