/**
 * Global Teardown for Playwright Tests
 * 
 * This file handles cleanup tasks that need to run after all tests
 * including generating final reports and cleaning up resources.
 */

const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('🧹 Running global teardown...');
  
  // Generate test summary report
  const testResultsDir = path.join(__dirname, '../../test-results');
  const testResultsFile = path.join(testResultsDir, 'test-results.json');
  
  if (fs.existsSync(testResultsFile)) {
    const results = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   Total Tests: ${results.stats?.expected || 0}`);
    console.log(`   Passed: ${results.stats?.passed || 0}`);
    console.log(`   Failed: ${results.stats?.failed || 0}`);
    console.log(`   Skipped: ${results.stats?.skipped || 0}`);
    
    // Generate timestamp for archiving
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveFile = path.join(testResultsDir, `test-results-${timestamp}.json`);
    
    // Archive the results
    fs.copyFileSync(testResultsFile, archiveFile);
    console.log(`📁 Results archived: ${archiveFile}`);
  }
  
  console.log('✅ Global teardown complete');
}

module.exports = globalTeardown;