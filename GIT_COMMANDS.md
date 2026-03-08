# 📦 Git Commands for Deployment

## Quick Reference - Push to GitHub

```bash
# Check current status
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: add deployment configuration files"

# Push to GitHub (main branch)
git push origin main
```

---

## 🚀 Complete Deployment Workflow

### Step 1: Prepare Repository

```bash
# Check git status
git status

# Review changes
git diff

# Add all deployment files
git add Procfile railway.json runtime.txt .dockerignore DEPLOYMENT_GUIDE.md

# Or add all changes
git add .

# Check what will be committed
git status
```

### Step 2: Commit Changes

```bash
# Commit with descriptive message
git commit -m "feat: add production deployment configuration

- Add Railway configuration (railway.json, Procfile)
- Add runtime.txt for Python version
- Add .dockerignore for cleaner builds
- Add comprehensive deployment guide
- Update CORS for production
- Ready for Railway + Vercel deployment"

# Or shorter message
git commit -m "feat: add deployment configs for Railway and Vercel"
```

### Step 3: Push to GitHub

```bash
# Push to main branch
git push origin main

# If you get "Permission denied" error, set up GitHub authentication:
# Option 1: Use GitHub Desktop
# Option 2: Use Personal Access Token
# Option 3: Use SSH key
```

---

## 🔐 First Time Setup (if repo not connected to GitHub)

### Create GitHub Repository

```bash
# 1. Go to github.com and create new repository
# 2. Name it: "Feedback-System" or "ai-feedback-system"
# 3. Don't initialize with README (your repo already has one)

# 3. Connect local repo to GitHub
git remote add origin https://github.com/YOUR_USERNAME/Feedback-System.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main
```

---

## 🌿 Using Branches (Recommended for Features)

### Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/deployment-setup

# Make your changes...

# Commit changes
git add .
git commit -m "feat: add deployment configuration"

# Push branch to GitHub
git push origin feature/deployment-setup

# On GitHub: Create Pull Request → Merge to main
```

### After Merge

```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch (cleanup)
git branch -d feature/deployment-setup
```

---

## 🔄 Update Existing Deployment

### When You Make Code Changes

```bash
# 1. Make your changes (e.g., fix bugs, add features)

# 2. Stage changes
git add .

# 3. Commit with descriptive message
git commit -m "fix: correct sentiment counting in overview tab"

# 4. Push to GitHub (triggers auto-deploy on Railway & Vercel)
git push origin main

# Railway and Vercel will automatically deploy!
```

---

## 📊 Check Deployment Status

### After Pushing

1. **Railway**
   - Go to: https://railway.app
   - Your project → "Deployments" tab
   - Watch build logs in real-time

2. **Vercel**
   - Go to: https://vercel.com
   - Your project → "Deployments" tab
   - See build progress and logs

---

## 🐛 Troubleshooting Git Issues

### "Permission denied" Error

```bash
# Option 1: Use GitHub CLI
gh auth login

# Option 2: Use Personal Access Token
# 1. GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate new token (classic) with 'repo' scope
# 3. Use token as password when pushing

# Option 3: Use SSH
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add ~/.ssh/id_ed25519.pub to GitHub → Settings → SSH Keys
git remote set-url origin git@github.com:YOUR_USERNAME/Feedback-System.git
```

### Already Committed .env by Mistake

```bash
# Remove .env from git (but keep local file)
git rm --cached .env

# Add to .gitignore if not already there
echo ".env" >> .gitignore

# Commit the removal
git commit -m "chore: remove .env from version control"

# Push changes
git push origin main

# IMPORTANT: Go to Railway/Vercel and set environment variables manually!
```

### Merge Conflicts (if working with team)

```bash
# Pull latest changes
git pull origin main

# If conflicts occur, resolve them manually in VS Code
# VS Code will highlight conflicts with <<<<<<< and >>>>>>>

# After resolving:
git add .
git commit -m "chore: resolve merge conflicts"
git push origin main
```

### Undo Last Commit (before pushing)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Remove changes completely
git reset --hard HEAD~1
```

### View Commit History

```bash
# See all commits
git log

# Pretty format
git log --oneline --graph --all

# Last 10 commits
git log -10
```

---

## 📋 Pre-Push Checklist

Before pushing to production:

```bash
# 1. Run tests (if you have any)
pytest

# 2. Check for sensitive data
git diff | grep -i "password\|secret\|key"

# 3. Verify .gitignore includes:
# .env
# __pycache__/
# node_modules/
# .next/

# 4. Check commit message is descriptive
git log -1

# 5. Push!
git push origin main
```

---

## 🎯 Common Git Commands Reference

```bash
# Status
git status                    # Check what's changed
git diff                      # See line-by-line changes
git log                       # View commit history

# Staging
git add .                     # Add all changes
git add file.py               # Add specific file
git add folder/               # Add entire folder

# Committing
git commit -m "message"       # Commit with message
git commit --amend            # Edit last commit message

# Pushing
git push origin main          # Push to main branch
git push origin feature-name  # Push to feature branch
git push -u origin main       # First time push (set upstream)

# Pulling
git pull origin main          # Pull latest changes
git fetch origin              # Check for updates without merging

# Branches
git branch                    # List branches
git checkout -b branch-name   # Create and switch to branch
git checkout main             # Switch to main branch
git branch -d branch-name     # Delete local branch

# Remotes
git remote -v                 # Show remote URLs
git remote add origin URL     # Add remote repository
git remote set-url origin URL # Change remote URL
```

---

## ✅ Ready to Deploy?

1. **Commit all changes**: `git add . && git commit -m "feat: production ready"`
2. **Push to GitHub**: `git push origin main`
3. **Set up Railway**: Connect GitHub repo → Deploy
4. **Set up Vercel**: Connect GitHub repo → Deploy frontend folder
5. **Configure environment variables** on both platforms
6. **Test**: Visit your deployed URLs!

**Your app will auto-deploy on every push to `main`** 🎉
