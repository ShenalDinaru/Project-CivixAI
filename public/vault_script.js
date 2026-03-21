// API Configuration
const API_BASE_URL = `${window.location.origin}/api`;

function getAuthenticatedUser() {
  const rawUser = sessionStorage.getItem('currentUser');
  const userUID = sessionStorage.getItem('userUID');

  if (!rawUser || !userUID) return null;

  try {
    const user = JSON.parse(rawUser);
    if (!user || typeof user !== 'object') return null;
    return user;
  } catch (error) {
    console.warn('Unable to parse current user from sessionStorage.', error);
    return null;
  }
}

function enforceAuth() {
  const user = getAuthenticatedUser();
  if (!user) {
    window.location.replace('LoginPG.html');
    return null;
  }
  return user;
}

const authenticatedUser = enforceAuth();
const userUID = sessionStorage.getItem('userUID');

function showToast(message, type = 'info') {
  const existing = document.querySelector('.vault-toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `vault-toast vault-toast-${type}`;
  el.textContent = message;
  el.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999;
    padding: 14px 18px;
    border-radius: 12px;
    background: ${
      type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'
    };
    color: white;
    font-weight: 700;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// Elements
const backBtn = document.getElementById('backBtn');

const saveEntryBtn = document.getElementById('saveEntryBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const refreshEntriesBtn = document.getElementById('refreshEntriesBtn');

const entriesList = document.getElementById('entriesList');
const entriesEmptyState = document.getElementById('entriesEmptyState');

const editingEntryIdInput = document.getElementById('editingEntryId');

const entryNameInput = document.getElementById('entryName');
const nicInput = document.getElementById('nic');
const tinInput = document.getElementById('tin');
const bankNameInput = document.getElementById('bankName');
const bankAccountNumberInput = document.getElementById('bankAccountNumber');
const nicImageInput = document.getElementById('nicImage');
const passportImageInput = document.getElementById('passportImage');
const drivingLicenseImageInput = document.getElementById('drivingLicenseImage');
const takePhotoButtons = document.querySelectorAll('.take-photo-btn');
const nicImageStatus = document.getElementById('nicImageStatus');
const passportImageStatus = document.getElementById('passportImageStatus');
const drivingLicenseImageStatus = document.getElementById('drivingLicenseImageStatus');
const cameraModal = document.getElementById('cameraModal');
const cameraModalTitle = document.getElementById('cameraModalTitle');
const cameraPreview = document.getElementById('cameraPreview');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraCancelBtn = document.getElementById('cameraCancelBtn');
const cameraCaptureBtn = document.getElementById('cameraCaptureBtn');
const notesInput = document.getElementById('notes');

let entriesCache = [];
let nicImageState = null;
let passportImageState = null;
let drivingLicenseImageState = null;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
let cameraStream = null;
let activeCaptureTarget = null;

function clearForm() {
  editingEntryIdInput.value = '';
  entryNameInput.value = '';
  nicInput.value = '';
  tinInput.value = '';
  bankNameInput.value = '';
  bankAccountNumberInput.value = '';
  if (nicImageInput) nicImageInput.value = '';
  if (passportImageInput) passportImageInput.value = '';
  if (drivingLicenseImageInput) drivingLicenseImageInput.value = '';
  nicImageState = null;
  passportImageState = null;
  drivingLicenseImageState = null;
  updateImageStatusLabels();
  notesInput.value = '';
}

function setFormFromEntry(entry) {
  editingEntryIdInput.value = entry.id || '';
  entryNameInput.value = entry.name || '';
  nicInput.value = entry.nic || '';
  tinInput.value = entry.tin || '';
  bankNameInput.value = entry.bankName || '';
  bankAccountNumberInput.value = entry.bankAccountNumber || '';
  nicImageState = entry.nicImage || null;
  passportImageState = entry.passportImage || null;
  drivingLicenseImageState = entry.drivingLicenseImage || null;
  if (nicImageInput) nicImageInput.value = '';
  if (passportImageInput) passportImageInput.value = '';
  if (drivingLicenseImageInput) drivingLicenseImageInput.value = '';
  updateImageStatusLabels();
  notesInput.value = entry.notes || '';
}

function updateImageStatusLabels() {
  if (nicImageStatus) {
    nicImageStatus.textContent = nicImageState?.name ? `Selected: ${nicImageState.name}` : 'No image selected';
  }
  if (passportImageStatus) {
    passportImageStatus.textContent = passportImageState?.name ? `Selected: ${passportImageState.name}` : 'No image selected';
  }
  if (drivingLicenseImageStatus) {
    drivingLicenseImageStatus.textContent = drivingLicenseImageState?.name ? `Selected: ${drivingLicenseImageState.name}` : 'No image selected';
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read selected image'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToApproxBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

function assignImageStateByTarget(target, imageObj) {
  if (target === 'nicImage') nicImageState = imageObj;
  if (target === 'passportImage') passportImageState = imageObj;
  if (target === 'drivingLicenseImage') drivingLicenseImageState = imageObj;
}

async function stopCameraStream() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  if (cameraPreview) cameraPreview.srcObject = null;
}

async function closeCameraModal() {
  if (cameraModal) {
    cameraModal.classList.remove('open');
    cameraModal.setAttribute('aria-hidden', 'true');
  }
  await stopCameraStream();
  activeCaptureTarget = null;
}

async function openCameraModal(target) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera access is not supported on this browser.', 'error');
    return;
  }

  try {
    activeCaptureTarget = target;
    const label = target === 'nicImage'
      ? 'NIC'
      : target === 'passportImage'
        ? 'Passport'
        : 'Driving License';
    if (cameraModalTitle) cameraModalTitle.textContent = `Take ${label} Photo`;

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });

    if (cameraPreview) {
      cameraPreview.srcObject = cameraStream;
      await cameraPreview.play();
    }
    if (cameraModal) {
      cameraModal.classList.add('open');
      cameraModal.setAttribute('aria-hidden', 'false');
    }
  } catch (error) {
    console.error('Camera open failed:', error);
    showToast('Unable to access camera. Check browser permissions.', 'error');
    await closeCameraModal();
  }
}

