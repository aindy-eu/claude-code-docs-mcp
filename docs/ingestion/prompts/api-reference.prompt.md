# API Reference Documentation Extraction Prompt

## Purpose
Extract detailed API specifications, parameters, return types, and usage patterns from API documentation.

## Instructions

Please read this API documentation and extract comprehensive technical details.

### Focus Areas

1. **API Endpoints/Methods**
   - Full signatures with types
   - Required vs optional parameters
   - Return values and types
   - Error responses

2. **Authentication & Authorization**
   - Required headers/tokens
   - Permission levels
   - Rate limits

3. **Examples & Usage**
   - Working code examples
   - Common patterns
   - Error handling

### Output Structure

```json
{
  "source": "URL",
  "apiName": "API name",
  "version": "API version",
  "baseUrl": "Base API URL",
  "authentication": {
    "method": "Bearer/API Key/etc",
    "required": true/false,
    "details": "specifics"
  },
  "endpoints": [{
    "method": "GET/POST/etc",
    "path": "/endpoint/path",
    "description": "what it does",
    "parameters": [{
      "name": "param",
      "type": "string/number/etc",
      "required": true/false,
      "description": "what it's for",
      "default": "default value",
      "constraints": ["validation rules"]
    }],
    "returns": {
      "type": "response type",
      "schema": {},
      "examples": []
    },
    "errors": [{
      "code": "ERROR_CODE",
      "status": 400,
      "description": "when this occurs"
    }],
    "examples": [{
      "language": "curl/python/js",
      "code": "complete example",
      "description": "what this demonstrates"
    }]
  }],
  "rateLimits": {
    "requests": "per time period",
    "headers": ["rate limit headers"]
  },
  "metadata": {
    "extractedAt": "ISO timestamp",
    "modelUsed": "claude-3-opus"
  }
}
```

**Output only valid JSON with no additional text or formatting.**