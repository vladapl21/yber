/* ===== YBER data layer =====
   Every view talks to API.*; nothing else touches data.
   remote mode: server.js (node) owns the data, persisted to data/db.json
   local  mode: same rules run in-page against the embedded seed (file:// or preview) */
const YBER_RULES = {
  SERVICE_FEE: 0.12,
  XP: { signup: 100, booking: 250, listing: 300, wishlist3: 50 },
  LEVELS: [
    { xp: 0,    name: 'Deckhand' },
    { xp: 500,  name: 'First Mate' },
    { xp: 1500, name: 'Skipper' },
    { xp: 3500, name: 'Captain' },
    { xp: 7000, name: 'Admiral' }
  ],
  BADGES: [
    { id: 'welcome',    icon: '⚓', name: 'Ahoy!',         how: 'Create an account' },
    { id: 'first_trip', icon: '🧭', name: 'First Voyage',  how: 'Book your first boat' },
    { id: 'host',       icon: '🛥️', name: 'Boat Owner',    how: 'List a boat' },
    { id: 'collector',  icon: '❤️', name: 'Collector',     how: 'Save 3 boats' },
    { id: 'globetrotter', icon: '🌍', name: 'Globetrotter', how: 'Book in 3 regions' },
    { id: 'streak7',    icon: '🔥', name: 'Week at Sea',   how: '7-day streak' }
  ],
  daysBetween(a, b) { return Math.max(1, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)); },
  quote(listing, from, to, captain) {
    const days = this.daysBetween(from, to);
    const base = listing.rate * days;
    const captainFee = (listing.captain === 'optional' && captain) ? (listing.captainRate || 0) * days : 0;
    const fee = Math.round((base + captainFee) * this.SERVICE_FEE);
    return { days, base, captainFee, fee, total: base + captainFee + fee };
  },
  level(xp) {
    const L = this.LEVELS; let i = 0;
    while (i < L.length - 1 && xp >= L[i + 1].xp) i++;
    const cur = L[i], next = L[i + 1] || null;
    const pct = next ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100) : 100;
    return { index: i, name: cur.name, next, pct, toNext: next ? next.xp - xp : 0 };
  }
};

