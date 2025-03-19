#!/usr/bin/env node

/**
 * Release script for metalsmith-sectioned-blog-pagination
 * 
 * This script:
 * 1. Loads the GITHUB_TOKEN from environment or .env file
 * 2. Runs release-it with the token
 * 3. Creates a GitHub release with changelog
 * 4. Creates a package (.tgz) file but does not publish to npm
 * 
 * Usage:
 *   npm run release         # Create a real release
 *   npm run release:check   # Dry run to check if release will work
 */

// Explicitly load .env file
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting release process...');

// Verify we have run build first
if (!fs.existsSync(path.join(__dirname, 'lib'))) {
  console.error('Error: Build directory not found. Run npm run build first.');
  process.exit(1);
}

// Check if token is already in environment
if (!process.env.GITHUB_TOKEN) {
  console.log('GITHUB_TOKEN not found in environment, loading from .env file...');

  // Load environment variables from .env file
  dotenv.config();

  // If still not found, try to read directly from the .env file
  if (!process.env.GITHUB_TOKEN) {
    try {
      const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
      const match = envFile.match(/GITHUB_TOKEN=([^\s]+)/);
      if (match && match[1]) {
        process.env.GITHUB_TOKEN = match[1];
        console.log('Loaded GITHUB_TOKEN directly from .env file');
      } else {
        console.error('Error: Could not find GITHUB_TOKEN in .env file');
        console.error('Please create a .env file with GITHUB_TOKEN=your_token or set it in your environment');
        process.exit(1);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('Error: .env file not found. Please create one with GITHUB_TOKEN=your_token');
      } else {
        console.error('Error reading .env file:', error.message);
      }
      process.exit(1);
    }
  }
}

// Log success with masked token
if (process.env.GITHUB_TOKEN) {
  const maskedToken = process.env.GITHUB_TOKEN.substring(0, 4) + '...' + 
    process.env.GITHUB_TOKEN.substring(process.env.GITHUB_TOKEN.length - 4);
  console.log('GITHUB_TOKEN loaded successfully:', maskedToken);
} else {
  console.error('Failed to load GITHUB_TOKEN');
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
console.log(`Running in ${dryRun ? 'dry-run' : 'production'} mode`);

// Prepare release-it arguments
const releaseItArgs = dryRun ? ['.', '--dry-run'] : ['.'];
releaseItArgs.push('--github.token', process.env.GITHUB_TOKEN);

// Get path to release-it binary
const releaseItBin = path.join(__dirname, 'node_modules', '.bin', 'release-it');

// Check if release-it exists
if (!fs.existsSync(releaseItBin)) {
  console.error(`Error: release-it not found at ${releaseItBin}`);
  console.error('Please run: npm install --save-dev release-it');
  process.exit(1);
}

console.log('Running release-it...');

// Spawn release-it process
const result = spawnSync(releaseItBin, releaseItArgs, { 
  stdio: 'inherit',
  cwd: __dirname
});

// Report result
if (result.status === 0) {
  console.log('Release completed successfully!');
} else {
  console.error(`Release failed with exit code ${result.status}`);
}

process.exit(result.status);
