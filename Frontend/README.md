<<<<<<< HEAD
# EMS Frontend (Event Management System)

## 1. Project Overview
This project is the frontend for a comprehensive Event Management System (EMS) designed for university/college environments. It acts as a role-based dashboard application that digitizes the entire lifecycle of an event—from planning and multi-tier institutional approvals to venue booking, registration, and post-event reporting. 

Built with **Next.js 14 (App Router), React 18, and Tailwind CSS**, it is heavily focused on multi-stakeholder workflows.

---

## 2. Key Features Implemented
These features are visibly mapped and constructed in the frontend codebase:
*   **Event Lifecycle Management**: UI for creating, editing, cancelling, and archiving technical, cultural, and sports events.
*   **Dynamic Event Objectives**: Event creation/editing forms enforces the collection of a minimum of 3 custom event objectives.
*   **Multi-Tier Approval Engine**: A dedicated, sequential workflow view to request, track, and approve events. The approval chain is strictly enforced as: **Club Coordinator → Dean → Director**.
*   **Venue Management & Clash Checking**: UI that queries the backend to determine if a selected venue overlaps with other events.
*   **Document & Link Handling**: Specialized forms (`EventDocuments.tsx`) for uploading posters, participant spreadsheets, and post-event reports via `multipart/form-data`.
*   **Role-Based Interface**: Layouts dynamically scope UI features based on explicit user roles (Admin, Student, Club Coordinator).

---

## 3. User Roles (Frontend Perspective)
The UI heavily branches its rendering based on the logged-in user's role:
*   **`admin`**: System-level control. Access to manage users, settings, system-wide venues, clubs, departments, and viewing email logs.
*   **`club_coordinator`**: Typically student or staff coordinators managing specific clubs/department events. Can access event creation, submit post-event reports, and manage event documents.
*   **`student`**: End-user view. Can browse public events, register for them, and view their registration history.
*   **`dean`, `director`**: Specialized approver roles in the sequential approval chain.

---

## 4. Folder Structure
*   `app/` - The Next.js 14 App Router layout. Separated cleanly into `(auth)` for public onboarding and `(dashboard)` for authenticated, role-scoped routing layouts.
*   `components/` - The presentation layer. 
    *   `events/`: Primary business logic components (e.g., `CreateEventForm.tsx`, `ApprovalChain.tsx`, `EditEventForm.tsx`).
    *   `ui/`: Base atomic components built dynamically with Radix/Tailwind (all clumped into one `index.tsx` file).
    *   `shared/`: Reusable display fragments like `StatCard.tsx` and `StatusBadge.tsx`.
*   `lib/` - Vital connective tissue. Contains `api.ts` (Axios configuration/interceptors) and `services.ts` (mapping every single API route and fallback data).
*   `store/` - Global state models leveraging `Zustand`.
*   `types/` - The source of truth for all data shapes (`index.ts` extensively maps Users, Events, Venues, Approvals, and Forms).

---

## 5. Routing Structure
The application uses segmented layouts to lock down features. Key routes:
*   **Auth**: `/login`, `/register`
*   **Admin Dashboard**: `/admin`, `/admin/users`, `/admin/settings`, `/admin/clubs`, `/admin/venues`, `/admin/email-log`
*   **Club Coordinator Dashboard**: `/club_coordinator/*`
*   **Student Dashboard**: `/student`, `/student/events`, `/student/registrations`
*   **Higher Management**: `/dean/*`, `/director/*` (Dedicated namespaces for high-level approvals).

---

## 6. State Management
State is managed entirely using **Zustand** with local storage persistence (`zustand/middleware`):
*   `authStore.ts`: Hydrates and manages `user`, `isAuthenticated`, and the *in-memory* JWT `accessToken` (token is explicitly excluded from persistence for security).
*   `eventStore.ts`: Manages contextual caching of active event lists, current individual event details under context, active visual filters (status, type, search), and pagination limits.

---

## 7. API Integration (CRITICAL)
The frontend uses Axios with a custom `api.ts` interceptor that injects Bearer tokens and handles **silent JWT refreshes on 401 errors**. 
*All API specifications are strictly mapped in `lib/services.ts`.*

**Key endpoints mapped:**
*   **Auth**: `POST /auth/login`, `POST /auth/refresh`, `GET /users/me`
*   **Events**: `GET /events/`, `POST /events/`, `POST /events/:id/submit`, `POST /events/:id/poster` (multipart file uploads)
*   **Approvals**: `GET /approvals/pending`, `POST /approvals/:eventId/approve`, `GET /approvals/:id/chain`
*   **Venues**: `GET /venues/check-clash`

