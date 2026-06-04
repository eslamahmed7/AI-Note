import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const distPath = path.join(projectRoot, 'dist');
const repoUrl = 'https://github.com/eslamahmed7/AI-Note.git';

function run(command, cwd = projectRoot) {
  console.log(`Running: ${command} in ${cwd}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

// 1. Build the project
console.log('Building project...');
run('npm run build');

// 2. Change directory into dist and publish
if (!fs.existsSync(distPath)) {
  console.error('Dist directory does not exist. Build failed?');
  process.exit(1);
}

// Ensure there is no existing .git inside dist
const distGitPath = path.join(distPath, '.git');
if (fs.existsSync(distGitPath)) {
  fs.rmSync(distGitPath, { recursive: true, force: true });
}

console.log('Initializing git in dist folder...');
run('git init', distPath);
run('git checkout -b gh-pages', distPath);
run('git add .', distPath);
run('git commit -m "Deploy to GitHub Pages"', distPath);
run(`git remote add origin ${repoUrl}`, distPath);

console.log('Force pushing to gh-pages branch...');
run('git push -u origin gh-pages --force', distPath);

console.log('Successfully deployed to GitHub Pages!');
