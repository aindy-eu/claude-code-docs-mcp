# Tutorial Documentation Extraction Prompt

## Purpose
Extract step-by-step instructions, learning objectives, and progressive examples from tutorial documentation.

## Instructions

Please read this tutorial and extract structured learning content.

### Focus Areas

1. **Learning Path**
   - Prerequisites
   - Learning objectives
   - Difficulty level
   - Estimated time

2. **Step-by-Step Instructions**
   - Clear sequential steps
   - Expected outcomes
   - Common mistakes
   - Checkpoints

3. **Progressive Examples**
   - Building complexity
   - Explanations
   - Variations

### Output Structure

```json
{
  "source": "URL",
  "tutorialTitle": "title",
  "difficulty": "beginner/intermediate/advanced",
  "estimatedTime": "duration",
  "objectives": ["what you'll learn"],
  "prerequisites": ["required knowledge"],
  "steps": [{
    "stepNumber": 1,
    "title": "step title",
    "instructions": "detailed instructions",
    "code": {
      "language": "language",
      "snippet": "code to write",
      "explanation": "why this code"
    },
    "expectedResult": "what should happen",
    "commonMistakes": ["pitfalls"],
    "checkpoint": "how to verify success"
  }],
  "finalProject": {
    "description": "what you built",
    "completeCode": "final version",
    "extensions": ["next steps"]
  },
  "troubleshooting": [{
    "issue": "common problem",
    "solution": "how to fix"
  }],
  "metadata": {
    "extractedAt": "ISO timestamp",
    "modelUsed": "claude-3-opus"
  }
}
```

**Output only valid JSON with no additional text or formatting.**