#!/usr/bin/env node

/**
 * Environment Variables Validator
 * Run this before starting the development server
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Validating environment configuration...\n');

// Check .env.local exists
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env.local file not found!');
  console.error('\n   Please create it:');
  console.error('   cp .env.example .env.local\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://...supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJ...',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJ...',
  'ENCRYPTION_KEY': '64 hex characters',
  'CRON_SECRET_KEY': 'hex string',
};

const optionalVars = {
  'NODE_ENV': 'development',
  'RESEND_API_KEY': 'optional (for email)',
};

const errors = [];
const warnings = [];

// Check required variables
for (const [varName, expectedFormat] of Object.entries(requiredVars)) {
  const hasVar = envContent.includes(`${varName}=`);
  
  if (!hasVar) {
    errors.push(`Missing: ${varName}`);
  } else {
    // Extract value
    const match = envContent.match(new RegExp(`${varName}=(.+)`));
    if (match) {
      const value = match[1].trim();
      
      // Check for placeholder values
      if (value.includes('your_') || value === '' || value.startsWith('your ')) {
        errors.push(`Not configured: ${varName} (still has placeholder value)`);
      }
      
      // Specific validation
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('https://') && !value.startsWith('http://')) {
          errors.push(`Invalid format: ${varName} must start with https:// or http://`);
        }
      }
      
      if (varName === 'ENCRYPTION_KEY') {
        if (value.length !== 64) {
          errors.push(`Invalid length: ENCRYPTION_KEY must be 64 hex characters, got ${value.length}`);
        }
      }
    }
  }
}

// Check optional variables (warn if missing)
for (const [varName] of Object.entries(optionalVars)) {
  const hasVar = envContent.includes(`${varName}=`);
  
  if (!hasVar) {
    warnings.push(`Optional variable not set: ${varName}`);
  }
}

// Print results
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All required environment variables are properly configured!\n');
  console.log('Environment Summary:');
  
  for (const [varName] of Object.entries(requiredVars)) {
    const match = envContent.match(new RegExp(`${varName}=(.+)`));
    if (match) {
      const value = match[1].trim();
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`  ✓ ${varName} = ${displayValue}`);
    }
  }
  
  console.log('\n🚀 Ready to run: npm run dev\n');
  process.exit(0);
}

// Print errors
if (errors.length > 0) {
  console.error('❌ Configuration errors found:\n');
  errors.forEach(error => {
    console.error(`   ✗ ${error}`);
  });
  console.error('\n📋 Please fix these issues in .env.local\n');
}

// Print warnings
if (warnings.length > 0) {
  console.warn('⚠️  Warnings:\n');
  warnings.forEach(warning => {
    console.warn(`   ⚠ ${warning}`);
  });
  console.warn('');
}

if (errors.length > 0) {
  process.exit(1);
} else {
  console.log('\n✅ Configuration is valid! You can now run: npm run dev\n');
  process.exit(0);
}
