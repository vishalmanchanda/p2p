const axios = require('axios');
const { getDeepseekApi } = require('../utils/deepseekApi');

/**
 * Generate structured requirements from basic requirements
 * @param {string} basicRequirements - The basic requirements text
 * @param {string} modelName - The name of the LLM model to use
 * @returns {Object} - The structured requirements object
 */
async function generateStructuredRequirements(basicRequirements, modelName = 'deepseek-r1:8b') {
  try {
    console.log(`Generating structured requirements using model: ${modelName}`);
    const deepseekApi = getDeepseekApi();
    
    const prompt = `You are a requirements engineer helping to convert basic user requirements into structured requirements. 
Take the following basic requirements and convert them into a well-structured format.

Basic Requirements:
${basicRequirements}

Your task is to generate structured requirements covering all of the following sections:
1. Personas - Key user types who will interact with the system
2. Goals - The main objectives the project aims to achieve
3. Core Features - Essential functionalities required for the system
4. Key Data - Important data entities and their attributes
5. Workflows - Main user journeys and process flows
6. Constraints - Technical, business, or other limitations to consider

Format your response as a JSON object with the following structure:
{
  "personas": [
    { "name": "Persona Name", "description": "Detailed description of this persona's characteristics, needs and goals" }
  ],
  "goals": [
    { "title": "Goal Title", "description": "Detailed description of this goal" }
  ],
  "coreFeatures": [
    { "title": "Feature Title", "description": "Detailed description of this feature", "priority": "High/Medium/Low" }
  ],
  "keyData": [
    { "entity": "Entity Name", "attributes": ["attribute1", "attribute2"], "description": "Description of this data entity" }
  ],
  "workflows": [
    { "name": "Workflow Name", "steps": ["Step 1", "Step 2", "Step 3"], "description": "Description of this workflow" }
  ],
  "constraints": [
    { "type": "Technical/Business/Legal/etc.", "description": "Detailed description of this constraint" }
  ]
}

Ensure your response is only the JSON without any additional text.`;

    // Call the model
    const response = await deepseekApi.post('/v1/chat/completions', {
      model: modelName,
      messages: [
        { role: 'system', content: 'You are an AI assistant that specializes in generating structured software requirements.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2048
    });

    // Parse the response
    let jsonResponse;
    try {
      // Extract the JSON string from the response
      const jsonString = response.data.choices[0].message.content.trim();
      
      // Try to find JSON content within the response if it's not pure JSON
      let jsonContent = jsonString;
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      // Clean up the JSON string
      jsonContent = jsonContent
        .replace(/```json\n?/g, '') // Remove JSON code block markers
        .replace(/```\n?/g, '')     // Remove any remaining code block markers
        .trim();
        
      jsonResponse = JSON.parse(jsonContent);
      
      // Validate the structure
      if (!jsonResponse.personas || !jsonResponse.goals || !jsonResponse.coreFeatures || 
          !jsonResponse.keyData || !jsonResponse.workflows || !jsonResponse.constraints) {
        throw new Error('Invalid JSON structure: missing required sections');
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw response:', response.data.choices[0].message.content);
      throw new Error('Failed to parse the structured requirements. The model did not return valid JSON. Please try again.');
    }

    return {
      success: true,
      data: jsonResponse
    };
  } catch (error) {
    console.error('Error generating structured requirements:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to generate structured requirements',
        details: error.response?.data || {}
      }
    };
  }
}

/**
 * Enhance existing structured requirements based on user feedback
 * @param {Object} structuredRequirements - The existing structured requirements
 * @param {string} enhancementPrompt - The user's enhancement request
 * @param {string} modelName - The name of the LLM model to use
 * @returns {Object} - The enhanced structured requirements
 */
async function enhanceStructuredRequirements(structuredRequirements, enhancementPrompt, modelName = 'deepseek-r1:8b') {
  try {
    console.log(`Enhancing structured requirements using model: ${modelName}`);
    const deepseekApi = getDeepseekApi();
    
    const prompt = `You are a requirements engineer helping to enhance structured requirements based on user feedback.

Current Structured Requirements:
${JSON.stringify(structuredRequirements, null, 2)}

User's Enhancement Request:
${enhancementPrompt}

Your task is to enhance the structured requirements based on the user's feedback while maintaining the same JSON structure. Return the complete enhanced requirements JSON object.

Format your response as a JSON object with the following structure:
{
  "personas": [
    { "name": "Persona Name", "description": "Detailed description of this persona's characteristics, needs and goals" }
  ],
  "goals": [
    { "title": "Goal Title", "description": "Detailed description of this goal" }
  ],
  "coreFeatures": [
    { "title": "Feature Title", "description": "Detailed description of this feature", "priority": "High/Medium/Low" }
  ],
  "keyData": [
    { "entity": "Entity Name", "attributes": ["attribute1", "attribute2"], "description": "Description of this data entity" }
  ],
  "workflows": [
    { "name": "Workflow Name", "steps": ["Step 1", "Step 2", "Step 3"], "description": "Description of this workflow" }
  ],
  "constraints": [
    { "type": "Technical/Business/Legal/etc.", "description": "Detailed description of this constraint" }
  ]
}

Ensure your response is only the JSON without any additional text.`;

    // Call the model
    const response = await deepseekApi.post('/v1/chat/completions', {
      model: modelName,
      messages: [
        { role: 'system', content: 'You are an AI assistant that specializes in enhancing software requirements based on user feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    // Parse the response
    let jsonResponse;
    try {
      // Extract the JSON string from the response
      const jsonString = response.data.choices[0].message.content.trim();
      jsonResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse the enhanced requirements. The model did not return valid JSON.');
    }

    return {
      success: true,
      data: jsonResponse
    };
  } catch (error) {
    console.error('Error enhancing structured requirements:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to enhance structured requirements',
        details: error.response?.data || {}
      }
    };
  }
}

module.exports = {
  generateStructuredRequirements,
  enhanceStructuredRequirements
}; 