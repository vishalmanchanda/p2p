const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const genAIService = require('../services/gen-ai.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/prototype:
 *   post:
 *     summary: Generate HTML prototype based on a scenario
 *     description: Uses the  model to generate a professional HTML prototype with Tailwind CSS, jQuery, and Font Awesome based on the provided scenario description. The generated prototype is saved to the public directory.
 *     tags: [Prototype Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrototypeGenerationRequest'
 *     responses:
 *       200:
 *         description: Successfully generated HTML prototype
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.prototypeGeneration), async (req, res, next) => {
  try {
    const { scenario, name, features } = req.body;
    
    // Sanitize the name for use as a directory name
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Create the prompt for the code generation
    const prompt = `
Create a professional-looking HTML prototype for the following scenario: ${scenario}

The prototype should:
${features ? `- Include these specific features: ${features.join(', ')}` : ''}
- Use HTML5, jQuery, Tailwind CSS v4, and Font Awesome icons
- Be responsive and mobile-friendly
- Have a clean, modern design
- Include realistic placeholder content
- Be fully functional with interactive elements
- Use best practices for accessibility

The HTML should include:
1. Proper HTML5 document structure
2. CDN links for jQuery, Tailwind CSS v4, and Font Awesome
3. Responsive navigation
4. Appropriate sections based on the scenario
5. Interactive elements (forms, buttons, etc.) with jQuery functionality
6. Footer with copyright and links

Return ONLY the complete HTML code for the prototype.
`;

    // Generate the HTML code
    const result = await genAIService.generateCode({
      prompt,
      language: 'html',
      comments: false,
      maxTokens: 4096 // Larger token limit for complex HTML
    });
    
    // Create the directory structure
    const dirPath = path.join(process.cwd(), 'public', sanitizedName);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Save the HTML file
    const filePath = path.join(dirPath, 'index.html');
    await fs.writeFile(filePath, result.code);
    
    // Generate the URL for accessing the prototype
    const prototypeUrl = `/public/${sanitizedName}/index.html`;
    
    res.status(200).json({
      success: true,
      data: {
        message: `HTML prototype for "${name}" has been generated successfully.`,
        scenario: scenario,
        filePath: filePath,
        url: prototypeUrl,
        model: result.model
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 