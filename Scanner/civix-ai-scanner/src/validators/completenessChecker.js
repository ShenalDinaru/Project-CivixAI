class CompletenessChecker {
    constructor() {
        this.requiredFields = ['name', 'date', 'signature'];
        this.optionalFields = ['email', 'phone', 'address'];
    }

    async validate(text) {
        if (!text || typeof text !== 'string') {
            return {
                isComplete: false,
                missingFields: this.requiredFields,
                completenessScore: 0,
                suggestions: ['No text provided for validation']
            };
        }

        const missingFields = [];
        const fieldPresence = {};

        // Check for presence of required fields
        for (const field of this.requiredFields) {
            const isPresent = this.checkFieldPresence(text, field);
            fieldPresence[field] = isPresent;
            
            if (!isPresent) {
                missingFields.push(field);
            }
        }

        // Check optional fields
        for (const field of this.optionalFields) {
            fieldPresence[field] = this.checkFieldPresence(text, field);
        }

        const completenessScore = this.calculateCompletenessScore(fieldPresence);

        return {
            isComplete: missingFields.length === 0,
            missingFields,
            fieldPresence,
            completenessScore,
            suggestions: this.generateSuggestions(missingFields)
        };
    }

    checkFieldPresence(text, field) {
        const fieldPatterns = {
            name: /\b(name|full name|姓名|nombre)\b/i,
            date: /\b(date|日期|fecha)\b.*?\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i,
            signature: /\b(sign|signature|签署|firma)\b/i,
            email: /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/i,
            phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/i,
            address: /\b(address|地址|dirección)\b/i
        };

        const pattern = fieldPatterns[field] || new RegExp(`\\b${field}\\b`, 'i');
        return pattern.test(text);
    }

    calculateCompletenessScore(fieldPresence) {
        const requiredFields = Object.keys(fieldPresence).filter(f => this.requiredFields.includes(f));
        const presentFields = requiredFields.filter(f => fieldPresence[f]);
        return Math.round((presentFields.length / requiredFields.length) * 100);
    }

    generateSuggestions(missingFields) {
        const suggestions = [];
        
        if (missingFields.length > 0) {
            suggestions.push(`Missing required fields: ${missingFields.join(', ')}`);
            
            missingFields.forEach(field => {
                const tips = {
                    name: 'Add a "Name:" field with the document signer\'s full name',
                    date: 'Add a "Date:" field with today\'s date in format DD/MM/YYYY',
                    signature: 'Include a signature line or signature field'
                };
                if (tips[field]) {
                    suggestions.push(tips[field]);
                }
            });
        } else {
            suggestions.push('Document is complete and ready for processing');
        }

        return suggestions;
    }
}

module.exports = CompletenessChecker;