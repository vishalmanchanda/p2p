const fs = require('fs').promises;
const path = require('path');
const prototypeBuilderService = require('./src/services/prototype-builder.service');

async function testHtmlGeneration() {
  try {
    // Source directory with existing JDL and db.json
    const sourceDir = path.join(process.cwd(), 'public', 'blog-app-test3');
    
    // Read the JDL file
    const jdlFilePath = path.join(sourceDir, 'data.jdl');
    const jdlContent = await fs.readFile(jdlFilePath, 'utf8');
    console.log('JDL content:', jdlContent);
    
    // Read the db.json file
    const dbJsonPath = path.join(sourceDir, 'db.json');
    const dbJsonContent = await fs.readFile(dbJsonPath, 'utf8');
    const dbJson = JSON.parse(dbJsonContent);
    console.log('DB JSON content:', dbJson);
    
    // Extract entity information
    const entities = Object.keys(dbJson);
    console.log('Entities found:', entities);
    
    // Define scenario and features
    const scenario = 'A blog application with user management, post creation, and commenting features';
    const features = ['Dark mode', 'Responsive design', 'Search functionality'];
    
    // Generate sections based on entities
    const sections = generateSectionsFromEntities(entities, scenario);
    console.log('Sections generated:', sections.map(s => s.id));
    
    // Create a test directory
    const testDir = path.join(process.cwd(), 'public', 'html-test');
    await fs.mkdir(testDir, { recursive: true });
    
    // Generate the HTML
    console.log('Generating HTML...');
    const result = await prototypeBuilderService.buildPrototype({
      scenario: `${scenario} with JSON Server API integration. The API is available at http://localhost:3001 and provides endpoints for these entities: ${entities.join(', ')}`,
      name: 'html-test',
      sections,
      features
    });
    
    console.log('HTML generation result:', result);
    
    // Generate a simple API.js file
    const apiJsPath = path.join(testDir, 'api.js');
    const apiJsContent = generateApiJs(entities, 'html-test');
    await fs.writeFile(apiJsPath, apiJsContent);
    
    console.log('Test completed successfully!');
    console.log('HTML file path:', result.filePath);
    console.log('URL:', result.url);
  } catch (error) {
    console.error('Error testing HTML generation:', error);
  }
}

function generateSectionsFromEntities(entities, scenario) {
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

function generateApiJs(entities, name) {
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

// Run the test
testHtmlGeneration(); 