async function capturePhotoFromCamera() {
  if (!cameraPreview || !cameraCanvas || !activeCaptureTarget) return;

  const width = cameraPreview.videoWidth || 1280;
  const height = cameraPreview.videoHeight || 720;

  cameraCanvas.width = width;
  cameraCanvas.height = height;

  const ctx = cameraCanvas.getContext('2d');
  if (!ctx) {
    showToast('Unable to capture image.', 'error');
    return;
  }

  ctx.drawImage(cameraPreview, 0, 0, width, height);
  const dataUrl = cameraCanvas.toDataURL('image/jpeg', 0.9);

  const approxBytes = dataUrlToApproxBytes(dataUrl);
  if (approxBytes > MAX_IMAGE_BYTES) {
    showToast('Captured image is too large. Move closer and retry.', 'warning');
    return;
  }

  const imageObj = {
    name: `${activeCaptureTarget}_${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    dataUrl,
  };

  assignImageStateByTarget(activeCaptureTarget, imageObj);
  updateImageStatusLabels();
  showToast('Photo captured successfully.', 'success');
  await closeCameraModal();
}

async function handleImageInputChange(fileInput, assignState) {
  const file = fileInput?.files?.[0];
  if (!file) return;

  if (!file.type || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file.', 'warning');
    fileInput.value = '';
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    showToast('Each image must be 2MB or smaller.', 'warning');
    fileInput.value = '';
    return;
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    assignState({
      name: file.name,
      mimeType: file.type,
      dataUrl,
    });
    updateImageStatusLabels();
  } catch (err) {
    console.error(err);
    showToast('Failed to process selected image.', 'error');
    fileInput.value = '';
  }
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.message || data?.error || `Request failed: ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

function renderEntries(entries) {
  if (!entriesList) return;

  entriesList.innerHTML = '';

  if (!Array.isArray(entries) || entries.length === 0) {
    if (entriesEmptyState) entriesEmptyState.style.display = 'block';
    entriesList.appendChild(entriesEmptyState);
    return;
  }

  if (entriesEmptyState) entriesEmptyState.style.display = 'none';

  entries.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'vault-entry';

    const top = document.createElement('div');
    top.className = 'vault-entry-top';

    const left = document.createElement('div');
    const name = document.createElement('h3');
    name.className = 'vault-entry-name';
    name.textContent = entry.name || 'Untitled entry';
    left.appendChild(name);

    const fields = document.createElement('div');
    fields.className = 'vault-entry-fields';

    const nicLine = document.createElement('div');
    nicLine.innerHTML = `<span class="mask">NIC:</span> <span></span>`;
    nicLine.querySelector('span:last-child').textContent = entry.nic || ' None';
    if (!entry.nic) nicLine.querySelector('span:last-child').style.color = 'rgba(255,255,255,0.55)';

    const tinLine = document.createElement('div');
    tinLine.innerHTML = `<span class="mask">TIN:</span> <span></span>`;
    tinLine.querySelector('span:last-child').textContent = entry.tin || ' None';
    if (!entry.tin) tinLine.querySelector('span:last-child').style.color = 'rgba(255,255,255,0.55)';

    const bankNameLine = document.createElement('div');
    const bankNameLabel = document.createElement('span');
    bankNameLabel.className = 'mask';
    bankNameLabel.textContent = 'Bank Name:';
    bankNameLine.appendChild(bankNameLabel);
    const bankNameText = document.createElement('span');
    bankNameText.textContent = entry.bankName ? ` ${String(entry.bankName).slice(0, 60)}` : ' None';
    if (!entry.bankName) bankNameText.style.color = 'rgba(255,255,255,0.55)';
    bankNameLine.appendChild(bankNameText);

    const bankAccountLine = document.createElement('div');
    bankAccountLine.innerHTML = `<span class="mask">Bank A/C:</span> <span></span>`;
    bankAccountLine.querySelector('span:last-child').textContent = entry.bankAccountNumber || ' None';
    if (!entry.bankAccountNumber) bankAccountLine.querySelector('span:last-child').style.color = 'rgba(255,255,255,0.55)';

    const notesLine = document.createElement('div');
    const notesLabel = document.createElement('span');
    notesLabel.className = 'mask';
    notesLabel.textContent = 'Notes:';
    notesLine.appendChild(notesLabel);

    if (entry.notes) {
      const snippet = document.createElement('span');
      snippet.textContent = ' ' + String(entry.notes).slice(0, 80);
      notesLine.appendChild(snippet);
    } else {
      const none = document.createElement('span');
      none.textContent = ' None';
      none.style.color = 'rgba(255,255,255,0.55)';
      notesLine.appendChild(none);
    }

    fields.appendChild(nicLine);
    fields.appendChild(tinLine);
    fields.appendChild(bankNameLine);
    fields.appendChild(bankAccountLine);
    fields.appendChild(notesLine);
    left.appendChild(fields);

    const docsWrap = document.createElement('div');
    docsWrap.className = 'vault-doc-thumbs';
    const docs = [
      { key: 'nicImage', label: 'NIC', data: entry.nicImage },
      { key: 'passportImage', label: 'Passport', data: entry.passportImage },
      { key: 'drivingLicenseImage', label: 'License', data: entry.drivingLicenseImage },
    ];
    docs.forEach((doc) => {
      if (!doc.data?.dataUrl) return;
      const img = document.createElement('img');
      img.className = 'vault-doc-thumb';
      img.src = doc.data.dataUrl;
      img.alt = `${doc.label} image`;
      img.title = `${doc.label} image`;
      docsWrap.appendChild(img);
    });
    if (docsWrap.children.length > 0) {
      left.appendChild(docsWrap);
    }

    const actions = document.createElement('div');
    actions.className = 'vault-entry-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-secondary small';
    editBtn.textContent = 'Edit';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.entryId = entry.id;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.entryId = entry.id;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    top.appendChild(left);
    top.appendChild(actions);
    card.appendChild(top);

    entriesList.appendChild(card);
  });
}

