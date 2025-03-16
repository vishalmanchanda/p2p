const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const genAIService = require('./gen-ai.service');
const jdlToJsonService = require('./jdl-to-json.service');
const prototypeBuilderService = require('./prototype-builder.service');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Service for generating a complete prototype with JSON Server integration
 */
class PrototypeJsonServerService {
  /**
   * Generate a complete prototype with JSON Server integration
   * @param {Object} params - Parameters for prototype generation
   * @returns {Promise<Object>} - Generated prototype information
   */
  async generatePrototype({ jdlContent, scenario, name, options = {} }) {
    try {
      console.log('Generating prototype with JSON Server integration:', name);
      
      // Sanitize the name for use as a directory name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create the directory structure
      const baseDir = path.join(process.cwd(), 'public', sanitizedName);
      const staticDir = path.join(baseDir, 'static');
      
      console.log('Creating directories:', baseDir, staticDir);
      await fs.mkdir(baseDir, { recursive: true });
      await fs.mkdir(staticDir, { recursive: true });
      
      // Check if JDL file already exists
      const jdlFilePath = path.join(baseDir, 'data.jdl');
      const dbJsonPath = path.join(baseDir, 'db.json');
      
      let entities = [];
      let jsonResult = null;
      
      // Check if both JDL and db.json already exist
      let filesExist = false;
      try {
        await fs.access(jdlFilePath);
        await fs.access(dbJsonPath);
        filesExist = true;
        console.log('Existing JDL and db.json files found, reusing them');
      } catch (error) {
        console.log('JDL or db.json files not found, generating new ones');
      }
      
      if (filesExist) {
        // Read the existing db.json to extract entities
        const dbJsonContent = await fs.readFile(dbJsonPath, 'utf8');
        const dbJson = JSON.parse(dbJsonContent);
        entities = Object.keys(dbJson).filter(key => Array.isArray(dbJson[key])); // Only include array properties as entities
        console.log('Entities extracted from existing db.json:', entities);
      } else {
        // Save the JDL file
        console.log('Saving JDL file to:', jdlFilePath);
        await fs.writeFile(jdlFilePath, jdlContent);
        
        // Generate JSON from JDL
        console.log('Generating JSON from JDL');
        jsonResult = await jdlToJsonService.generateJsonFromJdl({
          jdlContent,
          name,
          options: options.jsonOptions || {}
        });
        console.log('JSON generated successfully');
        
        // Move the db.json file to the correct location
        console.log('Copying db.json to:', dbJsonPath);
        await fs.copyFile(jsonResult.filePath, dbJsonPath);
        
        // Extract entity information from the JSON content
        entities = Object.keys(jsonResult.content);
        console.log('Entities found:', entities);
      }
      
      // Generate prototype sections based on the entities
      console.log('Generating prototype sections');
      const sections = await this._generateSectionsFromEntities(entities, scenario);
      console.log('Sections generated successfully');
      
      try {
        // Generate the prototype HTML
        console.log('Building prototype HTML');
        const prototypeResult = await prototypeBuilderService.buildPrototype({
          scenario: `${scenario} with JSON Server API integration. The API is available at http://localhost:3001 and provides endpoints for these entities: ${entities.join(', ')}`,
          name,
          sections,
          features: options.features || []
        });
        console.log('Prototype HTML built successfully');
        
        // Generate the API integration JavaScript
        console.log('Generating API integration JavaScript');
        try {
          const apiJsContent = await this._generateApiIntegrationJs(entities, name);
          const apiJsPath = path.join(staticDir, 'api.js');
          await fs.writeFile(apiJsPath, apiJsContent);
          console.log('API integration JavaScript generated successfully');
        } catch (apiJsError) {
          console.error('Error generating API integration JavaScript:', apiJsError);
          // Create a fallback API integration JavaScript
          const fallbackApiJs = this._generateFallbackApiJs(entities, name);
          const apiJsPath = path.join(staticDir, 'api.js');
          await fs.writeFile(apiJsPath, fallbackApiJs);
          console.log('Created fallback API integration JavaScript');
        }
        
        // Move the prototype HTML to the static directory
        const indexHtmlPath = path.join(staticDir, 'index.html');
        console.log('Copying index.html to:', indexHtmlPath);
        await fs.copyFile(prototypeResult.filePath, indexHtmlPath);
      } catch (htmlError) {
        console.error('Error during HTML generation:', htmlError);
        
        // Create a simple fallback HTML file if the prototype builder fails
        const fallbackHtml = this._generateFallbackHtml(entities, name, scenario);
        const indexHtmlPath = path.join(staticDir, 'index.html');
        console.log('Creating fallback index.html at:', indexHtmlPath);
        await fs.writeFile(indexHtmlPath, fallbackHtml);
      }
      
      // Generate the JSON Server start script
      const startScriptPath = path.join(baseDir, 'start-server.sh');
      console.log('Creating start script at:', startScriptPath);
      const startScriptContent = `#!/bin/bash
cd "$(dirname "$0")"
npx json-server db.json -p 3001 -s static
`;
      await fs.writeFile(startScriptPath, startScriptContent);
      await execPromise(`chmod +x ${startScriptPath}`);
      
      console.log('Prototype generation completed successfully');
      return {
        message: `Prototype with JSON Server integration for "${name}" has been generated successfully.`,
        name,
        scenario,
        entities,
        directoryPath: baseDir,
        staticPath: staticDir,
        jdlPath: jdlFilePath,
        dbJsonPath,
        indexHtmlPath: path.join(staticDir, 'index.html'),
        startScriptPath,
        url: `/public/${sanitizedName}/static/index.html`,
        startCommand: `cd ${baseDir} && npx json-server db.json -p 3001 -s static`
      };
    } catch (error) {
      console.error('Error generating prototype with JSON Server:', error);
      throw new ApiError('Failed to generate prototype with JSON Server', 500, 'PROTOTYPE_GENERATION_ERROR');
    }
  }
  
