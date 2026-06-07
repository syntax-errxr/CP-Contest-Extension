# Product Requirements Document (PRD): CP Extension

## 1. Product Overview
**Name:** CP Extension  
**Target Users:** Competitive Programmers  
**Vision:** To provide a unified, automated dashboard for competitive programmers to track upcoming contests, monitor their ratings, and analyze their problem-solving progress across multiple competitive programming platforms.

## 2. Goals & Objectives
* **Centralize Information:** Eliminate the need for users to manually check multiple platforms for contest schedules and rating updates.
* **Encourage Upsolving:** Prominently display "how much upsolve left" to foster continuous learning and improvement.
* **Progress Tracking:** Offer an analytical view of topics solved and problem difficulty levels to help users identify weak areas.

## 3. Core Feature List
Based on the provided requirements, the extension will focus on two core modules:

### Feature 1: Contest Tracking
* **Supported Platforms:** Codeforces, Leetcode, At Coder, Code Chef.
* **Authentication Dependency:** The platform must be logged in to fetch user-specific data.
* **Global UI Requirement:** *Side mai rating likhna* – The user's current rating must be displayed alongside the platform name on the main dashboard.
* **Sub-features:**
    * **Next Contest:** Display timings and schedules for upcoming contests across all supported platforms.
    * **Previous Contest Dashboard:** * Display the user's **Rank** in the last contest.
        * Display the **Rating** change (positive/negative delta).
    * **Upsolving Tracker:** A specific metric/progress bar showing "how much upsolve left" for recently participated contests to encourage completing unsolved problems.

### Feature 2: Topics Solved (Cross-Platform Analytics)
* **Codeforces (CF):** Track and display solved problems categorized by **Topic** + **Problem Rating** (e.g., DP - 1500, Graphs - 1700).
* **Leetcode:** Track and display solved problems categorized by **Topic** (e.g., Arrays, Dynamic Programming, Trees).

## 4. User Stories
* *As a competitive programmer*, I want to see my current rating next to each platform's name so that I have a quick overview of my standing without opening multiple tabs.
* *As a user*, I want to see the timings for the "Next Contest" on CF, Leetcode, AtCoder, and CodeChef in one place so that I can plan my schedule.
* *As a participant*, I want to view my "Prev Contest" rank and rating change immediately after the results are published.
* *As a learner*, I want to see exactly "how much upsolve left" for my previous contests so that I don't forget to practice the problems I missed.
* *As a Codeforces user*, I want to see the topics and ratings of the problems I have solved to gauge my proficiency in specific algorithmic concepts.
* *As a Leetcode user*, I want to see a breakdown of topics I have solved to ensure I am well-prepared for technical interviews.

## 5. Success Metrics (KPIs)
* **Acquisition:** Number of Chrome Web Store installs.
* **Engagement:** * Daily Active Users (DAU) / Weekly Active Users (WAU).
    * Average number of platforms authenticated per user.
* **Feature Adoption:** * Click-through rate on "Upsolve" suggestions/links.
    * Percentage of users viewing the "Topics Solved" analytics tab.
* **Retention:** Week 1 and Week 4 retention rates of installed users.

## 6. Technical Considerations
* **API Usage:** Utilize official or community-driven APIs for Codeforces (Codeforces API), Leetcode (GraphQL), AtCoder, and CodeChef.
* **Background Scripts:** Use Chrome Extension background workers to periodically fetch upcoming contest timings and notify the user.
* **State Management:** Securely handle login states and cache rating/upsolve data locally using `chrome.storage` to reduce API calls and improve load times.