async function loadEntries() {
  if (!userUID) {
    showToast('User not found. Please login again.', 'error');
    window.location.replace('LoginPG.html');
    return;
  }

  try {
    const data = await apiPost('/vault/entries', { userUID });
    if (!data.success) {
      throw new Error(data.message || 'Failed to load vault entries');
    }
    entriesCache = data.entries || [];
    renderEntries(entriesCache);
  } catch (err) {
    console.error('Failed to load vault entries:', err);
    showToast('Failed to load vault entries.', 'error');
  }
}

async function saveEntry() {
  if (!userUID) return;

  const name = entryNameInput.value.trim();
  const nic = nicInput.value.trim();
  const tin = tinInput.value.trim();
  const bankName = bankNameInput.value.trim();
  const bankAccountNumber = bankAccountNumberInput.value.trim();
  const notes = notesInput.value.trim();

  if (!name) {
    showToast('Entry name is required.', 'warning');
    return;
  }

  // Require at least one confidential field
  if (!nic && !tin && !bankName && !bankAccountNumber && !notes
    && !nicImageState && !passportImageState && !drivingLicenseImageState) {
    showToast('Add at least one confidential field.', 'warning');
    return;
  }

  const editingId = editingEntryIdInput.value || null;

  try {
    saveEntryBtn.disabled = true;
    saveEntryBtn.style.opacity = '0.7';

    const data = await apiPost('/vault/entry', {
      userUID,
      id: editingId,
      name,
      nic,
      tin,
      bankName,
      bankAccountNumber,
      nicImage: nicImageState,
      passportImage: passportImageState,
      drivingLicenseImage: drivingLicenseImageState,
      notes,
    });

    if (!data.success) {
      throw new Error(data.message || 'Failed to save entry');
    }

    showToast(editingId ? 'Entry updated.' : 'Entry saved.', 'success');
    clearForm();
    await loadEntries();
  } catch (err) {
    console.error('Failed to save vault entry:', err);
    showToast(err?.message || 'Failed to save entry.', 'error');
  } finally {
    saveEntryBtn.disabled = false;
    saveEntryBtn.style.opacity = '1';
  }
}

