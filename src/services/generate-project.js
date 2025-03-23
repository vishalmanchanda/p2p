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

async function generateEntityConfigs(projectPath, requirementsText, port = 3002, host = 'localhost') {
  const entityConfigsPath = path.join(projectPath, 'static', 'entity-configs.js');

  // call the generateCode function from gen-ai.service.js
  const genAIService = require('./gen-ai.service');
  try {
    const response = await genAIService.generateCode({
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
    });
    
    // Log the response structure to understand what we're getting
    console.log('AI service response type:', typeof response);
    console.log('AI service response structure:', Object.keys(response));
    
    // Extract the code from the response object
    // This is a guess - we need to know the actual structure
    const entityConfigs = response.text || response.code || response.content || 
                          (typeof response === 'string' ? response : JSON.stringify(response, null, 2));
    
    // Make sure we have a string before writing to file
    if (typeof entityConfigs !== 'string') {
      throw new Error(`Expected string from AI service but got ${typeof entityConfigs}`);
    }
    
    fs.writeFileSync(entityConfigsPath, entityConfigs);
    console.log(`Entity configs generated at: ${entityConfigsPath}`);
    return entityConfigsPath;
  } catch (error) {
    console.error('Error generating entity configs:', error);
    throw error;
  }
}

module.exports = {
  generateProject,
  generateEntityConfigs
};

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

main();
