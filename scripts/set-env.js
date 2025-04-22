const fs = require('fs');
const { execSync } = require('child_process');

// Get the current version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

// Get the current commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();

// Create or update the .env.local file
const envContent = `
NEXT_PUBLIC_APP_VERSION=${version}
NEXT_PUBLIC_COMMIT_HASH=${commitHash}
`;

fs.writeFileSync('.env.local', envContent);

console.log(`Environment variables set:
NEXT_PUBLIC_APP_VERSION=${version}
NEXT_PUBLIC_COMMIT_HASH=${commitHash}
`); 