async function deleteEntry(entryId) {
  if (!entryId || !userUID) return;
  const ok = confirm('Delete this vault entry? This cannot be undone.');
  if (!ok) return;

  try {
    const data = await apiPost('/vault/entry/delete', { userUID, id: entryId });
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete entry');
    }
    showToast('Entry deleted.', 'success');
    clearForm();
    await loadEntries();
  } catch (err) {
    console.error('Failed to delete vault entry:', err);
    showToast(err?.message || 'Failed to delete entry.', 'error');
  }
}

// Events
if (backBtn) {
  backBtn.addEventListener('click', () => window.location.href = 'home.html');
}

if (saveEntryBtn) saveEntryBtn.addEventListener('click', saveEntry);
if (clearFormBtn) clearFormBtn.addEventListener('click', clearForm);
if (refreshEntriesBtn) refreshEntriesBtn.addEventListener('click', loadEntries);
if (nicImageInput) {
  nicImageInput.addEventListener('change', () =>
    handleImageInputChange(nicImageInput, (img) => { nicImageState = img; })
  );
}
if (passportImageInput) {
  passportImageInput.addEventListener('change', () =>
    handleImageInputChange(passportImageInput, (img) => { passportImageState = img; })
  );
}
if (drivingLicenseImageInput) {
  drivingLicenseImageInput.addEventListener('change', () =>
    handleImageInputChange(drivingLicenseImageInput, (img) => { drivingLicenseImageState = img; })
  );
}
if (takePhotoButtons && takePhotoButtons.length > 0) {
  takePhotoButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.docTarget;
      if (!target) return;
      openCameraModal(target);
    });
  });
}
if (cameraCancelBtn) {
  cameraCancelBtn.addEventListener('click', () => {
    closeCameraModal();
  });
}
if (cameraCaptureBtn) {
  cameraCaptureBtn.addEventListener('click', () => {
    capturePhotoFromCamera();
  });
}
if (cameraModal) {
  cameraModal.addEventListener('click', (event) => {
    if (event.target === cameraModal) {
      closeCameraModal();
    }
  });
}
window.addEventListener('beforeunload', () => {
  stopCameraStream();
});

if (entriesList) {
  entriesList.addEventListener('click', async (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
    if (!btn) return;

    const action = btn.dataset.action;
    const entryId = btn.dataset.entryId;
    if (!action || !entryId) return;

    if (action === 'edit') {
      const entry = entriesCache.find((x) => x.id === entryId);
      if (!entry) {
        showToast('Entry not found.', 'error');
        return;
      }
      setFormFromEntry(entry);
      showToast('Loaded entry for editing.', 'info');
      // Scroll to form for mobile usability
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (action === 'delete') {
      await deleteEntry(entryId);
    }
  });
}

// Initial load
if (authenticatedUser && userUID) {
  updateImageStatusLabels();
  loadEntries();
}

