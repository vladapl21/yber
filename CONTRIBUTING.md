# Working on YBER together

## First time on your machine

You need [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com), the [GitHub CLI](https://cli.github.com),
and a GitHub account that has been invited to the repo (accept the invite at https://github.com/notifications first).

Install on Windows: `winget install Git.Git`, `winget install OpenJS.NodeJS.LTS`, `winget install GitHub.cli`,
then close and reopen your terminal. On a Mac: `brew install git node gh`.

```
gh auth login --hostname github.com --git-protocol https --web
gh repo clone OWNER/yber
cd yber
npm install
npx playwright install chromium
npm start
```

`gh auth login` asks one question ("Authenticate Git with your GitHub credentials?", press Enter for yes),
shows a one-time code, and opens a browser where you paste it. Replace `OWNER` with the repo owner's GitHub username.

Open http://localhost:3000. Stop the server with `Ctrl+C`.
Log in as `demo@yber.app` / `demo1234`, or create your own account; it only exists on your machine.

## Every time you work on something

```
git switch main
git pull
git switch -c your-name/short-description     # e.g. vlad/booking-calendar
```

Make changes in `src/` (never `index.html`, which is generated and gitignored). Then:

```
npm test
git add -A
git commit -m "Add availability calendar to boat page"
git push -u origin your-name/short-description
gh pr create --fill
```

That opens a pull request. Ask someone to look at it; GitHub runs the tests on it automatically
(`gh pr checks --watch` to follow along). Once the check is green and someone has approved it:

```
gh pr merge --squash --delete-branch
git switch main
git pull
```

## Rules of thumb

- One branch per feature. Keep pull requests small enough to review in ten minutes.
- Nobody pushes straight to `main`.
- Run `npm test` before pushing. GitHub runs it too, on every pull request.
- `data/` is your local database and is never committed. `npm run reset` wipes it.
- If you change a business rule (prices, Sea Miles, validation), change it in both
  `src/api.js` and `server.js`, and add a test.
- Using Claude Code? It reads `CLAUDE.md` automatically. Ask it to run `npm test` before it finishes.

## Merge conflicts

If `git pull` or a pull request reports a conflict, VS Code highlights the conflicting blocks
with **Accept Current / Accept Incoming / Accept Both** buttons. Pick the right version, save,
then `git add -A` and `git commit`. If in doubt, ask whoever wrote the other change.
