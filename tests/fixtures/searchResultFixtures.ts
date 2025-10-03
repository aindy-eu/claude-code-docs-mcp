import { SearchResult } from '@/mcp-tools/search/search.types.js';
import { getDocUrl } from '@/config/claude-code-documentation-urls.js';

export const mockSearchResults: SearchResult[] = [
  {
    content:
      'Claude Code supports slash commands for quick actions. Use /help to see available commands.',
    title: 'Slash Commands Overview',
    section: 'Getting Started',
    url: getDocUrl('slashCommands'),
    score: 0.95,
    codeExamples: ['/help', '/settings', '/memory clear'],
    provider: 'ollama'
  },
  {
    content:
      'MCP (Model Context Protocol) allows Claude Code to connect to external data sources and tools.',
    title: 'MCP Integration Guide',
    section: 'Advanced Features',
    url: getDocUrl('mcp'),
    score: 0.87,
    codeExamples: ['claude mcp add my-server node ./my-server.js', 'mcp.tools.search("query")'],
    provider: 'ollama'
  },
  {
    content: 'Hooks allow you to run custom commands when certain events occur in Claude Code.',
    title: 'Using Hooks',
    section: 'Configuration',
    url: getDocUrl('hooks'),
    score: 0.82,
    codeExamples: [
      '{"hooks": {"pre-commit": "npm test"}}',
      'hooks.onFileChange(() => console.log("File changed"))'
    ],
    provider: 'openai'
  }
];

export const mockQdrantResponse = {
  points: [
    {
      id: '1',
      score: 0.95,
      payload: {
        content: mockSearchResults[0].content,
        title: mockSearchResults[0].title,
        section: mockSearchResults[0].section,
        url: mockSearchResults[0].url,
        codeExamples: mockSearchResults[0].codeExamples
      }
    },
    {
      id: '2',
      score: 0.87,
      payload: {
        content: mockSearchResults[1].content,
        title: mockSearchResults[1].title,
        section: mockSearchResults[1].section,
        url: mockSearchResults[1].url,
        codeExamples: mockSearchResults[1].codeExamples
      }
    }
  ]
};

export const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
