# 🌐 MediTrack Web

![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Responsive](https://img.shields.io/badge/Design-Responsive-blueviolet)
![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)

Web client for the MediTrack medication reminder platform. Built with Vanilla JS, HTML5 and CSS3 — no frameworks, no dependencies. Consumes the [MediTrack REST API](https://github.com/LuisAlvarezMtz/meditrack-api) using fetch-based authenticated requests. Fully responsive for mobile and desktop.

---

## 🚀 Features

- **JWT Authentication** — Login with phone number and password, token stored and sent on every request
- **Role-based UI** — Separate flows for Patients and Caregivers
- **Medication Management** — View, create, update and delete medications
- **Reminder Scheduling** — Set up and manage medication reminders
- **Responsive Design** — Optimized layout for both mobile and desktop screens
- **Modular JS** — ES6 modules with a clean separation between pages, core logic and API calls

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom, no frameworks) |
| Logic | Vanilla JavaScript (ES6+, modules) |
| HTTP | Fetch API with JWT headers |
| Fonts | Google Fonts — Poppins |
| Deploy | Render (static site) |

---

## 📁 Project Structure

```
meditrack-web/
├── assets/
│   └── img/              # Icons and images (e.g. MediTrackIcon.png)
├── js/
│   ├── core/             # Shared logic: layout, auth, API client
│   └── pages/            # Page-specific scripts (index, dashboard, etc.)
├── pages/                # HTML pages (patient register, caregiver register, dashboard, etc.)
├── styles/
│   └── home/             # CSS per page/section
├── index.html            # Login page (entry point)
└── README.md
```

---

## 🔐 Authentication Flow

Login requires a phone number and password. On success, the API returns a JWT that is stored client-side and attached to every subsequent request.

```
1. Enter phone number + password on index.html
2. POST /api/auth/login  →  Receive JWT
3. Store token           →  localStorage / sessionStorage
4. All requests include  →  Authorization: Bearer <token>
```

Users choose their role at registration:

| Role | Description |
|---|---|
| 👤 Patient | Manages their own medications and reminders |
| 🩺 Caregiver | Monitors and supports assigned patients |

---

## 🖥️ Pages

| Page | Description |
|---|---|
| `index.html` | Login + role selection modal for registration |
| `pages/registro-paciente.html` | Patient registration form |
| `pages/registro-cuidador.html` | Caregiver registration form |
| `pages/dashboard.html` | Main dashboard after login |
| *(add more as needed)* | |

---

## ⚙️ Configuration

The API base URL is set in the core JS module. To point the client to a different backend, update:

```js
// js/core/api.js (or equivalent)
const API_BASE_URL = 'https://meditrackwebappback.onrender.com';
```

---

## 🏃 Running Locally

No build step required. Just open with a local server to avoid CORS issues with ES6 modules:

```bash
# Option 1: VS Code Live Server extension (recommended)
# Right-click index.html → Open with Live Server

# Option 2: Python
python -m http.server 3000

# Option 3: Node.js
npx serve .
```

Then open `http://localhost:3000` in your browser.

---

## ☁️ Deployment

The web client is deployed as a **static site on [Render](https://render.com)**.

> 🔗 Live app: `https://your-app.onrender.com` *(update with your actual URL)*

---

## 🔗 Related Repositories

- [`meditrack-api`](https://github.com/LuisAlvarezMtz/meditrack-api) — Spring Boot REST API backend

---

## 👤 Author

**Luis Angel Alvarez Martinez**
📧 [angel.alvarez20@hotmail.com](mailto:angel.alvarez20@hotmail.com)

---

## 📄 License

This project is licensed under the MIT License.
