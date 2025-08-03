#!/usr/bin/env node

/**
 * 🔍 APK Analysis Script
 * 
 * This script analyzes the VoiceJournal APK to identify potential
 * startup issues and configuration problems.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  white: '\x1b[0;37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findAPK() {
  const releasesDir = path.join(__dirname, '../releases');
  const apkFiles = fs.readdirSync(releasesDir).filter(file => file.endsWith('.apk'));
  
  if (apkFiles.length === 0) {
    throw new Error('No APK files found in releases directory');
  }
  
  // Return the latest APK
  const latestAPK = apkFiles.find(file => file.includes('UPDATED')) || apkFiles[0];
  return path.join(releasesDir, latestAPK);
}

function analyzeAPKBasics(apkPath) {
  log('📱 Basic APK Analysis:', 'cyan');
  
  try {
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`   📄 File: ${path.basename(apkPath)}`, 'blue');
    log(`   📊 Size: ${sizeInMB} MB`, stats.size > 100 * 1024 * 1024 ? 'yellow' : 'green');
    log(`   📅 Modified: ${stats.mtime.toISOString()}`, 'blue');
    
    // Check if file is valid ZIP (APK is ZIP format)
    const buffer = fs.readFileSync(apkPath, { start: 0, end: 4 });
    const isValidZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
    log(`   📦 Valid ZIP: ${isValidZip ? 'Yes' : 'No'}`, isValidZip ? 'green' : 'red');
    
    return { size: stats.size, isValidZip, filename: path.basename(apkPath) };
    
  } catch (error) {
    log(`   ❌ Error analyzing APK: ${error.message}`, 'red');
    return { error: error.message };
  }
}

function analyzeAPKWithAAPT(apkPath) {
  log('\n🔍 APK Manifest Analysis:', 'cyan');
  
  try {
    // Try to use aapt (Android Asset Packaging Tool)
    const aaptOutput = execSync(`aapt dump badging "${apkPath}" 2>/dev/null`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    // Parse key information from aapt output
    const packageMatch = aaptOutput.match(/package: name='([^']+)'/);
    const versionCodeMatch = aaptOutput.match(/versionCode='([^']+)'/);
    const versionNameMatch = aaptOutput.match(/versionName='([^']+)'/);
    const minSdkMatch = aaptOutput.match(/sdkVersion:'([^']+)'/);
    const targetSdkMatch = aaptOutput.match(/targetSdkVersion:'([^']+)'/);
    const mainActivityMatch = aaptOutput.match(/launchable-activity: name='([^']+)'/);
    
    const manifestInfo = {
      packageName: packageMatch ? packageMatch[1] : 'Unknown',
      versionCode: versionCodeMatch ? versionCodeMatch[1] : 'Unknown',
      versionName: versionNameMatch ? versionNameMatch[1] : 'Unknown',
      minSdk: minSdkMatch ? minSdkMatch[1] : 'Unknown',
      targetSdk: targetSdkMatch ? targetSdkMatch[1] : 'Unknown',
      mainActivity: mainActivityMatch ? mainActivityMatch[1] : 'Unknown'
    };
    
    log(`   📦 Package: ${manifestInfo.packageName}`, 'blue');
    log(`   🏷️  Version: ${manifestInfo.versionName} (${manifestInfo.versionCode})`, 'blue');
    log(`   📱 Min SDK: ${manifestInfo.minSdk}`, 'blue');
    log(`   🎯 Target SDK: ${manifestInfo.targetSdk}`, 'blue');
    log(`   🚀 Main Activity: ${manifestInfo.mainActivity}`, 'blue');
    
    // Check for potential issues
    const issues = [];
    
    if (manifestInfo.minSdk === 'Unknown') {
      issues.push({ severity: 'high', message: 'Min SDK version not detected' });
    }
    
    if (manifestInfo.mainActivity === 'Unknown') {
      issues.push({ severity: 'high', message: 'Main activity not detected' });
    }
    
    if (manifestInfo.targetSdk === 'Unknown') {
      issues.push({ severity: 'medium', message: 'Target SDK version not detected' });
    }
    
    return { manifestInfo, issues };
    
  } catch (error) {
    log(`   ❌ AAPT analysis failed: ${error.message}`, 'red');
    return { error: error.message };
  }
}

function analyzeAPKWithUnzip(apkPath) {
  log('\n📦 APK Contents Analysis:', 'cyan');
  
  try {
    const tempDir = path.join(__dirname, '../temp-apk-analysis');
    
    // Clean up previous analysis
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Extract APK contents
    execSync(`cd "${tempDir}" && unzip -q "${apkPath}"`, { timeout: 30000 });
    
    const contents = {};
    
    // Check key files
    const keyFiles = [
      'AndroidManifest.xml',
      'classes.dex',
      'META-INF/MANIFEST.MF',
      'res/',
      'assets/',
      'lib/',
      'resources.arsc'
    ];
    
    keyFiles.forEach(file => {
      const filePath = path.join(tempDir, file);
      contents[file] = fs.existsSync(filePath);
      
      if (contents[file]) {
        const stats = fs.statSync(filePath);
        const sizeInfo = stats.isDirectory() ? 'Directory' : `${(stats.size / 1024).toFixed(2)} KB`;
        log(`   ✅ ${file}: ${sizeInfo}`, 'green');
      } else {
        log(`   ❌ ${file}: Missing`, 'red');
      }
    });
    
    // Check for common React Native / Expo files
    const reactNativeFiles = [
      'assets/shell-app-manifest.json',
      'assets/shell-app.bundle',
      'assets/ExpoModulesProvider.plist',
      'assets/embedded.mobileprovision'
    ];
    
    log('\n🔍 React Native / Expo Files:', 'cyan');
    reactNativeFiles.forEach(file => {
      const filePath = path.join(tempDir, file);
      const exists = fs.existsSync(filePath);
      log(`   ${exists ? '✅' : '❌'} ${file}`, exists ? 'green' : 'yellow');
    });
    
    // Check lib directory for native libraries
    const libDir = path.join(tempDir, 'lib');
    if (fs.existsSync(libDir)) {
      log('\n🔧 Native Libraries:', 'cyan');
      const architectures = fs.readdirSync(libDir);
      architectures.forEach(arch => {
        const archPath = path.join(libDir, arch);
        if (fs.statSync(archPath).isDirectory()) {
          const libs = fs.readdirSync(archPath);
          log(`   📱 ${arch}: ${libs.length} libraries`, 'blue');
        }
      });
    }
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return { contents, analyzed: true };
    
  } catch (error) {
    log(`   ❌ Unzip analysis failed: ${error.message}`, 'red');
    return { error: error.message };
  }
}

function generateDiagnosticReport(basicInfo, manifestInfo, contentsInfo) {
  log('\n📋 Diagnostic Report:', 'cyan');
  
  const issues = [];
  
  // Check basic issues
  if (basicInfo.error) {
    issues.push({ severity: 'high', category: 'file', message: `APK file error: ${basicInfo.error}` });
  }
  
  if (!basicInfo.isValidZip) {
    issues.push({ severity: 'high', category: 'format', message: 'APK is not a valid ZIP file' });
  }
  
  if (basicInfo.size > 100 * 1024 * 1024) {
    issues.push({ severity: 'medium', category: 'size', message: `APK size is large (${(basicInfo.size / (1024 * 1024)).toFixed(2)} MB)` });
  }
  
  // Check manifest issues
  if (manifestInfo.issues) {
    issues.push(...manifestInfo.issues.map(issue => ({ ...issue, category: 'manifest' })));
  }
  
  // Check contents issues
  if (contentsInfo.error) {
    issues.push({ severity: 'high', category: 'contents', message: `APK contents error: ${contentsInfo.error}` });
  }
  
  if (contentsInfo.contents && !contentsInfo.contents['classes.dex']) {
    issues.push({ severity: 'high', category: 'contents', message: 'Missing classes.dex file' });
  }
  
  if (contentsInfo.contents && !contentsInfo.contents['AndroidManifest.xml']) {
    issues.push({ severity: 'high', category: 'contents', message: 'Missing AndroidManifest.xml file' });
  }
  
  // Categorize issues
  const highIssues = issues.filter(issue => issue.severity === 'high');
  const mediumIssues = issues.filter(issue => issue.severity === 'medium');
  const lowIssues = issues.filter(issue => issue.severity === 'low');
  
  log(`\n🚨 Issues Found:`, 'yellow');
  log(`   High: ${highIssues.length}`, highIssues.length > 0 ? 'red' : 'green');
  log(`   Medium: ${mediumIssues.length}`, mediumIssues.length > 0 ? 'yellow' : 'green');
  log(`   Low: ${lowIssues.length}`, lowIssues.length > 0 ? 'yellow' : 'green');
  
  if (highIssues.length > 0) {
    log('\n❌ High Priority Issues:', 'red');
    highIssues.forEach(issue => {
      log(`   • ${issue.message}`, 'red');
    });
  }
  
  if (mediumIssues.length > 0) {
    log('\n⚠️  Medium Priority Issues:', 'yellow');
    mediumIssues.forEach(issue => {
      log(`   • ${issue.message}`, 'yellow');
    });
  }
  
  // Generate recommendations
  log('\n💡 Recommendations:', 'cyan');
  
  if (highIssues.length > 0) {
    log('   1. Fix high priority issues before testing on Appetize.io', 'red');
  }
  
  if (issues.some(issue => issue.category === 'manifest')) {
    log('   2. Review app.json and expo configuration', 'yellow');
  }
  
  if (basicInfo.size > 100 * 1024 * 1024) {
    log('   3. Consider optimizing APK size for better performance', 'yellow');
  }
  
  if (issues.length === 0) {
    log('   ✅ No major issues detected in APK structure', 'green');
    log('   ✅ The startup issue may be runtime-related', 'green');
  }
  
  return { issues, recommendations: issues.length };
}

async function runAPKAnalysis() {
  log('🔍 Starting APK Analysis...', 'cyan');
  
  try {
    const apkPath = findAPK();
    log(`\n📱 Analyzing: ${path.basename(apkPath)}`, 'blue');
    
    // Basic file analysis
    const basicInfo = analyzeAPKBasics(apkPath);
    
    // Manifest analysis
    const manifestInfo = analyzeAPKWithAAPT(apkPath);
    
    // Contents analysis  
    const contentsInfo = analyzeAPKWithUnzip(apkPath);
    
    // Generate diagnostic report
    const report = generateDiagnosticReport(basicInfo, manifestInfo, contentsInfo);
    
    // Save detailed report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, '../diagnostics', `${timestamp}-apk-analysis.json`);
    
    const detailedReport = {
      timestamp,
      apkPath: path.basename(apkPath),
      basicInfo,
      manifestInfo,
      contentsInfo,
      issues: report.issues,
      summary: {
        totalIssues: report.issues.length,
        highPriorityIssues: report.issues.filter(i => i.severity === 'high').length,
        mediumPriorityIssues: report.issues.filter(i => i.severity === 'medium').length,
        lowPriorityIssues: report.issues.filter(i => i.severity === 'low').length
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    log(`\n📄 Detailed report saved: ${path.basename(reportPath)}`, 'green');
    
    log('\n✅ APK Analysis Complete!', 'green');
    
  } catch (error) {
    log(`❌ APK Analysis failed: ${error.message}`, 'red');
    console.error(error.stack);
  }
}

// Run the analysis
if (require.main === module) {
  runAPKAnalysis().catch(console.error);
}

module.exports = { runAPKAnalysis };