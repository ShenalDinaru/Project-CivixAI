const fs = require('fs').promises;
const path = require('path');

class FileHandler {
    constructor() {
        this.ensureDirectories();
    }

    async ensureDirectories() {
        const dirs = ['uploads', 'processed', 'logs'];
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Directory created/verified: ${dir}`);
            } catch (error) {
                console.error(`❌ Error creating directory ${dir}:`, error.message);
            }
        }
    }

    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                exists: true,
                size: stats.size,
                modified: stats.mtime,
                isFile: stats.isFile()
            };
        } catch (error) {
            return { exists: false };
        }
    }

    async cleanupOldFiles(directory, maxAgeHours = 24) {
        try {
            const files = await fs.readdir(directory);
            const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            
            for (const file of files) {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtimeMs < cutoff) {
                    await fs.unlink(filePath);
                    console.log(`Cleaned up old file: ${file}`);
                }
            }
        } catch (error) {
            console.error(`Error cleaning up ${directory}:`, error.message);
        }
    }

    getFileExtension(filename) {
        return path.extname(filename).toLowerCase().slice(1);
    }

    isValidExtension(filename, allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'tiff']) {
        const ext = this.getFileExtension(filename);
        return allowedExtensions.includes(ext);
    }
}

module.exports = FileHandler;