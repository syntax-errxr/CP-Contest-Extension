# CP Extension Project Todo List

This document lists the atomic, sequential tasks required to build the **CP Extension** project from scratch. The order below is designed to ensure no overlapping dependencies, allowing you to work on one task at a time.

---

## Phase 1: Local Environment & Infrastructure Setup
- [ ] **Task 1: Initialize Git Repository and Directory Structure**
  Create the project repository with separate subdirectories: `/backend` for FastAPI, `/frontend` for the React + TypeScript Chrome extension, and `/docker` for container configurations.
- [ ] **Task 2: Configure Docker Compose for Local Development**
  Create a `docker-compose.yml` file in the root directory to spin up PostgreSQL, Redis, and a placeholder FastAPI service. Ensure health checks are configured for both databases.
- [ ] **Task 3: Backend Project Initialization**
  Initialize the FastAPI project in `/backend` using Poetry or pip. Configure dependency management (`requirements.txt` or `pyproject.toml`) with FastAPI, Uvicorn, SQLAlchemy/SQLModel, Alembic, and Redis-py.
- [ ] **Task 4: Frontend & Extension Boilerplate Setup**
  Create a React app with TypeScript in `/frontend` using Vite. Configure standard linter/formatter configurations and draft a basic `manifest.json` (Manifest V3) pointing to the build assets.

---

## Phase 2: Database Schema & Migrations
- [ ] **Task 5: Configure SQLAlchemy & Database Connection**
  Implement database connection management in `/backend/app/db/session.py` utilizing SQLAlchemy's async engine. Make sure db connection credentials are read from environment variables.
- [ ] **Task 6: Create Database Models**
  Define database models in `/backend/app/models/` for:
  - `User`: storing user id, email, Google OAuth token info.
  - `PlatformLink`: mapping user to their respective platform usernames/handles (Codeforces, LeetCode, AtCoder, CodeChef).
  - `Contest`: storing cached upcoming/past contest details (start time, duration, platform).
  - `UserContestParticipation`: storing rank, rating delta, and upsolving status for past contests.
  - `SolvedProblem`: caching problems solved by a user (platform, title, difficulty/rating, topic tags, solved timestamp).
- [ ] **Task 7: Set Up Alembic Migrations**
  Initialize Alembic in `/backend`, configure it to auto-detect models, and generate the initial migration script. Run migrations to create tables in the local PostgreSQL instance.

---

## Phase 3: Authentication & User Management (Backend)
- [ ] **Task 8: Setup Google OAuth Backend Credentials & Configuration**
  Create credentials on Google Cloud Console. Set up environment variables on the backend. Write helper utilities to request OAuth tokens and fetch Google user profiles.
- [ ] **Task 9: Implement JWT Token Utilities**
  Implement access token generation, verification, and decoding functions using python-jose or PyJWT on the backend.
- [ ] **Task 10: Create Backend Auth Endpoints**
  Create `/api/auth/login` (redirection or initialization url) and `/api/auth/callback` to handle Google auth code exchange, create/retrieve users in the database, and issue a JWT token.
- [ ] **Task 11: Implement Current User Middleware/Dependency**
  Write a FastAPI dependency `get_current_user` that validates the JWT token from the `Authorization` header and fetches the user from the database.

---

## Phase 4: Third-Party CP Platform Integrations (Scrapers & APIs)
- [ ] **Task 12: Implement Codeforces API Client**
  Write a module `/backend/app/services/codeforces.py` to:
  - Fetch upcoming and past contest lists.
  - Fetch user profile ratings and rank history.
  - Fetch solved problems with ratings and tags (e.g., Dynamic Programming, Graphs) for a specific handle.
- [ ] **Task 13: Implement LeetCode GraphQL Client**
  Write `/backend/app/services/leetcode.py` to fetch a user's solved problems categorized by topic, and current rating profile.
- [ ] **Task 14: Implement AtCoder Scraper/Client**
  Write `/backend/app/services/atcoder.py` to scrape or fetch upcoming contests, user ratings, and previous contest ranks.
- [ ] **Task 15: Implement CodeChef Scraper/Client**
  Write `/backend/app/services/codechef.py` to fetch upcoming contests, user ratings, and previous contest ranks.

---

## Phase 5: Backend API Development
- [ ] **Task 16: Implement Platform Handles Association API**
  Create POST and GET `/api/user/platforms` endpoints allowing users to link/unlink their Codeforces, LeetCode, AtCoder, and CodeChef handles.
- [ ] **Task 17: Implement Contests Retrieval API with Redis Caching**
  Create GET `/api/contests` to return a list of upcoming contests across all 4 platforms. Integrate Redis to cache contest lists for 1 hour to prevent API rate-limiting.
- [ ] **Task 18: Implement User Ratings API**
  Create GET `/api/user/ratings` to fetch the user's current rating across linked platforms. Return rating alongside platform names (ready for the dashboard's "side mai rating likhna" requirement).
