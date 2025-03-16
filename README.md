# DeepSeek Express API

This is an Express.js API that integrates with the DeepSeek AI model to provide various AI capabilities:

- Code generation
- Content validation and review
- Topic research
- Content summarization
- Insight derivation
- SVG generation

## Local DeepSeek Model Setup

This API is configured to work with a locally running DeepSeek model using Ollama. Make sure you have the DeepSeek model running locally before starting the API.

### Prerequisites

1. Install [Ollama](https://ollama.ai/)
2. Pull the DeepSeek model:
   ```
   ollama pull deepseek-r1:8b
   ```
3. Run the model:
   ```
   ollama serve
   ```

The model should be accessible at `http://localhost:11434/`.

## API Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. The `.env` file is already configured to connect to the local DeepSeek model:
   ```
   PORT=3000
   NODE_ENV=development
   DEEPSEEK_API_KEY=
   DEEPSEEK_API_URL=http://127.0.0.1:11434
   DEEPSEEK_MODEL=deepseek-r1:8b
   ```
4. If your local model is running on a different port or has a different name, update the `.env` file accordingly.

## Troubleshooting

### Connection Refused Error

If you encounter a "Connection Refused" error when trying to connect to the local model, try the following:

1. Make sure Ollama is running:
   ```
   ollama serve
   ```

2. Check if the model is available:
   ```
   ollama list
   ```

3. If you still have issues, try using the explicit IPv4 address (127.0.0.1) instead of localhost in the `.env` file:
   ```
   DEEPSEEK_API_URL=http://127.0.0.1:11434
   ```

4. You can test the connection with:
   ```
   npm run test:local-model
   ```

## Running the Application

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Documentation

The API is documented using Swagger UI. Once the server is running, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

This provides a user-friendly interface to:
- Explore all available endpoints
- View request and response schemas
- Test the API directly from the browser

## API Endpoints

### Code Generation
- `POST /api/generate/code`
  - Generates clean, production-ready code based on the provided prompt
  - Returns only the actual code without explanatory text or `<think>` tags

### HTML Prototype Generation
- `POST /api/generate/prototype`
  - Generates a professional-looking HTML prototype based on a scenario description
  - Uses HTML5, jQuery, Tailwind CSS, and Font Awesome
  - Saves the generated prototype to the public directory
  - Returns a URL to access the prototype

### Section-Based HTML Prototype Generation
- `POST /api/generate/prototype-builder`
  - Builds a complete HTML prototype by generating and assembling multiple sections
  - Each section is created individually using the LLM and then combined
  - Provides more control over the structure and content of the prototype
- `POST /api/generate/prototype-builder/section`
  - Generates a single section for an HTML prototype
  - Allows for iterative development of prototypes section by section
- `GET /api/generate/prototype-builder/{name}/sections`
  - Lists all generated sections for a specific prototype

### Content Validation
- `POST /api/validate/content`

### Topic Research
- `POST /api/research/topic`

### Content Summarization
- `POST /api/summarize`

### Insight Derivation
- `POST /api/derive/insights`

### SVG Generation
- `POST /api/generate/svg`

## Request Format

Each endpoint accepts a JSON payload with specific parameters. See the API documentation for details.

## Response Format

All responses follow a standard format:
```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  }
}
```

Or in case of an error:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
``` 