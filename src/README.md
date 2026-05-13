# ⚡ DropHired — AI Job Hunting OS

> The smartest way to hunt, apply, and track tech jobs. Built for data engineers, powered by AI.

![DropHired](https://img.shields.io/badge/DropHired-v1.0-6366f1?style=for-the-badge&logo=lightning&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Claude AI](https://img.shields.io/badge/Claude_AI-Haiku-b5694c?style=for-the-badge)
![Adzuna](https://img.shields.io/badge/Adzuna_API-Free-orange?style=for-the-badge)

---

## 🚀 What is DropHired?

DropHired is a fully AI-powered job application tool that:

- 🔍 **Searches real jobs** from LinkedIn, Indeed & Glassdoor (via Adzuna)
- 🎯 **AI scores your match** for every job automatically
- 📄 **Tailors your resume** with role-specific bullet points
- ✉ **Writes cover letters** specific to each company
- 🤖 **Auto-fills applications** with your profile data
- 📋 **Tracks every application** with full history
- 👤 **Finds recruiters** and drafts cold outreach emails
- 🏢 **Searches company career pages** for targeted MNC roles

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Match Scoring** | Scores all jobs at once after search — no waiting |
| **Resume Builder** | Asks smart questions, builds full ATS-optimized resume, downloads as PDF |
| **Cover Letter** | Full 3-paragraph letter tailored to each role |
| **Cold Outreach** | Cold email + follow-up + LinkedIn connection note |
| **Auto-Fill** | Fills 18 application fields with one click |
| **Application Tracker** | Saves resume, cover letter, JD, form fields for every application |
| **Interview Prep** | Role-specific interview tips |
| **50 MNC Companies** | Microsoft, Google, Tesla, SpaceX, Databricks + 45 more |
| **Country Filter** | US, UK, Canada, Australia, Germany, India, Singapore, UAE |

---

## 🛠 Setup (5 minutes)

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/drophired.git
cd drophired
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Get your free API keys

You need **2 free API keys**:

#### 🔑 Anthropic API Key (Claude AI)
1. Go to **console.anthropic.com**
2. Sign up for free
3. Go to **API Keys** → Create new key
4. Copy the key (starts with `sk-ant-api03-...`)
5. New accounts get **$5 free credits** — enough for hundreds of job analyses

#### 🔑 Adzuna API Keys (Job Search)
1. Go to **developer.adzuna.com**
2. Click **Register**
3. Select **"Personal or academic research"**
4. Copy your **App ID** and **App Key** from the dashboard
5. Free tier = **1000 searches/month**

### Step 4 — Start the app

```bash
npm start
```

### Step 5 — Enter your keys

When the app opens, you'll see the **DropHired setup screen**.
Paste your 3 keys and click **⚡ Launch DropHired**.

Keys are saved to your browser locally — you only do this once.

---

## 📸 Screenshots

> Add your own screenshots here!

---

## 🔒 Privacy & Security

- **All API keys stored locally** in your browser (localStorage)
- **Keys never leave your device** except to call the official APIs directly
- **No backend server** — everything runs in your browser
- **No account required** — just your own API keys

---

## 💰 Cost Breakdown

| Service | Free Tier | After Free |
|---|---|---|
| Anthropic (Claude) | $5 free credits | ~$2-5/month typical use |
| Adzuna Job Search | 1000 searches/month | $0 — resets monthly |
| **Total** | **$0 to start** | **~$3-5/month** |

---

## 🧰 Tech Stack

- **React 18** — Frontend
- **Claude Haiku** — AI analysis, resume writing, cover letters
- **Adzuna API** — Real job listings
- **jsPDF** — Resume PDF generation
- **localStorage** — Application tracking & settings

---

## 🤝 Contributing

Pull requests welcome! Some ideas:
- Add more job boards
- LinkedIn OAuth integration
- Chrome extension for auto-fill
- Mobile app version

---

## 📄 License

MIT — free to use, modify, and share.

---

Built with ⚡ by the DropHired community
