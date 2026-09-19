/* YBER end-to-end tests.
   Run everything:           npm test
   Browser-storage mode:     npm run test:file     (opens index.html directly, no server)
   Real backend mode:        npm run test:server   (Playwright starts server.js on port 3100
                                                    with a throwaway database; your data/db.json is untouched)
   Watch them run:           npm run test:ui       or the Testing (flask) panel in VS Code

   Every page.goto() below is relative ('#/route'). playwright.config.js sets baseURL per project,
   so the same test runs against file:///.../index.html and http://127.0.0.1:3100/ unchanged. */
const { test, expect } = require('@playwright/test');

const uniqueEmail = () => `test${Date.now()}${Math.floor(Math.random() * 1e4)}@yber.test`;

// Any uncaught error in the page fails the test that caused it.
let pageErrors = [];
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
});
test.afterEach(async () => {
  expect(pageErrors, 'uncaught errors in the page').toEqual([]);
});

async function openSignup(page) {
  await page.goto('#/');
  await page.click('text=I already have an account');
  await page.click('[data-action=auth-switch]');
  await expect(page.locator('.modal h2')).toHaveText('Create your profile');
}

async function logInAsDemo(page) {
  await page.fill('input[name=email]', 'demo@yber.app');
  await page.fill('input[name=password]', 'demo1234');
  await page.click('.modal button[type=submit]');
}

test('landing to search: region picker leads to listings', async ({ page }) => {
  await page.goto('#/');
  await page.click('text=Get started');
  await page.fill('#region-input', 'seychelles');
  await page.keyboard.press('Enter');
  await page.click('[data-action=ob-continue]');
  await expect(page.locator('.card')).toHaveCount(4);
  await expect(page.locator('.results-head h2')).toContainText('Seychelles');
});

test('registration creates an account and awards the welcome badge', async ({ page }) => {
  await openSignup(page);
  await page.fill('input[name=name]', 'Playwright Tester');
  await page.fill('input[name=email]', uniqueEmail());
  await page.fill('input[name=password]', 'testpass123');
  await page.click('.modal button[type=submit]');
  await expect(page.locator('.overlay')).toHaveCount(0);

  await page.goto('#/account');
  await expect(page.locator('.acct-hero h1')).toHaveText('Playwright Tester');
  await expect(page.locator('.xp .row b')).toContainText('100 Sea Miles');
  await expect(page.locator('.bdg:not(.locked)')).toHaveCount(1);   // "Ahoy!"
});

test('registration rejects a duplicate email', async ({ page }) => {
  await openSignup(page);
  await page.fill('input[name=name]', 'Dupe');
  await page.fill('input[name=email]', 'demo@yber.app');           // seeded account
  await page.fill('input[name=password]', 'testpass123');
  await page.click('.modal button[type=submit]');
  await expect(page.locator('#auth-err')).toContainText('already has an account');
});

test('registration rejects a short password', async ({ page }) => {
  await openSignup(page);
  await page.fill('input[name=name]', 'Shorty');
  await page.fill('input[name=email]', uniqueEmail());
  await page.fill('input[name=password]', 'abc');
  await page.click('.modal button[type=submit]');
  const valid = await page.locator('input[name=password]').evaluate((el) => el.validity.valid);
  expect(valid).toBe(false);
  await expect(page.locator('.modal h2')).toHaveText('Create your profile');   // still open, nothing submitted
});

test('login rejects a wrong password', async ({ page }) => {
  await page.goto('#/');
  await page.click('text=I already have an account');
  await page.fill('input[name=email]', 'demo@yber.app');
  await page.fill('input[name=password]', 'wrong-password');
  await page.click('.modal button[type=submit]');
  await expect(page.locator('#auth-err')).toContainText('incorrect');
});

