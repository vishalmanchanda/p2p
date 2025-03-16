const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jdlToJsonService = require('../services/jdl-to-json.service');
const jdlGeneratorService = require('../services/jdl-generator.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/jdl-to-json:
 *   post:
 *     summary: Convert JDL to JSON Server db.json
 *     description: Converts JHipster Domain Language (JDL) to a JSON Server db.json file with mock data. The generated JSON can be used with JSON Server to create a mock API.
 *     tags: [JDL Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JdlToJsonRequest'
 *     responses:
 *       200:
 *         description: Successfully generated JSON Server db.json
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JdlToJsonResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.jdlToJson), async (req, res, next) => {
  try {
    const { jdlContent, name, options } = req.body;
    
    const result = await jdlToJsonService.generateJsonFromJdl({
      jdlContent,
      name,
      options
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
 * /generate/jdl-to-json/from-jdl-file/{jdlName}:
 *   post:
 *     summary: Convert existing JDL file to JSON Server db.json
 *     description: Converts an existing JDL file to a JSON Server db.json file with mock data. The generated JSON can be used with JSON Server to create a mock API.
 *     tags: [JDL Generation]
 *     parameters:
 *       - in: path
 *         name: jdlName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the existing JDL file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   recordsPerEntity:
 *                     type: integer
 *                     description: Number of records to generate per entity
 *                     default: 10
 *                     example: 5
 *     responses:
 *       200:
 *         description: Successfully generated JSON Server db.json
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JdlToJsonResponse'
 *       404:
 *         description: JDL file not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/from-jdl-file/:jdlName', async (req, res, next) => {
  try {
    const { jdlName } = req.params;
    const { options } = req.body || {};
    
    const sanitizedName = jdlName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const jdlFilePath = path.join(process.cwd(), 'public', 'jdl', `${sanitizedName}.jdl`);
    
    try {
      // Check if JDL file exists
      await fs.access(jdlFilePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: `JDL file "${jdlName}" not found`,
          code: 'JDL_FILE_NOT_FOUND'
        }
      });
    }
    
    // Read the JDL file
    const jdlContent = await fs.readFile(jdlFilePath, 'utf8');
    
    // Generate JSON from JDL
    const result = await jdlToJsonService.generateJsonFromJdl({
      jdlContent,
      name: jdlName,
      options
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
 * /generate/jdl-to-json/from-requirements:
 *   post:
 *     summary: Generate JDL and convert to JSON Server db.json in one step
 *     description: Generates JDL from requirements and then converts it to a JSON Server db.json file with mock data. The generated JSON can be used with JSON Server to create a mock API.
 *     tags: [JDL Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JdlFromRequirementsToJsonRequest'
 *     responses:
 *       200:
 *         description: Successfully generated JDL and JSON Server db.json
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JdlToJsonResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/from-requirements', validate(schemas.jdlFromRequirementsToJson), async (req, res, next) => {
  try {
    const { requirements, name, jdlOptions, jsonOptions } = req.body;
    
    // Generate JDL from requirements
    const jdlResult = await jdlGeneratorService.generateJdl({
      requirements,
      name,
      options: jdlOptions
    });
    
    // Generate JSON from JDL
    const jsonResult = await jdlToJsonService.generateJsonFromJdl({
      jdlContent: jdlResult.content,
      name,
      options: jsonOptions
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...jsonResult,
        jdl: {
          filePath: jdlResult.filePath,
          url: jdlResult.url
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /generate/jdl-to-json/{name}:
 *   get:
 *     summary: Get a previously generated JSON Server db.json file
 *     description: Retrieves a previously generated JSON Server db.json file by name.
 *     tags: [JDL Generation]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the JSON file
 *     responses:
 *       200:
 *         description: Successfully retrieved JSON file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: JSON file not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filePath = path.join(process.cwd(), 'public', sanitizedName, 'db.json');
    
    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: `JSON file for "${name}" not found`,
          code: 'JSON_FILE_NOT_FOUND'
        }
      });
    }
    
    // Read the JSON file
    const jsonContent = await fs.readFile(filePath, 'utf8');
    
    // Parse and send the JSON
    res.status(200).json(JSON.parse(jsonContent));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 