#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.info('🧪 Claude Code Documentation MCP Server - Test Runner\n');

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

  console.info(`📋 Running tests: ${testType}\n`);

  // Check dependencies
  const qdrantHealthy = await checkQdrantHealth();
  const ollamaHealthy = await checkOllamaHealth();

  console.info('🔍 Dependency Check:');
  console.info(`  Qdrant (localhost:6333): ${qdrantHealthy ? '✅ Available' : '❌ Not available'}`);
  console.info(`  Ollama (localhost:11434): ${ollamaHealthy ? '✅ Available' : '❌ Not available'}`);
  console.info('');

  // Determine which tests to run
  const runUnit = ['all', 'unit'].includes(testType);
  const runIntegration = ['all', 'integration'].includes(testType) && qdrantHealthy;

  if (testType === 'integration' && !qdrantHealthy) {
    console.info('⚠️  Skipping integration tests - Qdrant not available');
    console.info('💡 Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant');
    process.exit(1);
  }

  try {
    // Run unit tests
    if (runUnit) {
      console.info('🔬 Running unit tests...');
      execSync('npm run test:unit', { stdio: 'inherit' });
      console.info('✅ Unit tests passed\n');
    }

    // Run integration tests
    if (runIntegration) {
      console.info('🔗 Running integration tests...');
      execSync('npm run test:integration', { stdio: 'inherit' });
      console.info('✅ Integration tests passed\n');
    }

    // Generate coverage report if running all tests
    if (testType === 'all' || testType === 'coverage') {
      console.info('📊 Generating coverage report...');
      execSync('npm run test:coverage', { stdio: 'inherit' });
      console.info('✅ Coverage report generated\n');
    }

    console.info('🎉 All tests completed successfully!');

    // Show next steps
    console.info('\n💡 Next steps:');
    if (!qdrantHealthy) {
      console.info(
        '  • Start Qdrant to run integration tests: docker run -p 6333:6333 qdrant/qdrant'
      );
    }
    if (!ollamaHealthy) {
      console.info('  • Install Ollama for real embedding tests: https://ollama.ai');
      console.info('  • Pull embedding model: ollama pull nomic-embed-text');
    }
    console.info('  • Run tests with: npm test');
    console.info('  • Watch tests: npm run test:watch');
    console.info('  • Coverage report: npm run test:coverage');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.info('Usage: tsx tests/test-runner.ts [type]');
  console.info('');
  console.info('Types:');
  console.info('  all (default)  Run all tests');
  console.info('  unit          Run only unit tests');
  console.info('  integration   Run only integration tests (requires Qdrant)');
  console.info('  coverage      Run tests with coverage report');
  console.info('');
  console.info('Examples:');
  console.info('  tsx tests/test-runner.ts');
  console.info('  tsx tests/test-runner.ts unit');
  console.info('  tsx tests/test-runner.ts integration');
  process.exit(0);
}

runTests().catch(console.error);
