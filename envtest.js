const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const envFilePath = path.resolve(__dirname, '.env');
console.log('Resolved env path:', envFilePath);
console.log('Raw .env:', fs.readFileSync(envFilePath, 'utf8'));

dotenv.config({ path: envFilePath });

console.log('TEST_KEY:', process.env.TEST_KEY);
console.log('SUBPATH:', process.env.SUBPATH);
