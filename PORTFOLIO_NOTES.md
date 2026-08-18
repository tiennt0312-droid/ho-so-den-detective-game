# Portfolio Notes

This file is for the repository owner and can be removed before publishing if desired.

## Suggested CV entry

**Hồ Sơ Đen — Interactive Detective Game | Personal Project**  
Built and deployed an interactive detective web game with three difficulty levels, evidence review, suspect interrogation, and server-side accusation validation. Structured case content as reusable JSON datasets and exposed dedicated APIs while keeping solution data out of the initial browser payload. Used Codex as an AI coding assistant for implementation and iteration.

**Tech:** JavaScript, React, Vinext, Vite, REST-style APIs, JSON, Cloudflare-compatible deployment

Add two links beside the project:

- **Live Demo:** your `chatgpt.site` URL
- **Source Code:** your GitHub repository URL

## GitHub publishing checklist

1. Create a new empty public repository on GitHub, e.g. `ho-so-den-detective-game`.
2. Open PowerShell inside this cleaned project folder.
3. Run:

```powershell
git init
git add .
git commit -m "Initial public release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ho-so-den-detective-game.git
git push -u origin main
```

4. In the GitHub repository page, add the live demo URL in the **About** section.
5. Pin the repository on your GitHub profile if it is one of your main portfolio projects.

## Before an interview

Be ready to explain:

- Why culprit data is not returned by the public case endpoint
- How `/api/interrogate` and `/api/accuse` work
- How a new case can be added
- What state is currently browser-only and what would need a database
- What you would refactor next if the project grew

