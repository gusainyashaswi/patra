// Default configuration
const STORAGE_KEY_API = 'patra_backend_url';
let apiBaseUrl = localStorage.getItem(STORAGE_KEY_API) || 'http://localhost:5001';
let currentFormat = 'html'; // 'html' | 'text'

// Email Templates
const TEMPLATES = {
  welcome: {
    subject: 'Welcome to Patra — You are all set!',
    html: `<h2>Welcome aboard! 🎉</h2>
<p>Thank you for signing up with Patra Mailing Service.</p>
<p>With Patra, you can effortlessly manage, test, and dispatch emails with high deliverability and transparent logging.</p>
<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
<p style="font-size: 12px; color: #64748b;">If you did not initiate this registration, please disregard this email.</p>`,
    text: `Welcome aboard!\n\nThank you for signing up with Patra Mailing Service.\nWith Patra, you can effortlessly manage, test, and dispatch emails with high deliverability and transparent logging.\n\nIf you did not initiate this registration, please disregard this email.`
  },
  otp: {
    subject: 'Your Patra Verification Code: 489201',
    html: `<h3>Verification Security Code</h3>
<p>Use the following single-use code to authenticate your session:</p>
<div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background: #f1f5f9; display: inline-block; border-radius: 8px; margin: 12px 0;">
  489201
</div>
<p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes. Never share this code with anyone.</p>`,
    text: `Verification Security Code\n\nUse the following single-use code to authenticate your session:\n\n489201\n\nThis code will expire in 10 minutes. Never share this code with anyone.`
  },
  digest: {
    subject: 'Patra System Digest — Weekly Performance Summary',
    html: `<h2>Weekly Delivery Performance Report</h2>
<p>Here is your weekly outbound dispatch snapshot:</p>
<ul>
  <li><strong>Total Dispatches:</strong> 1,420</li>
  <li><strong>Delivery Rate:</strong> 99.8%</li>
  <li><strong>Bounce Rate:</strong> 0.2%</li>
</ul>
<p>All system queues are operating normally.</p>`,
    text: `Weekly Delivery Performance Report\n\nHere is your weekly outbound dispatch snapshot:\n- Total Dispatches: 1,420\n- Delivery Rate: 99.8%\n- Bounce Rate: 0.2%\n\nAll system queues are operating normally.`
  }
};

// DOM Elements
const connectionBadge = document.getElementById('connection-indicator');
const connectionLabel = document.getElementById('connection-label');
const toggleConfigBtn = document.getElementById('toggle-config-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const apiUrlInput = document.getElementById('api-url-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');

const mailForm = document.getElementById('mail-form');
const fromInput = document.getElementById('from-input');
const toInput = document.getElementById('to-input');
const ccInput = document.getElementById('cc-input');
const bccInput = document.getElementById('bcc-input');
const toggleCcBtn = document.getElementById('toggle-cc-btn');
const ccBccContainer = document.getElementById('cc-bcc-container');
const subjectInput = document.getElementById('subject-input');
const bodyInput = document.getElementById('body-input');
const tabHtml = document.getElementById('tab-html');
const tabText = document.getElementById('tab-text');
const resetFormBtn = document.getElementById('reset-form-btn');
const sendBtn = document.getElementById('send-btn');
const btnText = sendBtn.querySelector('.btn-text');
const btnSpinner = sendBtn.querySelector('.btn-spinner');
const btnIcon = sendBtn.querySelector('.btn-icon');

const previewTo = document.getElementById('preview-to');
const previewSubject = document.getElementById('preview-subject');
const previewContent = document.getElementById('preview-content');
const previewModeTag = document.getElementById('preview-mode-tag');

const historyContainer = document.getElementById('history-container');
const refreshHistoryBtn = document.getElementById('refresh-history-btn');
const toastContainer = document.getElementById('toast-container');

// Initialize
function init() {
  apiUrlInput.value = apiBaseUrl;
  setupEventListeners();
  updateLivePreview();
  checkBackendConnection();
  // Poll backend health every 15s
  setInterval(checkBackendConnection, 15000);
}

// Event Listeners
function setupEventListeners() {
  // Settings toggle
  toggleConfigBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
  });
  saveSettingsBtn.addEventListener('click', () => {
    const newUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    if (newUrl) {
      apiBaseUrl = newUrl;
      localStorage.setItem(STORAGE_KEY_API, apiBaseUrl);
      settingsPanel.classList.add('hidden');
      showToast('Settings saved. Reconnecting...', 'info');
      checkBackendConnection();
    }
  });

  // CC/BCC accordion toggle
  toggleCcBtn.addEventListener('click', () => {
    const isHidden = ccBccContainer.classList.toggle('hidden');
    toggleCcBtn.textContent = isHidden ? '+ CC / BCC' : '− Hide CC / BCC';
  });

  // Format Switch
  tabHtml.addEventListener('click', () => setFormat('html'));
  tabText.addEventListener('click', () => setFormat('text'));

  // Live Preview Listeners
  toInput.addEventListener('input', updateLivePreview);
  subjectInput.addEventListener('input', updateLivePreview);
  bodyInput.addEventListener('input', updateLivePreview);

  // Template Buttons
  document.querySelectorAll('.btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-template');
      applyTemplate(key);
    });
  });

  // Reset form
  resetFormBtn.addEventListener('click', () => {
    mailForm.reset();
    updateLivePreview();
  });

  // Form Submit
  mailForm.addEventListener('submit', handleSendMail);

  // History Refresh
  refreshHistoryBtn.addEventListener('click', fetchHistory);
}

