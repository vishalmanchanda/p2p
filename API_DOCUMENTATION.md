# DeepSeek Express API Documentation

This document provides detailed information about the DeepSeek Express API endpoints, request formats, and response structures.

## Local DeepSeek Model

This API is configured to work with a locally running DeepSeek model (deepseek-r1:8b) using Ollama at http://127.0.0.1:11434/. Make sure the model is running before using the API.

### Troubleshooting Connection Issues

If you encounter connection issues:

1. Ensure Ollama is running with `ollama serve`
2. Verify the model is available with `ollama list`
3. Use the explicit IPv4 address (127.0.0.1) instead of localhost in your configuration

## Base URL

```
http://localhost:3000/api
```

## Authentication

No authentication is required for the API requests. The API communicates with the local DeepSeek model directly.

## Common Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Endpoints

### 1. Generate Code

Generate code based on a prompt.

- **URL**: `/generate/code`
- **Method**: `POST`
- **Request Body**:

```json
{
  "prompt": "Create a function that calculates the Fibonacci sequence",
  "language": "javascript",
  "comments": true,
  "maxTokens": 2048
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| prompt | string | Yes | - | The requirements for the code to be generated |
| language | string | No | "javascript" | The programming language for the generated code |
| comments | boolean | No | true | Whether to include comments in the generated code |
| maxTokens | number | No | 2048 | Maximum number of tokens in the response |

- **Success Response**:

```json
{
  "success": true,
  "data": {
    "code": "// Generated code here...",
    "language": "javascript",
    "model": "deepseek-r1:8b"
  }
}
```

### 2. Validate Content

Validate and review content based on specified criteria.

- **URL**: `/validate/content`
- **Method**: `POST`
- **Request Body**:

```json
{
  "content": "The content to be validated...",
  "criteria": ["accuracy", "clarity", "coherence"],
  "detailed": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| content | string | Yes | - | The content to be validated |
| criteria | array of strings | No | ["accuracy", "clarity", "coherence"] | Criteria for validation |
| detailed | boolean | No | true | Whether to provide detailed feedback |

- **Success Response**:

```json
{
  "success": true,
  "data": {
    "review": "Validation results...",
    "criteria": ["accuracy", "clarity", "coherence"],
    "model": "deepseek-r1:8b"
  }
}
```

### 3. Research Topic

Perform research on a specified topic.

- **URL**: `/research/topic`
- **Method**: `POST`
- **Request Body**:

```json
{
  "topic": "Artificial Intelligence in Healthcare",
  "depth": "intermediate",
  "format": "detailed"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| topic | string | Yes | - | The topic to research |
| depth | string | No | "intermediate" | Depth of research: "basic", "intermediate", or "advanced" |
| format | string | No | "detailed" | Format of results: "outline", "detailed", or "comprehensive" |

- **Success Response**:

```json
{
  "success": true,
  "data": {
    "research": "Research results...",
    "topic": "Artificial Intelligence in Healthcare",
    "depth": "intermediate",
    "format": "detailed",
    "model": "deepseek-r1:8b"
  }
}
```

### 4. Summarize Content

Summarize content with customizable length and style.

- **URL**: `/summarize`
- **Method**: `POST`
- **Request Body**:

```json
{
  "content": "The content to be summarized...",
  "length": "medium",
  "style": "paragraph"
}
```