🚨 **CRITICAL BEHAVIOR**: If the backend (`/api/v1`) is disconnected or reachable, the `services.ts` file gracefully catches `axios` errors and returns rich hardcoded mock data (`MOCK_EVENTS`, `MOCK_VENUES`, `MOCK_STATS`). The frontend will fully "appear" to work without a backend connected.

---

## 8. Forms & Data Handling
*   **Library Driven**: Forms are constructed entirely using `react-hook-form` paired with `zod` schema resolvers (`@hookform/resolvers/zod`).
*   **Primary Forms**: `CreateEventForm.tsx` and `EditEventForm.tsx` are massive, complex orchestrators handling metadata, dynamic venue selections, and document attachment flows. They employ dynamic arrays (like `useFieldArray` for Event Objectives) natively.
*   **Validation Approach**: Strict client-side schemas ensure dates are temporally logical, arrays meet size requirements (e.g., min 3 event objectives), and cross-field checks pass before `lib/services.ts` ever touches a submit endpoint.
*   **Terms & Conditions Verification Flow**: Final submission workflows are intercepted by a mandatory `TermsModal.tsx` verification step. The backend payload captures explicit user consent tracking metadata: `tc_accepted_at` (timestamp), `tc_accepted_by` (triggering user ID), and `tc_version` (static iteration tracker) before submitting for institutional approval.
*   **Post-Event Report Submission**: After an event reaches `completed` status, the Club Coordinator can submit a final report directly from the Event Details page or via a modal on the My Events list. The upload button is **only visible** when `event.status === 'completed'` and only to the event's Club Coordinator. Upon successful upload (via `eventService.uploadReport`), a green "Report Submitted" indicator replaces the upload UI. This flow does **not** block the coordinator from creating new events.

---

## 9. UI Components
Important domain-specific reusable components:
*   `ApprovalChain.tsx`: Visually renders the strict sequential routing (`Dean -> Director`) of an event's approval status.
*   `EventCard.tsx`: The primary summary card used across all dashboard list views.
*   `EventDocuments.tsx`: Dedicated modular fragment managing resource URLs, S3 links, and file uploads.
*   `StatusBadge.tsx`: Shared UI utility generating color-coded badges for dozens of localized system states.

---

## 10. Current Limitations / Missing Parts
*   **Over-reliance on Mock Data**: Because `lib/services.ts` swallows Axios errors to feed mock interfaces, genuine 500 Network or API errors are hidden from the developer.
*   **Stubbed Routes**: The `dean` and `director` routes structurally exist in `app/(dashboard)` but are not fully fleshed out with unique domain views—they simply inherit generic layout structures right now.
*   **Real-time Capabilities**: While the app relies on multi-tier workflows, there are no WebSockets or SSE (Server-Sent Events) integrated. It completely relies on standard GET polling or manual UI refreshes.
*   **UI Component Centralization**: Nearly all UI structural atoms (buttons, dialogs, inputs) are jammed into a single `components/ui/index.tsx` file instead of cleanly separated shadcn-style files.

---

## 11. Expected Backend Requirements
Based strictly on how the frontend is wired via `services.ts`, the backend MUST provide:
*   **Relational Database Engine**: Events belong to clubs, venues, users, and possess recursive/sequence-ordered approvals.
*   **Advanced Date Check Endpoint (`/venues/check-clash`)**: The backend must handle resolving time overlaps algorithmically.
*   **JWT Module**: An implementation yielding `access_token` and an `httpOnly` secure cookie for refreshing.
*   **File Upload Support**: The backend requires endpoints configured to handle multi-part file payloads for generic documents, images, and reports (suggesting S3 or filesystem integration).
*   **Dynamic Workflow Engine**: The backend must process the linear sequence (`pending_dean` → `pending_director` → `approved`).

---

## 12. How to Run the Project
1. Clone the repository and navigate to the frontend directory.
2. Ensure you are using the correct Node version (v18+ recommended).
3. Prepare environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

---

