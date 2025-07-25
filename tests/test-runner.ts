#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🧪 Claude Code Documentation MCP Server - Test Runner\n');

// Check if Qdrant is running for integration tests
async function checkQdrantHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:6333/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Check if Ollama is running for real embedding tests
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  console.log(`📋 Running tests: ${testType}\n`);

  // Check dependencies
  const qdrantHealthy = await checkQdrantHealth();
  const ollamaHealthy = await checkOllamaHealth();

  console.log('🔍 Dependency Check:');
  console.log(`  Qdrant (localhost:6333): ${qdrantHealthy ? '✅ Available' : '❌ Not available'}`);
  console.log(`  Ollama (localhost:11434): ${ollamaHealthy ? '✅ Available' : '❌ Not available'}`);
  console.log('');

  // Determine which tests to run
  const runUnit = ['all', 'unit'].includes(testType);
  const runIntegration = ['all', 'integration'].includes(testType) && qdrantHealthy;
  
  if (testType === 'integration' && !qdrantHealthy) {
    console.log('⚠️  Skipping integration tests - Qdrant not available');
    console.log('💡 Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant');
    process.exit(1);
  }

  try {
    // Run unit tests
    if (runUnit) {
      console.log('🔬 Running unit tests...');
      execSync('npm run test:unit', { stdio: 'inherit' });
      console.log('✅ Unit tests passed\n');
    }

    // Run integration tests
    if (runIntegration) {
      console.log('🔗 Running integration tests...');
      execSync('npm run test:integration', { stdio: 'inherit' });
      console.log('✅ Integration tests passed\n');
    }

    // Generate coverage report if running all tests
    if (testType === 'all' || testType === 'coverage') {
      console.log('📊 Generating coverage report...');
      execSync('npm run test:coverage', { stdio: 'inherit' });
      console.log('✅ Coverage report generated\n');
    }

    console.log('🎉 All tests completed successfully!');
    
    // Show next steps
    console.log('\n💡 Next steps:');
    if (!qdrantHealthy) {
      console.log('  • Start Qdrant to run integration tests: docker run -p 6333:6333 qdrant/qdrant');
    }
    if (!ollamaHealthy) {
      console.log('  • Install Ollama for real embedding tests: https://ollama.ai');
      console.log('  • Pull embedding model: ollama pull nomic-embed-text');
    }
    console.log('  • Run tests with: npm test');
    console.log('  • Watch tests: npm run test:watch');
    console.log('  • Coverage report: npm run test:coverage');

  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: tsx tests/test-runner.ts [type]');
  console.log('');
  console.log('Types:');
  console.log('  all (default)  Run all tests');
  console.log('  unit          Run only unit tests');
  console.log('  integration   Run only integration tests (requires Qdrant)');
  console.log('  coverage      Run tests with coverage report');
  console.log('');
  console.log('Examples:');
  console.log('  tsx tests/test-runner.ts');
  console.log('  tsx tests/test-runner.ts unit');
  console.log('  tsx tests/test-runner.ts integration');
  process.exit(0);
}

runTests().catch(console.error);