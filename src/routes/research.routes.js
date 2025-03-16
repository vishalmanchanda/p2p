const express = require('express');
const router = express.Router();
const genAIService = require('../services/gen-ai.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /research/topic:
 *   post:
 *     summary: Perform research on a topic
 *     description: Uses the DeepSeek model to research a topic with customizable depth and format
 *     tags: [Topic Research]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TopicResearchRequest'
 *     responses:
 *       200:
 *         description: Successfully researched topic
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicResearchResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.topicResearch), async (req, res, next) => {
  try {
    const { topic, depth, format } = req.body;
    
    const result = await genAIService.researchTopic({
      topic,
      depth,
      format
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