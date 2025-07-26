/**
 * Prompt templates for Claude-driven documentation ingestion
 * These prompts guide Claude to read documentation and output structured JSON
 */

import { IngestionPromptTemplate } from '../types/claude-ingestion.js';

export const INGESTION_PROMPTS: Record<string, IngestionPromptTemplate> = {
  overview: {
    docType: 'overview',
    template: `Please read this Claude Code documentation page and extract structured information.

Focus on:
1. Main purpose and capabilities
2. Key concepts and terminology
3. Prerequisites or requirements
4. Common use cases
5. Important warnings or limitations

For each major section:
- Extract the main content
- Identify code examples with their purpose
- Note best practices
- Highlight important warnings
- List related features or sections`,
    
    outputInstructions: `Output as JSON matching this structure:
{
  "source": "URL or identifier",
  "pageTitle": "Main title",
  "summary": "2-3 sentence overview",
  "sections": [{
    "title": "Section heading",
    "content": "Main text content",
    "codeExamples": [{
      "language": "typescript/bash/etc",
      "code": "actual code",
      "description": "what this shows",
      "demonstrates": ["concept1", "concept2"]
    }],
    "keyConcepts": ["term1", "term2"],
    "warnings": ["important note"],
    "bestPractices": ["practice1"],
    "relatedSections": ["other-feature"]
  }],
  "prerequisites": ["required knowledge"],
  "useCases": ["use case 1"],
  "metadata": {
    "extractedAt": "ISO timestamp",
    "modelUsed": "claude-3-opus"
  }
}`,
    focusAreas: ['capabilities', 'requirements', 'getting started']
  },

  tutorial: {
    docType: 'tutorial',
    template: `Please read this Claude Code tutorial and extract structured learning content.

Focus on:
1. Learning objectives
2. Step-by-step instructions
3. Code examples for each step
4. Common mistakes to avoid
5. Exercises or challenges
6. Next steps after completion

For each tutorial section:
- Extract clear instructions
- Capture all code examples
- Note expected outcomes
- Highlight troubleshooting tips
- Identify prerequisite knowledge`,
    
    outputInstructions: `Output as JSON with the same structure as above, but ensure:
- Sections follow the tutorial flow
- Code examples include full context
- Each step's purpose is clear
- Common errors and solutions are captured`,
    focusAreas: ['step-by-step process', 'hands-on examples', 'troubleshooting']
  },

  reference: {
    docType: 'reference',
    template: `Please read this Claude Code API/reference documentation and extract detailed technical information.

Focus on:
1. API signatures and parameters
2. Configuration options
3. Return values and types
4. Error conditions
5. Usage examples
6. Performance considerations

For each API or configuration:
- Document all parameters with types
- Show practical examples
- Note default values
- List possible errors
- Include related APIs`,
    
    outputInstructions: `Output as JSON with emphasis on:
- Complete parameter documentation
- Multiple code examples per feature
- Edge cases and error handling
- Performance tips
- Version compatibility notes`,
    focusAreas: ['API details', 'parameters', 'error handling', 'examples']
  },

  guide: {
    docType: 'guide',
    template: `Please read this Claude Code guide and extract practical guidance.

Focus on:
1. Best practices and patterns
2. Real-world scenarios
3. Decision-making criteria
4. Advanced techniques
5. Integration strategies
6. Optimization tips

For each topic:
- Extract actionable advice
- Capture real examples
- Note trade-offs
- Highlight expert tips
- Connect to other features`,
    
    outputInstructions: `Output as JSON focusing on:
- Practical, actionable content
- Real-world code examples
- Decision trees or criteria
- Performance optimization
- Security considerations`,
    focusAreas: ['best practices', 'real-world usage', 'optimization', 'security']
  },

  troubleshooting: {
    docType: 'troubleshooting',
    template: `Please read this Claude Code troubleshooting documentation and extract problem-solution pairs.

Focus on:
1. Common error messages
2. Symptoms and root causes
3. Diagnostic steps
4. Solutions and workarounds
5. Prevention strategies
6. When to seek help

For each issue:
- Describe the problem clearly
- List diagnostic steps
- Provide solutions
- Include code fixes
- Note prevention tips`,
    
    outputInstructions: `Output as JSON with:
- Clear problem descriptions
- Step-by-step solutions
- Code examples for fixes
- Prevention strategies
- Links to related issues`,
    focusAreas: ['error messages', 'solutions', 'diagnostics', 'prevention']
  }
};

/**
 * Get the appropriate prompt template for a documentation type
 */
export function getIngestionPrompt(docType: string): IngestionPromptTemplate {
  return INGESTION_PROMPTS[docType] || INGESTION_PROMPTS.overview;
}

/**
 * Create a complete prompt for Claude including the template and instructions
 */
export function createIngestionPrompt(
  docType: string, 
  additionalContext?: string
): string {
  const template = getIngestionPrompt(docType);
  
  const parts = [
    template.template,
    '',
    additionalContext || '',
    '',
    template.outputInstructions,
    '',
    'Important: Ensure all code examples are complete and runnable. Extract implicit knowledge and patterns, not just explicit text.',
    'Output only valid JSON with no additional text or formatting.'
  ];

  return parts.filter(p => p).join('\n');
}

/**
 * Create a prompt for checking documentation updates
 */
export function createUpdateCheckPrompt(
  documentList: string[],
  lastCheckDate: string
): string {
  return `Please help me identify which Claude Code documentation pages may have been updated since ${lastCheckDate}.

Documentation pages to check:
${documentList.map(d => `- ${d}`).join('\n')}

For each page that might have updates:
1. Note what type of changes might have occurred
2. Suggest priority for re-ingestion
3. Identify any new sections or features

Output as JSON:
{
  "checkDate": "ISO timestamp",
  "recommendations": [{
    "url": "documentation URL",
    "priority": "high/medium/low",
    "reasoning": "why this might need updating",
    "suggestedSections": ["specific sections to focus on"]
  }]
}`;
}

/**
 * Create a prompt for validating ingested content
 */
export function createValidationPrompt(
  ingestedContent: any,
  originalUrl: string
): string {
  return `Please validate this ingested documentation content for quality and completeness.

Original source: ${originalUrl}
Ingested content summary:
- Sections: ${ingestedContent.sections?.length || 0}
- Code examples: ${ingestedContent.stats?.totalCodeExamples || 0}
- Key concepts: ${ingestedContent.stats?.totalConcepts || 0}

Check for:
1. Completeness - are major sections missing?
2. Accuracy - do code examples look correct?
3. Structure - is the organization logical?
4. Context - is important context preserved?

Output as JSON:
{
  "validationDate": "ISO timestamp",
  "qualityScore": 0-100,
  "issues": [{
    "type": "completeness/accuracy/structure/context",
    "description": "what's wrong",
    "severity": "high/medium/low",
    "suggestion": "how to fix"
  }],
  "recommendations": ["improvement suggestions"]
}`;
}