/* ===== YBER app: core (helpers, state, router, events) ===== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
const fmtDateLong = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
const initials = (name) => String(name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const daysBetween = (a, b) => YBER_RULES.daysBetween(a, b);

const S = {
  regions: [], user: null, wish: new Set(),
  region: null, pick: null, from: null, to: null, guests: 2,
  filters: { types: [], minPrice: null, maxPrice: null, minLen: null, maxLen: null, captain: 'any', minGuests: null, instant: false, superhost: false },
  sort: 'relevance',
  results: [], allInRegion: [],
  host: null, acctTab: 'trips', boat: null, boatOpt: { captain: false }, galleryTime: 'day',
  cardTime: {}
};
const DEFAULT_FILTERS = JSON.parse(JSON.stringify(S.filters));

const regionById = (id) => S.regions.find(r => r.id === id) || null;
const captainLabel = (b) => b.captain === 'included' ? 'Captain included' : b.captain === 'optional' ? 'Captain optional' : 'Self-drive';
const estTotal = (b, days) => YBER_RULES.quote(b, S.from, S.to, false).total;
const listingImg = (b, time) => (b.photos && b.photos.length) ? `<img src="${esc(b.photos[0])}" alt="${esc(b.name)}">` : Art.boat(b.type, b.palette, time || 'day');
const listingImgAt = (b, i) => (b.photos && b.photos.length) ? `<img src="${esc(b.photos[Math.min(i, b.photos.length - 1)])}" alt="${esc(b.name)}">` : Art.boat(b.type, b.palette, ['day', 'dusk', 'night'][i % 3]);

/* ---------- toasts ---------- */
function toast(msg, kind = '', ms = 2600) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.innerHTML = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, ms);
}
function celebrate(gain) {
  if (!gain) return;
  if (gain.xp) toast(`⭐ +${gain.xp} Sea Miles`, 'xp');
  (gain.badges || []).forEach(id => { const b = YBER_RULES.BADGES.find(x => x.id === id); if (b) setTimeout(() => toast(`${b.icon} Badge unlocked: ${b.name}`, 'xp', 3200), 500); });
}
function setUser(u) { S.user = u; S.wish = new Set(u ? u.wishlist || [] : []); }

/* ---------- modal ---------- */
function openModal(html) { $('#modal-root').innerHTML = `<div class="overlay" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true"><button class="x" data-action="close-modal" aria-label="Close">✕</button>${html}</div></div>`; setTimeout(() => { const f = $('#modal-root input'); if (f) f.focus(); }, 30); }
function closeModal() { $('#modal-root').innerHTML = ''; }

let authNext = null;
function openAuth(mode = 'login', next = null) {
  authNext = next;
  const login = mode === 'login';
  openModal(`
    <h2>${login ? 'Log in' : 'Create your profile'}</h2>
    ${login ? `<div class="demo-hint">Try the demo account: <b>demo@yber.app</b> / <b>demo1234</b></div>` : ''}
    <form data-form="auth" data-mode="${login ? 'login' : 'signup'}">
      ${login ? '' : `<div class="field"><input class="input" name="name" placeholder="Name" autocomplete="name" required></div>`}
      <div class="field"><input class="input" name="email" type="email" placeholder="Email" autocomplete="email" required></div>
      <div class="field"><input class="input" name="password" type="password" placeholder="Password" autocomplete="${login ? 'current-password' : 'new-password'}" required minlength="6"></div>
      <div class="err" id="auth-err" hidden></div>
      <button class="btn btn-primary btn-block" type="submit">${login ? 'Log in' : 'Create account'}</button>
    </form>
    <div class="sw">${login ? 'New to YBER?' : 'Already have an account?'} <button type="button" data-action="auth-switch" data-mode="${login ? 'signup' : 'login'}">${login ? 'Sign up' : 'Log in'}</button></div>`);
}
async function afterAuth(res, isSignup) {
  setUser(res.user);
  closeModal();
  toast(isSignup ? `Welcome aboard, ${esc(res.user.name.split(' ')[0])}!` : `Welcome back, ${esc(res.user.name.split(' ')[0])}`);
  if (isSignup) celebrate(res.gain);
  const next = authNext; authNext = null;
  if (typeof next === 'function') next();
  else if (next) { if (location.hash === next) render(); else location.hash = next; }
  else render();
}

