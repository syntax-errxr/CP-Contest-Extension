# CP Extension (Competitive Programming Dashboard)

A unified browser extension dashboard for competitive programmers to track ratings, contest schedules, and upsolving progress across multiple platforms (Codeforces, LeetCode, AtCoder, and CodeChef).

This project features a lightweight **TypeScript Express** backend connected to an **SQLite** database via **Prisma**, and a modern **React + Vite** frontend compiled as a Manifest V3 Chrome Extension. No accounts or logins are necessary; it runs locally and seamlessly.

---

## 🚀 Features

*   **Zero-Login Setup**: Directly opens to your dashboard. All actions are handled under a single local user profile.
*   **Multi-Platform Stats**: Link and track your handle profiles on:
    *   Codeforces (Rating, Rank, Rating Change)
    *   LeetCode (Rating, Rank)
    *   AtCoder (Rating, Rank)
    *   CodeChef (Rating, Stars, Rank)
*   **Contest Scheduler**: Automatically pulls upcoming contests from all platforms.
*   **🔔 Desktop Alarms**: Click the bell next to any upcoming contest to schedule a Windows notification sound/toast 5 minutes before it starts. Clicking the notification opens the contest page.
*   **🔄 Force Sync**: Click "Sync Now" to fetch live ratings and contest updates immediately (with a 3-minute cooldown to prevent API rate-limiting).
*   **Dark Mode**: Sleek dark theme by default, toggles to light theme seamlessly.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, Cheerio (web scraping), Axios
*   **Frontend**: React, TypeScript, Vite, Vanilla CSS
*   **Database**: SQLite (`test.db`)
*   **Browser Integration**: Chrome Extension Manifest V3 (Alarms, Storage, Notifications)

---

## 📖 Step-by-Step Setup Guide (For 0-Knowledge Users)

Follow these exact steps to get the project running on your computer.

### Step 1: Install Prerequisites

Before starting, you must install:
1.  **Node.js**: Download and install Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/). This lets you run the servers.
2.  **Google Chrome**: (Or any Chromium-based browser like Edge or Brave) to run the extension.

---

### Step 2: Set Up the Backend Server

The backend acts as the engine that scrapes profiles and syncs contest data.

1.  Open your command line / terminal (e.g., Command Prompt, PowerShell, or Git Bash).
2.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
3.  **Install dependencies**:
    *   *Note: In Node.js, dependencies are installed using `npm install` instead of Python's `pip install -r requirements.txt`.*
    ```bash
    npm install
    ```
4.  **Create database configurations**:
    Inside the `backend` folder, verify that a file named `.env` exists. If not, create one and paste this line:
    ```env
    DATABASE_URL="file:./test.db"
    PORT=8000
    ```
5.  **Initialize the Database**:
    Setup the SQLite database and create the tables:
    ```bash
    npx prisma db push
    ```
6.  **Start the Backend server**:
    ```bash
    npm run dev
    ```
    *You should see a message saying:* `CP EXTENSION EXPRESS BACKEND LIVE ON PORT 8000`. Keep this terminal window open.

---

### Step 3: Set Up the Frontend (Chrome Extension)

Compile the extension code so Google Chrome can load it.

1.  Open a **new** terminal window (so the backend server remains running in the background).
2.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Build the extension**:
    Compile the React code into static files:
    ```bash
    npm run build
    ```
    This creates a new folder called **`dist`** inside the `frontend` directory.

---

### Step 4: Install the Extension in Google Chrome

1.  Open Google Chrome.
2.  Go to the extensions management page by entering this in the URL bar:
    ```text
    chrome://extensions/
    ```
3.  In the top-right corner, toggle the **Developer Mode** switch to **ON**.
4.  In the top-left corner, click the **Load unpacked** button.
5.  Navigate to your project folder, select the `frontend/dist` directory, and click **Select Folder** (or Open).
6.  Click the extension puzzle piece icon in Chrome toolbar and pin **CP Extension** for easy access!

---

## 🎯 How to Use the Extension

1.  **Open CP Extension**: Click the extension icon. It opens directly to your dashboard.
2.  **Link Profiles**: Type your competitive programming handle/username next to each platform in the "Linked Profiles" section and click **Link**. It will fetch your statistics instantly.
3.  **Sync Data**: Click the **🔄 Sync Now** button next to "Linked Profiles" to manually fetch updated ratings. It has a 3-minute cooldown timer to keep you safe from platform API blocks.
4.  **Toggle Alarms**: Find a contest in "Upcoming Contests" and click the **🔕 Muted Bell** icon. It will change to a **🔔 Active Bell**. 5 minutes before the contest starts, a desktop notification toast will play a sound. Click the toast to open the contest page!
