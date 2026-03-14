# JSON Files Storage Location

## Current Storage Location

### Local File System
**Path:** `ChatBot/processed/`

**Full Absolute Path:**
```
C:\Users\yalenthren\Desktop\Project-CivixAI\ChatBot\processed\
```

### How It Works
1. When a document is uploaded and processed, the extracted text is saved as a JSON file
2. The JSON file is saved in the `ChatBot/processed/` folder
3. File naming: `{original_filename_without_extension}.json`
   - Example: If you upload `application_form.pdf`, it saves as `application_form.json`

### JSON File Structure
```json
{
  "filename": "original_filename.pdf",
  "processedAt": "2024-01-15T10:30:00.000Z",
  "text": "Extracted text content from the document...",
  "metadata": {
    "originalName": "original_filename.pdf",
    "fileType": "application/pdf",
    "textLength": 5000,
    "wordCount": 750
  }
}
```

### Code Reference
**File:** `ChatBot/src/services/documentProcessor.js`
- Line 16: `const PROCESSED_DIR = path.join(__dirname, '../../processed');`
- Line 208: `const jsonFilePath = path.join(PROCESSED_DIR, jsonFileName);`
- Line 209: `await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');`

## Future: Firebase Cloud Storage Integration

### Planned Implementation
When users log in with credentials, JSON files will be saved to Firebase Cloud Storage:

**Structure:**
```
Firebase Storage:
  └── users/
      └── {userId}/
          └── documents/
              └── {documentId}.json
```

### Benefits
- ✅ User-specific storage (each user has their own documents)
- ✅ Cloud backup (documents persist across devices)
- ✅ Secure access (only the user can access their documents)
- ✅ Scalable (no local storage limitations)

### Implementation Notes
1. **Authentication**: Users will authenticate via Firebase Auth
2. **Storage Path**: `users/{userId}/documents/{filename}.json`
3. **Access Control**: Firebase Security Rules will ensure users can only access their own documents
4. **Migration**: Existing local JSON files can be migrated to Firebase when user logs in

### Files to Modify for Firebase Integration
1. `ChatBot/src/services/documentProcessor.js` - Update save/load functions
2. Add Firebase Storage SDK
3. Create user authentication flow
4. Update RAG system to load from Firebase instead of local filesystem
