console.log('Script loaded successfully!');
// Configuration
const config = {
    apiEndpoint: 'http://localhost:3000/api',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
};

// State management
let state = {
    currentFile: null,
    batchFiles: [],
    scanHistory: JSON.parse(localStorage.getItem('civixScanHistory')) || [],
    settings: JSON.parse(localStorage.getItem('civixSettings')) || {
        strictness: 'medium',
        language: 'eng',
        autoDelete: true,
        notifications: true,
        apiEndpoint: 'http://localhost:3000/api/scan'
    },
    statistics: JSON.parse(localStorage.getItem('civixStatistics')) || {
        scannedToday: 0,
        successRate: 0,
        avgScore: 0,
        lastReset: new Date().toDateString()
    }
};

// DOM Elements (add these references)
const DOM = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMReferences();
    initializeApp();
    checkBackendConnection();
    updateStatistics();
    loadRecentScans();
    setupEventListeners();
    
    // Show welcome message
    setTimeout(() => {
        showNotification('info', 'Welcome to Civix AI Scanner', 'Upload documents to validate completeness and extract details.');
    }, 1000);
});

function initializeDOMReferences() {
    // Cache frequently used DOM elements
    DOM.progressSection = document.getElementById('progressSection');
    DOM.progressFill = document.getElementById('progressFill');
    DOM.progressText = document.getElementById('progressText');
    DOM.scanner = document.getElementById('scanner');
    DOM.results = document.getElementById('results');
    DOM.resultsSummary = document.getElementById('resultsSummary');
    DOM.validationResults = document.getElementById('validationResults');
    DOM.extractedData = document.getElementById('extractedData');
    DOM.rawTextContent = document.getElementById('rawTextContent');
    DOM.batchQueue = document.getElementById('batchQueue');
    DOM.batchResults = document.getElementById('batchResults');
}

function initializeApp() {
    // Apply saved settings
    if (document.getElementById('strictnessLevel')) {
        document.getElementById('strictnessLevel').value = state.settings.strictness;
    }
    if (document.getElementById('ocrLanguage')) {
        document.getElementById('ocrLanguage').value = state.settings.language;
    }
    if (document.getElementById('autoDelete')) {
        document.getElementById('autoDelete').checked = state.settings.autoDelete;
    }
    if (document.getElementById('enableNotifications')) {
        document.getElementById('enableNotifications').checked = state.settings.notifications;
    }
    if (document.getElementById('apiEndpoint')) {
        document.getElementById('apiEndpoint').value = state.settings.apiEndpoint;
    }
    
    // Update stats display
    document.getElementById('scannedToday').textContent = state.statistics.scannedToday;
    document.getElementById('successRate').textContent = `${state.statistics.successRate}%`;
    document.getElementById('avgScore').textContent = `${state.statistics.avgScore}%`;
    
    // Show connected status
    document.getElementById('userStatus').innerHTML = '<i class="fas fa-circle online"></i> Ready';
}

function setupEventListeners() {
    // File upload handlers
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const batchFileInput = document.getElementById('batchFileInput');
    const batchDropArea = document.getElementById('batchDropArea');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    if (batchFileInput) {
        batchFileInput.addEventListener('change', handleBatchFileSelect);
    }

    // Drag and drop for single file
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (dropArea) {
            dropArea.addEventListener(eventName, preventDefaults, false);
        }
        if (batchDropArea) {
            batchDropArea.addEventListener(eventName, preventDefaults, false);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        if (dropArea) {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
        }
        if (batchDropArea) {
            batchDropArea.addEventListener(eventName, () => batchDropArea.classList.add('drag-over'), false);
        }
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if (dropArea) {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
        }
        if (batchDropArea) {
            batchDropArea.addEventListener(eventName, () => batchDropArea.classList.remove('drag-over'), false);
        }
    });

    if (dropArea) {
        dropArea.addEventListener('drop', handleDrop, false);
    }
    if (batchDropArea) {
        batchDropArea.addEventListener('drop', handleBatchDrop, false);
    }
    
    // Add event listener for process batch button
    const processBatchBtn = document.getElementById('processBatchBtn');
    if (processBatchBtn) {
        processBatchBtn.addEventListener('click', processBatch);
    }
    
    // clearBatch is called via onclick in HTML, no need for event listener
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        await processSingleFile(files[0]);
    }
}