  /**
   * Generate prototype sections based on the entities
   * @param {Array} entities - Array of entity names
   * @param {String} scenario - Scenario description
   * @returns {Array} - Array of section configurations
   */
  async _generateSectionsFromEntities(entities, scenario) {
    const sections = [
      {
        id: 'header',
        type: 'header',
        description: `A responsive navigation header with logo, menu items for each entity (${entities.join(', ')}), and a theme toggle button.`
      },
      {
        id: 'main',
        type: 'main',
        description: `Main content area with tabs for each entity (${entities.join(', ')}). Each tab should display a table of the entity data with CRUD operations.`
      },
      {
        id: 'footer',
        type: 'footer',
        description: 'Footer with copyright, links to JSON Server documentation, and contact information.'
      }
    ];
    
    // Add entity-specific sections
    entities.forEach(entity => {
      sections.push({
        id: `${entity.toLowerCase()}-section`,
        type: 'entity-section',
        description: `A section for managing ${entity} data with a table view, search, filter, and CRUD operations. This should include forms for creating and editing ${entity} records.`
      });
    });
    
    return sections;
  }
  
  /**
   * Generate API integration JavaScript
   * @param {Array} entities - Array of entity names
   * @param {String} name - Name of the prototype
   * @returns {Promise<String>} - Generated JavaScript code
   */
  async _generateApiIntegrationJs(entities, name) {
    const prompt = `
Generate JavaScript code for integrating with a JSON Server API for a prototype named "${name}".
The API is available at http://localhost:3001 and provides endpoints for these entities: ${entities.join(', ')}.

The code should:
1. Include functions for fetching, creating, updating, and deleting records for each entity
2. Handle form submissions for creating and editing records
3. Display data in tables with sorting and filtering capabilities
4. Include error handling and loading states
5. Use modern JavaScript (ES6+) with fetch API
6. Be well-commented and organized by entity
7. Include a function to initialize the UI when the page loads
8. Support pagination if available in the API

The code will be included in a separate api.js file that will be loaded in the HTML prototype.
Return ONLY the JavaScript code without any explanations or markdown formatting.
`;

    const result = await genAIService.generateCode({
      prompt,
      language: 'javascript',
      comments: true,
      maxTokens: 4096
    });
    
    return result.code;
  }
  
