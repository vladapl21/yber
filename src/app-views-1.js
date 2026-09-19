/* ===== YBER app: landing, onboarding, search ===== */
const ACTIONS = {};

/* ---------- Landing (Duolingo-style) ---------- */
function Landing() {
  const feature = (title, body, art, rev) => `
    <section class="feature ${rev ? 'rev' : ''}">
      <div class="feature-art">${art}</div>
      <div><h2>${title}</h2><p>${body}</p></div>
    </section>`;
  return `
  <header class="land-nav">
    <a class="logo" href="#/">${Art.logo()} YBER</a>
    <div class="lang-pill">Site language: <b>English</b> <span>▾</span></div>
  </header>
  <section class="hero">
    <div class="hero-art">${Art.mascotScene()}</div>
    <div class="hero-copy">
      <h1>The easy, fun, and safe way to get out on the water!</h1>
      <a class="btn btn-primary btn-xl" href="#/start">Get started</a>
      ${S.user
        ? `<a class="btn btn-outline btn-xl" href="#/account">Continue as ${esc(S.user.name.split(' ')[0])}</a>`
        : `<button class="btn btn-outline btn-xl" data-action="open-auth" data-mode="login">I already have an account</button>`}
    </div>
  </section>
  <div class="strip"><div class="strip-in">
    <button class="strip-arrow" data-action="strip" data-dir="-1" aria-label="Scroll left">‹</button>
    <div class="strip-track" id="strip">${S.regions.map(r => `<a class="strip-item" href="#/search?region=${r.id}"><span class="flag">${r.flag}</span>${esc(r.name)}</a>`).join('')}</div>
    <button class="strip-arrow" data-action="strip" data-dir="1" aria-label="Scroll right">›</button>
  </div></div>
  ${feature('simple. safe. seaworthy.', 'Every boat on YBER is verified, insured for charter, and reviewed by real guests. Pick a region, pick a date, and book in under two minutes, with or without a captain.', `<div class="art-frame">${Art.boat('Catamaran', 'white', 'day')}</div>`, false)}
  ${feature('earn from your slip.', 'Your boat sits idle most of the year. List it once, set your price and availability, and let vetted guests pay for the days you are not using it. You approve every trip.', `<div class="art-frame">${Art.boat('Motor yacht', 'navy', 'dusk')}</div>`, true)}
  ${feature('stay motivated.', 'Every trip, review and listing earns Sea Miles. Level up from Deckhand to Admiral, unlock badges, and keep your streak alive by getting on the water.', Art.xpBadgeScene(), false)}
  ${feature('the whole marina, one app.', 'Rentals are step one. Slips, fuel, maintenance, crew and marina services are all coming to the same account, so everything about your boat lives in one place.', Art.marinaScene(), true)}
  <section class="cta"><h2>sail anytime, anywhere.</h2><a class="btn btn-white btn-xl" href="#/start">Get started</a></section>
  <footer>
    <div><h4>Rent</h4><a href="#/start">Find a boat</a><a href="#/start">Day charters</a><a href="#/start">Overnight trips</a><a href="#/start">Captained tours</a></div>
    <div><h4>Own</h4><a href="#/host">List your boat</a><span>Owner dashboard<b class="soon">soon</b></span><span>Insurance<b class="soon">soon</b></span></div>
    <div><h4>Marina</h4><a href="#/marinas">Slips &amp; moorings</a><span>Fuel<b class="soon">soon</b></span><span>Service &amp; repairs<b class="soon">soon</b></span><span>Dry storage<b class="soon">soon</b></span></div>
    <div><h4>YBER</h4><span>About</span><span>Help</span><span>Terms</span><span>Privacy</span></div>
  </footer>
  <div class="foot-bar">© 2026 YBER. Prototype. Listings are fictional.</div>`;
}
ACTIONS['strip'] = (t) => { const s = $('#strip'); if (s) s.scrollBy({ left: 320 * Number(t.dataset.dir), behavior: 'smooth' }); };
ACTIONS['open-auth'] = (t) => openAuth(t.dataset.mode || 'login', t.dataset.next || null);
ACTIONS['auth-switch'] = (t) => openAuth(t.dataset.mode, authNext);
ACTIONS['go'] = (t) => go(t.dataset.to);
ACTIONS['logout'] = async () => { await API.logout(); setUser(null); toast('Logged out'); go('#/'); };

