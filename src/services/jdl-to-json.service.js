const fs = require('fs').promises;
const path = require('path');
const genAIService = require('./gen-ai.service');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Service for converting JDL to JSON Server format with mock data
 */
class JdlToJsonService {
  /**
   * Generate a JSON Server db.json file from JDL content
   * @param {Object} params - Parameters for JSON generation
   * @returns {Promise<Object>} - Generated JSON information
   */
  async generateJsonFromJdl({ jdlContent, name, options }) {
    try {
      // Sanitize the name for use as a directory name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create the directory structure
      const dirPath = path.join(process.cwd(), 'public', sanitizedName);
      await fs.mkdir(dirPath, { recursive: true });
      
      // Parse the JDL to extract entity information
      const entityInfo = await this._parseJdl(jdlContent);
      
      // Generate the JSON content with mock data
      const jsonContent = await this._generateJsonContent(entityInfo, options);
      
      // Save the JSON file
      const filePath = path.join(dirPath, 'db.json');
      await fs.writeFile(filePath, JSON.stringify(jsonContent, null, 2));
      
      // Generate the URL for accessing the JSON file
      const fileUrl = `/public/${sanitizedName}/db.json`;
      
      return {
        message: `JSON Server db.json for "${name}" has been generated successfully.`,
        name,
        filePath,
        url: fileUrl,
        entityCount: Object.keys(jsonContent).length,
        content: jsonContent
      };
    } catch (error) {
      console.error('Error generating JSON from JDL:', error);
      throw new ApiError('Failed to generate JSON from JDL', 500, 'JSON_GENERATION_ERROR');
    }
  }
  
