/* YBER backend — zero dependencies.  Run: npm start  (or node server.js)  →  http://localhost:3000
   Data lives in data/db.json (created from the seed embedded in index.html on first boot).
   This is a prototype store: plain-text passwords, bearer token = user id. Replace before real users.

   Environment variables (all optional):
     PORT        port to listen on                      default 3000
     HOST        interface to bind                      default 127.0.0.1 (this machine only)
     YBER_DB     path to the JSON database              default data/db.json
     YBER_FRESH  set to 1 to wipe YBER_DB and re-seed on boot (the test suite uses this) */
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const DB_FILE = process.env.YBER_DB ? path.resolve(ROOT, process.env.YBER_DB) : path.join(ROOT, 'data', 'db.json');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
if (process.env.YBER_FRESH === '1') fs.rmSync(DB_FILE, { force: true });

const RULES = {
  SERVICE_FEE: 0.12,
  XP: { signup: 100, booking: 250, listing: 300, wishlist3: 50 },
  daysBetween: (a, b) => Math.max(1, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)),
  quote(l, from, to, captain) {
    const days = this.daysBetween(from, to);
    const base = l.rate * days;
    const captainFee = (l.captain === 'optional' && captain) ? (l.captainRate || 0) * days : 0;
    const fee = Math.round((base + captainFee) * this.SERVICE_FEE);
    return { days, base, captainFee, fee, total: base + captainFee + fee };
  }
};