- [ ] **Task 19: Implement Previous Contests & Upsolving API**
  Create GET `/api/user/prev-contests` returning the last participated contest, rank, rating delta, and upsolve completion percentage (calculated by matching problems of the contest against the user's solved problems).
- [ ] **Task 20: Implement Topics Solved Analytics API**
  Create GET `/api/user/analytics` returning aggregate data of solved problems:
  - For Codeforces: count of problems by (Topic + Rating) (e.g., DP-1500, Graphs-1700).
  - For LeetCode: count of problems by Topic (e.g., Array, DP, Trees).
- [ ] **Task 21: Implement Background Sync Scheduler**
  Add a periodic background worker (using FastAPI background tasks or an inline scheduler like APScheduler) to update user ratings, solved problems, and contest schedules in the database/Redis cache.

---

## Phase 6: Frontend Design System & Theme Setup
- [ ] **Task 22: Define Color Palette & Custom CSS Variables**
  Create `/frontend/src/index.css` defining CSS custom properties based on the Design Doc:
  - `--brand-orange`: `#FFA116`
  - `--success-green`: `#00EA64`
  - `--surface-dark`: `#282828`
  - `--cf-blue`: `#3B5998`
  - `--surface-light`: `#FFFFFF`
  - `--background-base`: `#F2F3F4`
  - `--text-secondary`: `#8C8C8C`
  - `--hard-danger`: `#EF4743`
  - Typography settings (Inter for UI, Monospace fonts for numerical data).
- [ ] **Task 23: Create Common UI Components**
  Implement common components:
  - `Card` (white background, `6px` border-radius, `1px` solid `#E0E0E0` border).
  - `Badge` (pill-shaped `12px` border-radius for topics and semantic tinted backgrounds for difficulty levels).
  - `ProgressBar` (horizontal bar with gray track and `--success-green` progress fill).

---

## Phase 7: Chrome Extension Manifest & Auth integration
- [ ] **Task 24: Configure Manifest V3 Popup & Permissions**
  Update `manifest.json` in `/frontend/public/` with necessary permissions (`storage`, `identity`). Ensure popup action is pointed to `index.html`.
- [ ] **Task 25: Implement Google Auth Flow in Extension Popup**
  Use `chrome.identity.launchWebAuthFlow` in `/frontend/src/services/auth.ts` to trigger Google Login, retrieve the auth code, send it to the backend endpoint, and store the returned JWT token in `chrome.storage.local`.
- [ ] **Task 26: Create Protected Routes / Auth Guard in React**
  Implement authentication checks in React's main app shell. If no JWT token is found in storage, display a beautiful Google Sign-In landing page.

---

## Phase 8: Core UI - Dashboard Development
- [ ] **Task 27: Build Platform Overview & Ratings List**
  Implement the main section showing linked platforms with the user's current rating right-aligned opposite the platform name ("side mai rating likhna"). Add input fields to link/edit handles.
- [ ] **Task 28: Build Upcoming Contests Widget**
  Create a scrollable list displaying schedules for "Next Contest" across Codeforces, LeetCode, AtCoder, and CodeChef. Include click handlers that open the contest page in a new browser tab.
- [ ] **Task 29: Build Previous Contest Summary Widget**
  Display last participated contest details: Rank and Rating Change (positive delta in `--success-green`, negative delta in `--hard-danger`).
- [ ] **Task 30: Build Upsolving Progress Widget**
  Implement the horizontal progress bar displaying "how much upsolve left" (completion percentage) for the previous contest.

---

## Phase 9: Core UI - Analytics Tab
- [ ] **Task 31: Build Navigation Tabs**
  Add a smooth tab system (Dashboard vs. Topics Solved Analytics) with active hover/transition states.
- [ ] **Task 32: Build Codeforces Analytics Breakdown**
  Render a grid of Codeforces solved problems categorized by Topic and Rating (e.g., Dynamic Programming: [1200: 5, 1500: 3, 1700: 1]).
- [ ] **Task 33: Build LeetCode Analytics Breakdown**
  Render a list or simple custom chart representing LeetCode solved problems sorted by Topic (e.g., Arrays: 45 solved, DP: 22 solved).

---

## Phase 10: Extension Background Scripts & Notifications
- [ ] **Task 34: Implement Service Worker (Background Script)**
  Create a background worker (`background.js`) to set up alarms for upcoming contests (e.g., 30 minutes before a contest starts).
- [ ] **Task 35: Implement System Notifications**
  Add logic in the service worker to trigger native Chrome notifications when a contest is starting soon.

---

## Phase 11: Deployment & Dockerization
- [ ] **Task 36: Write Dockerfiles**
  Create production-ready Dockerfiles for the FastAPI backend and build-stage containerization for React.
- [ ] **Task 37: Setup Production Database & Redis**
  Configure PostgreSQL and Redis instances on Railway.
- [ ] **Task 38: Deploy Services**
  Deploy the FastAPI app to Railway, set up production environment variables (Google OAuth secrets, Database URL, CORS origins), and compile/test the final chrome extension bundle.

---

## Phase 12: End-to-End Testing & Polishing
- [ ] **Task 39: Perform End-to-End Integration Testing**
  Test the entire flow: login via Google, link handles, view ratings & upcoming contests, participate in a contest, check rank/upsolve status, and view analytics.
- [ ] **Task 40: Chrome Web Store Package Preparation**
  Build the production React app, zip the output directory containing the built JS/CSS/assets and Manifest V3 config, and verify it meets Chrome Web Store upload guidelines.