/* ---------- routing ---------- */
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { path, q: Object.fromEntries(new URLSearchParams(qs || '')) };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

async function render() {
  const { path, q } = parseHash();
  closePops(); closeModal();
  const app = $('#app');
  window.scrollTo(0, 0);
  try {
    if (path === '/') { app.innerHTML = Landing(); return; }
    if (path === '/start') { app.innerHTML = Onboard(); return; }
    if (path === '/login') { app.innerHTML = Landing(); openAuth('login', '#/'); return; }
    if (path === '/signup') { app.innerHTML = Landing(); openAuth('signup', '#/start'); return; }
    if (path === '/search') {
      if (q.region && regionById(q.region)) S.region = q.region;
      if (!S.region) { location.hash = '#/start'; return; }
      app.innerHTML = SearchPage();
      await loadResults();
      return;
    }
    if (path.startsWith('/boat/')) { app.innerHTML = AppNav() + `<div class="page"><div class="empty">Loading…</div></div>`; await BoatPage(path.slice(6)); return; }
    if (path === '/host') { app.innerHTML = HostPage(); return; }
    if (path === '/account') {
      if (!S.user) { app.innerHTML = Landing(); openAuth('login', '#/account'); return; }
      app.innerHTML = AppNav() + `<div class="page"><div class="empty">Loading…</div></div>`;
      await AccountPage();
      return;
    }
    if (path === '/marinas') { app.innerHTML = MarinasPage(); return; }
    app.innerHTML = AppNav() + `<div class="page"><div class="empty"><h3>That page drifted off.</h3>Nothing lives at <code>${esc(path)}</code>.<br><a class="btn btn-primary btn-sm" href="#/">Back to shore</a></div></div>`;
  } catch (e) {
    console.error(e);
    app.innerHTML = AppNav() + `<div class="page"><div class="empty"><h3>Something went wrong.</h3>${esc(e.message || e)}<br><a class="btn btn-primary btn-sm" href="#/">Back to shore</a></div></div>`;
  }
}