// The seed's source of truth is src/seed.json. index.html carries a copy for the no-server mode.
function readSeed() {
  const src = path.join(ROOT, 'src', 'seed.json');
  if (fs.existsSync(src)) return { seed: JSON.parse(fs.readFileSync(src, 'utf8')), from: 'src/seed.json' };
  if (fs.existsSync(INDEX)) {
    const m = fs.readFileSync(INDEX, 'utf8').match(/<script id="yber-seed" type="application\/json">([\s\S]*?)<\/script>/);
    if (m) return { seed: JSON.parse(m[1].replace(/<\\\//g, '</')), from: 'index.html' };
  }
  console.error('No seed data found. Expected src/seed.json. Are you running this from the yber folder?');
  process.exit(1);
}
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const { seed, from } = readSeed();
    seed.bookings = seed.bookings || [];
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    console.log('Seeded ' + path.relative(ROOT, DB_FILE) + ' from ' + from);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
let db = loadDb();
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const genId = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const todayISO = () => new Date().toISOString().slice(0, 10);
const publicUser = (u) => { if (!u) return null; const { password, ...rest } = u; return rest; };
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function award(u, xp, badgeId) {
  const out = { xp: 0, badges: [] };
  if (xp) { u.xp = (u.xp || 0) + xp; out.xp = xp; }
  if (badgeId && !u.badges.includes(badgeId)) { u.badges.push(badgeId); out.badges.push(badgeId); }
  return out;
}
function touchStreak(u) {
  const t = todayISO(); if (u.lastActive === t) return;
  if (!u.lastActive) { u.streak = u.streak || 1; u.lastActive = t; return; }
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  u.streak = (u.lastActive === y) ? (u.streak || 0) + 1 : 1;
  u.lastActive = t;
  if (u.streak >= 7 && !u.badges.includes('streak7')) u.badges.push('streak7');
}
function auth(req, required = true) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const u = token && db.users.find(x => x.id === token);
  if (!u && required) throw new HttpError(401, 'Please log in first.');
  return u || null;
}

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('GET', '/api/health', () => ({ ok: 'yber', mode: 'server' }));
route('GET', '/api/regions', () => db.regions.map(r => ({ ...r, count: db.listings.filter(l => l.region === r.id).length })));
route('GET', '/api/listings', (req, p, q) => db.listings.filter(l => !q.region || l.region === q.region));
route('GET', '/api/listings/:id', (req, p) => { const l = db.listings.find(x => x.id === p.id); if (!l) throw new HttpError(404, 'Boat not found.'); return l; });
route('POST', '/api/listings', (req, p, q, body) => {
  const u = auth(req);
  const need = ['name', 'type', 'length', 'year', 'guests', 'region', 'marina', 'desc', 'rate', 'captain'];
  for (const k of need) if (body[k] === undefined || body[k] === '') throw new HttpError(400, `Missing field: ${k}`);
  if (!db.regions.find(r => r.id === body.region)) throw new HttpError(400, 'Unknown region.');
  if (!(Number(body.rate) >= 20)) throw new HttpError(400, 'Daily rate must be at least $20.');
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, 6).filter(s => typeof s === 'string' && s.startsWith('data:image/') && s.length < 4_000_000) : [];
  const l = {
    id: genId('b'), ownerId: u.id, host: u.name, region: body.region, name: String(body.name).slice(0, 60), type: body.type,
    length: Number(body.length), year: Number(body.year), guests: Number(body.guests), cabins: Number(body.cabins) || 0,
    rate: Number(body.rate), minDays: Number(body.minDays) || 1, rating: 0, trips: 0, captain: body.captain,
    captainRate: body.captain === 'optional' ? Number(body.captainRate) || 0 : 0, instant: !!body.instant, marina: String(body.marina).slice(0, 80),
    superhost: false, palette: body.palette || 'navy', pos: body.pos || [0.5, 0.5], features: (body.features || []).slice(0, 24).map(String),
    desc: String(body.desc).slice(0, 800), photos, createdAt: todayISO()
  };
  db.listings.push(l);
  const gain = award(u, RULES.XP.listing, 'host'); touchStreak(u); save();
  return { listing: l, gain, user: publicUser(u) };
});
route('POST', '/api/auth/signup', (req, p, q, body) => {
  const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim(), password = String(body.password || '');
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required.');
  if (password.length < 6) throw new HttpError(400, 'Password needs at least 6 characters.');
  if (db.users.find(u => u.email === email)) throw new HttpError(409, 'That email already has an account. Log in instead.');
  const u = { id: genId('u'), name, email, password, xp: 0, streak: 0, badges: [], wishlist: [], createdAt: todayISO() };
  db.users.push(u);
  const gain = award(u, RULES.XP.signup, 'welcome'); touchStreak(u); save();
  return { user: publicUser(u), gain, token: u.id };
});
route('POST', '/api/auth/login', (req, p, q, body) => {
  const email = String(body.email || '').trim().toLowerCase();
  const u = db.users.find(x => x.email === email);
  if (!u || u.password !== String(body.password || '')) throw new HttpError(401, 'Email or password is incorrect.');
  touchStreak(u); save();
  return { user: publicUser(u), token: u.id };
});
route('GET', '/api/me', (req) => publicUser(auth(req)));
route('PATCH', '/api/me', (req, p, q, body) => { const u = auth(req); if (body.name && String(body.name).trim()) u.name = String(body.name).trim().slice(0, 60); save(); return publicUser(u); });
route('GET', '/api/me/listings', (req) => { const u = auth(req); return db.listings.filter(l => l.ownerId === u.id); });
route('GET', '/api/bookings', (req) => { const u = auth(req); return db.bookings.filter(b => b.userId === u.id).sort((a, b) => b.from.localeCompare(a.from)); });
route('POST', '/api/bookings', (req, p, q, body) => {
  const u = auth(req);
  const l = db.listings.find(x => x.id === body.listingId); if (!l) throw new HttpError(404, 'Boat not found.');
  const { from, to } = body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || to <= from) throw new HttpError(400, 'Choose a valid date range.');
  if (from < todayISO()) throw new HttpError(400, 'Trip start must be in the future.');
  if (l.ownerId === u.id) throw new HttpError(400, 'You cannot book your own boat.');
  const quote = RULES.quote(l, from, to, !!body.captain);
  const bk = { id: genId('bk'), userId: u.id, listingId: l.id, from, to, captain: l.captain === 'included' || !!body.captain, ...quote, status: 'upcoming', createdAt: todayISO() };
  db.bookings.push(bk);
  l.trips = (l.trips || 0) + 1;
  const gain = award(u, RULES.XP.booking, 'first_trip');
  const regions = new Set(db.bookings.filter(b => b.userId === u.id).map(b => (db.listings.find(x => x.id === b.listingId) || {}).region));
  if (regions.size >= 3) gain.badges.push(...award(u, 0, 'globetrotter').badges);
  touchStreak(u); save();
  return { booking: bk, gain, user: publicUser(u) };
});
route('POST', '/api/bookings/:id/cancel', (req, p) => { const u = auth(req); const b = db.bookings.find(x => x.id === p.id && x.userId === u.id); if (!b) throw new HttpError(404, 'Booking not found.'); b.status = 'cancelled'; save(); return b; });
route('POST', '/api/wishlist/:id', (req, p) => {
  const u = auth(req);
  if (!db.listings.find(l => l.id === p.id)) throw new HttpError(404, 'Boat not found.');
  const i = u.wishlist.indexOf(p.id);
  if (i >= 0) u.wishlist.splice(i, 1); else u.wishlist.push(p.id);
  const gain = u.wishlist.length >= 3 ? award(u, u.badges.includes('collector') ? 0 : RULES.XP.wishlist3, 'collector') : { xp: 0, badges: [] };
  save();
  return { wishlist: u.wishlist.slice(), gain, user: publicUser(u) };
});

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      if (!fs.existsSync(INDEX)) return send(res, 500, 'index.html has not been built yet. Stop the server and run: npm start', 'text/plain');
      return send(res, 200, fs.readFileSync(INDEX, 'utf8'), 'text/html');
    }
    return send(res, 404, 'Not found', 'text/plain');
  }
  let raw = '';
  req.on('data', c => { raw += c; if (raw.length > 30e6) req.destroy(); });
  req.on('end', () => {
    try {
      const body = raw ? JSON.parse(raw) : {};
      for (const r of routes) {
        const m = req.method === r.method && url.pathname.match(r.re);
        if (m) return send(res, 200, r.handler(req, m.groups || {}, Object.fromEntries(url.searchParams), body));
      }
      send(res, 404, { error: 'No such endpoint' });
    } catch (e) {
      if (e instanceof SyntaxError) return send(res, 400, { error: 'Bad JSON' });
      send(res, e.status || 500, { error: e.message || 'Server error' });
      if (!e.status) console.error(e);
    }
  });
}).listen(PORT, HOST, () => console.log(`YBER running at http://localhost:${PORT}  (data: ${path.relative(ROOT, DB_FILE)})  Press Ctrl+C to stop.`))
  .on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Stop the other server (Ctrl+C in its terminal) or run with a different PORT.`);
    else console.error(e);
    process.exit(1);
  });
