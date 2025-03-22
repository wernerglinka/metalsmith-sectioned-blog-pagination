#!/usr/bin/env node

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function determineBadgeColor(percentage) {
  if (percentage >= 90) {
    return 'brightgreen';
  }
  if (percentage >= 80) {
    return 'green';
  }
  if (percentage >= 70) {
    return 'yellowgreen';
  }
  if (percentage >= 60) {
    return 'yellow';
  }
  if (percentage >= 50) {
    return 'orange';
  }
  return 'red';
}

async function main() {
  try {
    // Run lcov-parse on the lcov.info file
    const lcovPath = path.join(rootDir, 'coverage', 'lcov.info');
    const output = execSync(`npx lcov-parse ${lcovPath}`).toString();
    const coverageData = parseCoverageReport(output);
    
    // Update the README.md file with the coverage badge
    await updateReadme(coverageData);
    
    console.log(`Updated README.md with coverage badge: ${coverageData.percentage}% coverage`);
  } catch (error) {
    console.error('Error updating coverage badge:', error);
    process.exit(1);
  }
}

function parseCoverageReport(report) {
  // Parse the JSON output from lcov-parse
  const data = JSON.parse(report);
  
  // Calculate total lines and covered lines
  let totalLines = 0;
  let coveredLines = 0;
  
  data.forEach((file) => {
    totalLines += file.lines.found;
    coveredLines += file.lines.hit;
  });
  
  // Calculate coverage percentage
  const percentage = totalLines === 0 ? 0 : Math.round((coveredLines / totalLines) * 100);
  
  return {
    totalLines,
    coveredLines,
    percentage
  };
}

async function updateReadme(coverageData) {
  const readmePath = path.join(rootDir, 'README.md');
  let readme = await fs.readFile(readmePath, 'utf8');
  
  const { percentage } = coverageData;
  const color = determineBadgeColor(percentage);
  
  // Create the coverage badge
  const coverageBadge = `[![Coverage](https://img.shields.io/badge/coverage-${percentage}%25-${color}.svg?style=flat-square)](https://github.com/wernerglinka/metalsmith-sectioned-blog-pagination/blob/master/README.md)`;
  
  // Check if a coverage badge already exists
  const badgeRegex = /\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-[a-z]+\.svg(\?style=[a-z-]+)?\)\]\([^)]+\)/;
  
  if (badgeRegex.test(readme)) {
    // Replace the existing badge
    readme = readme.replace(badgeRegex, coverageBadge);
  } else {
    // Find the position to add the badge (after the first badge)
    const firstBadgePos = readme.indexOf('[![');
    if (firstBadgePos !== -1) {
      // Find the end of the badge line
      const endOfLine = readme.indexOf('\n', firstBadgePos);
      // Add the coverage badge after the line with the first badge
      readme = 
        readme.substring(0, endOfLine) + 
        ' ' + 
        coverageBadge + 
        readme.substring(endOfLine);
    } else {
      console.warn('Could not find a position to add the coverage badge.');
      return;
    }
  }
  
  // Write the updated README.md
  await fs.writeFile(readmePath, readme, 'utf8');
}

main();