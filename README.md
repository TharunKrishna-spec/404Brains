# 404: Clue Not Found

**A futuristic dark-themed Solveathon website for Voice-It, VIT Chennai, featuring admin and team portals for a clue-based competition.**

"404: Clue Not Found" is an immersive, real-time competitive platform designed for a multi-team clue-solving event. It features a distinct futuristic aesthetic, role-based portals for teams and administrators, and a dynamic gameplay loop that extends from clue-hunting to a strategic marketplace finale.

---

## ✨ Live Demo

Experience the live application here: **[https://404-brains-gray.vercel.app/](https://404-brains-gray.vercel.app/)**

---

## ✨ Core Features

### 🕹️ Core Gameplay Loop
- **Domain-Specific Clue Paths**: Each team is assigned a domain (e.g., HealthCare, Climate) and embarks on a unique clue-solving journey tailored to that theme.
- **Sequential Clue Unlocking**: Progress is linear. Teams must solve the current active clue to decrypt and unlock the next one, ensuring a structured and challenging progression.
- **Multi-Format Clues**: To test different skills, clues are presented in various formats, including cryptic text, images, embedded YouTube videos, and links to external interactive puzzles.
- **Answer Submission & Feedback**: The system validates answers (case-insensitively) and provides instant visual feedback—a shake animation for incorrect attempts and a celebratory confirmation for correct ones.
- **Skip Clue Mechanic**: For a strategic penalty of 20 coins, teams can choose to skip a particularly challenging clue and move on to the next.

### 💰 Dynamic Scoring & Leaderboard
- **Chronos Coin System**: A time-sensitive scoring mechanism rewards quick thinking. The faster a clue is solved after becoming active, the more coins are awarded:
  - **Solve within 5 minutes**: `30 Coins` 🏆
  - **Solve within 10 minutes**: `20 Coins`
  - **Solve after 10 minutes**: `10 Coins`
- **Live Leaderboards**: Standings are updated in real-time across the platform:
  - A public-facing **Leaderboard Page** for all to view.
  - An integrated **Live Standings Sidebar** on the team dashboard for constant competitive awareness.
  - **Advanced Ranking Logic**: Teams are ranked first by total score, then by the number of clues solved, and finally by the timestamp of their last correct submission (earliest wins).

### 🏪 Marketplace Phase
- **End-Game Twist**: Once the clue-hunting phase concludes, the event transitions into a strategic marketplace.
- **Problem Statement Purchase**: Teams use their earned coins to purchase a final, high-value problem statement from a selection unique to their domain.
- **Limited Availability**: Each problem statement has a finite number of purchase "slots," creating a tense, first-come-first-served endgame.
- **Final Score Calculation**: The cost of the purchased problem statement is added to the team's final coin total, solidifying their position on the leaderboard.

---

## 🖥️ Portals

### 🧑‍💻 Team Portal
The Team Dashboard is the central hub for participants, offering a real-time, immersive experience.
- **Dynamic Event Stages**: The dashboard intelligently adapts its UI based on the event's current status: `Stopped`, `Running`, `Ended`, or `Market`.
- **Live Progress Tracking**: During the event, a dynamic progress bar and counter show the team's completion status.
- **Clue Interface**:
    - **Active Clue Timer**: A large, prominent timer tracks the time elapsed on the current clue, directly impacting the potential score.
    - **Sequential Display**: Clues are displayed one at a time, with locked clues visually muted until they are unlocked.
    - **Rich Media**: Supports text (with a typing animation), images, and embedded videos directly within the clue card.
- **Marketplace View**: When the market opens, the dashboard transforms into a marketplace where teams can view and purchase their final problem statement.
- **Real-Time Chat**: An integrated chatbox allows teams to communicate with admins and other participants throughout the event.

### 🔑 Admin Portal
The Admin Dashboard is a comprehensive control center for managing every aspect of the event.
- **Secure Admin Login**: A separate, protected portal ensures only authorized users can manage the event.
- **Full Event Control**:
    - **State Management**: Admins can single-handedly start, end, and transition the event between the `Clue Hunt` and `Marketplace` phases.
    - **Marketplace Configuration**: Set the purchase limit for how many teams can buy a single problem statement.
- **Team Management (CRUD)**:
    - **Create**: Add new teams, generate their login credentials, and assign them to a domain.
    - **View & Filter**: See a list of all registered teams, filterable by domain.
    - **Update**: Manually edit team details, including their name, domain, and coin balance.
    - **Delete**: Securely and completely remove a team, including their authentication user and all associated progress data, via a dedicated Supabase Edge Function.
- **Content Management (CRUD)**:
    - **Clues**: Create, view, update, and delete clues for each domain.
    - **Problem Statements**: Manage the marketplace by adding, editing, or removing problem statements, along with their costs and descriptions.
- **Live Monitoring**:
    - **Domain Leaderboards**: View real-time leaderboards for each domain simultaneously.
    - **Purchase Logs**: Monitor which teams have purchased which problem statements as it happens.

---

## 🚀 Technical & UI/UX Features
The platform is built with a focus on creating an immersive, futuristic, and highly interactive user experience.

- **Futuristic UI/UX Design**:
  - A dark, cyberpunk-inspired theme with glowing text, borders, and UI elements.
  - Custom typography using `Orbitron` for headers and `Rajdhani` for body text.
- **Real-Time Architecture**:
  - Leverages **Supabase Realtime Subscriptions** to instantly synchronize data across all clients. This includes live leaderboards, the event chat, and dashboard updates, ensuring all participants see changes as they happen without needing to refresh.
- **Robust Authentication & Authorization**:
  - Utilizes Supabase Auth for secure user management.
  - Implements role-based access control (`admin`, `team`) to protect sensitive dashboards and actions.
- **Interactive Background & Effects**:
  - **Multi-Layered Animated Background**: Creates a sense of depth with a subtle parallax effect, a panning grid, flickering scanlines, and rising ember particles.
  - **Cursor Spotlight**: A soft, radial gradient follows the user's mouse, adding a layer of interactivity and focus.
  - **Click Wave**: A satisfying ripple effect emanates from the user's clicks on non-interactive areas.
- **Advanced Animations & Transitions**:
  - **Framer Motion**: Powers smooth page transitions and fluid micro-animations throughout the app.
  - **Glitch & Shake Effects**: A CSS-based glitch effect on hover for key text elements and a shake animation for providing feedback on incorrect inputs.
  - **Typing Effect**: Clue and message text is revealed with a character-by-character typing animation.
- **User-Centric Components**:
  - **Optimistic UI Updates**: Actions like submitting an answer provide immediate visual feedback, with the UI reverting only if a backend error occurs.
  - **Toast Notifications**: A non-intrusive system for displaying success, error, and info messages.
  - **Confirmation Modals**: Protects against accidental destructive actions like deleting content or skipping clues.
  - **Skeleton Loaders**: Provides a polished loading experience while data is being fetched.

---

## 🚀 Running Locally

This project is set up to run directly in the browser using modern ES modules and an import map, requiring no local build step.

1.  **Get the Code:**
    Download or clone the project files to your local machine.

2.  **Set up Supabase:**
    The project connects to a Supabase backend for authentication, database, and real-time features.
    - The necessary Supabase URL and Anon Key are already included in the `lib/supabaseClient.ts` file for the demo.
    - **Important**: To run this with your own backend, you will need to create a new Supabase project and replace the `supabaseUrl` and `supabaseAnonKey` in `lib/supabaseClient.ts` with your own project's credentials. You will also need to replicate the database schema and set up the `delete-user` Edge Function as seen in the project files.

3.  **Serve the Project:**
    Since the project uses ES modules (`import`), you need to serve the files from a local web server to avoid browser security errors (CORS).
    - The easiest way is to use a VS Code extension like **Live Server**.
    - Right-click on the `index.html` file and select "Open with Live Server".
    - This will open the application in your default browser, ready to run.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Animation**: Framer Motion
- **Routing**: React Router

---

## 💻 Developer

- **S I THARUN KRISHNA**