/* ---------- Onboarding: region ---------- */
function Onboard() {
  const sel = regionById(S.pick);
  return `
  <div class="ob">
    <div class="ob-top">
      <a class="ob-close" href="#/" aria-label="Back">✕</a>
      <div class="progress"><i style="--p:${sel ? '66%' : '33%'}"></i></div>
    </div>
    <h1>Where do you want to set sail?</h1>
    <div class="searchbox">
      <span class="ico">${Art.icon('search')}</span>
      <input id="region-input" data-role="region-input" data-ctx="ob" placeholder="Search a city, island, or marina" autocomplete="off" value="${sel ? esc(sel.name) : ''}">
      <div class="sugg" hidden></div>
    </div>
    <p class="ob-hint">Popular right now</p>
    <div class="region-grid">${S.regions.map(r => `<button class="region-card ${S.pick === r.id ? 'sel' : ''}" data-action="pick-region" data-id="${r.id}"><span class="flag">${r.flag}</span>${esc(r.name)}<small>${plural(r.count, 'boat')}</small></button>`).join('')}</div>
    <div class="ob-foot"><button class="btn btn-green" data-action="ob-continue" ${sel ? '' : 'disabled'}>Continue</button></div>
  </div>`;
}
ACTIONS['pick-region'] = (t) => pickRegion(t.dataset.id, 'ob');
ACTIONS['sugg-pick'] = (t) => pickRegion(t.dataset.id, t.dataset.ctx);
ACTIONS['ob-continue'] = () => { if (!S.pick) return; const p = $('.ob .progress i'); if (p) p.style.setProperty('--p', '100%'); S.region = S.pick; setTimeout(() => go('#/search?region=' + S.pick), 350); };

/* ---------- App nav (Turo-style) ---------- */
function AppNav(opts = {}) {
  const r = regionById(S.region);
  const { path } = parseHash();
  const pill = opts.search ? `
    <div class="searchpill">
      <div class="sp-seg"><label>Where</label><input data-role="region-input" data-ctx="nav" value="${esc(r ? r.name : '')}" placeholder="Search regions" autocomplete="off"><div class="sugg" hidden></div></div>
      <div class="sp-seg"><label>From</label><input type="date" data-role="from" value="${S.from}" min="${todayISO()}"></div>
      <div class="sp-seg"><label>Until</label><input type="date" data-role="to" value="${S.to}" min="${addDays(S.from, 1)}"></div>
      <div class="sp-seg"><label>Guests</label><select data-role="guests">${[1,2,4,6,8,10,12,15,20].map(n => `<option value="${n}" ${S.guests === n ? 'selected' : ''}>${n}${n === 20 ? '+' : ''}</option>`).join('')}</select></div>
      <button class="sp-go" data-action="refresh" aria-label="Search">${Art.icon('search')}</button>
    </div>
    <a class="sp-mobile" href="#/start">${Art.icon('search')} ${esc(r ? r.name : 'Region')} · ${fmtDate(S.from)} – ${fmtDate(S.to)}</a>` : `<div style="flex:1"></div>`;
  return `
  <nav class="app-nav"><div class="app-nav-in">
    <a class="logo" href="#/">${Art.logo()} YBER</a>
    ${pill}
    <div class="nav-links">
      <a class="nav-link hide-sm ${path === '/search' ? 'on' : ''}" href="${S.region ? '#/search?region=' + S.region : '#/start'}">Find a boat</a>
      <a class="nav-link ${path === '/host' ? 'on' : ''}" href="#/host">List your boat</a>
      <a class="nav-link hide-sm ${path === '/marinas' ? 'on' : ''}" href="#/marinas">Marinas <span class="soon">Soon</span></a>
      ${S.user
        ? `<a class="avatar-btn" href="#/account" title="${esc(S.user.name)}"><span class="avatar">${initials(S.user.name)}</span><span style="font-weight:800;font-size:13px">${esc(S.user.name.split(' ')[0])}</span></a>`
        : `<button class="btn btn-primary btn-sm" data-action="open-auth" data-mode="login">Log in</button>`}
    </div>
  </div></nav>`;
}
ACTIONS['refresh'] = () => { if ($('#results')) loadResults(); else if (S.region) go('#/search?region=' + S.region); };
function dateChange(t) {
  if (t.dataset.role === 'from') { S.from = t.value || S.from; if (S.to <= S.from) S.to = addDays(S.from, 1); }
  else { S.to = t.value || S.to; if (S.to <= S.from) S.from = addDays(S.to, -1); }
  $$('[data-role="from"]').forEach(i => { i.value = S.from; });
  $$('[data-role="to"]').forEach(i => { i.value = S.to; i.min = addDays(S.from, 1); });
  if ($('#results')) loadResults();
}

