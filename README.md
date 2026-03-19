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
##  📂 Directory Changes

Go to a specific folder — this make your terminal to run in a specific folder.
```bash
cd <path>
```

Go to a next folder from current folder — this make your directory to go to next folder from current folder.
```bash
cd \<folder name>
```

Go to one folder back from current folder — this make your directory to go to previous folder from current folder.
```bash
cd ..
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
