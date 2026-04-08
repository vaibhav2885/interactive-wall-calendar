# 🚀 Push to GitHub — Step by Step

## Step 1: Create a new repo on GitHub
Go to: https://github.com/new
- Name: `interactive-wall-calendar`
- Keep it Public
- Do NOT check "Add a README" (you already have one)
- Click **Create repository**

## Step 2: Open terminal in this project folder, then run:

```bash
git init
git add .
git commit -m "feat: interactive wall calendar — TakeUforward intern task"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/interactive-wall-calendar.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy on Vercel (Highly Recommended)
1. Go to https://vercel.com and sign in with GitHub
2. Click **New Project** → select your repo
3. Framework: **Vite** (auto-detected)
4. Click **Deploy**
5. Copy the live URL (e.g. https://interactive-wall-calendar.vercel.app)

## Step 4: Update README.md
Replace the placeholder demo link with your actual Vercel URL.

## Step 5: Submit in Google Form
- GitHub link: https://github.com/YOUR_USERNAME/interactive-wall-calendar
- Live demo: https://interactive-wall-calendar.vercel.app
