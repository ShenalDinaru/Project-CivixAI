const fs = require('fs');
const path = require('path');

console.log('Setting up Civix AI Scanner...');

// Create necessary directories
const dirs = [
    'uploads',
    'processed', 
    'logs',
    'config',
    'examples',
    'public'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

console.log('\nSetup complete!');
console.log('Run: npm install && npm start');
console.log('Access at: http://localhost:3000');