/* ---------- region suggestions (shared by onboarding + nav) ---------- */
function regionMatches(qStr) {
  const q = qStr.trim().toLowerCase();
  if (!q) return S.regions.slice(0, 8);
  return S.regions.filter(r => r.name.toLowerCase().includes(q) || r.country.toLowerCase().includes(q) || (r.marinas || []).some(m => m.toLowerCase().includes(q)));
}
function renderSuggestions(input) {
  const box = input.parentElement.querySelector('.sugg');
  if (!box) return;
  const list = regionMatches(input.value);
  const ctx = input.dataset.ctx || 'ob';
  box.hidden = false;
  box.innerHTML = list.length
    ? list.map((r, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-action="sugg-pick" data-id="${r.id}" data-ctx="${ctx}"><span class="flag">${r.flag}</span><span>${esc(r.name)}<br><span style="font-size:12px;color:var(--wolf)">${esc(r.country)}</span></span><small>${plural(r.count, 'boat')}</small></button>`).join('')
    : `<div class="none">No region called "${esc(input.value)}" yet. Try Miami, Ibiza, Seychelles, Dubai, Tokyo…</div>`;
}
function hideSuggestions() { $$('.sugg').forEach(b => { b.hidden = true; }); }
function pickRegion(id, ctx) {
  const r = regionById(id); if (!r) return;
  hideSuggestions();
  if (ctx === 'nav') { S.region = id; go('#/search?region=' + id); return; }
  if (ctx === 'host') { if (S.host) { S.host.d.region = id; S.host.d.marina = ''; } const i = $('[data-host="regionName"]'); if (i) i.value = r.name; refreshHostMarinas(); return; }
  S.pick = id;
  const i = $('#region-input'); if (i) i.value = r.name;
  $$('.region-card').forEach(c => c.classList.toggle('sel', c.dataset.id === id));
  const p = $('.ob .progress i'); if (p) p.style.setProperty('--p', '66%');
  const btn = $('[data-action="ob-continue"]'); if (btn) btn.disabled = false;
}

/* ---------- popovers ---------- */
function closePops() { $$('.pop').forEach(p => p.remove()); $$('.pill.open').forEach(p => p.classList.remove('open')); }

/* ---------- event delegation ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) {
    if (!e.target.closest('.pop')) closePops();
    if (!e.target.closest('.searchbox') && !e.target.closest('.sp-seg')) hideSuggestions();
    return;
  }
  const a = t.dataset.action;
  if (a === 'close-modal') { if (e.target === t || t.classList.contains('x')) closeModal(); return; }
  if (!e.target.closest('.pop') && a !== 'pop') closePops();
  const fn = ACTIONS[a];
  if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-role="region-input"]')) { renderSuggestions(t); return; }
  if (t.matches('[data-host]')) { hostInput(t); return; }
  if (t.matches('[data-filter]')) { filterInput(t); return; }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-role="from"], [data-role="to"]')) { dateChange(t); return; }
  if (t.matches('[data-role="guests"]')) { S.guests = Number(t.value); if ($('#results')) loadResults(); return; }
  if (t.matches('[data-filter]')) { filterInput(t, true); return; }
  if (t.matches('[data-role="book-from"], [data-role="book-to"]')) { bookDateChange(t); return; }
  if (t.matches('[data-role="photo-input"]')) { hostPhotos(t); return; }
});
document.addEventListener('focusin', (e) => { if (e.target.matches('[data-role="region-input"]')) renderSuggestions(e.target); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closePops(); hideSuggestions(); }
  if (e.key === 'Enter' && e.target.matches('[data-role="region-input"]')) {
    e.preventDefault();
    const first = e.target.parentElement.querySelector('.sugg button');
    if (first) pickRegion(first.dataset.id, first.dataset.ctx);
  }
});
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.dataset.form === 'auth') {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries());
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const isSignup = f.dataset.mode === 'signup';
      const res = isSignup ? await API.signup(fd) : await API.login(fd);
      await afterAuth(res, isSignup);
    } catch (err) { const el = $('#auth-err'); if (el) { el.hidden = false; el.textContent = err.message; } btn.disabled = false; }
    return;
  }
  if (f.dataset.form === 'profile') {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries());
    try { const u = await API.updateProfile(fd); setUser(u); toast('Profile saved'); render(); } catch (err) { toast(err.message, 'bad'); }
    return;
  }
  if (f.dataset.form === 'marina-search') { e.preventDefault(); toast('Slip reservations are next on the roadmap'); return; }
});
document.addEventListener('mouseover', (e) => {
  const c = e.target.closest('[data-pin]'); if (!c) return;
  $$(`[data-pin="${c.dataset.pin}"]`).forEach(el => el.classList.add('hl'));
});
document.addEventListener('mouseout', (e) => {
  const c = e.target.closest('[data-pin]'); if (!c) return;
  $$(`[data-pin="${c.dataset.pin}"]`).forEach(el => el.classList.remove('hl'));
});
window.addEventListener('hashchange', render);

/* ---------- boot ---------- */
(async function boot() {
  const mode = await API.init();
  S.regions = await API.regions();
  setUser(await API.me());
  S.from = addDays(todayISO(), 7); S.to = addDays(todayISO(), 9);
  document.body.dataset.mode = mode;
  render();
})();
