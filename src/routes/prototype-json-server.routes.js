const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const prototypeJsonServerService = require('../services/prototype-json-server.service');
const { validate, schemas } = require('../middleware/validator');

/**
 * @swagger
 * /generate/prototype-json-server:
 *   post:
 *     summary: Generate a prototype with JSON Server integration
 *     description: Generates a complete prototype with JSON Server integration based on JDL content. The prototype includes HTML, CSS, JavaScript, and a db.json file for JSON Server.
 *     tags: [Prototype Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrototypeJsonServerRequest'
 *     responses:
 *       200:
 *         description: Successfully generated prototype with JSON Server integration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeJsonServerResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(schemas.prototypeJsonServer), async (req, res, next) => {
  try {
    const { jdlContent, scenario, name, options } = req.body;
    
    const result = await prototypeJsonServerService.generatePrototype({
      jdlContent,
      scenario,
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
 * /generate/prototype-json-server/from-jdl-file/{jdlName}:
 *   post:
 *     summary: Generate a prototype with JSON Server integration from an existing JDL file
 *     description: Generates a complete prototype with JSON Server integration based on an existing JDL file. The prototype includes HTML, CSS, JavaScript, and a db.json file for JSON Server.
 *     tags: [Prototype Generation]
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
 *             $ref: '#/components/schemas/PrototypeJsonServerFromJdlRequest'
 *     responses:
 *       200:
 *         description: Successfully generated prototype with JSON Server integration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeJsonServerResponse'
 *       404:
 *         description: JDL file not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/from-jdl-file/:jdlName', async (req, res, next) => {
  try {
    const { jdlName } = req.params;
    const { scenario, name, options } = req.body;
    
    const sanitizedJdlName = jdlName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const jdlFilePath = path.join(process.cwd(), 'public', 'jdl', `${sanitizedJdlName}.jdl`);
    
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
    
    const result = await prototypeJsonServerService.generatePrototypeFromJdlFile({
      jdlName,
      scenario,
      name: name || jdlName,
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
 * /generate/prototype-json-server/from-requirements:
 *   post:
 *     summary: Generate a prototype with JSON Server integration from requirements
 *     description: Generates a complete prototype with JSON Server integration based on requirements. The prototype includes HTML, CSS, JavaScript, and a db.json file for JSON Server.
 *     tags: [Prototype Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrototypeJsonServerFromRequirementsRequest'
 *     responses:
 *       200:
 *         description: Successfully generated prototype with JSON Server integration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeJsonServerResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/from-requirements', validate(schemas.prototypeJsonServerFromRequirements), async (req, res, next) => {
  try {
    const { requirements, scenario, name, options } = req.body;
    
    const result = await prototypeJsonServerService.generatePrototypeFromRequirements({
      requirements,
      scenario,
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
 * /generate/prototype-json-server/start/{name}:
 *   post:
 *     summary: Start JSON Server for a prototype
 *     description: Starts JSON Server for a previously generated prototype.
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
 *         description: Successfully started JSON Server
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
 *                     message:
 *                       type: string
 *                       example: JSON Server for "blog-app" started successfully.
 *                     name:
 *                       type: string
 *                       example: blog-app
 *                     command:
 *                       type: string
 *                       example: cd /path/to/public/blog-app && npx json-server db.json -p 3001 -s static
 *       404:
 *         description: Prototype not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/start/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    
    const result = await prototypeJsonServerService.startJsonServer(name);
    
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
 * /generate/prototype-json-server/{name}:
 *   get:
 *     summary: Get information about a previously generated prototype
 *     description: Retrieves information about a previously generated prototype with JSON Server integration.
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
 *         description: Successfully retrieved prototype information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeJsonServerInfo'
 *       404:
 *         description: Prototype not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const baseDir = path.join(process.cwd(), 'public', sanitizedName);
    
    try {
      // Check if directory exists
      await fs.access(baseDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Prototype "${name}" not found`,
          code: 'PROTOTYPE_NOT_FOUND'
        }
      });
    }
    
    // Get information about the prototype
    const jdlPath = path.join(baseDir, 'data.jdl');
    const dbJsonPath = path.join(baseDir, 'db.json');
    const indexHtmlPath = path.join(baseDir, 'static', 'index.html');
    
    // Check if files exist
    let jdlExists = false;
    let dbJsonExists = false;
    let indexHtmlExists = false;
    
    try {
      await fs.access(jdlPath);
      jdlExists = true;
    } catch (error) {
      // JDL file doesn't exist
    }
    
    try {
      await fs.access(dbJsonPath);
      dbJsonExists = true;
    } catch (error) {
      // db.json file doesn't exist
    }
    
    try {
      await fs.access(indexHtmlPath);
      indexHtmlExists = true;
    } catch (error) {
      // index.html file doesn't exist
    }
    
    // Read db.json to get entities
    let entities = [];
    if (dbJsonExists) {
      const dbJsonContent = await fs.readFile(dbJsonPath, 'utf8');
      entities = Object.keys(JSON.parse(dbJsonContent));
    }
    
    res.status(200).json({
      success: true,
      data: {
        name,
        directoryPath: baseDir,
        jdlPath: jdlExists ? jdlPath : null,
        dbJsonPath: dbJsonExists ? dbJsonPath : null,
        indexHtmlPath: indexHtmlExists ? indexHtmlPath : null,
        url: indexHtmlExists ? `/public/${sanitizedName}/static/index.html` : null,
        startCommand: `cd ${baseDir} && npx json-server db.json -p 3001 -s static`,
        entities
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 