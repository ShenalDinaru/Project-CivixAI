class DataExtractor {
    constructor() {
        this.patterns = {
            name: [
                /Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
                /Full Name[:\s]+([^\n]+)/i,
                /姓名[:\s]+([^\n]+)/i
            ],
            date: [
                /Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
                /日期[:\s]+([^\n]+)/i,
                /Dated[:\s]+([^\n]+)/i
            ],
            email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
            id: [
                /ID[:\s]+([A-Z0-9-]+)/i,
                /身份证[:\s]+([^\n]+)/i,
                /SSN[:\s]+(\d{3}-\d{2}-\d{4})/i
            ],
            address: /Address[:\s]+([^\n]{10,})/i,
            amount: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g
        };
    }

    async extract(text) {
        if (!text || typeof text !== 'string') {
            return {
                fields: {},
                metadata: this.extractMetadata(''),
                confidence: 0
            };
        }

        const extractedData = {};

        for (const [field, patterns] of Object.entries(this.patterns)) {
            extractedData[field] = this.extractField(text, patterns);
        }

        // Additional structured extraction
        extractedData.dates = this.extractAllDates(text);
        extractedData.names = this.extractAllNames(text);
        extractedData.addresses = this.extractAddresses(text);
        extractedData.amounts = this.extractAllAmounts(text);

        return {
            fields: extractedData,
            metadata: this.extractMetadata(text),
            confidence: this.calculateConfidence(extractedData)
        };
    }

    extractField(text, patterns) {
        if (Array.isArray(patterns)) {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            return null;
        } else {
            const matches = text.match(patterns);
            return matches ? matches.map(m => m.trim()) : [];
        }
    }

    extractAllDates(text) {
        const datePatterns = [
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
            /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
            /\b\d{4}年\d{1,2}月\d{1,2}日\b/g
        ];

        const dates = [];
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                dates.push(...matches);
            }
        });

        return [...new Set(dates)];
    }

    extractAllNames(text) {
        // Simple name extraction
        const namePattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
        const matches = text.match(namePattern);
        return matches ? [...new Set(matches)] : [];
    }

    extractAddresses(text) {
        const addressPattern = /\b\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Boulevard|Blvd|Drive|Dr)\b/gi;
        const matches = text.match(addressPattern);
        return matches ? matches : [];
    }

    extractAllAmounts(text) {
        const amountPattern = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY)\b/gi;
        const matches = text.match(amountPattern);
        return matches ? matches : [];
    }

    extractMetadata(text) {
        return {
            wordCount: text.split(/\s+/).length,
            lineCount: text.split('\n').length,
            hasSignature: /signature|signed|sign here/i.test(text),
            hasDate: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text),
            hasContactInfo: /@\w+\.\w+|phone|tel|email/i.test(text)
        };
    }

    calculateConfidence(data) {
        let score = 0;
        let total = 0;

        const requiredFields = ['name', 'date'];
        for (const field of requiredFields) {
            total++;
            if (data[field] && (Array.isArray(data[field]) ? data[field].length > 0 : data[field])) {
                score++;
            }
        }

        return total > 0 ? Math.round((score / total) * 100) : 0;
    }
}

module.exports = DataExtractor;