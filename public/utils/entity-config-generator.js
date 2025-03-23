/**
 * Entity Configuration Generator Utility
 * 
 * This utility provides rule-based entity configuration generation
 * that can be used by both frontend and backend code.
 */

/**
 * Determines the field type based on field name and common patterns
 * @param {string} fieldName - The name of the field
 * @returns {string} - The inferred field type
 */
function inferFieldType(fieldName) {
  const name = fieldName.toLowerCase();
  
  // Common patterns for field types
  if (name.includes('email')) return 'email';
  if (name.includes('password')) return 'password';
  if (name.includes('phone') || name.includes('tel')) return 'tel';
  if (name.includes('url') || name.includes('website')) return 'url';
  if (name.includes('description') || name.includes('notes') || name.includes('comments') || name.includes('address')) return 'textarea';
  if (name.includes('date') || name.includes('time')) return 'date';
  if (name.includes('image') || name.includes('photo') || name.includes('picture') || name.includes('avatar')) return 'image';
  if (name.includes('color')) return 'color';
  if (name.includes('status') || name.includes('type') || name.includes('category')) return 'select';
  if (name.includes('price') || name.includes('cost') || name.includes('amount') || 
      name.includes('id') || name.includes('number') || name.includes('quantity') || 
      name.includes('count') || name.includes('age') || name.includes('score') || 
      name.includes('rating') || name.includes('lat') || name.includes('lng') || 
      name.includes('longitude') || name.includes('latitude') || name.includes('zip')) return 'number';
  
  // Default to text type
  return 'text';
}

/**
 * Creates field configuration object for an entity attribute
 * @param {string} field - The field name
 * @returns {Object} - The field configuration object
 */
function createFieldConfig(field) {
  const type = inferFieldType(field);
  const label = field.charAt(0).toUpperCase() + field.slice(1);
  
  // Base configuration
  const config = {
    name: field,
    label,
    type,
    required: true,
    hideInTable: type === 'password' || type === 'textarea'
  };
  
  // Add type-specific configurations
  if (type === 'select') {
    config.options = [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ];
  }
  
  if (type === 'number') {
    config.min = 0;
    if (field.includes('price') || field.includes('cost') || field.includes('amount')) {
      config.prefix = '$';
      config.step = 0.01;
    }
  }
  
  return config;
}

/**
 * Extracts entity details from requirements text using regular expressions
 * @param {string} requirementsText - The project requirements text
 * @returns {Object[]} - Array of entity details with name and fields
 */
function extractEntitiesFromRequirements(requirementsText) {
  const entities = [];
  const entityMatches = requirementsText.match(/([A-Z][a-zA-Z]*) has fields: ([^.]+)/g) || [];
  
  entityMatches.forEach(match => {
    const entityNameMatch = match.match(/([A-Z][a-zA-Z]*) has fields/);
    const fieldsMatch = match.match(/has fields: ([^.]+)/);
    
    if (entityNameMatch && fieldsMatch) {
      const entityName = entityNameMatch[1];
      const fieldsStr = fieldsMatch[1];
      const fields = fieldsStr.split(',').map(f => f.trim());
      
      entities.push({
        name: entityName,
        fields
      });
    }
  });
  
  return entities;
}

/**
 * Generates entity configurations from requirements
 * @param {string} requirementsText - The project requirements
 * @param {number} port - Port number for the API
 * @param {string} host - Host for the API
 * @returns {string} - Generated entity configurations as JavaScript code
 */
function generateEntityConfigsCode(requirementsText, port = 3002, host = 'localhost') {
  const entities = extractEntitiesFromRequirements(requirementsText);
  
  if (entities.length === 0) {
    // No entities found, return a minimal default config
    return `// Default entity configuration
const defaultConfig = {
  entityName: 'items',
  title: 'Items',
  apiBaseUrl: 'http://${host}:${port}',
  itemsPerPage: 10,
  attributes: [
    { name: 'id', label: 'ID', type: 'number', required: true, hideInTable: false },
    { name: 'name', label: 'Name', type: 'text', required: true, hideInTable: false }
  ]
};

const configuredEntities = [
  { name: 'items', config: defaultConfig }
];
`;
  }
  
  let entityConfigs = '// Generated entity configurations\n\n';
  let configuredEntitiesArray = [];
  
  entities.forEach(entity => {
    const entityName = entity.name;
    const fields = entity.fields;
    
    const entityVarName = `${entityName.toLowerCase()}Config`;
    const entityPluralName = `${entityName.toLowerCase()}s`;
    
    // Generate attributes array with improved field configurations
    const attributes = fields.map(field => {
      const config = createFieldConfig(field);
      return `    { name: '${config.name}', label: '${config.label}', type: '${config.type}', required: ${config.required}, hideInTable: ${config.hideInTable}${
        config.type === 'number' && config.prefix ? `, prefix: '${config.prefix}', min: ${config.min}, step: ${config.step}` : ''
      }${
        config.type === 'select' ? `, options: ${JSON.stringify(config.options)}` : ''
      } }`;
    }).join(',\n');
    
    // Generate config for this entity
    entityConfigs += `const ${entityVarName} = {
  entityName: '${entityPluralName}',
  title: '${entityName}',
  apiBaseUrl: 'http://${host}:${port}',
  itemsPerPage: 10,
  attributes: [
${attributes}
  ]
};\n\n`;
    
    configuredEntitiesArray.push(`  { name: '${entityName.toLowerCase()}', config: ${entityVarName} }`);
  });
  
  // Add the configuredEntities array
  entityConfigs += `const configuredEntities = [
${configuredEntitiesArray.join(',\n')}
];
`;
  
  return entityConfigs;
}

/**
 * Extracts entity names from requirements text
 * @param {string} requirementsText - The project requirements
 * @returns {string[]} - Array of entity names
 */
function extractEntityNames(requirementsText) {
  const entities = extractEntitiesFromRequirements(requirementsText);
  return entities.map(entity => entity.name);
}

// Check if we're in Node.js environment or browser environment
if (typeof module !== 'undefined' && module.exports) {
  // Node.js exports
  module.exports = {
    inferFieldType,
    createFieldConfig,
    extractEntitiesFromRequirements,
    generateEntityConfigsCode,
    extractEntityNames
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.EntityConfigGenerator = {
    inferFieldType,
    createFieldConfig,
    extractEntitiesFromRequirements,
    generateEntityConfigsCode,
    extractEntityNames
  };
} 