const API = (() => {
  const KEY = 'yber_local_v1', TOKEN_KEY = 'yber_token_v1';
  let mode = 'local', db = null, token = null;

  // Guarded cache: unavailable in some sandboxes, so every call is wrapped.
  const cache = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no persistence available */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const seed = () => JSON.parse(document.getElementById('yber-seed').textContent);
  const persist = () => cache.set(KEY, { v: db.version, db });
  const publicUser = (u) => { if (!u) return null; const { password, ...rest } = u; return rest; };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const genId = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayISO = () => new Date().toISOString().slice(0, 10);

  async function init() {
    const s = seed();
    const saved = cache.get(KEY);
    db = (saved && saved.v === s.version && saved.db) ? saved.db : s;
    db.bookings = db.bookings || [];
    token = cache.get(TOKEN_KEY);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 900);
      const r = await fetch('/api/health', { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) { const j = await r.json(); if (j && j.ok === 'yber') mode = 'remote'; }
    } catch (e) { /* no server: stay local */ }
    return mode;
  }

  // ---- remote helpers ----
  async function call(method, path, body) {
    const r = await fetch('/api' + path, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ('Request failed (' + r.status + ')'));
    return j;
  }

  // ---- local helpers ----
  const me = () => (token && db.users.find(u => u.id === token)) || null;
  function award(u, xp, badgeId) {
    const out = { xp: 0, badges: [] };
    if (xp) { u.xp = (u.xp || 0) + xp; out.xp = xp; }
    if (badgeId && !u.badges.includes(badgeId)) { u.badges.push(badgeId); out.badges.push(badgeId); }
    return out;
  }
  function requireUser() { const u = me(); if (!u) throw new Error('Please log in first.'); return u; }
  function touchStreak(u) {
    const t = todayISO();
    if (u.lastActive === t) return;
    if (!u.lastActive) { u.streak = u.streak || 1; u.lastActive = t; return; }
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    u.streak = (u.lastActive === y) ? (u.streak || 0) + 1 : 1;
    u.lastActive = t;
    if (u.streak >= 7 && !u.badges.includes('streak7')) u.badges.push('streak7');
  }

  const local = {
    async regions() { return db.regions.map(r => ({ ...r, count: db.listings.filter(l => l.region === r.id).length })); },
    async listings(region) { await sleep(120); return db.listings.filter(l => !region || l.region === region); },
    async listing(id) { return db.listings.find(l => l.id === id) || null; },
    async createListing(data) {
      const u = requireUser();
      const l = { ...data, id: genId('b'), ownerId: u.id, host: u.name, rating: 0, trips: 0, superhost: false, createdAt: todayISO() };
      db.listings.push(l);
      const gain = award(u, YBER_RULES.XP.listing, 'host');
      touchStreak(u); persist();
      return { listing: l, gain, user: publicUser(u) };
    },
    async signup({ name, email, password }) {
      email = String(email || '').trim().toLowerCase();
      if (!name || !email || !password) throw new Error('Name, email and password are required.');
      if (password.length < 6) throw new Error('Password needs at least 6 characters.');
      if (db.users.find(u => u.email === email)) throw new Error('That email already has an account. Log in instead.');
      const u = { id: genId('u'), name: name.trim(), email, password, xp: 0, streak: 0, badges: [], wishlist: [], createdAt: todayISO() };
      db.users.push(u);
      const gain = award(u, YBER_RULES.XP.signup, 'welcome');
      touchStreak(u);
      token = u.id; cache.set(TOKEN_KEY, token); persist();
      return { user: publicUser(u), gain };
    },
    async login({ email, password }) {
      email = String(email || '').trim().toLowerCase();
      const u = db.users.find(x => x.email === email);
      if (!u || u.password !== password) throw new Error('Email or password is incorrect.');
      touchStreak(u);
      token = u.id; cache.set(TOKEN_KEY, token); persist();
      return { user: publicUser(u) };
    },
    async logout() { token = null; cache.del(TOKEN_KEY); },
    async me() { return publicUser(me()); },
    async updateProfile({ name }) { const u = requireUser(); if (name && name.trim()) u.name = name.trim(); persist(); return publicUser(u); },
    async bookings() { const u = requireUser(); return db.bookings.filter(b => b.userId === u.id).sort((a, b) => b.from.localeCompare(a.from)); },
    async createBooking({ listingId, from, to, captain }) {
      const u = requireUser();
      const l = db.listings.find(x => x.id === listingId); if (!l) throw new Error('Boat not found.');
      if (!from || !to || to <= from) throw new Error('Choose a valid date range.');
      const q = YBER_RULES.quote(l, from, to, !!captain);
      const bk = { id: genId('bk'), userId: u.id, listingId, from, to, captain: l.captain === 'included' || !!captain, ...q, status: 'upcoming', createdAt: todayISO() };
      db.bookings.push(bk);
      l.trips = (l.trips || 0) + 1;
      const gain = award(u, YBER_RULES.XP.booking, 'first_trip');
      const regions = new Set(db.bookings.filter(b => b.userId === u.id).map(b => (db.listings.find(x => x.id === b.listingId) || {}).region));
      if (regions.size >= 3) { const g2 = award(u, 0, 'globetrotter'); gain.badges.push(...g2.badges); }
      touchStreak(u); persist();
      return { booking: bk, gain, user: publicUser(u) };
    },
    async cancelBooking(id) { const u = requireUser(); const b = db.bookings.find(x => x.id === id && x.userId === u.id); if (!b) throw new Error('Booking not found.'); b.status = 'cancelled'; persist(); return b; },
    async toggleWishlist(id) {
      const u = requireUser();
      const i = u.wishlist.indexOf(id);
      if (i >= 0) u.wishlist.splice(i, 1); else u.wishlist.push(id);
      const gain = u.wishlist.length >= 3 ? award(u, u.badges.includes('collector') ? 0 : YBER_RULES.XP.wishlist3, 'collector') : { xp: 0, badges: [] };
      persist();
      return { wishlist: u.wishlist.slice(), gain, user: publicUser(u) };
    },
    async myListings() { const u = requireUser(); return db.listings.filter(l => l.ownerId === u.id); },
    reset() { cache.del(KEY); cache.del(TOKEN_KEY); db = seed(); db.bookings = db.bookings || []; token = null; }
  };

  const remote = {
    regions: () => call('GET', '/regions'),
    listings: (region) => call('GET', '/listings' + (region ? '?region=' + encodeURIComponent(region) : '')),
    listing: (id) => call('GET', '/listings/' + encodeURIComponent(id)).catch(() => null),
    createListing: (data) => call('POST', '/listings', data),
    signup: async (d) => { const j = await call('POST', '/auth/signup', d); token = j.token; cache.set(TOKEN_KEY, token); return j; },
    login: async (d) => { const j = await call('POST', '/auth/login', d); token = j.token; cache.set(TOKEN_KEY, token); return j; },
    logout: async () => { token = null; cache.del(TOKEN_KEY); },
    me: () => token ? call('GET', '/me').catch(() => { token = null; cache.del(TOKEN_KEY); return null; }) : Promise.resolve(null),
    updateProfile: (d) => call('PATCH', '/me', d),
    bookings: () => call('GET', '/bookings'),
    createBooking: (d) => call('POST', '/bookings', d),
    cancelBooking: (id) => call('POST', '/bookings/' + encodeURIComponent(id) + '/cancel'),
    toggleWishlist: (id) => call('POST', '/wishlist/' + encodeURIComponent(id)),
    myListings: () => call('GET', '/me/listings'),
    reset: () => {}
  };

  const impl = () => (mode === 'remote' ? remote : local);
  const api = { init, get mode() { return mode; }, reviewPool: () => db.reviewPool, types: () => db.types };
  ['regions', 'listings', 'listing', 'createListing', 'signup', 'login', 'logout', 'me', 'updateProfile', 'bookings', 'createBooking', 'cancelBooking', 'toggleWishlist', 'myListings', 'reset']
    .forEach(k => { api[k] = (...a) => impl()[k](...a); });
  return api;
})();