async function handleBatchFileSelect(e) {
    const files = Array.from(e.target.files);
    await addToBatchQueue(files);
}

async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        await processSingleFile(files[0]);
    }
}

async function handleBatchDrop(e) {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    await addToBatchQueue(files);
}

async function processSingleFile(file) {
    // Validate file
    if (!validateFile(file)) {
        return;
    }

    state.currentFile = file;
    
    // Show progress
    if (DOM.progressSection) {
        DOM.progressSection.style.display = 'block';
    }
    updateProgress(0, 'Preparing file...');
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('document', file);
        
        updateProgress(30, 'Uploading to server...');
        
        // Send to backend
        const response = await fetch(`${state.settings.apiEndpoint}/scan`, {
            method: 'POST',
            body: formData
        });
        
        updateProgress(70, 'Processing document...');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        updateProgress(100, 'Analysis complete!');
        
        // Update statistics
        updateScanStatistics(result);
        
        // Store in history
        addToHistory(file.name, result);
        
        // Show results after delay
        setTimeout(() => {
            displayResults(result);
            showNotification('success', 'Scan Complete', 'Document has been analyzed successfully.');
        }, 500);
        
    } catch (error) {
        console.error('Scan error:', error);
        showNotification('error', 'Scan Failed', error.message);
        updateProgress(0, 'Failed - ' + error.message);
    }
}

async function addToBatchQueue(files) {
    for (const file of files) {
        if (!validateFile(file)) continue;
        
        // Check if file already in queue
        if (state.batchFiles.some(f => f.name === file.name && f.size === file.size)) {
            showNotification('warning', 'Duplicate File', `${file.name} is already in the queue`);
            continue;
        }
        
        // Add to batch queue
        state.batchFiles.push({
            file: file,
            status: 'pending',
            result: null
        });
    }
    
    updateBatchQueueDisplay();
    updateBatchProcessButton();
}

