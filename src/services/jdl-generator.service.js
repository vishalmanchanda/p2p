const fs = require('fs').promises;
const path = require('path');
const genAIService = require('./gen-ai.service');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Service for generating JDL (JHipster Domain Language) entity relationships from requirements
 */
class JdlGeneratorService {
  /**
   * Generate JDL from requirements
   * @param {Object} params - Parameters for JDL generation
   * @returns {Promise<Object>} - Generated JDL information
   */
  async generateJdl({ requirements, name, options }) {
    try {
      // Sanitize the name for use as a file name
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create the directory structure
      const dirPath = path.join(process.cwd(), 'public', 'jdl');
      await fs.mkdir(dirPath, { recursive: true });
      
      // Generate the JDL content
      const jdlContent = await this._generateJdlContent(requirements, options);
      
      // Save the JDL file
      const filePath = path.join(dirPath, `${sanitizedName}.jdl`);
      await fs.writeFile(filePath, jdlContent);
      
      // Generate the URL for accessing the JDL file
      const fileUrl = `/public/jdl/${sanitizedName}.jdl`;
      
      return {
        message: `JDL for "${name}" has been generated successfully.`,
        name,
        filePath,
        url: fileUrl,
        content: jdlContent
      };
    } catch (error) {
      console.error('Error generating JDL:', error);
      throw new ApiError('Failed to generate JDL', 500, 'JDL_GENERATION_ERROR');
    }
  }
  
  /**
   * Generate JDL content from requirements
   * @param {String} requirements - The requirements text
   * @param {Object} options - Additional options for JDL generation
   * @returns {Promise<String>} - Generated JDL content
   */
  async _generateJdlContent(requirements, options) {
    const prompt = `
Generate JHipster Domain Language (JDL) code based on the following requirements:

${requirements}

The JDL should include:
1. Entity definitions with appropriate fields and types
2. Relationships between entities (OneToOne, OneToMany, ManyToOne, ManyToMany)
3. Field validations where appropriate
4. Enumerations if needed
5. Entity options (pagination, service, dto, etc.) if specified in the requirements

${options?.includeApplicationConfig ? 'Also include application configuration.' : ''}
${options?.microserviceNames?.length > 0 ? `Define these entities for microservices: ${options.microserviceNames.join(', ')}` : ''}
${options?.databaseType ? `Use ${options.databaseType} as the database type.` : ''}

Follow these JDL best practices:
- Use proper naming conventions (PascalCase for entities, camelCase for fields)
- Include comments to explain complex relationships or business rules
- Group related entities together
- Specify appropriate field types (String, Integer, Long, BigDecimal, LocalDate, ZonedDateTime, Boolean, Enumeration, etc.)
- Add validations like required, minlength, maxlength, min, max, pattern where appropriate
- Use meaningful relationship names

Use the standard JHipster JDL syntax, for example:

entity Blog {
  name String required,
  handle String required minlength(2),
  description TextBlob
}

entity Post {
  title String required,
  content TextBlob required,
  date ZonedDateTime required
}

relationship OneToMany {
  Blog{post} to Post{blog(name)}
}

Return ONLY the JDL code without any explanations or markdown formatting.
`;

    // Generate the JDL content
    const result = await genAIService.generateCode({
      prompt,
      language: 'jdl',
      comments: true,
      maxTokens: 4096 // Larger token limit for complex JDL
    });
    
    return result.code;
  }
  
  /**
   * Validate JDL content
   * @param {String} jdlContent - The JDL content to validate
   * @returns {Promise<Object>} - Validation results
   */
  async validateJdl(jdlContent) {
    // This is a simple validation that checks for common JDL syntax elements
    // For a more comprehensive validation, a proper JDL parser would be needed
    
    // Check for entity definitions in various formats
    const hasEntityDefinition = 
      /entity\s+\w+\s*{/.test(jdlContent) || // Traditional format
      /entities:\s*\n\s*\w+:/.test(jdlContent) || // YAML-like format
      /\w+:\s*{\s*fields:/.test(jdlContent); // Object-like format
    
    // Check for relationship definitions in various formats
    const hasRelationship = 
      /relationship\s+(OneToOne|OneToMany|ManyToOne|ManyToMany)\s*{/.test(jdlContent) || // Traditional format
      /relationships:\s*\n\s*-/.test(jdlContent) || // YAML-like format
      /\w+:\s*{\s*type:\s*(OneToOne|OneToMany|ManyToOne|ManyToMany)/.test(jdlContent); // Object-like format
    
    const errors = [];
    
    if (!hasEntityDefinition) {
      errors.push('No entity definitions found in JDL');
    }
    
    if (jdlContent.includes('relationship') && !hasRelationship) {
      errors.push('Invalid relationship syntax in JDL');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new JdlGeneratorService(); 