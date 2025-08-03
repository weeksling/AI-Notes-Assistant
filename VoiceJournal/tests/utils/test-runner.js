/**
 * Test Runner for Appetize.io Testing
 * 
 * This script provides a comprehensive test runner with reporting
 * and configuration options for testing on Appetize.io.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class AppetizeTestRunner {
  constructor() {
    this.testResultsDir = path.join(__dirname, '../../test-results');
    this.ensureTestResultsDir();
  }

  ensureTestResultsDir() {
    if (!fs.existsSync(this.testResultsDir)) {
      fs.mkdirSync(this.testResultsDir, { recursive: true });
    }
  }

  validateEnvironment() {
    const requiredEnvVars = ['APPETIZE_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      console.error('Please set these in your .env file or environment');
      process.exit(1);
    }
    
    console.log('✅ Environment validation passed');
  }

  validateAppInfo() {
    const appInfoPath = path.join(__dirname, '../../appetize-app-info.json');
    if (!fs.existsSync(appInfoPath)) {
      console.error('❌ Missing appetize-app-info.json file');
      console.error('Please run the upload script first to upload your app to Appetize.io');
      process.exit(1);
    }
    
    const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
    if (!appInfo.publicKey) {
      console.error('❌ Invalid app info: missing publicKey');
      process.exit(1);
    }
    
    console.log('✅ App info validation passed');
    console.log(`   App Key: ${appInfo.publicKey}`);
    console.log(`   App URL: ${appInfo.appUrl}`);
  }

  async runTests(options = {}) {
    console.log('🚀 Starting Appetize.io test suite...\n');
    
    // Validate environment
    this.validateEnvironment();
    this.validateAppInfo();
    
    // Construct Playwright command
    const playwrightArgs = [
      'npx playwright test',
      options.headed ? '--headed' : '',
      options.debug ? '--debug' : '',
      options.project ? `--project=${options.project}` : '',
      options.grep ? `--grep="${options.grep}"` : '',
      options.workers ? `--workers=${options.workers}` : '',
      options.timeout ? `--timeout=${options.timeout}` : '',
      options.retries ? `--retries=${options.retries}` : '',
      options.reporter ? `--reporter=${options.reporter}` : '',
      options.outputDir ? `--output-dir=${options.outputDir}` : '',
      options.testDir ? options.testDir : ''
    ].filter(arg => arg !== '').join(' ');
    
    console.log(`📋 Running command: ${playwrightArgs}\n`);
    
    try {
      const startTime = Date.now();
      
      // Run the tests
      execSync(playwrightArgs, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`\n✅ Tests completed in ${duration}ms`);
      
      // Generate report
      await this.generateReport(options);
      
    } catch (error) {
      console.error('\n❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async generateReport(options = {}) {
    console.log('\n📊 Generating test report...');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testSuite: 'Appetize.io VoiceJournal Tests',
      options: options,
      results: {}
    };
    
    // Read test results if available
    const testResultsFile = path.join(this.testResultsDir, 'test-results.json');
    if (fs.existsSync(testResultsFile)) {
      const results = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
      reportData.results = results;
      
      console.log('\n📈 Test Results Summary:');
      console.log(`   Total Tests: ${results.stats?.expected || 0}`);
      console.log(`   Passed: ${results.stats?.passed || 0}`);
      console.log(`   Failed: ${results.stats?.failed || 0}`);
      console.log(`   Skipped: ${results.stats?.skipped || 0}`);
      console.log(`   Duration: ${results.stats?.duration || 0}ms`);
    }
    
    // Save comprehensive report
    const reportFile = path.join(this.testResultsDir, `report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    console.log(`📁 Report saved: ${reportFile}`);
    
    // Generate HTML report link
    const htmlReportDir = path.join(this.testResultsDir, 'html-report');
    if (fs.existsSync(htmlReportDir)) {
      const htmlReportFile = path.join(htmlReportDir, 'index.html');
      if (fs.existsSync(htmlReportFile)) {
        console.log(`🌐 HTML Report: file://${htmlReportFile}`);
      }
    }
  }

  async runSmokeTests(options = {}) {
    console.log('🔥 Running smoke tests...\n');
    
    return this.runTests({
      ...options,
      testDir: 'tests/e2e/smoke.test.js',
      reporter: 'line,json,html'
    });
  }

  async runFunctionalTests(options = {}) {
    console.log('⚙️ Running functional tests...\n');
    
    return this.runTests({
      ...options,
      testDir: 'tests/e2e/voicejournal.test.js',
      reporter: 'line,json,html'
    });
  }

  async runAllTests(options = {}) {
    console.log('🎯 Running all tests...\n');
    
    return this.runTests({
      ...options,
      testDir: 'tests/e2e/',
      reporter: 'line,json,html'
    });
  }

  async runPerformanceTests(options = {}) {
    console.log('⚡ Running performance tests...\n');
    
    return this.runTests({
      ...options,
      grep: 'performance',
      reporter: 'line,json,html'
    });
  }

  async runQuickTest(options = {}) {
    console.log('⚡ Running quick test...\n');
    
    return this.runTests({
      ...options,
      grep: 'should load app successfully',
      workers: 1,
      reporter: 'line'
    });
  }

  listAvailableTests() {
    console.log('📋 Available test suites:\n');
    console.log('  smoke      - Basic functionality and stability tests');
    console.log('  functional - Feature-specific tests');
    console.log('  all        - All available tests');
    console.log('  performance- Performance and load tests');
    console.log('  quick      - Quick smoke test for validation');
    console.log('\nUsage: node test-runner.js [suite] [options]');
    console.log('\nOptions:');
    console.log('  --headed     - Run tests in headed mode');
    console.log('  --debug      - Run tests in debug mode');
    console.log('  --workers=N  - Number of parallel workers');
    console.log('  --timeout=N  - Test timeout in milliseconds');
    console.log('  --retries=N  - Number of retries for failed tests');
  }

  parseArgs(args) {
    const options = {};
    
    args.forEach(arg => {
      if (arg === '--headed') options.headed = true;
      if (arg === '--debug') options.debug = true;
      if (arg.startsWith('--workers=')) options.workers = arg.split('=')[1];
      if (arg.startsWith('--timeout=')) options.timeout = arg.split('=')[1];
      if (arg.startsWith('--retries=')) options.retries = arg.split('=')[1];
      if (arg.startsWith('--grep=')) options.grep = arg.split('=')[1];
    });
    
    return options;
  }
}

// CLI Interface
async function main() {
  const runner = new AppetizeTestRunner();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    runner.listAvailableTests();
    return;
  }
  
  const suite = args[0];
  const options = runner.parseArgs(args.slice(1));
  
  try {
    switch (suite) {
      case 'smoke':
        await runner.runSmokeTests(options);
        break;
      case 'functional':
        await runner.runFunctionalTests(options);
        break;
      case 'all':
        await runner.runAllTests(options);
        break;
      case 'performance':
        await runner.runPerformanceTests(options);
        break;
      case 'quick':
        await runner.runQuickTest(options);
        break;
      default:
        console.error(`❌ Unknown test suite: ${suite}`);
        runner.listAvailableTests();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AppetizeTestRunner;