# ⚙️ FocusFlow — Backend Server

The backend API server for [FocusFlow](https://github.com/NarutoEmma/focusFlow), an AI-powered mobile learning companion. Handles AI interaction, data processing, and serves as the bridge between the mobile frontend and Groq (LLaMA).

Deployed on **Render** and connected to **Firebase Firestore** for real-time data storage.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| AI Model | Groq API (LLaMA) |
| Database | Firebase Firestore |
| Deployment | Render |
| Version Control | Git, GitHub |

> 📱 Frontend repository: [focusFlow](https://github.com/NarutoEmma/focusFlow)

---

## 🚀 Running Locally

### Prerequisites

- Node.js or Python 3.10+
- A [Groq API key](https://console.groq.com/)
- Firebase service account credentials

---

### 1. Clone the repository

```bash
git clone https://github.com/NarutoEmma/FocusFlow_Server.git
cd FocusFlow_Server
```

---

### 2. Install dependencies

```bash
npm install
# or for Python:
pip install -r requirements.txt
```

---

### 3. Configure environment

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
PORT=8000
```

---

### 4. Start the server

```bash
npm start
# or:
uvicorn main:app --reload
```

---

## 🌐 Deployment

This server is deployed on [Render](https://render.com). To deploy your own instance:

1. Fork this repository
2. Create a new **Web Service** on Render
3. Connect your GitHub repo
4. Add the environment variables above in Render's dashboard
5. Deploy

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Send a message to the AI assistant |
| POST | `/reminder` | Create a study reminder |
| GET | `/progress/:userId` | Fetch user progress data |
| POST | `/assessment` | Submit an assessment result |

---

## 👤 Author

**Igwegbe Emmanuel**
- GitHub: [@NarutoEmma](https://github.com/NarutoEmma)
- LinkedIn: [emmanuel-igwegbe](https://www.linkedin.com/in/emmanuel-igwegbe-22b837347/)
- Email: captainemm45@gmail.com

---

## 📄 Licence

This project is for academic and portfolio purposes. Contact the author for any other use.