  /**
   * Generate a fallback HTML file when the prototype builder fails
   * @param {Array} entities - Array of entity names
   * @param {String} name - Name of the prototype
   * @param {String} scenario - Scenario description
   * @returns {String} - Fallback HTML content
   */
  _generateFallbackHtml(entities, name, scenario) {
    const entityTabs = entities.map(entity => `
      <div class="tab-pane fade" id="${entity.toLowerCase()}" role="tabpanel" aria-labelledby="${entity.toLowerCase()}-tab">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5>${entity}</h5>
            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#add${entity}Modal">Add ${entity}</button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped" id="${entity.toLowerCase()}-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- ${entity} data will be loaded here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const entityNavs = entities.map((entity, index) => `
      <li class="nav-item" role="presentation">
        <button class="nav-link ${index === 0 ? 'active' : ''}" id="${entity.toLowerCase()}-tab" data-bs-toggle="tab" data-bs-target="#${entity.toLowerCase()}" type="button" role="tab" aria-controls="${entity.toLowerCase()}" aria-selected="${index === 0 ? 'true' : 'false'}">${entity}</button>
      </li>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - JSON Server Prototype</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    body {
      padding-top: 56px;
    }
    .dark-mode {
      background-color: #222;
      color: #eee;
    }
    .dark-mode .card {
      background-color: #333;
      color: #eee;
    }
    .dark-mode .table {
      color: #eee;
    }
    .dark-mode .nav-link {
      color: #eee;
    }
    .dark-mode .nav-link.active {
      color: #fff;
      background-color: #444;
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
    <div class="container">
      <a class="navbar-brand" href="#">${name}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link active" href="#">Home</a>
          </li>
          ${entities.map(entity => `<li class="nav-item"><a class="nav-link" href="#${entity.toLowerCase()}">${entity}</a></li>`).join('')}
        </ul>
        <div class="d-flex">
          <button id="theme-toggle" class="btn btn-outline-light">
            <i class="fas fa-moon"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container mt-4">
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-body">
            <h2>${name}</h2>
            <p>${scenario}</p>
            <p>This prototype uses JSON Server to provide a mock API for the entities: ${entities.join(', ')}.</p>
            <p>The API is available at <code>http://localhost:3001</code>.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <ul class="nav nav-tabs" id="entityTabs" role="tablist">
          ${entityNavs}
        </ul>
        <div class="tab-content" id="entityTabsContent">
          ${entityTabs}
        </div>
      </div>
    </div>
  </div>

  <footer class="bg-dark text-white mt-5 py-3">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <p>&copy; 2023 ${name}</p>
        </div>
        <div class="col-md-6 text-end">
          <a href="https://github.com/typicode/json-server" class="text-white" target="_blank">JSON Server Documentation</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script>
    // Theme toggle functionality
    document.getElementById('theme-toggle').addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const icon = this.querySelector('i');
      if (icon.classList.contains('fa-moon')) {
        icon.classList.replace('fa-moon', 'fa-sun');
      } else {
        icon.classList.replace('fa-sun', 'fa-moon');
      }
    });

    // Load data from JSON Server
    const API_URL = 'http://localhost:3001';

    // Function to load entity data
    function loadEntityData(entity) {
      fetch(\`\${API_URL}/\${entity.toLowerCase()}\`)
        .then(response => response.json())
        .then(data => {
          const tableBody = document.querySelector(\`#\${entity.toLowerCase()}-table tbody\`);
          tableBody.innerHTML = '';
          
          data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = \`
              <td>\${item.id}</td>
              <td>\${item.name || 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-info me-1" onclick="editItem('\${entity}', \${item.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('\${entity}', \${item.id})">Delete</button>
              </td>
            \`;
            tableBody.appendChild(row);
          });
        })
        .catch(error => console.error(\`Error loading \${entity} data:\`, error));
    }

    // Load data for all entities
    window.onload = function() {
      ${entities.map(entity => `loadEntityData('${entity}');`).join('\n      ')}
    };

    // Function to delete an item
    function deleteItem(entity, id) {
      if (confirm(\`Are you sure you want to delete this \${entity}?\`)) {
        fetch(\`\${API_URL}/\${entity.toLowerCase()}/\${id}\`, {
          method: 'DELETE'
        })
        .then(response => {
          if (response.ok) {
            loadEntityData(entity);
          } else {
            alert('Failed to delete item');
          }
        })
        .catch(error => console.error('Error:', error));
      }
    }

    // Function to edit an item (placeholder)
    function editItem(entity, id) {
      alert(\`Edit \${entity} with ID \${id} (Not implemented in this fallback UI)\`);
    }
  </script>
</body>
</html>`;
  }
  
  /**
   * Generate a fallback API integration JavaScript
   * @param {Array} entities - Array of entity names
   * @param {String} name - Name of the prototype
   * @returns {String} - Fallback JavaScript code
   */
  _generateFallbackApiJs(entities, name) {
    const entityFunctions = entities.map(entity => {
      const entityLower = entity.toLowerCase();
      return `
// ${entity} API functions
function get${entity}() {
  return fetch('http://localhost:3001/${entityLower}')
    .then(response => response.json())
    .catch(error => {
      console.error('Error fetching ${entity}:', error);
      return [];
    });
}

function create${entity}(data) {
  return fetch('http://localhost:3001/${entityLower}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .catch(error => {
      console.error('Error creating ${entity}:', error);
      throw error;
    });
}

function update${entity}(id, data) {
  return fetch(\`http://localhost:3001/${entityLower}/\${id}\`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .catch(error => {
      console.error('Error updating ${entity}:', error);
      throw error;
    });
}

function delete${entity}(id) {
  return fetch(\`http://localhost:3001/${entityLower}/\${id}\`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete ${entity}');
      }
      return true;
    })
    .catch(error => {
      console.error('Error deleting ${entity}:', error);
      throw error;
    });
}`;
    }).join('\n\n');
    
    const loadFunctions = entities.map(entity => {
      return `  // Load ${entity} data
  get${entity}().then(data => {
    const tableBody = document.querySelector('#${entity.toLowerCase()}-table tbody');
    if (tableBody) {
      tableBody.innerHTML = '';
      
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td>\${item.id}</td>
          <td>\${item.name || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-info me-1" onclick="edit${entity}(\${item.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="delete${entity}Item(\${item.id})">Delete</button>
          </td>
        \`;
        tableBody.appendChild(row);
      });
    }
  });`;
    }).join('\n\n');
    
    return `/**
 * API Integration for ${name}
 * This file provides functions to interact with the JSON Server API
 */

// API base URL
const API_URL = 'http://localhost:3001';

${entityFunctions}

// UI interaction functions
${entities.map(entity => `
function edit${entity}(id) {
  alert('Edit ${entity} with ID ' + id + ' (Not implemented in this fallback UI)');
}

function delete${entity}Item(id) {
  if (confirm('Are you sure you want to delete this ${entity}?')) {
    delete${entity}(id)
      .then(() => {
        // Reload data
        get${entity}().then(data => {
          const tableBody = document.querySelector('#${entity.toLowerCase()}-table tbody');
          if (tableBody) {
            tableBody.innerHTML = '';
            
            data.forEach(item => {
              const row = document.createElement('tr');
              row.innerHTML = \`
                <td>\${item.id}</td>
                <td>\${item.name || 'N/A'}</td>
                <td>
                  <button class="btn btn-sm btn-info me-1" onclick="edit${entity}(\${item.id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="delete${entity}Item(\${item.id})">Delete</button>
                </td>
              \`;
              tableBody.appendChild(row);
            });
          }
        });
      })
      .catch(error => {
        alert('Error deleting ${entity}: ' + error.message);
      });
  }
}`).join('\n\n')}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', function() {
${loadFunctions}
});`;
  }
  
  /**
   * Generate a prototype from an existing JDL file
   * @param {Object} params - Parameters for prototype generation
   * @returns {Promise<Object>} - Generated prototype information
   */
  async generatePrototypeFromJdlFile({ jdlName, scenario, name, options = {} }) {
    try {
      console.log('Generating prototype from JDL file:', jdlName);
      const sanitizedJdlName = jdlName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const jdlFilePath = path.join(process.cwd(), 'public', 'jdl', `${sanitizedJdlName}.jdl`);
      
      console.log('JDL file path:', jdlFilePath);
      
      // Read the JDL file
      const jdlContent = await fs.readFile(jdlFilePath, 'utf8');
      console.log('JDL content read successfully, length:', jdlContent.length);
      
      // Generate the prototype
      return this.generatePrototype({
        jdlContent,
        scenario,
        name: name || jdlName,
        options
      });
    } catch (error) {
      console.error('Error generating prototype from JDL file:', error);
      throw new ApiError('Failed to generate prototype from JDL file', 500, 'PROTOTYPE_GENERATION_ERROR');
    }
  }
  
  /**
   * Generate a prototype from requirements
   * @param {Object} params - Parameters for prototype generation
   * @returns {Promise<Object>} - Generated prototype information
   */
  async generatePrototypeFromRequirements({ requirements, scenario, name, options = {} }) {
    try {
      // Generate JDL from requirements
      const prompt = `
Generate JHipster Domain Language (JDL) for the following requirements:

${requirements}

The JDL should:
1. Define entities with appropriate fields and types
2. Include validations for fields (required, min, max, pattern, etc.)
3. Define relationships between entities
4. Use standard JHipster JDL syntax

Return ONLY the JDL code without any explanations or markdown formatting.
`;

      const jdlResult = await genAIService.generateCode({
        prompt,
        language: 'jdl',
        comments: true,
        maxTokens: 4096
      });
      
      // Generate the prototype
      return this.generatePrototype({
        jdlContent: jdlResult.code,
        scenario,
        name,
        options
      });
    } catch (error) {
      console.error('Error generating prototype from requirements:', error);
      throw new ApiError('Failed to generate prototype from requirements', 500, 'PROTOTYPE_GENERATION_ERROR');
    }
  }
  
  /**
   * Start the JSON Server for a prototype
   * @param {String} name - Name of the prototype
   * @returns {Promise<Object>} - Server information
   */
  async startJsonServer(name) {
    try {
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const baseDir = path.join(process.cwd(), 'public', sanitizedName);
      
      // Check if the directory exists
      try {
        await fs.access(baseDir);
      } catch (error) {
        throw new ApiError(`Prototype "${name}" not found`, 404, 'PROTOTYPE_NOT_FOUND');
      }
      
      // Check if db.json exists
      const dbJsonPath = path.join(baseDir, 'db.json');
      try {
        await fs.access(dbJsonPath);
      } catch (error) {
        throw new ApiError(`db.json for prototype "${name}" not found`, 404, 'DB_JSON_NOT_FOUND');
      }
      
      // Start the JSON Server
      const command = `cd ${baseDir} && npx json-server db.json -p 3001 -s static`;
      const { stdout, stderr } = await execPromise(command);
      
      return {
        message: `JSON Server for "${name}" started successfully.`,
        name,
        command,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      console.error('Error starting JSON Server:', error);
      throw new ApiError('Failed to start JSON Server', 500, 'JSON_SERVER_ERROR');
    }
  }
}

module.exports = new PrototypeJsonServerService(); 