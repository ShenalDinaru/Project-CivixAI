// Example 1: Simple usage
const CivixAIScanner = require('./src/main');
const scanner = new CivixAIScanner();

async function scanExample() {
    const result = await scanner.scanDocument('document.pdf', 'pdf');
    console.log('Is Complete:', result.validation.isComplete);
    console.log('Missing Fields:', result.validation.missingFields);
    console.log('Extracted Data:', result.extractedData);
}

// Example 2: Batch processing
async function batchScanExample() {
    const files = [
        { path: 'doc1.pdf', mimetype: 'application/pdf' },
        { path: 'doc2.jpg', mimetype: 'image/jpeg' }
    ];
    
    const results = await scanner.batchScan(files);
    results.forEach(result => {
        console.log(`File: ${result.filename}`);
        console.log(`Completeness: ${result.validation.completenessScore}%`);
        console.log('---');
    });
}

// Run the examples (uncomment to run)
// scanExample().catch(console.error);
// batchScanExample().catch(console.error);

module.exports = {
    scanExample,
    batchScanExample
};