  /**
   * Parse JDL content to extract entity information
   * @param {String} jdlContent - The JDL content
   * @returns {Promise<Array>} - Array of entity information
   */
  async _parseJdl(jdlContent) {
    // This is a simple parser that extracts entity names and fields
    // For a more comprehensive parser, a proper JDL parser would be needed
    
    const entityRegex = /entity\s+(\w+)\s*{([^}]*)}/g;
    const fieldRegex = /\s*(\w+)\s+(\w+)(?:\s+([^,\n]*))?/g;
    const relationshipRegex = /relationship\s+(OneToOne|OneToMany|ManyToOne|ManyToMany)\s*{([^}]*)}/g;
    
    const entities = [];
    let match;
    
    // Extract entities and their fields
    while ((match = entityRegex.exec(jdlContent)) !== null) {
      const entityName = match[1];
      const fieldsContent = match[2];
      const fields = [];
      
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(fieldsContent)) !== null) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const fieldValidations = fieldMatch[3] || '';
        
        fields.push({
          name: fieldName,
          type: fieldType,
          validations: fieldValidations,
          isRequired: fieldValidations.includes('required')
        });
      }
      
      entities.push({
        name: entityName,
        fields
      });
    }
    
    // Extract relationships
    const relationships = [];
    while ((match = relationshipRegex.exec(jdlContent)) !== null) {
      const relationType = match[1];
      const relationContent = match[2];
      
      // Parse relationship content
      // Format: EntityA{fieldB} to EntityB{fieldA}
      const relationMatch = relationContent.match(/(\w+)(?:{(\w+)})?\s+to\s+(\w+)(?:{(\w+)})?/);
      
      if (relationMatch) {
        const [, sourceEntity, sourceField, targetEntity, targetField] = relationMatch;
        
        relationships.push({
          type: relationType,
          source: {
            entity: sourceEntity,
            field: sourceField
          },
          target: {
            entity: targetEntity,
            field: targetField
          }
        });
      }
    }
    
    // Add relationship information to entities
    for (const relationship of relationships) {
      const sourceEntity = entities.find(e => e.name === relationship.source.entity);
      const targetEntity = entities.find(e => e.name === relationship.target.entity);
      
      if (sourceEntity && targetEntity) {
        if (!sourceEntity.relationships) sourceEntity.relationships = [];
        if (!targetEntity.relationships) targetEntity.relationships = [];
        
        sourceEntity.relationships.push({
          type: relationship.type,
          with: targetEntity.name,
          field: relationship.source.field,
          isSource: true
        });
        
        targetEntity.relationships.push({
          type: relationship.type,
          with: sourceEntity.name,
          field: relationship.target.field,
          isSource: false
        });
      }
    }
    
    return entities;
  }
  
  /**
   * Generate JSON content with mock data based on entity information
   * @param {Array} entities - Array of entity information
   * @param {Object} options - Additional options for JSON generation
   * @returns {Promise<Object>} - Generated JSON content
   */
  async _generateJsonContent(entities, options) {
    // Use LLM to generate mock data based on entity information
    const prompt = `
Generate a JSON Server db.json file with mock data based on the following entity information:

${JSON.stringify(entities, null, 2)}

The JSON should:
1. Include all entities as top-level keys in the JSON
2. Generate ${options?.recordsPerEntity || 10} records for each entity
3. Use appropriate data types for each field based on its type
4. Handle relationships correctly (e.g., include foreign keys)
5. Ensure referential integrity in the data

For example, if there's a OneToMany relationship between Author and Book, each Book should have an authorId that references an existing Author id.

Return ONLY the JSON content without any explanations or markdown formatting. Do not include backticks (\`\`\`) or any other markdown syntax.
`;

    // Generate the JSON content
    const result = await genAIService.generateCode({
      prompt,
      language: 'json',
      comments: false,
      maxTokens: 4096 // Larger token limit for complex JSON
    });
    
    // Parse the generated JSON
    try {
      // Clean the code to remove any markdown formatting
      let cleanedCode = result.code;
      
      // Remove markdown code block syntax if present
      cleanedCode = cleanedCode.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      
      // Remove any backticks at the beginning or end
      cleanedCode = cleanedCode.replace(/^`+|`+$/g, '');
      
      console.log('Cleaned JSON code:', cleanedCode.substring(0, 100) + '...');
      
      return JSON.parse(cleanedCode);
    } catch (error) {
      console.error('Error parsing generated JSON:', error);
      
      // Fallback to generating a simple JSON structure
      console.log('Falling back to simple JSON structure');
      const fallbackJson = this._generateFallbackJson(entities, options?.recordsPerEntity || 10);
      return fallbackJson;
    }
  }
  
  /**
   * Generate a fallback JSON structure when parsing fails
   * @param {Array} entities - Array of entity information
   * @param {Number} recordsPerEntity - Number of records to generate per entity
   * @returns {Object} - Simple JSON structure
   */
  _generateFallbackJson(entities, recordsPerEntity) {
    const result = {};
    
    entities.forEach(entity => {
      const records = [];
      
      for (let i = 1; i <= recordsPerEntity; i++) {
        const record = { id: i };
        
        entity.fields.forEach(field => {
          switch (field.type.toLowerCase()) {
            case 'string':
              record[field.name] = `${entity.name} ${field.name} ${i}`;
              break;
            case 'integer':
            case 'int':
            case 'long':
              record[field.name] = i * 10;
              break;
            case 'float':
            case 'double':
            case 'decimal':
              record[field.name] = i * 10.5;
              break;
            case 'boolean':
              record[field.name] = i % 2 === 0;
              break;
            case 'date':
            case 'localdate':
              record[field.name] = new Date(2023, 0, i).toISOString().split('T')[0];
              break;
            case 'instant':
            case 'zoneddatetime':
              record[field.name] = new Date(2023, 0, i).toISOString();
              break;
            default:
              record[field.name] = `${field.name} ${i}`;
          }
        });
        
        records.push(record);
      }
      
      result[entity.name] = records;
    });
    
    return result;
  }
  
  /**
   * Generate JSON content directly from JDL without parsing
   * @param {String} jdlContent - The JDL content
   * @param {Object} options - Additional options for JSON generation
   * @returns {Promise<Object>} - Generated JSON content
   */
  async generateJsonDirectly(jdlContent, options) {
    const prompt = `
Convert the following JHipster Domain Language (JDL) to a JSON Server db.json file with mock data:

${jdlContent}

The JSON should:
1. Include all entities as top-level keys in the JSON
2. Generate ${options?.recordsPerEntity || 10} records for each entity
3. Use appropriate data types for each field based on its type
4. Handle relationships correctly (e.g., include foreign keys)
5. Ensure referential integrity in the data

For example, if there's a OneToMany relationship between Author and Book, each Book should have an authorId that references an existing Author id.

Return ONLY the JSON content without any explanations or markdown formatting. Do not include backticks (\`\`\`) or any other markdown syntax.
`;

    // Generate the JSON content
    const result = await genAIService.generateCode({
      prompt,
      language: 'json',
      comments: false,
      maxTokens: 4096 // Larger token limit for complex JSON
    });
    
    // Parse the generated JSON
    try {
      // Clean the code to remove any markdown formatting
      let cleanedCode = result.code;
      
      // Remove markdown code block syntax if present
      cleanedCode = cleanedCode.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      
      // Remove any backticks at the beginning or end
      cleanedCode = cleanedCode.replace(/^`+|`+$/g, '');
      
      console.log('Cleaned JSON code:', cleanedCode.substring(0, 100) + '...');
      
      return JSON.parse(cleanedCode);
    } catch (error) {
      console.error('Error parsing generated JSON:', error);
      
      // Try to parse the JDL to extract entity information
      try {
        const entities = await this._parseJdl(jdlContent);
        console.log('Falling back to simple JSON structure based on parsed JDL');
        const fallbackJson = this._generateFallbackJson(entities, options?.recordsPerEntity || 10);
        return fallbackJson;
      } catch (parseError) {
        console.error('Error parsing JDL for fallback:', parseError);
        throw new ApiError('Failed to parse generated JSON', 500, 'JSON_PARSE_ERROR');
      }
    }
  }
}

module.exports = new JdlToJsonService(); 