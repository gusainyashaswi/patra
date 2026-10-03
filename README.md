# Patra ✉️

> A clean, modern mailing service repository with separated backend and frontend architectures.

---

## 📁 Repository Structure

```
patra/
├── backend/                       # Node.js & Express API Service
│   ├── src/
│   │   ├── config/                # Environment and transporter configurations
│   │   │   └── index.js
│   │   ├── controllers/           # Request handlers and validation
│   │   │   └── mailController.js
│   │   ├── routes/                # API route definitions
│   │   │   └── mailRoutes.js
│   │   ├── services/              # Nodemailer logic & outbox history
│   │   │   └── mailService.js
│   │   ├── app.js                 # Express application middleware & setup
│   │   └── server.js              # Server entry point
│   ├── .env.example               # Template environment variables
│   └── package.json               # Backend dependencies and scripts
│
├── frontend/                      # Web Client Dashboard
│   ├── src/
│   │   ├── css/
│   │   │   └── style.css          # Design system & responsive layout
│   │   └── js/
│   │       └── app.js             # Client logic, live preview & API client
│   ├── index.html                 # Main interface
│   ├── server.js                  # Lightweight local static server
│   └── package.json               # Frontend scripts
│
├── .gitignore                     # Git ignore rules for dependencies & env
└── README.md                      # Project documentation
```

---

## 🚀 Quick Start

### 1. Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Set up your SMTP credentials:
   ```bash
   cp .env.example .env
   ```
   > **Note:** If no SMTP credentials are provided, Patra automatically generates a temporary [Ethereal](https://ethereal.email/) test account so you can test sending emails immediately with web preview links.

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The backend runs on **http://localhost:5001**.

#### Backend API Endpoints

- `GET /api/health` — Service health and status.
- `POST /api/mail/send` — Dispatches an email.
  - **Body parameters:**
    - `to` (string or array of strings, required)
    - `subject` (string, required)
    - `text` or `html` (string, at least one required)
    - `from` (string, optional)
    - `cc` (string or array of strings, optional)
    - `bcc` (string or array of strings, optional)
- `GET /api/mail/history` — Returns sent emails and delivery logs.

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Start the local client server:
   ```bash
   npm start
   # or
   npm run dev
   ```
3. Open your browser at **http://localhost:3000**.

---

## ✨ Key Features

- **Decoupled Architecture**: Isolated `backend` and `frontend` folders with separate configs and runtimes.
- **Zero-Config Testing**: Automatically creates Ethereal test accounts when no SMTP provider is supplied, allowing safe offline and local testing.
- **Real-Time Live Preview**: Instantly renders email body and headers as you compose.
- **Outbox & History Tracking**: View delivered emails and click through to web-based preview inboxes.
- **Built-in Quick Templates**: Onboarding Welcome, Security OTP, and Weekly Digest templates.
- **Modern UI**: Dark glassmorphic aesthetic, responsive design, and health check indicator.