// Change body format (HTML vs Plain Text)
function setFormat(format) {
  currentFormat = format;
  if (format === 'html') {
    tabHtml.classList.add('active');
    tabText.classList.remove('active');
    bodyInput.placeholder = '<h2>Hello!</h2><p>Your HTML message here...</p>';
    previewModeTag.textContent = 'HTML Preview';
  } else {
    tabText.classList.add('active');
    tabHtml.classList.remove('active');
    bodyInput.placeholder = 'Your plain text message here...';
    previewModeTag.textContent = 'Plain Text Preview';
  }
  updateLivePreview();
}

// Apply selected template
function applyTemplate(templateKey) {
  const template = TEMPLATES[templateKey];
  if (!template) return;

  subjectInput.value = template.subject;
  if (currentFormat === 'html') {
    bodyInput.value = template.html;
  } else {
    bodyInput.value = template.text;
  }
  updateLivePreview();
  showToast(`Applied "${templateKey}" template`, 'info');
}

// Update Live Preview Box
function updateLivePreview() {
  const to = toInput.value.trim();
  const subject = subjectInput.value.trim();
  const body = bodyInput.value.trim();

  previewTo.textContent = to || '(No recipient specified)';
  previewSubject.textContent = subject || '(No subject)';

  if (!body) {
    previewContent.innerHTML = '<p class="preview-placeholder">Start typing message content to see live rendered preview...</p>';
    return;
  }

  if (currentFormat === 'html') {
    // Basic DOM element creation for preview display
    previewContent.innerHTML = body;
  } else {
    previewContent.textContent = body;
  }
}

// Check Backend Connection Status
async function checkBackendConnection() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/health`, { method: 'GET' });
    if (res.ok) {
      connectionBadge.className = 'status-badge connected';
      connectionLabel.textContent = 'Backend Online';
      fetchHistory(); // fetch latest outbox when connected
    } else {
      throw new Error('Health check returned non-200');
    }
  } catch {
    connectionBadge.className = 'status-badge disconnected';
    connectionLabel.textContent = 'Backend Offline';
  }
}

// Handle Form Submission (Dispatch Email)
async function handleSendMail(e) {
  e.preventDefault();

  const to = toInput.value.trim();
  const subject = subjectInput.value.trim();
  const body = bodyInput.value.trim();
  const from = fromInput.value.trim() || undefined;
  const cc = ccInput.value.trim() || undefined;
  const bcc = bccInput.value.trim() || undefined;

  if (!to) {
    showToast('Please specify a recipient email address', 'error');
    return;
  }
  if (!body) {
    showToast('Email message body cannot be empty', 'error');
    return;
  }

  // Payload preparation
  const payload = {
    from,
    to,
    cc: cc ? cc.split(',').map(s => s.trim()) : undefined,
    bcc: bcc ? bcc.split(',').map(s => s.trim()) : undefined,
    subject,
  };

  if (currentFormat === 'html') {
    payload.html = body;
  } else {
    payload.text = body;
  }

  // Set loading UI
  setLoading(true);

  try {
    const response = await fetch(`${apiBaseUrl}/api/mail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to dispatch email');
    }

    showToast('Email dispatched successfully!', 'success');
    
    // If an ethereal preview link is returned, notify user
    if (result.data && result.data.previewUrl) {
      console.log('[Patra] Preview URL:', result.data.previewUrl);
    }

    fetchHistory();
  } catch (error) {
    console.error('[Patra] Send Error:', error);
    showToast(error.message || 'Connection failed to backend service', 'error');
  } finally {
    setLoading(false);
  }
}

// Fetch Outbox History
async function fetchHistory() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/mail/history?limit=20`);
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      renderHistory(result.data);
    }
  } catch (err) {
    console.warn('[Patra] Could not fetch history:', err.message);
  }
}

// Render History List
function renderHistory(items) {
  if (!items || items.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty"><p>No emails sent yet in this session.</p></div>';
    return;
  }

  historyContainer.innerHTML = items.map(item => {
    const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const previewLinkHtml = item.previewUrl
      ? `<a href="${item.previewUrl}" target="_blank" rel="noopener noreferrer" class="preview-link">Open Preview ↗</a>`
      : `<span class="preview-link" style="opacity: 0.6;">SMTP Sent</span>`;

    return `
      <div class="history-item">
        <div class="history-item-top">
          <span class="history-to">To: ${escapeHtml(item.to)}</span>
          <span class="history-badge">SENT</span>
        </div>
        <div class="history-subject">${escapeHtml(item.subject || '(No subject)')}</div>
        <div class="history-item-bottom">
          <span>${date}</span>
          ${previewLinkHtml}
        </div>
      </div>
    `;
  }).join('');
}

// Helper: Loading button state
function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  if (isLoading) {
    btnText.textContent = 'Dispatching...';
    btnSpinner.classList.remove('hidden');
    btnIcon.classList.add('hidden');
  } else {
    btnText.textContent = 'Dispatch Email';
    btnSpinner.classList.add('hidden');
    btnIcon.classList.remove('hidden');
  }
}

// Helper: Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Boot
window.addEventListener('DOMContentLoaded', init);
