// Playwright config for YBER.  `npm test` runs every test twice:
//   file   → opens index.html directly (in-browser storage, no server)
//   server → against server.js, which Playwright starts on port 3100 with a throwaway
//            database (data/test-db.json, wiped each run). Your data/db.json is never touched.
const { defineConfig } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

// pathToFileURL handles Windows drive letters and spaces in the path
// (e.g. C:\Users\Asus ROG Strix\...) — string concatenation does not.
const FILE_BASE = pathToFileURL(path.join(__dirname, 'index.html')).href;
const TEST_PORT = 3100;
const SERVER_BASE = `http://127.0.0.1:${TEST_PORT}/`;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 820 },
    actionTimeout: 10_000,
    trace: 'retain-on-failure',      // open with: npx playwright show-trace <path printed on failure>
  },
  projects: [
    { name: 'file', use: { baseURL: FILE_BASE } },
    { name: 'server', use: { baseURL: SERVER_BASE } },
  ],
  webServer: {
    command: 'node server.js',
    url: `${SERVER_BASE}api/health`,
    reuseExistingServer: false,
    timeout: 15_000,
    env: { ...process.env, PORT: String(TEST_PORT), HOST: '127.0.0.1', YBER_DB: 'data/test-db.json', YBER_FRESH: '1' },
  },
});