function updateBatchQueueDisplay() {
    const batchQueue = document.getElementById('batchQueue');
    if (!batchQueue) return;
    
    batchQueue.innerHTML = '';
    
    state.batchFiles.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        
        queueItem.innerHTML = `
            <i class="fas fa-file"></i>
            <div class="queue-info">
                <div class="queue-name">${item.file.name}</div>
                <div class="queue-size">${formatFileSize(item.file.size)}</div>
            </div>
            <span class="queue-status ${item.status}">${item.status}</span>
            <button class="btn btn-outline btn-sm" onclick="removeFromBatch(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        batchQueue.appendChild(queueItem);
    });
}

function updateBatchProcessButton() {
    const btn = document.getElementById('processBatchBtn');
    if (!btn) return;
    
    const hasPendingFiles = state.batchFiles.some(f => f.status === 'pending');
    btn.disabled = !hasPendingFiles;
    btn.innerHTML = hasPendingFiles ? 
        `<i class="fas fa-play"></i> Process ${state.batchFiles.filter(f => f.status === 'pending').length} Files` :
        `<i class="fas fa-play"></i> Process Batch`;
}

async function processBatch() {
    const pendingFiles = state.batchFiles.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) return;
    
    // Show progress in main area
    if (DOM.scanner) DOM.scanner.style.display = 'none';
    if (DOM.results) DOM.results.style.display = 'block';
    
    if (DOM.resultsSummary) {
        DOM.resultsSummary.innerHTML = `
            <h3><i class="fas fa-layer-group"></i> Batch Processing</h3>
            <p>Processing ${pendingFiles.length} files...</p>
            <div class="progress-bar">
                <div class="progress-fill" id="batchProgressFill" style="width: 0%"></div>
            </div>
            <div class="progress-text" id="batchProgressText">0/${pendingFiles.length} processed</div>
        `;
    }
    
    // Process each file
    let completedCount = 0;
    const batchResults = [];
    
    for (let i = 0; i < state.batchFiles.length; i++) {
        if (state.batchFiles[i].status !== 'pending') continue;
        
        state.batchFiles[i].status = 'processing';
        updateBatchQueueDisplay();
        
        try {
            const formData = new FormData();
            formData.append('document', state.batchFiles[i].file);
            
            const response = await fetch(`${state.settings.apiEndpoint}/scan`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                state.batchFiles[i].status = 'completed';
                state.batchFiles[i].result = result;
                batchResults.push({
                    filename: state.batchFiles[i].file.name,
                    ...result
                });
                
                // Update statistics
                updateScanStatistics(result);
                
                // Store in history
                addToHistory(state.batchFiles[i].file.name, result);
                
                showNotification('success', 'File Processed', `${state.batchFiles[i].file.name} completed successfully`);
            } else {
                throw new Error(`Failed with status ${response.status}`);
            }
            
        } catch (error) {
            state.batchFiles[i].status = 'error';
            showNotification('error', 'Batch Item Failed', 
                `${state.batchFiles[i].file.name}: ${error.message}`);
        }
        
        completedCount++;
        
        // Update progress
        const progress = (completedCount / pendingFiles.length) * 100;
        const batchProgressFill = document.getElementById('batchProgressFill');
        const batchProgressText = document.getElementById('batchProgressText');
        
        if (batchProgressFill) batchProgressFill.style.width = `${progress}%`;
        if (batchProgressText) batchProgressText.textContent = 
            `${completedCount}/${pendingFiles.length} processed`;
        
        updateBatchQueueDisplay();
    }
    
    // Display batch results
    displayBatchResults(batchResults);
    updateBatchProcessButton();
    
    showNotification('success', 'Batch Complete', `Processed ${completedCount} files successfully`);
}

function displayBatchResults(results) {
    const batchResultsDiv = document.getElementById('batchResults');
    if (!batchResultsDiv) return;
    
    batchResultsDiv.innerHTML = '<h3>Batch Results Summary</h3>';
    
    if (results.length === 0) {
        batchResultsDiv.innerHTML += '<p>No results to display</p>';
        return;
    }
    
    results.forEach((result, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'data-card';
        
        const completeness = result.validation?.completenessScore || 0;
        const isComplete = result.validation?.isComplete || false;
        
        resultCard.innerHTML = `
            <h4><i class="fas fa-file"></i> ${result.filename || `Document ${index + 1}`}</h4>
            <div class="data-item">
                <span class="data-label">Completeness:</span>
                <span class="data-value ${isComplete ? 'success' : 'warning'}">
                    ${completeness}%
                </span>
            </div>
            <div class="data-item">
                <span class="data-label">Missing Fields:</span>
                <span class="data-value">${result.validation?.missingFields?.length || 0}</span>
            </div>
            <div class="data-item">
                <span class="data-label">Status:</span>
                <span class="data-value ${isComplete ? 'success' : 'warning'}">
                    ${isComplete ? 'Complete' : 'Incomplete'}
                </span>
            </div>
        `;
        
        batchResultsDiv.appendChild(resultCard);
    });
}

function removeFromBatch(index) {
    state.batchFiles.splice(index, 1);
    updateBatchQueueDisplay();
    updateBatchProcessButton();
}

function clearBatch() {
    state.batchFiles = [];
    updateBatchQueueDisplay();
    updateBatchProcessButton();
    const batchResults = document.getElementById('batchResults');
    if (batchResults) batchResults.innerHTML = '';
}

function validateFile(file) {
    // Check file type
    const allowedMimeTypes = config.allowedTypes;
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
    
    const isValidMime = allowedMimeTypes.includes(file.type.toLowerCase());
    const isValidExt = allowedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
    );
    
    if (!isValidMime && !isValidExt) {
        showNotification('error', 'Invalid File Type', 
            `File type "${file.type || 'unknown'}" is not supported. Supported types: PDF, JPG, PNG, TIFF`);
        return false;
    }
    
    // Check file size
    if (file.size > config.maxFileSize) {
        showNotification('error', 'File Too Large', 
            `File size ${formatFileSize(file.size)} exceeds maximum ${formatFileSize(config.maxFileSize)}.`);
        return false;
    }
    
    return true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgress(percent, message) {
    if (DOM.progressFill) DOM.progressFill.style.width = `${percent}%`;
    if (DOM.progressText) DOM.progressText.textContent = `${percent}% - ${message}`;
}

function displayResults(result) {
    // Hide scanner, show results
    if (DOM.scanner) DOM.scanner.style.display = 'none';
    if (DOM.results) DOM.results.style.display = 'block';
    
    // Update results summary
    updateResultsSummary(result);
    
    // Update validation results
    updateValidationResults(result.validation);
    
    // Update extracted data
    updateExtractedData(result.extractedData);
    
    // Update raw text
    updateRawText(result.rawText);
    
    // Update details
    updateDetails(result);
    
    // Switch to validation tab
    switchTab('validation');
}

function updateResultsSummary(result) {
    if (!DOM.resultsSummary) return;
    
    const completeness = result.validation?.completenessScore || 0;
    const isComplete = result.validation?.isComplete || false;
    const extractedCount = Object.keys(result.extractedData?.fields || {}).length;
    
    DOM.resultsSummary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value ${isComplete ? 'success' : 'warning'}">
                    ${completeness}%
                </div>
                <div class="summary-label">Completeness Score</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${isComplete ? '✓' : '✗'}</div>
                <div class="summary-label">Document Status</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${extractedCount}</div>
                <div class="summary-label">Fields Extracted</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${result.validation?.missingFields?.length || 0}</div>
                <div class="summary-label">Missing Fields</div>
            </div>
        </div>
    `;
}

