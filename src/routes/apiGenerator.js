const express = require('express');
const router = express.Router();
const apiGeneratorService = require('../services/apiGeneratorService');
const path = require('path');

/** @swagger
 * /generator/api-js:
 *   post:
 *     summary: Generate a custom API.js file based on provided entities
 *     description: Generates a custom API.js file for your entities
 *     tags:
 *       - API Generator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryEntities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum:
 *                         - blogs
 *                         - authors
 *                         - comments
 *                         - profile
 *                         - tasks
 *                         - projects
 *                         - users
 *                         - roles
 *                         - permissions
 *                         - categories
 *                         - cards
 *                         - checklists
 *  
 *     responses:
 *       200:
 *         description: Successfully generated API.js file
 *         content:
 *           application/json:
 *             schema:
 *               type: object   
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 path:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post('/', async (req, res) => {
  try {
    const {
      primaryEntities,
      relationHandlers,
      forms,
      searchConfig,
      defaultTab,
      relatedSections,
      renderFunctions,
      baseUrl,
      outputPath
    } = req.body;

    // Validate required fields
    if (!primaryEntities || !Array.isArray(primaryEntities) || primaryEntities.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one primary entity is required' 
      });
    }

    // Generate the API.js content
    const apiJsContent = await apiGeneratorService.generateApiJs({
      primaryEntities,
      relationHandlers,
      forms,
      searchConfig,
      defaultTab,
      relatedSections,
      renderFunctions,
      baseUrl
    });

    // If outputPath is provided, save the file
    if (outputPath) {
      // Ensure the path is within the public directory for security
      const normalizedPath = path.normalize(outputPath);
      if (!normalizedPath.startsWith('public/')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Output path must be within the public directory' 
        });
      }

      const savedPath = await apiGeneratorService.saveApiJs(apiJsContent, normalizedPath);
      
      return res.status(200).json({
        success: true,
        message: 'API.js file generated and saved successfully',
        path: savedPath,
        url: `/${savedPath.replace('public/', '')}`
      });
    }

    // If no outputPath, return the content directly
    return res.status(200).json({
      success: true,
      message: 'API.js content generated successfully',
      content: apiJsContent
    });
  } catch (error) {
    console.error('Error in API.js generation route:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate API.js',
      error: error.message
    });
  }
});

/**
 * @route GET /api/generator/template
 * @desc Get information about available entity templates
 * @access Public
 */
router.get('/template', (req, res) => {
  // Provide information about available templates and their structure
  const templateInfo = {
    availableEntities: ['blogs', 'authors', 'comments'],
    entityStructure: {
      blogs: {
        fields: ['id', 'name', 'description', 'createdAt'],
        relations: ['comments', 'author']
      },
      authors: {
        fields: ['id', 'name', 'email', 'bio'],
        relations: ['blogs']
      },
      comments: {
        fields: ['id', 'content', 'createdAt', 'blogId'],
        relations: ['blog']
      }
    },
    exampleConfig: {
      primaryEntities: [
        { type: 'blogs' },
        { type: 'authors' }
      ],
      relationHandlers: [
        { 
          parentType: 'blog', 
          parentContainer: 'blogs-list', 
          triggerClass: '.btn-view-comments', 
          relatedType: 'comments' 
        }
      ],
      forms: [
        { 
          id: 'comment-form', 
          parentType: 'blog', 
          itemType: 'comments', 
          contentField: 'comment-content' 
        }
      ],
      searchConfig: [
        {
          inputId: 'search-blogs',
          itemClass: 'blog-item'
        }
      ],
      defaultTab: 'blogs-content',
      relatedSections: ['comments']
    }
  };

  return res.status(200).json({
    success: true,
    data: templateInfo
  });
});

module.exports = router; 