Deploy Air apps to Oracle Cloud server.

Usage: /deploy [target]
- /deploy web — deploy web app only
- /deploy admin — deploy admin app only
- /deploy all — deploy both web and admin (default)

## Instructions

1. Check for uncommitted changes with `git status`.
2. If there are uncommitted changes (modified or untracked files):
   - Stage all changes with `git add -A`
   - Run `git diff --staged` and `git log --oneline -5` to understand the changes and commit style
   - Create a commit with a concise message summarizing the changes. End with the Co-Authored-By line.
3. Deploy both web and admin apps (unless a specific target is given):
   - **web**: `bash oracle/scripts/deploy.sh`
   - **admin**: `bash oracle/scripts/deploy-admin.sh`
   - **all** (default): Run both scripts sequentially (web first, then admin)
4. Report the deployment result to the user.

Important:
- Run from the project root directory `d:/Antigravity/Air`
- The deploy scripts will `git push` automatically before deploying
- Deploy timeout should be set to 300000ms (5 minutes) per script
- If deploy fails, show the error output and suggest checking server logs with `bash oracle/scripts/monitor.sh`