function updateValidationResults(validation) {
    if (!DOM.validationResults) return;
    
    DOM.validationResults.innerHTML = '';
    
    if (!validation) {
        DOM.validationResults.innerHTML = '<div class="validation-item error"><div class="validation-icon">!</div><div class="validation-text">No validation data available</div></div>';
        return;
    }
    
    // Add validation items
    if (validation.isComplete !== undefined) {
        const statusItem = document.createElement('div');
        statusItem.className = `validation-item ${validation.isComplete ? 'success' : 'warning'}`;
        statusItem.innerHTML = `
            <div class="validation-icon">${validation.isComplete ? '✓' : '✗'}</div>
            <div class="validation-text">
                <strong>Document Status:</strong> ${validation.isComplete ? 'Complete' : 'Incomplete'}
            </div>
        `;
        DOM.validationResults.appendChild(statusItem);
    }
    
    if (validation.completenessScore !== undefined) {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'validation-item info';
        scoreItem.innerHTML = `
            <div class="validation-icon">📊</div>
            <div class="validation-text">
                <strong>Completeness Score:</strong> ${validation.completenessScore}%
            </div>
        `;
        DOM.validationResults.appendChild(scoreItem);
    }
    
    // Add missing fields
    if (validation.missingFields && validation.missingFields.length > 0) {
        const missingItem = document.createElement('div');
        missingItem.className = 'validation-item warning';
        missingItem.innerHTML = `
            <div class="validation-icon">⚠️</div>
            <div class="validation-text">
                <strong>Missing Fields (${validation.missingFields.length}):</strong>
                <div class="missing-fields">
                    ${validation.missingFields.map(field => `<span class="field-tag">${field}</span>`).join('')}
                </div>
            </div>
        `;
        DOM.validationResults.appendChild(missingItem);
    }
    
    // Add validation errors if any
    if (validation.errors && validation.errors.length > 0) {
        const errorsItem = document.createElement('div');
        errorsItem.className = 'validation-item error';
        errorsItem.innerHTML = `
            <div class="validation-icon">✗</div>
            <div class="validation-text">
                <strong>Validation Errors:</strong>
                <ul>
                    ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
        DOM.validationResults.appendChild(errorsItem);
    }
}

function updateExtractedData(extractedData) {
    if (!DOM.extractedData || !extractedData) return;
    
    DOM.extractedData.innerHTML = '';
    
    if (!extractedData.fields || Object.keys(extractedData.fields).length === 0) {
        DOM.extractedData.innerHTML = '<p>No data extracted</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Field</th>
                <th>Value</th>
                <th>Confidence</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(extractedData.fields).map(([field, data]) => `
                <tr>
                    <td><strong>${field}</strong></td>
                    <td>${data.value || 'N/A'}</td>
                    <td>
                        <span class="confidence ${getConfidenceClass(data.confidence)}">
                            ${data.confidence ? `${data.confidence}%` : 'N/A'}
                        </span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    DOM.extractedData.appendChild(table);
}

function updateRawText(rawText) {
    const rawTextElement = document.getElementById('rawTextContent');
    if (!rawTextElement) return;
    
    if (!rawText) {
        rawTextElement.textContent = 'No text extracted';
        return;
    }
    
    rawTextElement.textContent = rawText;
}

function updateDetails(result) {
    const detailsContent = document.getElementById('detailsContent');
    if (!detailsContent) return;
    
    detailsContent.innerHTML = '';
    
    if (!result) {
        detailsContent.innerHTML = '<p>No details available</p>';
        return;
    }
    
    const details = [
        { label: 'File Name', value: state.currentFile?.name || 'N/A' },
        { label: 'File Size', value: state.currentFile ? formatFileSize(state.currentFile.size) : 'N/A' },
        { label: 'File Type', value: state.currentFile?.type || 'N/A' },
        { label: 'Scan Date', value: new Date().toLocaleString() },
        { label: 'Completeness Score', value: `${result.validation?.completenessScore || 0}%` },
        { label: 'Status', value: result.validation?.isComplete ? 'Complete' : 'Incomplete' },
        { label: 'Fields Extracted', value: Object.keys(result.extractedData?.fields || {}).length },
        { label: 'Missing Fields', value: result.validation?.missingFields?.length || 0 }
    ];
    
    details.forEach(detail => {
        const detailItem = document.createElement('div');
        detailItem.className = 'details-item';
        detailItem.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> ${detail.label}</h4>
            <div class="details-content">${detail.value}</div>
        `;
        detailsContent.appendChild(detailItem);
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and tab contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const tabMap = {
        'validation': { btn: 0, content: 0 },
        'extraction': { btn: 1, content: 1 },
        'raw': { btn: 2, content: 2 },
        'details': { btn: 3, content: 3 }
    };
    
    if (tabMap[tabName]) {
        const { btn, content } = tabMap[tabName];
        if (tabButtons[btn]) tabButtons[btn].classList.add('active');
        if (tabContents[content]) tabContents[content].classList.add('active');
    }
}

function getConfidenceClass(confidence) {
    if (confidence >= 90) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
}

function copyRawText() {
    const rawTextElement = document.querySelector('.raw-text');
    if (rawTextElement) {
        navigator.clipboard.writeText(rawTextElement.textContent);
        showNotification('success', 'Copied!', 'Text copied to clipboard');
    }
}

// Missing functions that need to be implemented:
function checkBackendConnection() {
    // Check if backend is running
    fetch(`${state.settings.apiEndpoint}/health`)
        .then(response => {
            if (response.ok) {
                console.log('Backend connected');
            } else {
                showNotification('warning', 'Backend Warning', 'Backend is not responding optimally');
            }
        })
        .catch(error => {
            showNotification('error', 'Connection Error', 'Cannot connect to backend server');
        });
}

function updateStatistics() {
    // Update statistics display
    localStorage.setItem('civixStatistics', JSON.stringify(state.statistics));
}

function loadRecentScans() {
    // Load recent scans from localStorage
    if (state.scanHistory.length > 0) {
        console.log(`Loaded ${state.scanHistory.length} recent scans`);
    }
}

function updateScanStatistics(result) {
    // Update statistics based on scan result
    state.statistics.scannedToday++;
    
    if (result.validation?.completenessScore) {
        const currentAvg = state.statistics.avgScore;
        const totalScans = state.statistics.scannedToday;
        state.statistics.avgScore = ((currentAvg * (totalScans - 1)) + result.validation.completenessScore) / totalScans;
    }
    
    // Update success rate
    const successScans = Math.floor(state.statistics.scannedToday * (state.statistics.successRate / 100));
    state.statistics.successRate = ((successScans + 1) / state.statistics.scannedToday) * 100;
    
    localStorage.setItem('civixStatistics', JSON.stringify(state.statistics));
}

function addToHistory(filename, result) {
    const scanRecord = {
        id: Date.now(),
        filename: filename,
        timestamp: new Date().toISOString(),
        completeness: result.validation?.completenessScore || 0,
        status: result.validation?.isComplete ? 'complete' : 'incomplete',
        extractedFields: Object.keys(result.extractedData?.fields || {}).length
    };
    
    state.scanHistory.unshift(scanRecord);
    
    // Keep only last 50 scans
    if (state.scanHistory.length > 50) {
        state.scanHistory = state.scanHistory.slice(0, 50);
    }
    
    localStorage.setItem('civixScanHistory', JSON.stringify(state.scanHistory));
}

function showNotification(type, title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠️' : 'ℹ️'} ${title}
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    // Add to notifications container
    const container = document.getElementById('notificationContainer') || document.body;
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Modal functions
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.style.display = 'flex';
        startCamera();
    }
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.style.display = 'none';
        stopCamera();
    }
}

function triggerFileInput(mode) {
    closeUploadModal();
    if (mode === 'single') {
        document.getElementById('fileInput').click();
    } else {
        document.getElementById('batchFileInput').click();
    }
}

// Camera functions
let currentStream = null;
let currentFacingMode = 'environment'; // 'user' for front, 'environment' for back

async function startCamera() {
    try {
        const video = document.getElementById('cameraFeed');
        if (!video) return;
        
        const constraints = {
            video: {
                facingMode: currentFacingMode
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        showNotification('error', 'Camera Error', 'Unable to access camera. Please check permissions.');
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    startCamera();
}

function captureDocument() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('cameraCanvas');
    
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
        if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            closeCameraModal();
            await processSingleFile(file);
        }
    }, 'image/jpeg', 0.9);
}

// Sample data function
function loadSampleData() {
    showNotification('info', 'Sample Data', 'Loading sample document...');
    // Create a sample file for testing
    const sampleText = 'Sample Document\n\nThis is a test document for the Civix AI Scanner.\n\nName: John Doe\nDate: 2024-01-01\nStatus: Complete';
    const blob = new Blob([sampleText], { type: 'text/plain' });
    const file = new File([blob], 'sample-document.txt', { type: 'text/plain' });
    
    // Note: This won't work with actual scanning since it's a text file
    // but demonstrates the function exists
    showNotification('warning', 'Sample Data', 'Please use a PDF or image file for actual scanning.');
}

// Results functions
function exportResults() {
    const results = {
        validation: DOM.validationResults?.innerHTML || '',
        extractedData: DOM.extractedData?.innerHTML || '',
        rawText: document.getElementById('rawTextContent')?.textContent || ''
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Export Complete', 'Results exported successfully');
}

function scanAnother() {
    if (DOM.scanner) DOM.scanner.style.display = 'block';
    if (DOM.results) DOM.results.style.display = 'none';
    if (DOM.progressSection) DOM.progressSection.style.display = 'none';
    
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    state.currentFile = null;
    updateProgress(0, 'Ready');
}

// Settings functions
function saveSettings() {
    const strictness = document.getElementById('strictnessLevel')?.value || 'medium';
    const language = document.getElementById('ocrLanguage')?.value || 'eng';
    const autoDelete = document.getElementById('autoDelete')?.checked || false;
    const notifications = document.getElementById('enableNotifications')?.checked || true;
    const apiEndpoint = document.getElementById('apiEndpoint')?.value || 'http://localhost:3000/api/scan';
    
    state.settings = {
        strictness,
        language,
        autoDelete,
        notifications,
        apiEndpoint
    };
    
    localStorage.setItem('civixSettings', JSON.stringify(state.settings));
    showNotification('success', 'Settings Saved', 'Your settings have been saved successfully');
}

function resetSettings() {
    state.settings = {
        strictness: 'medium',
        language: 'eng',
        autoDelete: true,
        notifications: true,
        apiEndpoint: 'http://localhost:3000/api/scan'
    };
    
    localStorage.setItem('civixSettings', JSON.stringify(state.settings));
    initializeApp();
    showNotification('success', 'Settings Reset', 'Settings have been reset to defaults');
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const uploadModal = document.getElementById('uploadModal');
    const cameraModal = document.getElementById('cameraModal');
    
    if (event.target === uploadModal) {
        closeUploadModal();
    }
    if (event.target === cameraModal) {
        closeCameraModal();
    }
});