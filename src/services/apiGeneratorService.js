const fs = require('fs').promises;
const path = require('path');

/**
 * Service to generate API.js files from templates based on entity configurations
 */
class ApiGeneratorService {
  /**
   * Generate a custom API.js file based on provided entities and configuration
   * 
   * @param {Object} options - Configuration options
   * @param {Array} options.primaryEntities - Primary entities to display (e.g., blogs, authors)
   * @param {Array} options.relationHandlers - Relationship handlers between entities
   * @param {Array} options.forms - Form configurations for adding new items
   * @param {Array} options.searchConfig - Search configurations for entities
   * @param {String} options.defaultTab - Default tab to show
   * @param {Array} options.relatedSections - Sections to hide initially
   * @param {Object} options.renderFunctions - Custom render functions for entities
   * @param {String} options.baseUrl - Base URL for the API (default: http://localhost:3001)
   * @returns {String} - Generated API.js content
   */
  async generateApiJs(options) {
    try {
      // Read the template file
      const templatePath = path.join(__dirname, '../templates/api-template.js');
      let template = await fs.readFile(templatePath, 'utf8');
      
      // Default options
      const defaultOptions = {
        baseUrl: 'http://localhost:3001',
        primaryEntities: [],
        relationHandlers: [],
        forms: [],
        searchConfig: [],
        defaultTab: 'content',
        relatedSections: []
      };
      
      // Merge options with defaults
      const config = { ...defaultOptions, ...options };
      
      // Generate custom render functions if provided
      let renderFunctionsCode = '';
      
      if (options.renderFunctions) {
        renderFunctionsCode = this.generateRenderFunctions(options.renderFunctions);
        // Replace the render functions in the template
        template = template.replace(
          /const renderFunctions = \{[\s\S]*?\};/m,
          renderFunctionsCode
        );
      }
      
      // Replace the configuration in the template
      const configCode = `const appConfig = ${JSON.stringify(config, null, 2)};`;
      template = template.replace(
        /const blogAppConfig = \{[\s\S]*?\};/m,
        configCode
      );
      
      // Replace the initialization call
      template = template.replace(
        'initializeApp(blogAppConfig);',
        'initializeApp(appConfig);'
      );
      
      // Replace the base URL if provided
      if (options.baseUrl) {
        template = template.replace(
          "const baseUrl = 'http://localhost:3001';",
          `const baseUrl = '${options.baseUrl}';`
        );
      }
      
      return template;
    } catch (error) {
      console.error('Error generating API.js:', error);
      throw new Error('Failed to generate API.js file');
    }
  }
  
  /**
   * Generate render functions code based on provided entity configurations
   * 
   * @param {Object} renderFunctions - Custom render functions for entities
   * @returns {String} - Generated render functions code
   */
  generateRenderFunctions(renderFunctions) {
    let code = 'const renderFunctions = {';
    
    for (const [entityType, config] of Object.entries(renderFunctions)) {
      code += `\n  ${entityType}: function(${entityType.slice(0, -1)}) {`;
      code += `\n    return \``;
      
      // Generate the HTML template based on the entity fields
      code += this.generateEntityTemplate(entityType, config);
      
      code += `\`;`;
      code += `\n  },`;
    }
    
    code += '\n};';
    return code;
  }
  
  /**
   * Generate HTML template for an entity based on its fields
   * 
   * @param {String} entityType - Type of entity (e.g., blogs, authors)
   * @param {Object} config - Entity configuration
   * @returns {String} - Generated HTML template
   */
  generateEntityTemplate(entityType, config) {
    const singularType = entityType.slice(0, -1);
    
    // Default templates based on entity type
    switch (entityType) {
      case 'blogs':
        return `
          <div class="blog-item bg-white rounded-lg shadow-md overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg" data-id="\${${singularType}.id}">
            <div class="p-5">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">\${${singularType}.name}</h3>
              \${${singularType}.description ? \`<p class="text-gray-600 mb-3">\${${singularType}.description.substring(0, 100)}\${${singularType}.description.length > 100 ? '...' : ''}</p>\` : ''}
              <div class="flex justify-between items-center">
                <button class="btn-view-comments inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                  <svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  View Comments
                </button>
                \${${singularType}.createdAt ? \`<span class="text-sm text-gray-500">\${new Date(${singularType}.createdAt).toLocaleDateString()}</span>\` : ''}
              </div>
            </div>
          </div>
        `;
      
      case 'authors':
        return `
          <div class="author-item bg-white rounded-lg shadow-md overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg" data-id="\${${singularType}.id}">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span class="text-xl font-medium text-indigo-800">\${${singularType}.name.charAt(0)}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-800">\${${singularType}.name}</h3>
                  \${${singularType}.email ? \`<p class="text-sm text-gray-500">\${${singularType}.email}</p>\` : ''}
                </div>
              </div>
              \${${singularType}.bio ? \`<p class="mt-3 text-gray-600">\${${singularType}.bio}</p>\` : ''}
            </div>
          </div>
        `;
      
      case 'comments':
        return `
          <div class="comment-item bg-gray-50 rounded-lg p-4 mb-3 border-l-4 border-indigo-300" data-id="\${${singularType}.id}">
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-3">
                <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-gray-700">\${${singularType}.content}</p>
                \${${singularType}.createdAt ? \`<p class="text-xs text-gray-500 mt-1">\${new Date(${singularType}.createdAt).toLocaleString()}</p>\` : ''}
              </div>
            </div>
          </div>
        `;
      
      default:
        // Generic template for other entity types
        return `
          <div class="${singularType}-item bg-white rounded-lg shadow-md overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg" data-id="\${${singularType}.id}">
            <div class="p-5">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">\${${singularType}.name || ${singularType}.title || 'Untitled'}</h3>
              ${config.fields?.map(field => {
                if (field === 'id' || field === 'name' || field === 'title') return '';
                return `\${${singularType}.${field} ? \`<p class="text-gray-600 mb-2">\${${singularType}.${field}}</p>\` : ''}`;
              }).join('\n              ') || ''}
              <div class="flex justify-end mt-2">
                <button class="btn-view-details inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        `;
    }
  }
  
  /**
   * Save the generated API.js file to the specified path
   * 
   * @param {String} content - Generated API.js content
   * @param {String} outputPath - Path to save the file
   * @returns {Promise<void>}
   */
  async saveApiJs(content, outputPath) {
    try {
      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file
      await fs.writeFile(outputPath, content, 'utf8');
      return outputPath;
    } catch (error) {
      console.error('Error saving API.js:', error);
      throw new Error('Failed to save API.js file');
    }
  }
}

module.exports = new ApiGeneratorService(); 