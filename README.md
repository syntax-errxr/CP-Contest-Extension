# CP Extension (Competitive Programming Dashboard)

A unified, local browser extension dashboard for competitive programmers. Track ratings, contest schedules, solved topics, and upsolving progress across multiple platforms (**Codeforces, LeetCode, AtCoder, and CodeChef**) in one clean interface.

No online accounts, cloud logins, or complex database setups are necessary—it runs entirely on your local machine.

---

## 🚀 Features

*   **Zero-Login Setup**: Directly opens to your dashboard. All ratings and progress are bound to your local profile.
*   **Multi-Platform Stats**: Link and track your handle profiles on:
    *   **Codeforces** (Rating, Rank, Rating Change, Problems Upsolved)
    *   **LeetCode** (Rating, Rank, solved count by topic)
    *   **AtCoder** (Rating, Rank, rating change)
    *   **CodeChef** (Rating, Stars, Rank, rating change)
*   **Contest Scheduler**: Automatically pulls upcoming contests from all 4 platforms in one schedule widget.
*   **🔔 Desktop Alarms**: Click the bell icon next to any upcoming contest to schedule a system notification toast 5 minutes before it starts. Clicking the notification opens the contest link.
*   **🔄 Force Sync**: Click "Sync Now" to fetch live ratings and contest updates immediately (with a 3-minute cooldown to prevent API rate-limiting).
*   **Dark Mode**: Sleek dark theme by default, toggles to light theme seamlessly.

---

## 📂 Understanding the Folder & Files

To make setup as simple as possible, we have created **easy-to-use helper scripts** right in the root folder. You don't need to open any terminal or write any code:

*   ⚙️ **`install_dependencies.bat`** – Run this **first and only once**. It automatically downloads and installs all necessary packages, configures your database, and builds the extension.
*   🖥️ **`run_project.bat`** – Run this to start the backend server in a command window. Keep it open in the background while using the extension.
*   🌐 **`add_extension.bat`** – Run this to automatically launch Google Chrome with your CP Extension preloaded.
*   👻 **`run_invisible.vbs`** – Runs the backend server silently in the background with **no command prompt window visible** on your screen.
*   📌 **`enable_startup.bat`** – Run this **once** to make the backend server start silently in the background every time you turn on your laptop.
*   ❌ **`disable_startup.bat`** – Run this to stop the backend server from automatically starting with Windows.

---

## 📖 A-Z Setup Guide (For Zero-Knowledge Users)

Follow these exact steps to get your extension up and running in under 5 minutes:

### 1️⃣ Step 1: Install the Prerequisites
Before running the scripts, make sure you have these two things installed:
1.  **Node.js**: Download and install Node.js (Version 18 or higher) from [nodejs.org](https://nodejs.org/). Just use the default installation settings.
2.  **Google Chrome**: Make sure you have Google Chrome installed on your computer.

---

### 2️⃣ Step 2: One-Time Installation
1.  Double-click the file named **`install_dependencies.bat`**.
2.  A command window will pop up and start installing packages and setting up the local database. This might take 1–2 minutes.
3.  Once the script prints **`SUCCESS: Installation completed successfully!`**, press any key to close the window.

---

### 3️⃣ Step 3: Start the Backend & Load the Extension
1.  Double-click the file named **`run_project.bat`** to start the local backend server (or run it silently/automatically via the instructions below).
2.  Double-click the file named **`add_extension.bat`**.
3.  Google Chrome will automatically open with the **CP Extension** loaded!
4.  In Chrome, click the **Puzzle Piece Icon** (Extensions menu) in the top-right toolbar and pin **CP Extension** for easy, one-click access!

---

## 🌟 Advanced: Silent Run & Auto-Start with Windows

If you don't want to manually launch the backend server every time or keep a Command Prompt window open on your taskbar:

### 👻 Running Silently
Instead of running `run_project.bat`, double-click **`run_invisible.vbs`**. The server will start running silently in the background without opening any command window.

### 📌 Starting Automatically on Windows Boot
1.  Double-click the file named **`enable_startup.bat`**.
2.  *That's it!* This registers the server to run silently in the background every time you log into your computer.
3.  To stop the auto-start behavior, simply double-click **`disable_startup.bat`**.

> [!TIP]
> **How to stop the background server:**
> Since the silent and startup modes run without a window, you can stop the server by opening your **Task Manager** (`Ctrl + Shift + Esc`), finding the **`Node.js JavaScript Runtime`** task, and clicking **End Task**.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, Cheerio (web scraping), Axios
*   **Frontend**: React, TypeScript, Vite, Vanilla CSS
*   **Database**: SQLite (`test.db`)
*   **Browser Integration**: Chrome Extension Manifest V3 (Alarms, Storage, Notifications)
