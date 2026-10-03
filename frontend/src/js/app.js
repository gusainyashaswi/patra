const STORAGE_KEY_API = 'patra_backend_url';
const STORAGE_KEY_TOKEN = 'patra_auth_token';

let apiBaseUrl = localStorage.getItem(STORAGE_KEY_API) || 'http://localhost:5001';
let currentFormat = 'html';
let currentUser = null;

// Centralized API client handling requests and automated Bearer token attachment
const apiClient = {
  getToken() {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  },
  setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  },
  clearToken() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },
  // Performs HTTP requests with JSON headers and Bearer token injection
  async request(endpoint, options = {}) {
    const url = `${apiBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      if (res.status === 401 && token && endpoint !== '/api/auth/login') {
        console.warn('[apiClient] Session expired. Clearing token.');
        this.clearToken();
        updateAuthUI(null);
      }

      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (networkError) {
      return { ok: false, status: 0, error: networkError.message };
    }
  },
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },
  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
};

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

const connectionBadge = document.getElementById('connection-indicator');
const connectionLabel = document.getElementById('connection-label');
const toggleConfigBtn = document.getElementById('toggle-config-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const apiUrlInput = document.getElementById('api-url-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');

const openAuthBtn = document.getElementById('open-auth-btn');
const userBadge = document.getElementById('user-badge');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userRoleTag = document.getElementById('user-role-tag');
const logoutBtn = document.getElementById('logout-btn');

const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');
const tabAuthLogin = document.getElementById('tab-auth-login');
const tabAuthRegister = document.getElementById('tab-auth-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');

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

// Initializes application state, event listeners, backend health polling, and user session
async function init() {
  apiUrlInput.value = apiBaseUrl;
  setupEventListeners();
  updateLivePreview();
  await checkBackendConnection();
  await loadCurrentUser();
  setInterval(checkBackendConnection, 15000);
}

// Binds DOM event listeners for forms, buttons, and format toggles
function setupEventListeners() {
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

  openAuthBtn.addEventListener('click', () => {
    openModal('login');
  });
  closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.add('hidden');
    }
  });

  tabAuthLogin.addEventListener('click', () => switchAuthTab('login'));
  tabAuthRegister.addEventListener('click', () => switchAuthTab('register'));

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);

  toggleCcBtn.addEventListener('click', () => {
    const isHidden = ccBccContainer.classList.toggle('hidden');
    toggleCcBtn.textContent = isHidden ? '+ CC / BCC' : '− Hide CC / BCC';
  });

  tabHtml.addEventListener('click', () => setFormat('html'));
  tabText.addEventListener('click', () => setFormat('text'));

  toInput.addEventListener('input', updateLivePreview);
  subjectInput.addEventListener('input', updateLivePreview);
  bodyInput.addEventListener('input', updateLivePreview);

  document.querySelectorAll('.btn-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-template');
      applyTemplate(key);
    });
  });

  resetFormBtn.addEventListener('click', () => {
    mailForm.reset();
    updateLivePreview();
  });

  mailForm.addEventListener('submit', handleSendMail);
  refreshHistoryBtn.addEventListener('click', fetchHistory);
}

// Opens the authentication modal with the specified tab active
function openModal(mode = 'login') {
  authModal.classList.remove('hidden');
  switchAuthTab(mode);
}

// Switches active tab between login and registration forms
function switchAuthTab(tab) {
  if (tab === 'login') {
    tabAuthLogin.classList.add('active');
    tabAuthRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginEmail.focus();
  } else {
    tabAuthRegister.classList.add('active');
    tabAuthLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerName.focus();
  }
}

// Updates header UI elements to reflect authenticated or unauthenticated state
function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    openAuthBtn.classList.add('hidden');
    userBadge.classList.remove('hidden');
    userAvatar.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
    userName.textContent = user.name || user.email;
    userRoleTag.textContent = user.role || 'user';
  } else {
    openAuthBtn.classList.remove('hidden');
    userBadge.classList.add('hidden');
  }
}

// Loads the authenticated user profile using stored JWT token
async function loadCurrentUser() {
  const token = apiClient.getToken();
  if (!token) {
    updateAuthUI(null);
    return;
  }

  const { ok, data } = await apiClient.get('/api/auth/me');
  if (ok && data.success && data.user) {
    updateAuthUI(data.user);
    fetchHistory();
  } else {
    apiClient.clearToken();
    updateAuthUI(null);
  }
}

// Authenticates user credentials and stores JWT token on success
async function handleLogin(e) {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showToast('Please provide email and password', 'error');
    return;
  }

  const submitBtn = document.getElementById('login-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing In...';

  try {
    const { ok, data } = await apiClient.post('/api/auth/login', { email, password });
    if (!ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    apiClient.setToken(data.token);
    updateAuthUI(data.user);
    authModal.classList.add('hidden');
    loginForm.reset();
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    fetchHistory();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

// Registers a new user account and activates session on success
async function handleRegister(e) {
  e.preventDefault();
  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!name || !email || !password) {
    showToast('Please fill in all registration fields', 'error');
    return;
  }
  if (password.length < 8) {
    showToast('Password must be at least 8 characters long', 'error');
    return;
  }

  const submitBtn = document.getElementById('register-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    const { ok, data } = await apiClient.post('/api/auth/register', { name, email, password });
    if (!ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    apiClient.setToken(data.token);
    updateAuthUI(data.user);
    authModal.classList.add('hidden');
    registerForm.reset();
    showToast(`Account created! Welcome, ${data.user.name}!`, 'success');
    fetchHistory();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}

// Terminates active session, clears stored JWT, and resets user state
async function handleLogout() {
  await apiClient.post('/api/auth/logout');
  apiClient.clearToken();
  updateAuthUI(null);
  showToast('You have been signed out', 'info');
  fetchHistory();
}

// Toggles email message composition body format between HTML and Plain Text
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

// Injects pre-defined email template into subject and body fields
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

// Renders live preview of recipient, subject, and formatted email body
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
    previewContent.innerHTML = body;
  } else {
    previewContent.textContent = body;
  }
}

// Polls backend health endpoint and updates connection badge status
async function checkBackendConnection() {
  const { ok } = await apiClient.get('/api/health');
  if (ok) {
    connectionBadge.className = 'status-badge connected';
    connectionLabel.textContent = 'Backend Online';
    fetchHistory();
  } else {
    connectionBadge.className = 'status-badge disconnected';
    connectionLabel.textContent = 'Backend Offline';
  }
}

// Validates form input and dispatches email via backend mail service
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

  const payload = {
    from,
    to,
    cc: cc ? cc.split(',').map((s) => s.trim()) : undefined,
    bcc: bcc ? bcc.split(',').map((s) => s.trim()) : undefined,
    subject,
  };

  if (currentFormat === 'html') {
    payload.html = body;
  } else {
    payload.text = body;
  }

  setLoading(true);

  try {
    const { ok, data } = await apiClient.post('/api/mail/send', payload);
    if (!ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to dispatch email');
    }

    showToast('Email dispatched successfully!', 'success');

    if (data.data && data.data.previewUrl) {
      console.log('[Patra] Preview URL:', data.data.previewUrl);
    }

    fetchHistory();
  } catch (error) {
    console.error('[Patra] Send Error:', error);
    showToast(error.message || 'Connection failed to backend service', 'error');
  } finally {
    setLoading(false);
  }
}

// Fetches recent email dispatch history for the active user
async function fetchHistory() {
  try {
    const { ok, data } = await apiClient.get('/api/mail/history?limit=20');
    if (!ok) return;
    if (data.success && Array.isArray(data.data)) {
      renderHistory(data.data);
    }
  } catch (err) {
    console.warn('[Patra] Could not fetch history:', err.message);
  }
}

// Renders outbox activity items with timestamps and preview links
function renderHistory(items) {
  if (!items || items.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty"><p>No emails sent yet in this session.</p></div>';
    return;
  }

  historyContainer.innerHTML = items
    .map((item) => {
      const date = new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
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
    })
    .join('');
}

// Toggles button loading state and spinner animation during dispatch
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

// Displays temporary toast notification on the screen
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

// Sanitizes string for safe insertion into HTML DOM
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', init);
