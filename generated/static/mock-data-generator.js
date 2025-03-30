/**
 * Mock Data Generator
 * This script generates realistic mock data based on entity configurations
 * Uses Faker.js to create random data that matches the entity schema
 */

class MockDataGenerator {
  
  constructor(entityConfigs, options = {}) {
    this.entityConfigs = entityConfigs;
    this.options = {
      outputFile: 'db.json',
      recordsPerEntity: 25,
      ...options
    };
    
    // Load Faker.js if not already available
    this.loadFaker();
  }
  
  async loadFaker() {
    if (typeof window !== 'undefined') {
      // Browser environment
      if (!window.faker) {
        console.log('Loading Faker.js in browser environment...');
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@faker-js/faker@7.6.0/dist/faker.min.js';
          script.onload = () => {
            console.log('Faker.js loaded successfully');
            this.faker = window.faker;
            resolve();
          };
          document.head.appendChild(script);
        });
      } else {
        this.faker = window.faker;
      }
    } else {
      // Node.js environment
      try {
        const { faker } = await import('@faker-js/faker');
        this.faker = faker;
      } catch (error) {
        console.error('Failed to import Faker.js. Make sure it is installed:', error);
        throw new Error('Faker.js is required. Install it with: npm install @faker-js/faker');
      }
    }
  }
  
  async generateMockData() {
    // Wait for Faker to be loaded
    if (!this.faker) {
      await this.loadFaker();
    }
    
    const mockData = {};
    
    // Process each entity configuration
    for (const entity of this.entityConfigs) {
      const entityName = entity.config.entityName;
      console.log(`Generating mock data for ${entityName}...`);
      
      // Generate records for this entity
      mockData[entityName] = this.generateEntityRecords(entity.config);
    }
    
    return mockData;
  }
  
  generateEntityRecords(entityConfig) {
    const records = [];
    const count = this.options.recordsPerEntity;
    
    for (let i = 1; i <= count; i++) {
      const record = { id: i };
      
      // Generate data for each attribute
      for (const attr of entityConfig.attributes) {
        if (attr.name === 'id') continue; // Skip id field as we already set it
        
        record[attr.name] = this.generateAttributeValue(attr, entityConfig);
      }
      
      records.push(record);
    }
    
    return records;
  }
  
  generateAttributeValue(attr, entityConfig) {
    // Generate appropriate value based on attribute type
    switch (attr.type) {
      case 'text':
        return this.generateTextValue(attr);
        
      case 'email':
        return this.faker.internet.email();
        
      case 'number':
        return this.generateNumberValue(attr);
        
      case 'date':
        return this.generateDateValue(attr);
        
      case 'select':
        return this.generateSelectValue(attr);
        
      case 'checkbox':
        return this.faker.datatype.boolean();
        
      case 'textarea':
        return this.faker.lorem.paragraphs(2);
        
      default:
        return this.faker.lorem.word();
    }
  }
  
  generateTextValue(attr) {
    // Generate appropriate text based on field name
    const name = attr.name.toLowerCase();
    
    if (name.includes('name')) {
      if (name.includes('first')) {
        return this.faker.name.firstName();
      } else if (name.includes('last')) {
        return this.faker.name.lastName();
      } else if (name.includes('product')) {
        return this.faker.commerce.productName();
      } else if (name.includes('company')) {
        return this.faker.company.name();
      } else {
        return this.faker.name.fullName();
      }
    } else if (name.includes('address')) {
      return this.faker.address.streetAddress();
    } else if (name.includes('city')) {
      return this.faker.address.city();
    } else if (name.includes('country')) {
      return this.faker.address.country();
    } else if (name.includes('phone')) {
      return this.faker.phone.number();
    } else if (name.includes('color')) {
      return this.faker.color.human();
    } else if (name.includes('title')) {
      return this.faker.lorem.sentence(4);
    } else if (name.includes('description')) {
      return this.faker.lorem.paragraph();
    } else if (name.includes('id') || name.includes('code')) {
      return this.faker.random.alphaNumeric(8).toUpperCase();
    } else {
      return this.faker.lorem.words(3);
    }
  }
  
  generateNumberValue(attr) {
    const min = attr.min !== undefined ? attr.min : 0;
    const max = attr.max !== undefined ? attr.max : 1000;
    
    // Generate appropriate number based on field name
    const name = attr.name.toLowerCase();
    
    if (name.includes('age')) {
      return this.faker.datatype.number({ min: 18, max: 80 });
    } else if (name.includes('price') || name.includes('amount') || name.includes('cost')) {
      // Generate price with 2 decimal places
      return parseFloat(this.faker.commerce.price(min, max));
    } else if (name.includes('quantity') || name.includes('count') || name.includes('stock')) {
      return this.faker.datatype.number({ min, max: Math.min(max, 100) });
    } else if (name.includes('rating')) {
      return this.faker.datatype.number({ min: 1, max: 5, precision: 0.1 });
    } else if (name.includes('percent') || name.includes('discount')) {
      return this.faker.datatype.number({ min: 0, max: 100, precision: 0.01 });
    } else {
      return this.faker.datatype.number({ min, max });
    }
  }
  
  generateDateValue(attr) {
    const name = attr.name.toLowerCase();
    
    // Generate date within appropriate range based on field name
    if (name.includes('birth')) {
      // Birth dates between 18 and 80 years ago
      return this.faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0];
    } else if (name.includes('future') || name.includes('due')) {
      // Future date within next year
      return this.faker.date.future(1).toISOString().split('T')[0];
    } else if (name.includes('past') || name.includes('created')) {
      // Past date within last year
      return this.faker.date.past(1).toISOString().split('T')[0];
    } else if (name.includes('hire') || name.includes('start')) {
      // Hire date within last 5 years
      return this.faker.date.past(5).toISOString().split('T')[0];
    } else {
      // Default to recent date
      return this.faker.date.recent(30).toISOString().split('T')[0];
    }
  }
  
  generateSelectValue(attr) {
    if (!attr.options || !attr.options.length) {
      return null;
    }
    
    // Randomly select one of the provided options
    const randomIndex = Math.floor(Math.random() * attr.options.length);
    return attr.options[randomIndex].value;
  }
  
  async saveToFile(data) {
    if (typeof window !== 'undefined') {
      // Browser environment - create downloadable file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = this.options.outputFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Mock data ready for download as ${this.options.outputFile}`);
    } else {
      // Node.js environment - write to file
      const fs = await import('fs/promises');
      await fs.writeFile(this.options.outputFile, JSON.stringify(data, null, 2));
      console.log(`Mock data saved to ${this.options.outputFile}`);
    }
  }
  
  async generate() {
    try {
      const mockData = await this.generateMockData();
      await this.saveToFile(mockData);
      return mockData;
    } catch (error) {
      console.error('Error generating mock data:', error);
      throw error;
    }
  }
}

// Function to initialize the generator
async function generateMockData(entityConfigs, options = {}) {
  const generator = new MockDataGenerator(entityConfigs, options);
  return generator.generate();
}

// If in browser environment, make the function available globally
if (typeof window !== 'undefined') {
  window.generateMockData = generateMockData;
}

// If in Node.js environment, export the function
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateMockData, MockDataGenerator };
} 