/* ---------- Search page ---------- */
function SearchPage() {
  return `${AppNav({ search: true })}
  <div class="filterbar" id="filterbar">${FilterBar()}</div>
  <div class="search-layout">
    <div class="results" id="results"><div class="empty">Finding boats…</div></div>
    <div class="mapwrap" id="mapwrap"></div>
  </div>
  <button class="btn btn-dark btn-sm map-toggle" data-action="toggle-map">${Art.icon('map')} Map</button>`;
}
ACTIONS['toggle-map'] = (t) => { const m = $('#mapwrap'); if (!m) return; m.classList.toggle('show'); t.innerHTML = m.classList.contains('show') ? 'List' : Art.icon('map') + ' Map'; if (m.classList.contains('show')) m.scrollIntoView({ behavior: 'smooth' }); };

const FILTER_DEFS = [
  { id: 'price', label: () => { const f = S.filters; if (f.minPrice == null && f.maxPrice == null) return 'Price'; return `${f.minPrice != null ? money(f.minPrice) : '$0'} – ${f.maxPrice != null ? money(f.maxPrice) : 'any'}`; }, on: () => S.filters.minPrice != null || S.filters.maxPrice != null },
  { id: 'type', label: () => S.filters.types.length ? (S.filters.types.length === 1 ? S.filters.types[0] : S.filters.types.length + ' types') : 'Boat type', on: () => S.filters.types.length > 0 },
  { id: 'length', label: () => { const f = S.filters; if (f.minLen == null && f.maxLen == null) return 'Length'; return `${f.minLen ?? 0}' – ${f.maxLen != null ? f.maxLen + "'" : 'any'}`; }, on: () => S.filters.minLen != null || S.filters.maxLen != null },
  { id: 'captain', label: () => ({ any: 'Captain', included: 'Captain included', optional: 'Captain optional', bareboat: 'Self-drive' }[S.filters.captain]), on: () => S.filters.captain !== 'any' },
  { id: 'guests', label: () => S.filters.minGuests ? `${S.filters.minGuests}+ guests` : 'Guests', on: () => !!S.filters.minGuests }
];
function FilterBar() {
  const f = S.filters;
  const active = Object.keys(f).some(k => JSON.stringify(f[k]) !== JSON.stringify(DEFAULT_FILTERS[k]));
  return `
    ${FILTER_DEFS.map(d => `<div class="pillwrap"><button class="pill ${d.on() ? 'on' : ''}" data-action="pop" data-pop="${d.id}" data-pill="${d.id}">${esc(d.label())} <span class="caret">▼</span></button></div>`).join('')}
    <button class="pill ${f.instant ? 'on' : ''}" data-action="toggle-filter" data-key="instant" data-pill="instant">${Art.icon('bolt')} Instant book</button>
    <button class="pill ${f.superhost ? 'on' : ''}" data-action="toggle-filter" data-key="superhost" data-pill="superhost">⭐ All-Star Hosts</button>
    ${active ? `<button class="pill" data-action="clear-filters">Clear</button>` : ''}
    <div class="spacer"></div>
    <div class="pillwrap"><button class="pill" data-action="pop" data-pop="sort" data-pill="sort">${Art.icon('filter')} Sort: ${esc(sortLabel())} <span class="caret">▼</span></button></div>`;
}
const SORTS = { relevance: 'Relevance', price_asc: 'Price: low to high', price_desc: 'Price: high to low', rating: 'Top rated', length: 'Longest first' };
const sortLabel = () => SORTS[S.sort] || 'Relevance';
function refreshPills() {
  const f = S.filters;
  FILTER_DEFS.forEach(d => { const b = $(`[data-pill="${d.id}"]`); if (b) { b.innerHTML = `${esc(d.label())} <span class="caret">▼</span>`; b.classList.toggle('on', d.on()); } });
  const s = $('[data-pill="sort"]'); if (s) s.innerHTML = `${Art.icon('filter')} Sort: ${esc(sortLabel())} <span class="caret">▼</span>`;
  const active = Object.keys(f).some(k => JSON.stringify(f[k]) !== JSON.stringify(DEFAULT_FILTERS[k]));
  const clear = $('[data-action="clear-filters"]');
  if (active && !clear) { const sp = $('.filterbar .spacer'); if (sp) sp.insertAdjacentHTML('beforebegin', `<button class="pill" data-action="clear-filters">Clear</button>`); }
  if (!active && clear) clear.remove();
}
function Popover(id) {
  const f = S.filters;
  const num = (key, ph) => `<input type="number" min="0" placeholder="${ph}" data-filter="${key}" value="${f[key] ?? ''}">`;
  switch (id) {
    case 'price': return `<h4>Daily price</h4><div class="row">${num('minPrice', 'Min $')}<span>–</span>${num('maxPrice', 'Max $')}</div><div class="actions"><button class="btn btn-ghost btn-sm" data-action="reset-filter" data-keys="minPrice,maxPrice">Reset</button><button class="btn btn-primary btn-sm" data-action="close-pop">Done</button></div>`;
    case 'type': return `<h4>Boat type</h4>${API.types().map(t => `<label class="chk"><input type="checkbox" data-filter="types" value="${esc(t)}" ${f.types.includes(t) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}<div class="actions"><button class="btn btn-ghost btn-sm" data-action="reset-filter" data-keys="types">Reset</button><button class="btn btn-primary btn-sm" data-action="close-pop">Done</button></div>`;
    case 'length': return `<h4>Length (feet)</h4><div class="row">${num('minLen', 'Min ft')}<span>–</span>${num('maxLen', 'Max ft')}</div><div class="actions"><button class="btn btn-ghost btn-sm" data-action="reset-filter" data-keys="minLen,maxLen">Reset</button><button class="btn btn-primary btn-sm" data-action="close-pop">Done</button></div>`;
    case 'captain': return `<h4>Captain</h4>${[['any', 'Any'], ['included', 'Captain included'], ['optional', 'Captain optional'], ['bareboat', 'Self-drive (licence needed)']].map(([v, l]) => `<label class="chk"><input type="radio" name="captain" data-filter="captain" value="${v}" ${f.captain === v ? 'checked' : ''}> ${l}</label>`).join('')}`;
    case 'guests': return `<h4>Minimum guests</h4><div class="row">${num('minGuests', 'e.g. 8')}</div><div class="actions"><button class="btn btn-ghost btn-sm" data-action="reset-filter" data-keys="minGuests">Reset</button><button class="btn btn-primary btn-sm" data-action="close-pop">Done</button></div>`;
    case 'sort': return `<h4>Sort by</h4>${Object.entries(SORTS).map(([v, l]) => `<label class="chk"><input type="radio" name="sort" data-filter="sort" value="${v}" ${S.sort === v ? 'checked' : ''}> ${l}</label>`).join('')}`;
  }
  return '';
}
ACTIONS['pop'] = (t) => {
  const wrap = t.parentElement; const open = wrap.querySelector('.pop');
  closePops();
  if (open) return;
  const id = t.dataset.pop;
  wrap.insertAdjacentHTML('beforeend', `<div class="pop ${id === 'sort' ? 'right' : ''}">${Popover(id)}</div>`);
  t.classList.add('open');
  const first = wrap.querySelector('.pop input'); if (first && first.type === 'number') first.focus();
};
ACTIONS['close-pop'] = () => closePops();
ACTIONS['reset-filter'] = (t) => { t.dataset.keys.split(',').forEach(k => { S.filters[k] = JSON.parse(JSON.stringify(DEFAULT_FILTERS[k])); }); closePops(); refreshPills(); loadResults(); };
ACTIONS['clear-filters'] = () => { S.filters = JSON.parse(JSON.stringify(DEFAULT_FILTERS)); S.sort = 'relevance'; closePops(); const fb = $('#filterbar'); if (fb) fb.innerHTML = FilterBar(); loadResults(); };
ACTIONS['toggle-filter'] = (t) => { const k = t.dataset.key; S.filters[k] = !S.filters[k]; t.classList.toggle('on', S.filters[k]); refreshPills(); loadResults(); };
let filterTimer = null;
function filterInput(t, immediate) {
  const k = t.dataset.filter;
  if (k === 'types') { const v = t.value; const i = S.filters.types.indexOf(v); if (t.checked && i < 0) S.filters.types.push(v); if (!t.checked && i >= 0) S.filters.types.splice(i, 1); }
  else if (k === 'sort') { S.sort = t.value; closePops(); }
  else if (k === 'captain') { S.filters.captain = t.value; closePops(); }
  else { S.filters[k] = t.value === '' ? null : Math.max(0, Number(t.value)); }
  refreshPills();
  clearTimeout(filterTimer);
  filterTimer = setTimeout(loadResults, immediate ? 0 : 250);
}

function applyFilters(all) {
  const f = S.filters;
  let list = all.filter(b =>
    (f.minPrice == null || b.rate >= f.minPrice) && (f.maxPrice == null || b.rate <= f.maxPrice) &&
    (f.minLen == null || b.length >= f.minLen) && (f.maxLen == null || b.length <= f.maxLen) &&
    (!f.types.length || f.types.includes(b.type)) &&
    (f.captain === 'any' || b.captain === f.captain) &&
    (!f.minGuests || b.guests >= f.minGuests) &&
    (!f.instant || b.instant) && (!f.superhost || b.superhost) &&
    (b.guests >= S.guests)
  );
  const score = (b) => (b.superhost ? 2 : 0) + (b.rating || 0) + Math.log10((b.trips || 0) + 1) + (b.instant ? .3 : 0);
  const cmp = { relevance: (a, b) => score(b) - score(a), price_asc: (a, b) => a.rate - b.rate, price_desc: (a, b) => b.rate - a.rate, rating: (a, b) => (b.rating - a.rating) || (b.trips - a.trips), length: (a, b) => b.length - a.length }[S.sort];
  return list.sort(cmp);
}
async function loadResults() {
  const region = regionById(S.region);
  S.allInRegion = await API.listings(S.region);
  S.results = applyFilters(S.allInRegion);
  const res = $('#results'); if (!res) return;
  const days = daysBetween(S.from, S.to);
  res.innerHTML = `
    <div class="results-head"><h2>${S.results.length ? `${plural(S.results.length, 'boat')} available in ${esc(region.name)}` : `No boats match in ${esc(region.name)}`}</h2><span style="font-size:13px;color:var(--wolf);font-weight:700">${fmtDate(S.from)} – ${fmtDate(S.to)} · ${plural(days, 'day')}</span></div>
    ${S.results.length ? `<div class="cards">${S.results.map(Card).join('')}</div>` : `<div class="empty"><h3>Nothing fits those filters yet.</h3>Loosen the price or length range, drop the guest count, or try another region.<br><button class="btn btn-primary btn-sm" data-action="clear-filters">Clear filters</button></div>`}`;
  const map = $('#mapwrap'); if (map) map.innerHTML = MapSVG(S.results, region);
}
function Card(b) {
  const days = daysBetween(S.from, S.to);
  const ti = S.cardTime[b.id] || 0;
  return `
  <article class="card" data-action="open-boat" data-id="${b.id}" data-pin="${b.id}">
    <div class="card-img">
      ${listingImgAt(b, ti)}
      ${b.superhost ? `<span class="badge super img-badge">⭐ All-Star Host</span>` : ''}
      <button class="heart ${S.wish.has(b.id) ? 'on' : ''}" data-action="toggle-wish" data-id="${b.id}" aria-label="Save">${S.wish.has(b.id) ? Art.icon('heart') : Art.icon('heartOutline')}</button>
      <div class="dots">${[0, 1, 2].map(i => `<i class="${i === ti ? 'on' : ''}" data-action="card-dot" data-id="${b.id}" data-i="${i}"></i>`).join('')}</div>
    </div>
    <div class="card-body">
      <div class="card-title"><span style="font-weight:800;color:var(--ink);font-size:16px;flex:1">${esc(b.name)}</span><span>${esc(b.type)} ${b.length}'</span></div>
      <div class="card-sub"><span class="star">${Art.icon('star')} ${b.rating ? b.rating.toFixed(1) : 'New'}</span><span>(${plural(b.trips || 0, 'trip')})</span><span>${captainLabel(b)}</span>${b.instant ? `<span class="badge instant">${Art.icon('bolt')} Instant</span>` : ''}</div>
      <div class="card-price"><div><b>${money(b.rate)}</b><small>/day</small></div><small>${money(estTotal(b, days))} est. total</small></div>
    </div>
  </article>`;
}
ACTIONS['open-boat'] = (t) => go('#/boat/' + t.dataset.id);
ACTIONS['card-dot'] = (t, e) => {
  e.stopPropagation();
  const b = S.results.find(x => x.id === t.dataset.id) || S.allInRegion.find(x => x.id === t.dataset.id); if (!b) return;
  S.cardTime[b.id] = Number(t.dataset.i);
  const wrap = t.closest('.card-img');
  const old = wrap.querySelector('svg, img'); if (old) old.outerHTML = listingImgAt(b, S.cardTime[b.id]);
  $$('.dots i', wrap).forEach(d => d.classList.toggle('on', d.dataset.i === t.dataset.i));
};
ACTIONS['toggle-wish'] = async (t, e) => {
  e.stopPropagation();
  const id = t.dataset.id;
  if (!S.user) { openAuth('login', () => ACTIONS['toggle-wish'](t, e)); return; }
  try {
    const res = await API.toggleWishlist(id);
    S.wish = new Set(res.wishlist); if (res.user) setUser(res.user);
    $$(`[data-action="toggle-wish"][data-id="${id}"]`).forEach(h => { h.classList.toggle('on', S.wish.has(id)); h.innerHTML = S.wish.has(id) ? Art.icon('heart') : Art.icon('heartOutline'); });
    $$(`.pin[data-pin="${id}"]`).forEach(p => p.classList.toggle('wish', S.wish.has(id)));
    toast(S.wish.has(id) ? '❤️ Saved to your boats' : 'Removed from saved');
    celebrate(res.gain);
  } catch (err) { toast(err.message, 'bad'); }
};
function MapSVG(list, region) {
  const W = 600, H = 800;
  const pins = list.map(b => {
    const [dx, dy] = b.pos || [0.5, 0.5];
    const x = Math.round(40 + dx * (W - 80)), y = Math.round(40 + dy * (H - 80));
    const label = money(b.rate); const w = 22 + label.length * 9;
    return `<g class="pin ${S.wish.has(b.id) ? 'wish' : ''}" data-action="open-boat" data-id="${b.id}" data-pin="${b.id}" transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15"/><text text-anchor="middle" y="5">${label}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${Art.mapBackground(region.id, W, H)}
    <g transform="translate(${W / 2} ${H / 2})"><circle r="6" fill="#1cb0f6" stroke="#fff" stroke-width="3"/><text x="12" y="5" font-family="Nunito,sans-serif" font-weight="800" font-size="13" fill="#4b4b4b">${esc(region.name)}</text></g>
    ${pins}
  </svg>
  <div class="map-note">Schematic map. Live map tiles (Mapbox) are next on the roadmap.</div>`;
}
