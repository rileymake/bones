// startup.js
// Purpose: Build React client, then start server programmatically

const { execSync } = require('child_process');

// ✅ 1. Build client
console.log('🔨 Building React client...');
execSync('npm run build --prefix client', { stdio: 'inherit' });

// ✅ 2. Start server
console.log('🚀 Starting server...');
require('./server/index.js');