## 13. Future Improvements (Frontend Only)
*   **Query Management Optimization**: Strip out generic `zustand` event lists and implement `React Query` (TanStack Query) or `SWR` for intelligent request de-duplication, better loading states, and automatic cache invalidation on approvals.
*   **Decouple Mock Services**: Move the hardcoded `MOCK_EVENTS` and mock logic out of production `services.ts` blocks and into dedicated MSW (Mock Service Worker) handlers.
*   **Code-Split UI Atoms**: Refactor `components/ui/index.tsx` into individual files to prevent gigantic initial client bundle loading.
*   **Optimistic Updates**: Provide snappy visual feedback on approval interactions (`approve` / `reject`) before the backend roundtrip resolves.
=======
# 🧰 Git Commands Cheat Sheet

A complete reference of essential Git commands for everyday use.

---

## 📦 Setup & Configuration

Set your username globally — this name will appear in all your commits.
```bash
git config --global user.name "Your Name"
```

Set your email globally — must match your GitHub/GitLab account email.
```bash
git config --global user.email "you@example.com"
```

Set the default branch name to `main` for all new repositories.
```bash
git config --global init.defaultBranch main
```

List all Git configuration settings currently applied.
```bash
git config --list
```

---

## 🚀 Initialize & Clone

Create a new empty Git repository in the current folder.
```bash
git init
```

Download a remote repository to your local machine.
```bash
git clone <repository-url>
```

Clone a remote repository into a custom-named folder.
```bash
git clone <repository-url> my-folder
```

---

## 📁 Staging & Committing

Show which files are modified, staged, or untracked in your working directory.
```bash
git status
```

Stage a single file, marking it ready for the next commit.
```bash
git add <file>
```

Stage all changed and new files in the current directory at once.
```bash
git add .
```

Save staged changes as a new commit with a descriptive message.
```bash
git commit -m "your commit message"
```

Automatically stage all tracked files and commit them in a single step.
```bash
git commit -am "your commit message"
```

Edit the most recent commit's message without creating a new commit.
```bash
git commit --amend -m "corrected commit message"
```

---

## 🌿 Branching

List all branches in your local repository, highlighting the current one.
```bash
git branch
```

List all branches that exist on the remote repository.
```bash
git branch -r
```

Create a new branch without switching to it.
```bash
git branch <branch-name>
```

Switch your working directory to an existing branch.
```bash
git checkout <branch-name>
```

Create a new branch and immediately switch to it.
```bash
git checkout -b <branch-name>
```

Rename the current branch to a new name.
```bash
git branch -m <new-branch-name>
```

Delete a branch only if it has been fully merged — prevents accidental data loss.
```bash
git branch -d <branch-name>
```

Force delete a branch regardless of its merge status.
```bash
git branch -D <branch-name>
```

---

## 🔀 Merging & Rebasing

Merge another branch's changes into the current branch.
```bash
git merge <branch-name>
```

Merge while always creating a merge commit, preserving full branch history.
```bash
git merge --no-ff <branch-name>
```

Move your current branch's commits on top of another branch for a cleaner history.
```bash
git rebase <branch-name>
```

Stop an ongoing rebase and return to the state before it started.
```bash
git rebase --abort
```

Resume a rebase after you've manually resolved merge conflicts.
```bash
git rebase --continue
```

---

## 🌐 Remote Repositories

Show all remote connections along with their fetch and push URLs.
```bash
git remote -v
```

Link your local repository to a remote repository under the alias `origin`.
```bash
git remote add origin <repository-url>
```

Remove a remote connection from your local repository.
```bash
git remote remove origin
```

Rename an existing remote connection from one alias to another.
```bash
git remote rename origin upstream
```

Push a branch to the remote for the first time and set it as the tracking branch.
```bash
git push -u origin <branch-name>
```

Push committed changes to the already-tracked remote branch.
```bash
git push
```

Push every local branch to the remote repository at once.
```bash
git push --all
```

Force push — overwrites remote history with your local history ⚠️
```bash
git push --force
```

Fetch and immediately merge changes from the remote into your current branch.
```bash
git pull
```

Pull changes from a specific remote branch into your current branch.
```bash
git pull origin <branch-name>
```

Download remote changes without merging them — lets you review before applying.
```bash
git fetch origin
```

---

## ⏪ Undo & Rollback

Remove a file from the staging area while keeping your local changes intact.
```bash
git restore --staged <file>
```

Discard all unsaved changes in a file and revert it back to the last commit.
```bash
git restore <file>
```

Create a new commit that undoes the changes from a previous commit — history is preserved.
```bash
git revert <commit-hash>
```

Move HEAD back to a previous commit, keeping all changes staged and ready.
```bash
git reset --soft <commit-hash>
```

