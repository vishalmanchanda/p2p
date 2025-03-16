const fs = require('fs').promises;
const path = require('path');
const genAIService = require('./gen-ai.service');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Service for building HTML prototypes section by section
 */
class PrototypeBuilderService {
  /**
   * Generate a complete HTML prototype by assembling sections
   * @param {Object} params - Parameters for prototype generation
   * @returns {Promise<Object>} - Generated prototype information
   */
  async buildPrototype({ scenario, name, sections, features }) {
    try {
      // Sanitize the name for use as a directory name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create the directory structure
      const dirPath = path.join(process.cwd(), 'public', sanitizedName);
      await fs.mkdir(dirPath, { recursive: true });
      
      // Generate the base HTML structure
      const baseHtml = await this._generateBaseStructure(scenario, features);
      
      // Generate each section and collect them
      const generatedSections = {};
      for (const section of sections) {
        generatedSections[section.id] = await this._generateSection(section, scenario, features);
      }
      
      // Assemble the final HTML
      const finalHtml = this._assembleHtml(baseHtml, generatedSections);
      
      // Save the HTML file
      const filePath = path.join(dirPath, 'index.html');
      await fs.writeFile(filePath, finalHtml);
      
      // Generate the URL for accessing the prototype
      const prototypeUrl = `/public/${sanitizedName}/index.html`;
      
      return {
        message: `HTML prototype for "${name}" has been generated successfully.`,
        scenario,
        sections: Object.keys(generatedSections),
        filePath,
        url: prototypeUrl
      };
    } catch (error) {
      console.error('Error building prototype:', error);
      throw new ApiError('Failed to build prototype', 500, 'PROTOTYPE_BUILD_ERROR');
    }
  }
  
  /**
   * Generate a single section of the prototype
   * @param {Object} section - Section configuration
   * @param {String} scenario - The overall scenario
   * @param {Array} features - Features to include
   * @returns {Promise<String>} - Generated HTML for the section
   */
  async _generateSection(section, scenario, features) {
    const { id, type, description } = section;
    
    // Create a prompt specific to this section type
    let prompt = `
Generate HTML code for a ${type} section of a web page based on this scenario: ${scenario}

Section description: ${description}

The section should:
${features ? `- Support these features: ${features.join(', ')}` : ''}
- Use HTML5, jQuery, Tailwind CSS v4, and Font Awesome icons
- Be responsive and mobile-friendly
- Have a clean, modern design
- Include realistic placeholder content
- Be fully functional with interactive elements
- Use best practices for accessibility

Return ONLY the HTML code for this specific section, without <!DOCTYPE>, <html>, <head>, or <body> tags.
`;

    // Generate the section HTML
    const result = await genAIService.generateCode({
      prompt,
      language: 'html',
      comments: false,
      maxTokens: 2048
    });
    
    return result.code;
  }
  
  /**
   * Generate the base HTML structure
   * @param {String} scenario - The overall scenario
   * @param {Array} features - Features to include
   * @returns {Promise<Object>} - Base HTML structure with placeholders
   */
  async _generateBaseStructure(scenario, features) {
    const prompt = `
Generate the base HTML structure for a web page based on this scenario: ${scenario}

The page should:
${features ? `- Support these features: ${features.join(', ')}` : ''}
- Use HTML5, jQuery, Tailwind CSS v4, and Font Awesome icons
- Be responsive and mobile-friendly
- Have a clean, modern design

Include:
1. Proper HTML5 document structure
2. All necessary CDN links for jQuery, Tailwind CSS v4, and Font Awesome
3. A responsive navigation bar
4. A footer with copyright and links
5. Basic CSS and JavaScript setup

Return ONLY the HTML structure with placeholders for content sections marked as:
<!-- SECTION_ID:header -->
<!-- SECTION_ID:main -->
<!-- SECTION_ID:features -->
<!-- SECTION_ID:footer -->

These placeholders will be replaced with actual content later.
`;

    // Generate the base structure
    const result = await genAIService.generateCode({
      prompt,
      language: 'html',
      comments: true,
      maxTokens: 2048
    });
    
    return result.code;
  }
  
  /**
   * Assemble the final HTML by replacing section placeholders
   * @param {String} baseHtml - Base HTML structure with placeholders
   * @param {Object} sections - Generated sections keyed by ID
   * @returns {String} - Complete HTML
   */
  _assembleHtml(baseHtml, sections) {
    let finalHtml = baseHtml;
    
    // Replace each section placeholder with the generated content
    for (const [id, content] of Object.entries(sections)) {
      const placeholder = `<!-- SECTION_ID:${id} -->`;
      finalHtml = finalHtml.replace(placeholder, content);
    }
    
    return finalHtml;
  }
  
  /**
   * Generate a single section and save it to a file
   * @param {Object} params - Parameters for section generation
   * @returns {Promise<Object>} - Generated section information
   */
  async generateSection({ scenario, name, section, features }) {
    try {
      // Sanitize the name for use as a directory name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create the directory structure
      const dirPath = path.join(process.cwd(), 'public', sanitizedName);
      await fs.mkdir(dirPath, { recursive: true });
      
      // Generate the section
      const sectionHtml = await this._generateSection(section, scenario, features);
      
      // Save the section to a file
      const filePath = path.join(dirPath, `${section.id}.html`);
      await fs.writeFile(filePath, sectionHtml);
      
      return {
        message: `Section "${section.id}" for "${name}" has been generated successfully.`,
        scenario,
        section: section.id,
        filePath
      };
    } catch (error) {
      console.error('Error generating section:', error);
      throw new ApiError('Failed to generate section', 500, 'SECTION_GENERATION_ERROR');
    }
  }
}

module.exports = new PrototypeBuilderService(); 