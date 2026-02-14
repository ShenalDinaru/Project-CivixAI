const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadedFiles = document.getElementById('uploadedFiles');
const statusMessage = document.getElementById('statusMessage');
const addMoreBtn = document.getElementById('addMoreBtn');
const doneBtn = document.getElementById('doneBtn');
const cancelBtn = document.getElementById('cancelBtn');
const backBtn = document.getElementById('backBtn');

let files = [];

function loadPreviousDocuments() {
  try {
    const savedFiles = localStorage.getItem('civixaiUploadedDocuments');
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      files = parsedFiles.map(fileData => ({
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        lastModified: fileData.lastModified
      }));
      renderFiles();
      updateButtons();
    }
  } catch (e) {
    console.warn('Unable to load previous documents:', e);
  }
}

function saveDocuments() {
  try {
    const fileData = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified || Date.now()
    }));
    localStorage.setItem('civixaiUploadedDocuments', JSON.stringify(fileData));
  } catch (e) {
    console.warn('Unable to save documents:', e);
  }
}

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
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

  validFiles.forEach(file => {
    if (!files.find(f => f.name === file.name && f.size === file.size)) {
      files.push(file);
    }
  });

  renderFiles();
  updateButtons();
  saveDocuments();
  simulateUpload();
}

function renderFiles() {
  uploadedFiles.innerHTML = '';
  
  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
    const iconSrc = isImage ? 'Resources/Icons/Image Icon.svg' : 'Resources/Icons/Vault Icon.svg';
    
    fileItem.innerHTML = `
      <div class="file-info">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="file-name">${file.name}</span>
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
  saveDocuments();
  
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
  doneBtn.disabled = !hasFiles;
}

addMoreBtn.addEventListener('click', () => {
  fileInput.click();
});

doneBtn.addEventListener('click', () => {
  if (files.length > 0) {
    showStatus('success', `✓ Processing complete! ${files.length} document${files.length > 1 ? 's' : ''} ready.`);
    setTimeout(() => {
      hideStatus();
    }, 2000);
  }
});

cancelBtn.addEventListener('click', () => {
  if (files.length > 0) {
    if (confirm('Are you sure you want to cancel? All uploaded documents will be removed.')) {
      files = [];
      renderFiles();
      updateButtons();
      saveDocuments();
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
      window.location.href = 'home.html';
    }
  });
}

window.removeFile = removeFile;

loadPreviousDocuments();
