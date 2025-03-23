// this service will have following  functions

// 1. generate-project (create project structure) 
// 2. generate-entity-configs (generate entity configs from requirements.txt)
// 3. generate-mock-data (generate mock data using generate-mock-data.js)

// 1. generate-project (create project structure) 
// structure will be like this 
// project-name
// ├── db
// │   ├── db.json (generated using generate-mock-data.js)
// ├── static (copy this folder from templates/static)
// │   ├── entity-configs.js (generated using generate-entity-configs.js)
// │   ├── crud.js
// │   ├── crud.html
// │   └── entities.js
// ├── requirements
// │   ├── requirements.txt
// ├── start.sh
// ├── start.bat
// ├── mock
// │   ├── generate-mock-data.sh
// │   ├── generate-mock-data.bat
// ├── package.json
// └── README.md

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const entityConfigGenerator = require('../utils/entity-config-generator');

/**
 * Generates a project structure based on the specified template
 * @param {string} projectName - Name of the project to create
 * @param {string} requirementsText - Content for requirements.txt file
 * @returns {string} - Path to the created project
 */
async function generateProject(projectName, requirementsText, port = 3002, staticFolder = 'static', host = 'localhost') {
  const projectPath = path.resolve(process.cwd(), projectName);
  
  // Create main project directory
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  } else {
    console.warn(`Warning: Project directory ${projectName} already exists. Files may be overwritten.`);
  }
  
  // Create subdirectories
  const directories = [
    path.join(projectPath, 'db'),
    path.join(projectPath, 'static'),
    path.join(projectPath, 'requirements')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Create requirements.txt
  fs.writeFileSync(
    path.join(projectPath, 'requirements', 'requirements.txt'),
    requirementsText || '# Add your requirements here'
  );
  
  // Copy static files from template
  const templateStaticPath = path.resolve(__dirname, '..', 'templates', 'static');
  if (fs.existsSync(templateStaticPath)) {
    copyDirectory(templateStaticPath, path.join(projectPath, 'static'));
    
    // Ensure the js and includes folders exist
    const jsDir = path.join(projectPath, 'static', 'js');
    const includesDir = path.join(projectPath, 'static', 'includes');
    const configDir = path.join(projectPath, 'static', 'config');
    
    fs.mkdirSync(jsDir, { recursive: true });
    fs.mkdirSync(includesDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    
    // Copy navbar-related files if they exist in the template
    const templateThemePath = path.resolve(__dirname, '..', 'templates', 'static', 'theme1');
    
    // Copy include-navbar.js
    const templateNavbarJsPath = path.join(templateThemePath, 'js', 'include-navbar.js');
    const targetNavbarJsPath = path.join(jsDir, 'include-navbar.js');
    if (fs.existsSync(templateNavbarJsPath)) {
      fs.copyFileSync(templateNavbarJsPath, targetNavbarJsPath);
      console.log(`Copied include-navbar.js to ${targetNavbarJsPath}`);
    }
    
    // Copy navbar.html
    const templateNavbarHtmlPath = path.join(templateThemePath, 'includes', 'navbar.html');
    const targetNavbarHtmlPath = path.join(includesDir, 'navbar.html');
    if (fs.existsSync(templateNavbarHtmlPath)) {
      fs.copyFileSync(templateNavbarHtmlPath, targetNavbarHtmlPath);
      console.log(`Copied navbar.html to ${targetNavbarHtmlPath}`);
    }
    
    // Create basic navbar-config.json if it doesn't exist
    const navbarConfigPath = path.join(configDir, 'navbar-config.json');
    if (!fs.existsSync(navbarConfigPath)) {
      const navbarConfig = {
        brand: {
          url: "index.html",
          logo: "images/logo.png",
          alt: "logo"
        },
        menus: [
          {
            title: "Home",
            url: "index.html",
            varname: "home",
            active: true
          },
          {
            title: "Entities",
            url: "crud.html",
            varname: "entities"
          }
        ]
      };
      fs.writeFileSync(navbarConfigPath, JSON.stringify(navbarConfig, null, 4));
      console.log(`Created navbar-config.json at ${navbarConfigPath}`);
    }
  } else {
    console.error(`Template static directory not found at ${templateStaticPath}`);
    // Create empty files to maintain structure
    ['crud.js', 'crud.html', 'entities.js'].forEach(file => {
      fs.writeFileSync(path.join(projectPath, 'static', file), '');
    });
  }

  //copy mock files from templates/mock to project-name/mock
  const templateMockPath = path.resolve(__dirname, '..', 'templates', 'mock');
  if (fs.existsSync(templateMockPath)) {
    copyDirectory(templateMockPath, path.join(projectPath, 'mock'));
  } else {
    console.error(`Template mock directory not found at ${templateMockPath}`);
  }
  
  // Create start scripts
  fs.writeFileSync(
    path.join(projectPath, 'start.sh'),
    `#!/bin/bash\nnpx json-server --watch db/db.json --port ${port} -s ${staticFolder}\n`
  );
  fs.chmodSync(path.join(projectPath, 'start.sh'), 0o755);
  
  fs.writeFileSync(
    path.join(projectPath, 'start.bat'),

    `@echo off\nnpx json-server --watch db/db.json --port ${port} -s ${staticFolder}\n`
  );

  // create mock generation scripts separately from start.sh and start.bat
  fs.writeFileSync(
    path.join(projectPath, 'mock', 'generate-mock-data.sh'),
    '#!/bin/bash\nnode mock/generate-mock-data.js\n'
  );
  fs.chmodSync(path.join(projectPath, 'mock', 'generate-mock-data.sh'), 0o755);

  fs.writeFileSync(
    path.join(projectPath, 'mock', 'generate-mock-data.bat'),
    '@echo off\nnode mock/generate-mock-data.js\n'
  );


  
  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Generated project',
    main: 'server.js',
    scripts: {
      start: 'json-server --watch db/db.json --port ${port} -s ${staticFolder}'
    },
    dependencies: {
      'json-server': '^0.17.0'
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create README.md
  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    `# ${projectName}\n\nGenerated project structure.\n\n## Getting Started\n\n### On Windows\nRun \`start.bat\`\n\n### On Linux/Mac\nRun \`./start.sh\`\n`
  );
  
  // Create empty db.json file (will be populated later)
  fs.writeFileSync(
    path.join(projectPath, 'db', 'db.json'),
    '{}'
  );
  
  // Create empty entity-configs.js file (will be populated later)
  fs.writeFileSync(
    path.join(projectPath, 'static', 'entity-configs.js'),
    '// This file will be generated based on requirements.txt\n'
  );
  
  console.log(`Project structure created at: ${projectPath}`);
  return projectPath;
}

/**
 * Helper function to copy a directory recursively
 * @param {string} source - Source directory path
 * @param {string} destination - Destination directory path
 */
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

async function generateEntityConfigs(projectPath, requirementsText, port = 3002, host = 'localhost', useLLM = false) {
  const entityConfigsPath = path.join(projectPath, 'static', 'entity-configs.js');

  // By default, use the rule-based generator from entityConfigGenerator utility
  console.log('Using rule-based generator to create entity configurations...');
  try {
    // Extract entities from requirements to check if we have valid entities
    const entities = entityConfigGenerator.extractEntitiesFromRequirements(requirementsText);
    
    // If no entities are found or if useLLM is explicitly set to true, try using LLM
    if (entities.length === 0 || useLLM) {
      console.log(`${entities.length === 0 ? 'No entities found in requirements.' : 'useLLM flag is set to true.'} Attempting to use LLM...`);
      try {
        const llmConfigPath = await generateEntityConfigsWithLLM(projectPath, requirementsText, port, host);
        return llmConfigPath;
      } catch (llmError) {
        console.error('Error generating entity configs with LLM:', llmError);
        console.log('Falling back to rule-based generator...');
      }
    }
    
    // Generate configs using the rule-based approach
    const defaultConfig = entityConfigGenerator.generateEntityConfigsCode(requirementsText, port, host);
    fs.writeFileSync(entityConfigsPath, defaultConfig);
    console.log(`Entity configs generated at: ${entityConfigsPath} using rule-based generator`);
    return entityConfigsPath;
  } catch (error) {
    console.error('Error generating entity configs:', error);
    
    // Last resort: use a minimal default configuration if everything else fails
    console.log('Creating minimal default entity configs');
    const minimalConfig = `// Default entity configuration
const defaultConfig = {
  entityName: 'items',
  title: 'Items',
  apiBaseUrl: 'http://${host}:${port}',
  itemsPerPage: 10,
  attributes: [
    { name: 'id', label: 'ID', type: 'number', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true }
  ]
};

const configuredEntities = [
  { name: 'items', config: defaultConfig }
];`;
    
    fs.writeFileSync(entityConfigsPath, minimalConfig);
    return entityConfigsPath;
  }
}

/**
 * Generates entity configurations using AI/LLM
 * @param {string} projectPath - Path to the project directory
 * @param {string} requirementsText - Content for requirements.txt file
 * @param {number} port - Port number for API base URL
 * @param {string} host - Host for API base URL
 * @returns {Promise<string>} - Path to the generated entity configs file
 */
async function generateEntityConfigsWithLLM(projectPath, requirementsText, port = 3002, host = 'localhost') {
  const entityConfigsPath = path.join(projectPath, 'static', 'entity-configs.js');
  const genAIService = require('./gen-ai.service');
  
  console.log('Calling AI service to generate entity configurations...');
  try {
    const response = await Promise.race([
      genAIService.generateCode({
        prompt: `Generate JavaScript code for entity configurations based on these requirements: ${requirementsText}

The output should be in this format:
const entityConfig = {
  entityName: 'entityNamePlural in lowercase',
  title: 'Entity Title',
  apiBaseUrl: 'http://${host}:${port}',
  itemsPerPage: 10,
  attributes: [
    { 
      name: 'attributeName', 
      label: 'Attribute Label', 
      type: 'text|number|email|date|select|checkbox|textarea', 
      required: true|false,
      // Additional properties based on type:
      // For number: min, max, step, prefix
      // For select: options array with value/label pairs
      // For checkbox: checkboxLabel
      // For any: helpText, hideInTable
    }
  ]
};

Finally, export all configs in an array like this:
const configuredEntities = [{name: 'entityName', config: entityConfig}, ...];

`,
        language: 'javascript',
        comments: false,
        maxTokens: 4096
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI service timeout')), 60000)
      )
    ]);
    
    // Log the response structure to understand what we're getting
    console.log('AI service response type:', typeof response);
    
    // Extract the code from the response object
    let entityConfigs;
    
    if (response && (response.text || response.code || response.content)) {
      entityConfigs = response.text || response.code || response.content;
      console.log('Successfully extracted entity configs from AI response');
    } else if (typeof response === 'string') {
      entityConfigs = response;
      console.log('Received string response from AI service');
    } else {
      // Fall back to rule-based generator if we can't extract code from the response
      throw new Error('Unable to extract valid code from AI response');
    }
    
    // Make sure we have a string before writing to file
    if (typeof entityConfigs !== 'string') {
      console.warn('Non-string entity configs, converting to JSON');
      entityConfigs = JSON.stringify(entityConfigs, null, 2);
    }
    
    fs.writeFileSync(entityConfigsPath, entityConfigs);
    console.log(`Entity configs generated at: ${entityConfigsPath} using LLM`);
    return entityConfigsPath;
  } catch (error) {
    console.error('Error generating entity configs with LLM:', error);
    throw error; // Re-throw to be caught by the calling function
  }
}

// run this file using node src/services/generate-project.js

// generate project
async function main() { 
// take port , host , staticFolder as optional command line arguments and projectName as required argument and requirementsText as fileName from command line arguments
// can these arguements be taken as a json object ?
// const args = process.argv.slice(2);
// if (process.argv.length < 6) {
//   console.error('Usage: node generate-project.js <projectName> <requirementsText> [port] [host] [staticFolder]');
//   process.exit(1);
// }
// const { projectName, requirementsText, port, host, staticFolder } = JSON.parse(args);




  const projectName = 'p1';
  const requirementsText1 = 'generate a project with a single entity called "User" with the following fields:  name, email, password';
  const requirementsText2 = 'generate a project with a two entities called "Product" and "Order" with the  fields as :  productId, productName, price, description for Product and  orderId,orderDate, totalAmount, status, customerName  for Order';
  const requirementsText3 = 'Generate a project with four entities called "Dhatu" (verbal root), "Pratyaya" (suffix), "Shabda" (word form), and "Vachya" (voice) with the following fields:  dhatuId, dhatuText, meaning, gana, padi, it, example, notes, pratyayaId, pratyayaText, meaning, type, usage, notes, shabdaId, shabdaText, linga, vibhakti, vachana, pratipadika, notes, vachyaId, vachyaName, transformation, examples, notes';
  const projectPath = await generateProject(projectName, requirementsText1);
  console.log(projectPath);
  // // generate entity configs
 const entityConfigs = await generateEntityConfigs(projectPath, requirementsText1, 3002, 'localhost', 'static');

}

// Only run the main function if this file is executed directly (not imported)
if (require.main === module) {
  main();
}

// Add exports at end of file
module.exports = {
  generateProject,
  generateEntityConfigs
};
