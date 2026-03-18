const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadedFiles = document.getElementById('uploadedFiles');
const statusMessage = document.getElementById('statusMessage');
const addMoreBtn = document.getElementById('addMoreBtn');
const doneBtn = document.getElementById('doneBtn');
const cancelBtn = document.getElementById('cancelBtn');
const backBtn = document.getElementById('backBtn');

// API Configuration
const BASE_URL = window.location.origin;
const API_BASE_URL = `${BASE_URL}/api`;
const CHATBOT_URL = `${BASE_URL}/Chatbot.html`;

let files = [];

// Inject styles for extraction status and upload options
const style = document.createElement('style');
style.textContent = `
  .extraction-status {
    font-size: 12px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  .status-extracting { color: #f59e0b; }
  .status-complete { color: #10b981; }
  .status-icon { width: 14px; height: 14px; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  
  /* Dropdown Styles */
  .custom-dropdown {
    position: absolute;
    background: rgba(26, 11, 46, 0.85);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 8px;   
    min-width: 220px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
    transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .custom-dropdown.active {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: all;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.9);
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
    width: 100%;
  }
  .dropdown-item:hover {
    background: rgba(255,255,255,0.1);
    color: white;
    transform: translateX(4px);
  }
  .dropdown-icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
    opacity: 0.8;
  }
  .dropdown-item:hover .dropdown-icon {
    opacity: 1;
  }

  /* Proceed Modal Styles */
  .proceed-modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 10000;
    display: flex; justify-content: center; align-items: flex-end;
    backdrop-filter: blur(4px);
    opacity: 0; transition: opacity 0.3s;
  }
  .proceed-modal-overlay.active { opacity: 1; }
  
  .proceed-card {
    background: #1a0b2e; border: 1px solid rgba(255,255,255,0.1);
    width: 100%; max-width: 400px;
    border-radius: 24px 24px 0 0;
    padding: 32px;
    transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    display: flex; flex-direction: column; gap: 24px;
  }
  @media (min-width: 768px) {
    .proceed-modal-overlay { align-items: center; }
    .proceed-card { border-radius: 24px; transform: translateY(20px) scale(0.95); }
  }
  .proceed-modal-overlay.active .proceed-card { transform: translateY(0) scale(1); }

  .toggle-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; }
  .toggle-label { color: white; font-size: 15px; font-weight: 500; }
  .toggle-switch { position: relative; width: 50px; height: 28px; flex-shrink: 0; }
  .toggle-input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.2); transition: .4s; border-radius: 34px; }
  .toggle-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
  .toggle-input:checked + .toggle-slider { background-color: #ff4e02; }
  .toggle-input:checked + .toggle-slider:before { transform: translateX(22px); }
  
  .btn-group { display: flex; gap: 12px; }
  .btn-confirm { flex: 1; background: linear-gradient(135deg, #bb0e0e 0%, #ff4e02 100%); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 16px; transition: transform 0.2s; }
  .btn-confirm:hover { transform: translateY(-2px); }
  .btn-cancel { flex: 1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 16px; transition: background 0.2s; }
  .btn-cancel:hover { background: rgba(255,255,255,0.15); }
  #cancelBtn { border-radius: 30px; }
`;
document.head.appendChild(style);

// Dropdown Logic
let activeDropdown = null;

function toggleDropdown(button) {
  if (activeDropdown && activeDropdown.dataset.triggerId === button.id) {
    closeDropdown();
    return;
  }
  closeDropdown();

  const rect = button.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown';
  dropdown.dataset.triggerId = button.id;
  
  dropdown.innerHTML = `
    <button class="dropdown-item" id="dd-upload">
      <img src="/Resources/Icons/Upload Icon.svg" class="dropdown-icon">
      <span>Upload File</span>
    </button>
    <button class="dropdown-item" id="dd-scan">
      <img src="/Resources/Icons/Camera Icon.svg" class="dropdown-icon">
      <span>Scan Document</span>
    </button>
  `;

  document.body.appendChild(dropdown);
  
  // Position logic
  const dropdownWidth = 220;
  let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
  
  // Keep within viewport
  if (left < 10) left = 10;
  if (left + dropdownWidth > window.innerWidth - 10) left = window.innerWidth - dropdownWidth - 10;
  
  dropdown.style.top = `${rect.bottom + 8 + window.scrollY}px`;
  dropdown.style.left = `${left}px`;
  
  requestAnimationFrame(() => dropdown.classList.add('active'));

  dropdown.querySelector('#dd-upload').onclick = () => {
    fileInput.click();
    closeDropdown();
  };
  
  dropdown.querySelector('#dd-scan').onclick = () => {
    closeDropdown();
    // Redirect to scanner page
    window.location.href = 'scanner_and_upload.html';
  };
  
  activeDropdown = dropdown;
}

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
}

