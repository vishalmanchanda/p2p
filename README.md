#  Express API

A comprehensive Express.js API that interfaces with the local  AI model to provide various AI-powered endpoints for code generation, content validation, research assistance, and more.

![API Documentation](https://img.shields.io/badge/API-Documentation-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express](https://img.shields.io/badge/Express-v4.18.2-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

 Express API is a powerful Node.js/Express server that acts as a middleware between your applications and a locally running  language model. It provides a set of RESTful endpoints for AI-powered operations like generating code, validating content, researching topics, and creating prototypes.

The API is designed to work with a local  model running via Ollama, making it efficient for development environments and removing the need for external API dependencies.

## ✨ Features

- **AI-Powered Code Generation**: Generate code in various programming languages based on your specifications
- **Content Validation**: Review and validate content based on custom criteria
- **Research Assistance**: Get AI-generated research on any topic
- **Content Summarization**: Automatically summarize long-form content
- **Insight Extraction**: Extract key insights from data or text
- **SVG Generation**: Create SVG graphics based on text descriptions
- **Prototype Generation**: Generate UI/UX prototypes from requirements
- **JDL Generation**: Create JHipster Domain Language files
- **Project Generation**: Scaffold entire projects based on requirements
- **Swagger Documentation**: Comprehensive API documentation
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Robust error handling system

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [Ollama](https://ollama.ai/) (for running the local  model)

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd deepseek-express-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install the  model using Ollama:
   ```bash
   ollama pull deepseek-r1:8b
   ```

4. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   ```

5. Start the Ollama server:
   ```bash
   ollama serve
   ```

6. Start the Express API:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

The API can be configured via environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port on which the server runs | 3000 |
| NODE_ENV | Environment (development/production) | development |
| DEEPSEEK_API_URL | URL of the Ollama API | http://127.0.0.1:11434 |
| DEEPSEEK_MODEL | Name of the  model | deepseek-r1:8b |

Additional configuration for alternative models (Gemini, Claude) is also available.

## 📖 Usage

Once the server is running, you can access:

- The API at `http://localhost:3000/api`
- API documentation at `http://localhost:3000/api-docs`
- Wizard UI at `http://localhost:3000/wizard`

### Example: Generate Code

```bash
curl -X POST http://localhost:3000/api/generate/code \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a function that calculates the Fibonacci sequence",
    "language": "javascript",
    "comments": true
  }'
```

## 🔌 API Endpoints

The API provides the following main endpoints:

- `/api/generate/code` - Generate code based on requirements
- `/api/validate/content` - Validate and review content
- `/api/research/topic` - Research a specified topic
- `/api/summarize` - Summarize content
- `/api/derive/insights` - Extract insights from content
- `/api/generate/svg` - Generate SVG graphics
- `/api/generate/prototype` - Generate UI/UX prototypes
- `/api/generate/prototype-builder` - Interactive prototype builder
- `/api/generate/jdl` - Generate JHipster Domain Language files
- `/api/generate/project` - Generate full project structures

For detailed information about request/response formats, refer to the Swagger documentation at `/api-docs` or the `API_DOCUMENTATION.md` file.

## 💻 Development

### Project Structure

```
deepseek-express-api/
├── src/
│   ├── config/       # Configuration files
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── templates/    # Templates for generation
│   ├── tests/        # Test files
│   ├── utils/        # Utility functions
│   └── index.js      # Application entry point
├── public/           # Static files
└── .env              # Environment variables
```

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Define the route handler and validation
3. Register the route in `src/index.js`

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Test the connection to the local model:

```bash
npm run test:local-model
```

## 🔧 Troubleshooting

### Common Issues

- **"Cannot connect to Ollama"**: Ensure that Ollama is running with `ollama serve`
- **"Model not found"**: Make sure you've pulled the model with `ollama pull deepseek-r1:8b`
- **Connection issues**: Use the explicit IPv4 address (127.0.0.1) instead of localhost

### Logs

Check the server logs for detailed error information.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 