test('publishing a listing puts it in search and on the owner account', async ({ page }) => {
  const boatName = 'Test Cat ' + Date.now().toString(36);
  await page.goto('#/host');

  // step 1 refuses an empty form
  await page.click('[data-action=host-next]');
  await expect(page.locator('#host-err')).toContainText('Give the boat a name');

  await page.fill('[data-host=name]', boatName);
  await page.click('[data-type=Catamaran]');
  await page.fill('[data-host=length]', '42');
  await page.fill('[data-host=year]', '2020');
  await page.fill('[data-host=guests]', '10');
  await page.fill('[data-host=regionName]', 'ibiza');
  await page.keyboard.press('Enter');
  await page.selectOption('#host-marina', { index: 1 });
  await page.click('[data-action=host-next]');

  await page.fill('[data-host=desc]', 'A catamaran for island hopping around Formentera, with crew and lunch included.');
  await page.click('[data-f="Snorkel gear"]');
  await page.click('[data-action=host-next]');

  await page.fill('[data-host=rate]', '900');
  await page.click('[data-v=optional]');
  await page.fill('[data-host=captainRate]', '250');
  await page.click('[data-action=host-next]');   // photos (optional)
  await page.click('[data-action=host-next]');   // review

  await expect(page.locator('.preview h3')).toHaveText(boatName);
  await page.click('[data-action=host-publish]');

  // publishing requires an account: the modal opens straight into sign-up
  await expect(page.locator('.modal h2')).toHaveText('Create your profile');
  await page.fill('input[name=name]', 'Boat Owner');
  await page.fill('input[name=email]', uniqueEmail());
  await page.fill('input[name=password]', 'testpass123');
  await page.click('.modal button[type=submit]');

  await expect(page.locator('.detail h1')).toHaveText(boatName);
  await expect(page.locator('.bookbox .price')).toContainText('$900');

  await page.goto('#/search?region=ibiza');
  await expect(page.locator('.card-title', { hasText: boatName })).toHaveCount(1);

  await page.goto('#/account');
  await page.click('[data-tab=boats]');
  await expect(page.locator('#acct-content .card')).toHaveCount(1);
  await expect(page.locator('.stat b').nth(2)).toHaveText('1');     // "Boats listed"
});

test('booking charges the right total and files the trip', async ({ page }) => {
  await page.goto('#/boat/b005');                 // Pacific Drift: $480/day, captain optional at $250/day
  await page.click('[data-action=toggle-captain]');
  // 2 days: (480 + 250) * 2 = 1460, plus 12% fee (175) = 1635
  await expect(page.locator('.line.total span').nth(1)).toHaveText('$1,635');

  await page.click('[data-action=book]');
  await logInAsDemo(page);

  await expect(page.locator('.modal h2')).toHaveText('Confirm your trip');
  await page.click('[data-action=confirm-booking]');
  await expect(page.locator('.modal h2')).toContainText('booked');
  await expect(page.locator('.xp-pill')).toContainText('250 Sea Miles');

  await page.click('[data-action=close-and-go]');
  await expect(page.locator('.trip', { hasText: 'Pacific Drift' }).first()).toBeVisible();
});

test('an end date before the start date is corrected, never priced at zero', async ({ page }) => {
  await page.goto('#/boat/b001');
  const start = await page.inputValue('[data-role=book-from]');
  await page.fill('[data-role=book-to]', start);           // end == start
  await expect(page.locator('[data-role=book-from]')).not.toHaveValue(start);
  await expect(page.locator('.line.total span').nth(1)).not.toHaveText('$0');
});

test('filters and sort narrow the result set', async ({ page }) => {
  await page.goto('#/search?region=miami');
  await expect(page.locator('.card')).toHaveCount(4);

  await page.click('[data-pop=price]');
  await page.fill('[data-filter=maxPrice]', '600');
  await expect(page.locator('.card')).toHaveCount(2);

  await page.click('[data-action=clear-filters]');
  await expect(page.locator('.card')).toHaveCount(4);

  await page.click('[data-pop=sort]');
  await page.click('input[value=price_desc]');
  await expect(page.locator('.card-price b').first()).toHaveText('$1,250');
});

test('wishlist survives a page reload', async ({ page }) => {
  await page.goto('#/search?region=miami');
  await page.click('.app-nav [data-action=open-auth]');
  await logInAsDemo(page);
  await expect(page.locator('.overlay')).toHaveCount(0);

  await page.goto('#/boat/b004');
  await page.click('.gallery .heart');
  await expect(page.locator('.gallery .heart')).toHaveClass(/\bon\b/);
  await page.reload();
  await expect(page.locator('.gallery .heart')).toHaveClass(/\bon\b/);
});

test('unknown routes show the not-found state', async ({ page }) => {
  await page.goto('#/nowhere');
  await expect(page.locator('.empty h3')).toContainText('drifted off');
});

test('no horizontal scroll at phone width on any route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const hash of ['#/', '#/start', '#/search?region=miami', '#/boat/b015', '#/host', '#/marinas']) {
    await page.goto(hash);
    await page.waitForTimeout(250);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, `${hash} is wider than the screen`).toBeLessThanOrEqual(392);
  }
});