Move HEAD back to a previous commit, keeping changes in the working directory but unstaged.
```bash
git reset --mixed <commit-hash>
```

Move HEAD back to a previous commit and permanently discard all changes ⚠️
```bash
git reset --hard <commit-hash>
```

Undo only the last commit while keeping all its changes available to re-edit.
```bash
git reset --soft HEAD~1
```

Completely wipe the last commit and all its changes from your working directory ⚠️
```bash
git reset --hard HEAD~1
```

---

## 📜 Logs & History

Display the full commit history with author, date, and message.
```bash
git log
```

Show a condensed one-line summary of each commit in the history.
```bash
git log --oneline
```

Visualize all branches and their commit history as an ASCII graph.
```bash
git log --oneline --graph --all
```

Display the full details and diff introduced by a specific commit.
```bash
git show <commit-hash>
```

Track the full history of a file, even across renames.
```bash
git log --follow <file>
```

Show which person last modified each line of a file and in which commit.
```bash
git blame <file>
```

---

## 🔍 Diff

Show changes in your working directory that haven't been staged yet.
```bash
git diff
```

Show changes that are staged and ready to be committed.
```bash
git diff --staged
```

Compare the differences between two branches side by side.
```bash
git diff <branch-1>..<branch-2>
```

Show the exact changes introduced between two specific commits.
```bash
git diff <commit-hash-1> <commit-hash-2>
```

---

## 🏷️ Tags

List all tags that exist in the repository.
```bash
git tag
```

Create a lightweight tag pointing to the current commit.
```bash
git tag <tag-name>
```

Create an annotated tag with a message — recommended for releases.
```bash
git tag -a <tag-name> -m "tag message"
```

Upload a specific tag to the remote repository.
```bash
git push origin <tag-name>
```

Upload all local tags to the remote repository at once.
```bash
git push origin --tags
```

Remove a tag from your local repository only.
```bash
git tag -d <tag-name>
```

Delete a tag from the remote repository.
```bash
git push origin --delete <tag-name>
```

---

## 🗃️ Stashing

Temporarily save all uncommitted changes so you can work on something else.
```bash
git stash
```

Stash your changes with a custom label to identify it later.
```bash
git stash push -m "work in progress"
```

Show all stashed entries along with their index and description.
```bash
git stash list
```

Re-apply the most recent stash and remove it from the stash list.
```bash
git stash pop
```

Apply a specific stash by index without removing it from the list.
```bash
git stash apply stash@{2}
```

Delete a specific stash entry from the stash list.
```bash
git stash drop stash@{0}
```

Delete all stashed entries permanently.
```bash
git stash clear
```

---

## 🍒 Cherry Pick

Apply the changes from a specific commit onto your current branch.
```bash
git cherry-pick <commit-hash>
```

Apply changes from a commit to your working directory without auto-committing.
```bash
git cherry-pick --no-commit <commit-hash>
```

---

## 🧹 Cleanup

Preview which untracked files would be deleted — safe to run first.
```bash
git clean -n
```

Permanently delete all untracked files from the working directory.
```bash
git clean -f
```

Delete all untracked files and untracked directories at once.
```bash
git clean -fd
```

---

## 🔁 Aliases (Shortcuts)

Create a shortcut `git st` that runs `git status`.
```bash
git config --global alias.st status
```

Create a shortcut `git lg` for a pretty graphical log view.
```bash
git config --global alias.lg "log --oneline --graph --all"
```

Create a shortcut `git undo` to safely undo the last commit.
```bash
git config --global alias.undo "reset --soft HEAD~1"
```

---

## 📌 Quick Reference Table

| Task | Command |
|------|---------|
| Initialize repo | `git init` |
| Clone repo | `git clone <url>` |
| Stage all | `git add .` |
| Commit | `git commit -m "msg"` |
| Push | `git push` |
| Pull | `git pull` |
| New branch | `git checkout -b <n>` |
| Merge branch | `git merge <n>` |
| View log | `git log --oneline` |
| Undo last commit | `git reset --soft HEAD~1` |
| Revert commit | `git revert <hash>` |
| Stash changes | `git stash` |
| View status | `git status` |
| View diff | `git diff` |

---

> ⚠️ **Warning:** Commands marked with ⚠️ are destructive and cannot be undone. Use with caution.

> 💡 **Tip:** Run `git help <command>` to see full documentation for any command.
>>>>>>> 4c4dbd6d3a9683d071351ee4c19ba66e8a4d9dfa
