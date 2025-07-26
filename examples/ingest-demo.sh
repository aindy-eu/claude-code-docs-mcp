#!/bin/bash
# Claude-Driven Documentation Ingestion Demo
# This script demonstrates how to use Claude Code to read and ingest documentation

set -e

echo "🚀 Claude-Driven Documentation Ingestion Demo"
echo "============================================"
echo ""

# Check if Qdrant is running
if ! curl -s http://localhost:6333/collections > /dev/null 2>&1; then
    echo "❌ Error: Qdrant is not running on localhost:6333"
    echo "Please start Qdrant with: docker run -p 6333:6333 qdrant/qdrant"
    exit 1
fi

# Check if Ollama is running (optional, will use OpenAI if not)
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
    PROVIDER="ollama"
else
    echo "⚠️  Ollama not found, will use OpenAI (requires OPENAI_API_KEY)"
    PROVIDER="openai"
fi

echo ""
echo "📝 Step 1: Using the example Claude output"
echo "This simulates what Claude would output when reading documentation"
echo ""

# Process the example output
echo "Processing example documentation..."
npm run process-claude examples/claude-output-example.json --provider $PROVIDER

echo ""
echo "🔍 Step 2: Testing search functionality"
echo ""

# Test searches
echo "Searching for 'slash commands'..."
npm run search "slash commands" -- --provider $PROVIDER --limit 2

echo ""
echo "Searching for 'parameter handling'..."
npm run search "how do parameters work in slash commands" -- --provider $PROVIDER --limit 2

echo ""
echo "📚 Step 3: Real Claude Code Usage (Manual)"
echo ""
echo "To ingest real documentation with Claude Code:"
echo ""
echo "1. Ask Claude to read a documentation page:"
echo "   claude \"Please read https://docs.anthropic.com/en/docs/claude-code/overview"
echo "   and extract structured information using this template:"
echo "   \$(cat examples/prompts/overview-prompt.txt)\""
echo ""
echo "2. Save Claude's output to a file:"
echo "   claude \"...\" > my-doc-output.json"
echo ""
echo "3. Process the output:"
echo "   npm run process-claude my-doc-output.json"
echo ""
echo "4. Search your knowledge base:"
echo "   npm run search \"your query\""
echo ""
echo "✅ Demo complete! Your knowledge base now contains example documentation."
echo ""
echo "🎯 Next steps:"
echo "- Try ingesting real Claude Code documentation"
echo "- Create custom prompts for your specific needs"
echo "- Build automation scripts for regular updates"
echo ""