document.addEventListener('click', (e) => {
  if (activeDropdown && 
      !e.target.closest('.custom-dropdown') && 
      !e.target.closest('#browseBtn') && 
      !e.target.closest('#addMoreBtn')) {
    closeDropdown();
  }
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown(browseBtn);
});

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = '';
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList) {
  const newFiles = Array.from(fileList);
  
  if (newFiles.length === 0) return;

  const validFiles = newFiles.filter(file => {
    const validTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(fileExtension);
  });

  if (validFiles.length === 0) {
    showStatus('error', 'Please upload valid files (.pdf, .doc, .docx, .txt, .jpg, .jpeg, .png, .gif)');
    return;
  }

  let addedCount = 0;
  let duplicateCount = 0;

  validFiles.forEach(file => {
    if (!files.find(f => f.name === file.name && f.size === file.size)) {
      file.extractionStatus = 'extracting';
      files.push(file);
      simulateExtraction(files.length - 1);
      addedCount++;
    } else {
      duplicateCount++;
    }
  });

  if (addedCount > 0) {
    renderFiles();
    updateButtons();
    simulateUpload();
  } else if (duplicateCount > 0) {
    showStatus('error', 'Document already uploaded.');
    setTimeout(() => hideStatus(), 2000);
  }
}

function simulateExtraction(index) {
  setTimeout(() => {
    if (files[index]) {
      files[index].extractionStatus = 'complete';
      renderFiles();
      updateButtons();
    }
  }, 2500 + Math.random() * 1500);
}

function renderFiles() {
  uploadedFiles.innerHTML = '';
  
  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
    const iconSrc = isImage ? '../Resources/Icons/Image Icon.svg' : '../Resources/Icons/Vault Icon.svg';
    
    let statusHtml = '';
    if (file.extractionStatus === 'extracting') {
      statusHtml = `
        <div class="extraction-status status-extracting">
          <svg class="status-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>Extracting text...</span>
        </div>`;
    } else {
      statusHtml = `
        <div class="extraction-status status-complete">
          <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>Text Extracted & Verified</span>
        </div>`;
    }

    fileItem.innerHTML = `
      <div class="file-info">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="display: flex; flex-direction: column;">
          <span class="file-name">${file.name}</span>
          ${statusHtml}
        </div>
      </div>
      <button class="remove-btn" onclick="removeFile(${index})">
        <svg class="remove-icon" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    uploadedFiles.appendChild(fileItem);
  });
}

function removeFile(index) {
  files.splice(index, 1);
  renderFiles();
  updateButtons();
  
  if (files.length === 0) {
    hideStatus();
  }
}

function simulateUpload() {
  hideStatus();
  
  setTimeout(() => {
    const success = Math.random() > 0.2;
    
    if (success) {
      showStatus('success', `✓ Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}!`);
    } else {
      showStatus('error', '✗ Upload failed. Please try again.');
    }
  }, 1000);
}

function showStatus(type, message) {
  statusMessage.className = `status-message ${type}`;
  statusMessage.textContent = message;
}

function hideStatus() {
  statusMessage.className = 'status-message';
  statusMessage.style.display = 'none';
}

function updateButtons() {
  const hasFiles = files.length > 0;
  addMoreBtn.disabled = !hasFiles;
  
  const isExtracting = files.some(f => f.extractionStatus === 'extracting');
  doneBtn.disabled = !hasFiles || isExtracting;
  
  if (doneBtn) {
    doneBtn.textContent = isExtracting ? 'Processing...' : (hasFiles ? 'Proceed' : 'Done');
    doneBtn.style.opacity = doneBtn.disabled ? '0.5' : '1';
    doneBtn.style.cursor = doneBtn.disabled ? 'not-allowed' : 'pointer';
  }

  if (cancelBtn) {
    cancelBtn.disabled = !hasFiles;
    cancelBtn.style.opacity = cancelBtn.disabled ? '0.5' : '1';
    cancelBtn.style.cursor = cancelBtn.disabled ? 'not-allowed' : 'pointer';
  }
}

function showProceedConfirmation() {
  const overlay = document.createElement('div');
  overlay.className = 'proceed-modal-overlay';
  
  overlay.innerHTML = `
    <div class="proceed-card">
      <div style="text-align: center;">
        <h3 style="color:white; margin:0 0 8px 0; font-size:20px;">Ready to Proceed</h3>
        <p style="color:rgba(255,255,255,0.6); margin:0; font-size:14px;">Choose how you want to continue.</p>
      </div>
      
      <div class="toggle-row">
        <span class="toggle-label">Analyze in Chatbot</span>
        <label class="toggle-switch">
          <input type="checkbox" class="toggle-input" checked id="attachToggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="btn-group">
        <button class="btn-cancel" id="modalCancel">Cancel</button>
        <button class="btn-confirm" id="modalConfirm">Proceed to Chat</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  requestAnimationFrame(() => overlay.classList.add('active'));
  
  const toggle = overlay.querySelector('#attachToggle');
  const confirmBtn = overlay.querySelector('#modalConfirm');
  
  // Update button text based on toggle state
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      confirmBtn.textContent = 'Proceed to Chat';
      confirmBtn.style.background = 'linear-gradient(135deg, #bb0e0e 0%, #ff4e02 100%)';
    } else {
      confirmBtn.textContent = 'Save & Finish';
      confirmBtn.style.background = '#10b981'; // Green for save
    }
  });
  
  const close = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };
  
  overlay.querySelector('#modalCancel').onclick = close;
  
  overlay.querySelector('#modalConfirm').onclick = async () => {
    const attach = toggle.checked;
    close();
    
    if (attach) {
      // Process documents and redirect to chatbot
      await processAndRedirectToChatbot();
    } else {
      // Just save documents without loading to chatbot
      await processDocumentsOnly();
    }
  };
}

addMoreBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown(addMoreBtn);
});

doneBtn.addEventListener('click', () => {
  if (files.length > 0) {
    const pending = files.some(f => f.extractionStatus === 'extracting');
    if (pending) {
      showStatus('error', 'Please wait for all documents to finish extraction.');
      return;
    }
    showProceedConfirmation();
  }
});

cancelBtn.addEventListener('click', () => {
  if (files.length > 0) {
    if (confirm('Are you sure you want to cancel? All uploaded documents will be removed.')) {
      files = [];
      renderFiles();
      updateButtons();
      hideStatus();
    }
  } else {
    showStatus('error', 'No documents to cancel.');
    setTimeout(hideStatus, 2000);
  }
});

if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      console.log('Back clicked - Navigation removed');
    }
  });
}

window.removeFile = removeFile;


/**
 * Process documents and redirect to chatbot
 */
async function processAndRedirectToChatbot() {
  if (files.length === 0) {
    showStatus('error', 'No documents to process.');
    return;
  }

  try {
    // Show processing status
    showStatus('success', 'Processing documents...');
    doneBtn.disabled = true;
    doneBtn.textContent = 'Processing...';

    // Create FormData with all files
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    // Step 1: Process documents (extract text and save as JSON)
    const processResponse = await fetch(`${API_BASE_URL}/documents/process`, {
      method: 'POST',
      body: formData
    });

    const processResult = await processResponse.json();

    if (!processResult.success) {
      throw new Error(processResult.error || 'Failed to process documents');
    }

    // Check if any documents were successfully processed
    const successful = processResult.results.filter(r => r.success);
    if (successful.length === 0) {
      throw new Error('No documents could be processed successfully');
    }

    showStatus('success', `Processed ${successful.length} document(s). Loading into chatbot...`);

    // Step 2: Load processed documents into RAG system
    const loadResponse = await fetch(`${API_BASE_URL}/documents/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const loadResult = await loadResponse.json();

    if (!loadResult.success) {
      throw new Error(loadResult.message || 'Failed to load documents into chatbot');
    }

    // Step 3: Redirect immediately after loading completes (no delay)
    showStatus('success', 'Redirecting to chatbot...');
    window.location.href = `${CHATBOT_URL}?documentsLoaded=true`;


  } catch (error) {
    console.error('Error processing documents:', error);
    showStatus('error', `Error: ${error.message}`);
    doneBtn.disabled = false;
    doneBtn.textContent = 'Proceed';
    setTimeout(() => hideStatus(), 5000);
  }
}

/**
 * Process documents only (without loading to chatbot)
 */
async function processDocumentsOnly() {
  if (files.length === 0) {
    showStatus('error', 'No documents to process.');
    return;
  }

  try {
    showStatus('success', 'Processing documents...');
    doneBtn.disabled = true;
    doneBtn.textContent = 'Processing...';

    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await fetch(`${API_BASE_URL}/documents/process`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to process documents');
    }

    const successful = result.results.filter(r => r.success);
    showStatus('success', `Successfully processed ${successful.length} document(s).`);
    
    doneBtn.disabled = false;
    doneBtn.textContent = 'Proceed';
    setTimeout(() => hideStatus(), 3000);

  } catch (error) {
    console.error('Error processing documents:', error);
    showStatus('error', `Error: ${error.message}`);
    doneBtn.disabled = false;
    doneBtn.textContent = 'Proceed';
    setTimeout(() => hideStatus(), 5000);
  }
}

// Check if redirected from scanner with image data
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const scannedImage = urlParams.get('scannedImage');
  
  if (scannedImage) {
    // Convert base64 to file and add to files array
    try {
      const base64Data = scannedImage.split(',')[1];
      const imageBlob = base64ToBlob(base64Data, 'image/jpeg');
      const fileName = `scanned_${Date.now()}.jpg`;
      const file = new File([imageBlob], fileName, { type: 'image/jpeg' });
      
      file.extractionStatus = 'extracting';
      files.push(file);
      simulateExtraction(files.length - 1);
      renderFiles();
      updateButtons();
      simulateUpload();
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error loading scanned image:', error);
    }
  }
});

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

updateButtons();
