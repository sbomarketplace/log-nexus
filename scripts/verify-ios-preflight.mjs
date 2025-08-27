#!/usr/bin/env node

/**
 * iOS Preflight Verification Script
 * Checks environment variables and Info.plist for App Store readiness
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readEnvFile() {
  const envProdPath = '.env.production';
  const envPath = '.env';
  
  let envFile = null;
  let filePath = null;
  
  if (existsSync(envProdPath)) {
    envFile = readFileSync(envProdPath, 'utf8');
    filePath = envProdPath;
  } else if (existsSync(envPath)) {
    envFile = readFileSync(envPath, 'utf8');
    filePath = envPath;
  }
  
  if (!envFile) return { filePath: null, vars: {} };
  
  const vars = {};
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key] = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      }
    }
  }
  
  return { filePath, vars };
}

function readPlistText() {
  const plistPath = 'ios/App/App/Info.plist';
  if (!existsSync(plistPath)) return null;
  return readFileSync(plistPath, 'utf8');
}

function extractPlistString(xml, keyName) {
  const keyRegex = new RegExp(`<key>${keyName}</key>\\s*<string>([^<]*)</string>`, 'i');
  const match = xml.match(keyRegex);
  return match ? match[1] : null;
}

function main() {
  console.log('🔍 iOS Preflight Verification\n');
  
  let hasErrors = false;
  
  // Check environment file
  const { filePath, vars } = readEnvFile();
  if (!filePath) {
    console.error('❌ No .env or .env.production file found');
    hasErrors = true;
  } else {
    console.log(`✅ Found environment file: ${filePath}`);
  }
  
  // Check required environment variables
  const requiredVars = [
    'VITE_ADMOB_APP_ID_IOS',
    'VITE_ADMOB_INLINE_BANNER_ID_IOS',
    'VITE_IAP_REMOVE_ADS_MONTHLY',
    'VITE_SHOW_AD_PLACEHOLDERS'
  ];
  
  for (const varName of requiredVars) {
    if (!vars[varName]) {
      console.error(`❌ Missing environment variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✅ Found ${varName}: ${vars[varName]}`);
    }
  }
  
  // Validate AdMob App ID format
  const appId = vars['VITE_ADMOB_APP_ID_IOS'];
  if (appId && !appId.match(/^ca-app-pub-\d+~\d+$/)) {
    console.error(`❌ Invalid AdMob App ID format: ${appId}`);
    console.error('   Expected format: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX');
    hasErrors = true;
  }
  
  // Validate AdMob Unit ID format
  const unitId = vars['VITE_ADMOB_INLINE_BANNER_ID_IOS'];
  if (unitId && !unitId.match(/^ca-app-pub-\d+\/\d+$/)) {
    console.error(`❌ Invalid AdMob Unit ID format: ${unitId}`);
    console.error('   Expected format: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');
    hasErrors = true;
  }
  
  // Check ad placeholders are disabled for production
  if (vars['VITE_SHOW_AD_PLACEHOLDERS'] === 'true') {
    console.error('❌ VITE_SHOW_AD_PLACEHOLDERS should be false for production');
    hasErrors = true;
  }
  
  // Check Info.plist
  const plistContent = readPlistText();
  if (!plistContent) {
    console.error('❌ ios/App/App/Info.plist not found');
    hasErrors = true;
  } else {
    console.log('✅ Found Info.plist');
    
    // Check GADApplicationIdentifier matches env
    const plistAppId = extractPlistString(plistContent, 'GADApplicationIdentifier');
    if (!plistAppId) {
      console.error('❌ GADApplicationIdentifier not found in Info.plist');
      hasErrors = true;
    } else if (plistAppId !== appId) {
      console.error(`❌ GADApplicationIdentifier mismatch:`);
      console.error(`   Info.plist: ${plistAppId}`);
      console.error(`   Environment: ${appId}`);
      hasErrors = true;
    } else {
      console.log(`✅ GADApplicationIdentifier matches: ${plistAppId}`);
    }
    
    // Check NSUserTrackingUsageDescription
    const trackingDesc = extractPlistString(plistContent, 'NSUserTrackingUsageDescription');
    if (!trackingDesc) {
      console.error('❌ NSUserTrackingUsageDescription not found in Info.plist');
      hasErrors = true;
    } else if (trackingDesc.length < 10) {
      console.error('❌ NSUserTrackingUsageDescription too short (needs meaningful description)');
      hasErrors = true;
    } else {
      console.log('✅ NSUserTrackingUsageDescription present');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.error('❌ Preflight check FAILED - fix issues above before building');
    process.exit(1);
  } else {
    console.log('✅ Preflight check PASSED - ready for iOS build');
    process.exit(0);
  }
}

main();