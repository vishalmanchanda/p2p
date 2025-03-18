#!/usr/bin/env node

/**
 * Mock Data Generator for JSON Server
 * This script reads entity configurations from entity-configs.js
 * and generates realistic mock data using Faker.js
 */

const fs = require('fs');
const path = require('path');

// Check if faker is installed
try {
  require('@faker-js/faker');
} catch (error) {
  console.error('Error: @faker-js/faker is not installed');
  console.log('Please install it with: npm install @faker-js/faker');
  process.exit(1);
}

const { faker } = require('@faker-js/faker');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value;
  }
  return acc;
}, {});

// Set options
const count = parseInt(args.count || '25', 10);
const outputFile = args.output || 'db/db.json';
// const configFilePrefix = args.configFilePrefix || 'default';

// Create a temporary file that exports the configurations properly
function createTemporaryConfigFile() {
  try {    
    const configPath = path.join(__dirname, '..', 'static', `entity-configs.js`);
    console.log(`Reading entity configurations from: ${configPath}`);
    
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Create a temporary file with proper Node.js exports
    const tempFilePath = path.join(__dirname, '_temp_config.js');
    
    // Add Node.js module.exports at the end
    configContent += `\nmodule.exports = { configuredEntities };`;
    
    fs.writeFileSync(tempFilePath, configContent);
    console.log(`Created temporary config file: ${tempFilePath}`);
    
    return tempFilePath;
  } catch (error) {
    console.error(`Error creating temporary config file: ${error.message}`);
    throw error;
  }
}

// Load entity configurations from the temporary file
function loadEntityConfigs(tempFilePath) {
  try {
    // Clear require cache to ensure we get fresh data
    delete require.cache[require.resolve(tempFilePath)];
    
    // Load the configurations
    const { configuredEntities } = require(tempFilePath);
    
    if (!configuredEntities || !Array.isArray(configuredEntities)) {
      throw new Error('configuredEntities is not properly defined or is not an array');
    }
    
    return configuredEntities;
  } catch (error) {
    console.error(`Error loading entity configurations: ${error.message}`);
    throw error;
  } finally {
    // Clean up the temporary file
    try {
      fs.unlinkSync(tempFilePath);
      console.log(`Removed temporary config file`);
    } catch (e) {
      console.warn(`Warning: Could not remove temporary file: ${e.message}`);
    }
  }
}

// Generate mock data based on entity configurations
function generateMockData(entityConfigs) {
  const mockData = {};
  
  entityConfigs.forEach(entity => {
    const entityName = entity.config.entityName;
    console.log(`Generating ${count} records for ${entityName}...`);
    
    mockData[entityName] = [];
    
    for (let i = 1; i <= count; i++) {
      const record = { id: i };
      
      entity.config.attributes.forEach(attr => {
        record[attr.name] = generateValue(attr);
      });
      
      mockData[entityName].push(record);
    }
  });
  
  return mockData;
}

// Generate a value based on attribute type
function generateValue(attr) {
  switch (attr.type) {
    case 'text':
      if (attr.name.toLowerCase().includes('name')) {
        if (attr.name.toLowerCase().includes('product')) {
          return faker.commerce.productName();
        } else if (attr.name.toLowerCase().includes('customer')) {
          return faker.person.fullName();
        } else {
          return faker.person.fullName();
        }
      } else if (attr.name.toLowerCase().includes('id')) {
        return faker.string.alphanumeric(8).toUpperCase();
      }
      return faker.lorem.words(3);
      
    case 'email':
      return faker.internet.email();
      
    case 'number':
      const min = attr.min !== undefined ? attr.min : 0;
      const max = attr.max !== undefined ? attr.max : 1000;
      
      if (attr.name.toLowerCase().includes('price') || 
          attr.name.toLowerCase().includes('amount') || 
          attr.name.toLowerCase().includes('salary')) {
        // Generate price with 2 decimal places
        return parseFloat(faker.commerce.price({ min, max }));
      } else if (attr.name.toLowerCase().includes('quantity') || 
                attr.name.toLowerCase().includes('stock')) {
        return faker.number.int({ min, max: Math.min(max, 100) });
      } else if (attr.name.toLowerCase().includes('age')) {
        return faker.number.int({ min: 18, max: 80 });
      } else {
        return faker.number.int({ min, max });
      }
      
    case 'date':
      const name = attr.name.toLowerCase();
      
      if (name.includes('hire')) {
        // Hire date within last 5 years
        return faker.date.past({ years: 5 }).toISOString().split('T')[0];
      } else if (name.includes('added')) {
        // Added date within last year
        return faker.date.past({ years: 1 }).toISOString().split('T')[0];
      } else if (name.includes('order')) {
        // Order date within last 30 days
        return faker.date.recent({ days: 30 }).toISOString().split('T')[0];
      } else {
        // Default to recent date
        return faker.date.recent({ days: 90 }).toISOString().split('T')[0];
      }
      
    case 'select':
      if (!attr.options || !attr.options.length) {
        return null;
      }
      
      // Randomly select one of the provided options
      const randomIndex = Math.floor(Math.random() * attr.options.length);
      return attr.options[randomIndex].value;
      
    case 'checkbox':
      return faker.datatype.boolean();
      
    case 'textarea':
      return faker.lorem.paragraphs(2);
      
    default:
      return faker.lorem.word();
  }
}

// Main function
async function main() {
  let tempFilePath = null;
  
  try {
    console.log(`Mock Data Generator`);
    console.log(`-------------------`);
    console.log(`Records per entity: ${count}`);
    console.log(`Output file: ${outputFile}`);
    
    // Create temporary config file with proper exports
    tempFilePath = createTemporaryConfigFile();
    
    // Load entity configurations
    const entityConfigs = loadEntityConfigs(tempFilePath);
    console.log(`Loaded ${entityConfigs.length} entity configurations`);
    
    // List the entities
    console.log(`Entities to generate:`);
    entityConfigs.forEach(entity => {
      console.log(`- ${entity.name} (${entity.config.entityName}): ${entity.config.attributes.length} attributes`);
    });
    
    // Generate mock data
    const mockData = generateMockData(entityConfigs);
    
    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(mockData, null, 2));
    
    console.log('\nMock data generation complete!');
    console.log('Summary:');
    
    Object.keys(mockData).forEach(entityName => {
      console.log(`- ${entityName}: ${mockData[entityName].length} records`);
    });
    
    console.log(`\nData saved to ${outputFile}`);
    console.log('You can now start JSON Server with:');
    console.log(`json-server --watch ${outputFile}`);
    
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  } finally {
    // Make sure we clean up the temporary file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

main(); 