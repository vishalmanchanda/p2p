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
      
      console.log('Sanitized name:', sanitizedName);
      // Create the directory structure
      const dirPath = path.join(process.cwd(), 'public', sanitizedName);
      await fs.mkdir(dirPath, { recursive: true });
      console.log('Directory structure created successfully '+ dirPath);
      
      // Generate the base HTML structure
      const baseHtml = await this._generateBaseStructure(scenario, features);
      console.log('Base HTML structure generated successfully');
      // Generate each section and collect them
      const generatedSections = {};
      for (const section of sections) {
        try {
          console.log('Generating section '+ section.id);
          generatedSections[section.id] = await this._generateSection(section, scenario, features);
          console.log('Section '+ section.id + ' generated successfully');
        } catch (sectionError) {
          console.error(`Error generating section ${section.id}:`, sectionError);
          // Create a fallback section
          generatedSections[section.id] = this._generateFallbackSection(section);
        }
      }
      console.log('All sections generated successfully');
      // Assemble the final HTML
      const finalHtml = this._assembleHtml(baseHtml, generatedSections);
      console.log('Final HTML assembled successfully');
      // Save the HTML file
      const filePath = path.join(dirPath, 'index.html');
      await fs.writeFile(filePath, finalHtml);
      console.log('HTML file saved successfully');
      // Generate the URL for accessing the prototype
      const prototypeUrl = `/public/${sanitizedName}/index.html`;
      console.log('Prototype URL generated successfully');
      return {
        message: `HTML prototype for "${name}" has been generated successfully.`,
        scenario,
        sections: Object.keys(generatedSections),
        filePath,
        url: prototypeUrl
      };
      
    } catch (error) {
      console.error('Error building prototype:', error);
      console.log('Error building prototype:', error)

      
      // Create a fallback HTML file
      try {
        const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const dirPath = path.join(process.cwd(), 'public', sanitizedName);
        const filePath = path.join(dirPath, 'index.html');
        
        // Generate a simple fallback HTML
        const fallbackHtml = this._generateFallbackHtml(name, scenario, sections);
        await fs.writeFile(filePath, fallbackHtml);
        
        const prototypeUrl = `/public/${sanitizedName}/index.html`;
        
        return {
          message: `HTML prototype for "${name}" has been generated with fallback template.`,
          scenario,
          sections: sections.map(s => s.id),
          filePath,
          url: prototypeUrl
        };
      } catch (fallbackError) {
        console.error('Error creating fallback HTML:', fallbackError);
        throw new ApiError('Failed to build prototype', 500, 'PROTOTYPE_BUILD_ERROR');
      }
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

    try {
      // Generate the base structure
      const result = await genAIService.generateCode({
        prompt,
        language: 'html',
        comments: true,
        maxTokens: 2048
      });
      
      return result.code;
    } catch (error) {
      console.error('Error generating base HTML structure:', error);
      
      // Return a fallback base HTML structure
      return this._generateFallbackBaseHtml(scenario, features);
    }
  }
  
  /**
   * Generate a fallback base HTML structure
   * @param {String} scenario - The overall scenario
   * @param {Array} features - Features to include
   * @returns {String} - Fallback base HTML structure
   */
  _generateFallbackBaseHtml(scenario, features) {
    const featuresList = features && features.length > 0 
      ? `<div class="mt-3"><strong>Features:</strong> ${features.join(', ')}</div>` 
      : '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype</title>
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
  </style>
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
    <div class="container">
      <a class="navbar-brand" href="#">Prototype</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link active" href="#">Home</a>
          </li>
        </ul>
        <div class="ms-auto">
          <button id="theme-toggle" class="btn btn-outline-light">
            <i class="fas fa-moon"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container mt-4">
    <div class="card mb-4">
      <div class="card-body">
        <h1>Prototype</h1>
        <p>${scenario}</p>
        ${featuresList}
      </div>
    </div>
  </div>

  <!-- SECTION_ID:header -->
  <!-- SECTION_ID:main -->
  <!-- SECTION_ID:features -->
  <!-- SECTION_ID:footer -->

  <footer class="bg-dark text-white py-4 mt-5">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <p>&copy; 2023 Prototype</p>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script>
    document.getElementById('theme-toggle').addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const icon = this.querySelector('i');
      if (icon.classList.contains('fa-moon')) {
        icon.classList.replace('fa-moon', 'fa-sun');
      } else {
        icon.classList.replace('fa-sun', 'fa-moon');
      }
    });
  </script>
</body>
</html>`;
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
  
  /**
   * Generate a fallback section when the AI generation fails
   * @param {Object} section - Section configuration
   * @returns {String} - Simple HTML for the section
   */
  _generateFallbackSection(section) {
    const { id, type, description } = section;
    
    return `
<div id="${id}" class="section ${type}-section">
  <div class="container my-5">
    <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Section</h2>
    <p class="text-muted">${description}</p>
    <div class="alert alert-info">
      This is a fallback ${type} section. The actual content could not be generated.
    </div>
  </div>
</div>`;
  }
  
  /**
   * Generate a fallback HTML when the entire prototype generation fails
   * @param {String} name - Name of the prototype
   * @param {String} scenario - Scenario description
   * @param {Array} sections - Sections configuration
   * @returns {String} - Complete fallback HTML
   */
  _generateFallbackHtml(name, scenario, sections) {
    const sectionPlaceholders = sections.map(section => {
      return `
<section id="${section.id}" class="py-5">
  <div class="container">
    <h2>${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</h2>
    <p class="text-muted">${section.description}</p>
    <div class="alert alert-info">
      This is a fallback section. The actual content could not be generated.
    </div>
  </div>
</section>`;
    }).join('\n');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Prototype</title>
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
    .dark-mode .card, .dark-mode .alert {
      background-color: #333;
      color: #eee;
    }
    .dark-mode .navbar {
      background-color: #111 !important;
    }
    .dark-mode .text-muted {
      color: #aaa !important;
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
          ${sections.map(section => `<li class="nav-item"><a class="nav-link" href="#${section.id}">${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</a></li>`).join('')}
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
            <h1>${name}</h1>
            <p class="lead">${scenario}</p>
            <div class="alert alert-warning">
              <strong>Note:</strong> This is a fallback prototype. The actual design could not be generated.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  ${sectionPlaceholders}

  <footer class="bg-dark text-white mt-5 py-3">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <p>&copy; 2023 ${name}</p>
        </div>
        <div class="col-md-6 text-end">
          <p>Prototype</p>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
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
  </script>
</body>
</html>`;
  }
}

module.exports = new PrototypeBuilderService(); 