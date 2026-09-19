/* ===== YBER app: boat detail, host flow, account, marinas ===== */

/* ---------- Boat detail ---------- */
function reviewsFor(b) {
  const pool = API.reviewPool() || [];
  if (!pool.length || !b.trips) return [];
  const h = Art.hash(b.id);
  const n = Math.min(3, b.trips);
  const out = [];
  for (let i = 0; i < n; i++) { const r = pool[(h + i * 7) % pool.length]; out.push({ ...r, when: ['2 weeks ago', 'Last month', '3 months ago'][i] }); }
  return out;
}
async function BoatPage(id) {
  const b = await API.listing(id);
  const app = $('#app');
  if (!b) { app.innerHTML = AppNav() + `<div class="page"><div class="empty"><h3>That boat has left the marina.</h3>It may have been unlisted.<br><a class="btn btn-primary btn-sm" href="${S.region ? '#/search?region=' + S.region : '#/start'}">Browse boats</a></div></div>`; return; }
  S.boat = b; S.boatOpt = { captain: false };
  if (!S.region) S.region = b.region;
  const r = regionById(b.region);
  const reviews = reviewsFor(b);
  const isMine = S.user && b.ownerId === S.user.id;
  app.innerHTML = `${AppNav()}
  <div class="page">
    <div class="crumbs"><a href="#/">YBER</a> › <a href="#/search?region=${b.region}">${esc(r ? r.name : b.region)}</a> › <span>${esc(b.name)}</span></div>
    <div class="gallery" id="gallery">
      <div data-action="gallery" data-i="0">${listingImgAt(b, 0)}</div>
      <div data-action="gallery" data-i="1">${listingImgAt(b, 1)}</div>
      <div data-action="gallery" data-i="2">${listingImgAt(b, 2)}</div>
      <button class="heart ${S.wish.has(b.id) ? 'on' : ''}" data-action="toggle-wish" data-id="${b.id}" aria-label="Save">${S.wish.has(b.id) ? Art.icon('heart') : Art.icon('heartOutline')}</button>
    </div>
    <div class="detail">
      <div>
        <h1>${esc(b.name)}</h1>
        <div class="sub">
          <span class="star">${Art.icon('star')} ${b.rating ? b.rating.toFixed(1) : 'New listing'}</span><span>(${plural(b.trips || 0, 'trip')})</span>
          ${b.superhost ? `<span class="badge super">⭐ All-Star Host</span>` : ''}${b.instant ? `<span class="badge instant">${Art.icon('bolt')} Instant book</span>` : ''}
          <span>${esc(b.marina)}</span>
        </div>
        <div class="spec-row">
          <span class="spec">${Art.icon('ruler')} ${b.length} ft ${esc(b.type)}</span>
          <span class="spec">${Art.icon('users')} Up to ${b.guests} guests</span>
          <span class="spec">${Art.icon('bed')} ${b.cabins ? plural(b.cabins, 'cabin') : 'Day boat'}</span>
          <span class="spec">${Art.icon('calendar')} ${b.year}</span>
          <span class="spec">${Art.icon('wheel')} ${captainLabel(b)}</span>
        </div>
        <div class="host">
          <span class="avatar">${initials(b.host)}</span>
          <div><b>Hosted by ${esc(b.host)}</b><div class="meta">${b.superhost ? 'All-Star Host · ' : ''}Responds within an hour · ${plural(b.trips || 0, 'completed trip')}</div></div>
        </div>
        <div class="section"><h3>About this boat</h3><p>${esc(b.desc)}</p></div>
        <div class="section"><h3>What's on board</h3><ul class="features">${(b.features || []).map(f => `<li>${Art.icon('check')} ${esc(f)}</li>`).join('')}</ul></div>
        <div class="section"><h3>Captain</h3><p>${b.captain === 'included' ? 'A licensed captain skippers every trip and is included in the daily rate. Fuel for a standard itinerary is included.' : b.captain === 'optional' ? `Rent bareboat with a valid boating licence, or add ${esc(b.host)}'s captain for ${money(b.captainRate)} per day. Fuel is charged on return.` : 'Self-drive only. A valid boating licence and a briefing at the dock are required. Fuel is charged on return.'}</p></div>
        <div class="section"><h3>${reviews.length ? plural(reviews.length, 'review') : 'No reviews yet'}</h3>
          ${reviews.map(rv => `<div class="review"><div class="review-h"><span class="avatar sm">${initials(rv.name)}</span>${esc(rv.name)} <span class="star">${'★'.repeat(rv.stars)}</span><span class="when">${rv.when}</span></div><p>${esc(rv.text)}</p></div>`).join('') || `<p>Be the first to take ${esc(b.name)} out.</p>`}
        </div>
        <div class="section"><h3>Cancellation</h3><p>Free cancellation up to 48 hours before departure. Weather cancellations called by the captain are refunded in full.</p></div>
      </div>
      <aside class="bookbox" id="bookbox">${BookBox(b)}</aside>
    </div>
  </div>`;
}
function BookBox(b) {
  const q = YBER_RULES.quote(b, S.from, S.to, S.boatOpt.captain);
  const isMine = S.user && b.ownerId === S.user.id;
  return `
    <div class="price">${money(b.rate)} <small>/ day</small></div>
    <div class="datebox">
      <label>Trip start<input type="date" data-role="book-from" value="${S.from}" min="${todayISO()}"></label>
      <label>Trip end<input type="date" data-role="book-to" value="${S.to}" min="${addDays(S.from, 1)}"></label>
    </div>
    ${b.captain === 'optional' ? `<label class="opt ${S.boatOpt.captain ? 'on' : ''}"><span><b>Add a captain</b><small>${money(b.captainRate)} per day, no licence needed</small></span><input type="checkbox" data-action="toggle-captain" ${S.boatOpt.captain ? 'checked' : ''}></label>` : ''}
    <div class="line"><span>${money(b.rate)} × ${plural(q.days, 'day')}</span><span>${money(q.base)}</span></div>
    ${q.captainFee ? `<div class="line"><span>Captain × ${plural(q.days, 'day')}</span><span>${money(q.captainFee)}</span></div>` : ''}
    <div class="line"><span>YBER service fee</span><span>${money(q.fee)}</span></div>
    <div class="line total"><span>Total</span><span>${money(q.total)}</span></div>
    ${isMine ? `<a class="btn btn-outline btn-block" href="#/account">This is your boat</a>` : `<button class="btn btn-green btn-block" data-action="book" data-id="${b.id}">${b.instant ? 'Book now' : 'Request to book'}</button>`}
    <div class="note">${b.instant ? 'Instant confirmation. You will not be charged until the trip starts.' : 'The host confirms within 24 hours. Nothing is charged until they do.'}</div>`;
}
function bookDateChange(t) {
  if (t.dataset.role === 'book-from') { S.from = t.value || S.from; if (S.to <= S.from) S.to = addDays(S.from, 1); }
  else { S.to = t.value || S.to; if (S.to <= S.from) S.from = addDays(S.to, -1); }
  const box = $('#bookbox'); if (box && S.boat) box.innerHTML = BookBox(S.boat);
}
ACTIONS['toggle-captain'] = () => { S.boatOpt.captain = !S.boatOpt.captain; const box = $('#bookbox'); if (box && S.boat) box.innerHTML = BookBox(S.boat); };
ACTIONS['gallery'] = (t) => {
  const g = $('#gallery'); if (!g || !S.boat) return;
  const i = Number(t.dataset.i);
  const tiles = $$('[data-action="gallery"]', g);
  // swap the clicked tile into the hero slot
  const heroHtml = tiles[0].innerHTML, heroI = tiles[0].dataset.i;
  tiles[0].innerHTML = t.innerHTML; tiles[0].dataset.i = i;
  t.innerHTML = heroHtml; t.dataset.i = heroI;
};
ACTIONS['book'] = async (t) => {
  const b = S.boat; if (!b) return;
  if (!S.user) { openAuth('login', () => ACTIONS['book'](t)); return; }
  const q = YBER_RULES.quote(b, S.from, S.to, S.boatOpt.captain);
  openModal(`
    <h2>Confirm your trip</h2>
    <div class="preview" style="margin-bottom:16px"><div class="card-img">${listingImg(b)}</div><div><h3>${esc(b.name)}</h3><div class="meta">${esc(b.type)} · ${b.length} ft · ${esc(b.marina)}<br>${fmtDateLong(S.from)} → ${fmtDateLong(S.to)}<br>${captainLabel(b)}${b.captain === 'optional' && S.boatOpt.captain ? ' (captain added)' : ''}</div></div></div>
    <div class="line"><span>${plural(q.days, 'day')} on the water</span><span>${money(q.base)}</span></div>
    ${q.captainFee ? `<div class="line"><span>Captain</span><span>${money(q.captainFee)}</span></div>` : ''}
    <div class="line"><span>Service fee</span><span>${money(q.fee)}</span></div>
    <div class="line total"><span>Total</span><span>${money(q.total)}</span></div>
    <div class="demo-hint" style="margin:14px 0">Payment is simulated in this prototype. Card capture (Stripe) is the next integration.</div>
    <button class="btn btn-green btn-block" data-action="confirm-booking">${b.instant ? 'Confirm and book' : 'Send request'}</button>`);
};
ACTIONS['confirm-booking'] = async (t) => {
  const b = S.boat; if (!b) return;
  t.disabled = true;
  try {
    const res = await API.createBooking({ listingId: b.id, from: S.from, to: S.to, captain: S.boatOpt.captain });
    if (res.user) setUser(res.user);
    const lvl = YBER_RULES.level(S.user.xp);
    openModal(`<div class="success"><div class="big">⛵</div><h2>${b.instant ? "You're booked!" : 'Request sent!'}</h2><p>${esc(b.name)} · ${fmtDate(res.booking.from)} – ${fmtDate(res.booking.to)}</p><p>Confirmation <b>${esc(res.booking.id.toUpperCase())}</b></p>
      <div class="xp-pill">⭐ +${res.gain.xp} Sea Miles · ${esc(lvl.name)}</div>
      <a class="btn btn-primary btn-block" href="#/account" data-action="close-and-go" data-to="#/account">See my trips</a></div>`);
    celebrate({ xp: 0, badges: res.gain.badges });
  } catch (err) { t.disabled = false; toast(err.message, 'bad'); }
};
ACTIONS['close-and-go'] = (t) => { closeModal(); go(t.dataset.to); };

/* ---------- Host flow: list your boat ---------- */
const HOST_STEPS = ['Basics', 'Details', 'Pricing', 'Photos', 'Review'];
const FEATURE_POOL = ['Bluetooth sound system', 'Swim platform', 'Snorkel gear', 'Paddleboards', 'Cooler with ice', 'Shade canopy', 'Marine toilet', 'Full galley', 'Air conditioning', 'Fishing gear', 'Life jackets', 'Sun pads', 'Dinghy', 'Wi-Fi', 'BBQ', 'Jet ski'];
function newHostDraft() {
  return { step: 0, err: '', d: { name: '', type: '', length: '', year: '', guests: '', cabins: '0', region: S.region || '', marina: '', desc: '', features: [], captain: 'included', captainRate: '', rate: '', minDays: 1, instant: true, palette: 'navy', photos: [] } };
}
function HostPage() {
  if (!S.host) S.host = newHostDraft();
  const h = S.host, d = h.d, step = h.step;
  const r = regionById(d.region);
  const marinas = r ? r.marinas : [];
  const body = [
    () => `
      <h1>Tell us about your boat</h1><p class="lead">Guests search by type, size and region first.</p>
      <div class="field"><label>Boat name</label><input class="input" data-host="name" value="${esc(d.name)}" placeholder="e.g. Blue Marlin" maxlength="40"></div>
      <div class="field"><label>Type</label><div class="type-grid">${API.types().map(t => `<button type="button" class="type-card ${d.type === t ? 'on' : ''}" data-action="host-type" data-type="${esc(t)}">${Art.typeGlyph(t)}${esc(t)}</button>`).join('')}</div></div>
      <div class="grid3">
        <div class="field"><label>Length (ft)</label><input class="input" type="number" min="8" max="400" data-host="length" value="${esc(d.length)}" placeholder="42"></div>
        <div class="field"><label>Year</label><input class="input" type="number" min="1950" max="2027" data-host="year" value="${esc(d.year)}" placeholder="2019"></div>
        <div class="field"><label>Max guests</label><input class="input" type="number" min="1" max="200" data-host="guests" value="${esc(d.guests)}" placeholder="8"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Region</label><div class="searchbox" style="position:relative"><input class="input" data-role="region-input" data-ctx="host" data-host="regionName" value="${esc(r ? r.name : '')}" placeholder="Search region" autocomplete="off" style="padding-left:14px"><div class="sugg" hidden></div></div></div>
        <div class="field"><label>Home marina</label><select class="input" data-host="marina" id="host-marina">${marinaOptions(marinas, d.marina)}</select></div>
      </div>`,
    () => `
      <h1>What makes it special?</h1><p class="lead">This is what guests read before they book.</p>
      <div class="field"><label>Description</label><textarea class="input" data-host="desc" placeholder="Where do you usually take guests? What is the boat best for?" maxlength="600">${esc(d.desc)}</textarea><div class="help">${d.desc.length}/600</div></div>
      <div class="field"><label>Cabins</label><input class="input" type="number" min="0" max="20" data-host="cabins" value="${esc(d.cabins)}" style="max-width:160px"></div>
      <div class="field"><label>On board</label><div class="chips">${FEATURE_POOL.map(f => `<button type="button" class="chip ${d.features.includes(f) ? 'on' : ''}" data-action="host-chip" data-f="${esc(f)}">${esc(f)}</button>`).join('')}</div></div>
      <div class="field"><label>Hull colour (for the placeholder illustration)</label><div class="chips">${Art.PALETTE_KEYS.map(k => `<button type="button" class="chip ${d.palette === k ? 'on' : ''}" data-action="host-palette" data-k="${k}">${k}</button>`).join('')}</div></div>`,
    () => `
      <h1>Set your price</h1><p class="lead">Similar ${d.type ? esc(d.type.toLowerCase()) + 's' : 'boats'} in ${esc(r ? r.name : 'this region')} earn ${suggestedRate(d)} per day.</p>
      <div class="grid2">
        <div class="field"><label>Daily rate (USD)</label><input class="input" type="number" min="20" data-host="rate" value="${esc(d.rate)}" placeholder="450"></div>
        <div class="field"><label>Minimum days</label><input class="input" type="number" min="1" max="30" data-host="minDays" value="${esc(d.minDays)}"></div>
      </div>
      <div class="field"><label>Captain</label><div class="radio-cards">
        ${[['included', 'Captain included', 'You or your crew skipper every trip. Guests need no licence.'], ['optional', 'Captain optional', 'Licensed guests can go bareboat; others add your captain for a daily fee.'], ['bareboat', 'Self-drive only', 'Guests must hold a valid licence. You hand over at the dock.']].map(([v, t, s]) => `<button type="button" class="radio-card ${d.captain === v ? 'on' : ''}" data-action="host-captain" data-v="${v}"><span class="dot"></span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}
      </div></div>
      ${d.captain === 'optional' ? `<div class="field"><label>Captain fee per day (USD)</label><input class="input" type="number" min="0" data-host="captainRate" value="${esc(d.captainRate)}" placeholder="250" style="max-width:220px"></div>` : ''}
      <div class="field"><button type="button" class="switch ${d.instant ? 'on' : ''}" data-action="host-instant"><span><b>Instant book</b><small>Guests book without waiting for approval. Listings with instant book get 2x more trips.</small></span><span class="toggle"></span></button></div>
      <div class="demo-hint">You keep ${Math.round((1 - YBER_RULES.SERVICE_FEE) * 100)}% of the daily rate after the YBER service fee. Payouts, tax forms and insurance paperwork are next on the roadmap.</div>`,
    () => `
      <h1>Add photos</h1><p class="lead">Listings with 5+ photos book three times as often. Up to 6 for now.</p>
      <div class="photos" id="photos">${d.photos.map((p, i) => `<div class="ph"><img src="${p}" alt="Photo ${i + 1}"><button type="button" class="rm" data-action="host-rm-photo" data-i="${i}">✕</button></div>`).join('')}
        ${d.photos.length < 6 ? `<label class="add">${Art.icon('camera')}<span>Add photo</span><input type="file" accept="image/*" multiple hidden data-role="photo-input"></label>` : ''}
      </div>
      <div class="help" style="margin-top:12px;font-size:12px;color:var(--hare);font-weight:700">No photos yet? We use an illustration of your ${esc(d.type || 'boat')} until you add them.</div>
      ${d.photos.length ? '' : `<div class="preview" style="margin-top:16px"><div class="card-img">${Art.boat(d.type || 'Motor yacht', d.palette, 'day')}</div><div><h3>Placeholder illustration</h3><div class="meta">This is what guests will see until you upload photos.</div></div></div>`}`,
    () => `
      <h1>Ready to publish?</h1><p class="lead">This is how your listing will appear in ${esc(r ? r.name : 'search')}.</p>
      <div class="preview">
        <div class="card-img">${d.photos.length ? `<img src="${d.photos[0]}" alt="">` : Art.boat(d.type, d.palette, 'day')}</div>
        <div><h3>${esc(d.name)}</h3><div class="meta">${esc(d.type)} · ${d.length} ft · ${d.year}<br>Up to ${d.guests} guests · ${d.cabins > 0 ? plural(Number(d.cabins), 'cabin') : 'day boat'}<br>${esc(d.marina)}, ${esc(r ? r.name : '')}<br><b style="color:var(--ink);font-size:16px">${money(d.rate)}</b> / day · ${captainLabel(d)}${d.instant ? ' · Instant book' : ''}</div></div>
      </div>
      <div class="section" style="border:0"><h3>Description</h3><p>${esc(d.desc)}</p></div>
      ${d.features.length ? `<div class="section" style="border:0;padding-top:0"><h3>On board</h3><ul class="features">${d.features.map(f => `<li>${Art.icon('check')} ${esc(f)}</li>`).join('')}</ul></div>` : ''}
      ${S.user ? '' : `<div class="demo-hint">You will be asked to log in or create a profile when you publish.</div>`}`
  ][step]();
  return `${AppNav()}
  <div class="ob-top" style="max-width:680px;margin:0 auto;padding:16px 24px 0"><a class="ob-close" href="${S.region ? '#/search?region=' + S.region : '#/'}" aria-label="Close">✕</a><div class="progress"><i style="--p:${Math.round((step + 1) / HOST_STEPS.length * 100)}%"></i></div><span style="font-size:12px;font-weight:800;color:var(--hare);white-space:nowrap">${step + 1} / ${HOST_STEPS.length} · ${HOST_STEPS[step]}</span></div>
  <div class="form">${body}
    <div class="err" id="host-err" ${h.err ? '' : 'hidden'}>${esc(h.err)}</div>
    <div class="form-foot">
      ${step > 0 ? `<button class="btn btn-outline" data-action="host-back">Back</button>` : `<span></span>`}
      ${step < HOST_STEPS.length - 1 ? `<button class="btn btn-green" data-action="host-next">Continue</button>` : `<button class="btn btn-green" data-action="host-publish">Publish listing</button>`}
    </div>
  </div>`;
}
function marinaOptions(marinas, sel) {
  return `<option value="">Choose a marina</option>${marinas.map(m => `<option ${m === sel ? 'selected' : ''}>${esc(m)}</option>`).join('')}<option value="__other" ${sel && !marinas.includes(sel) ? 'selected' : ''}>Other</option>`;
}
function refreshHostMarinas() { const s = $('#host-marina'); if (!s || !S.host) return; const r = regionById(S.host.d.region); s.innerHTML = marinaOptions(r ? r.marinas : [], S.host.d.marina); }
function suggestedRate(d) {
  const same = S.allInRegion.length ? S.allInRegion : [];
  const pool = same.filter(l => l.type === d.type);
  if (pool.length) { const avg = pool.reduce((a, l) => a + l.rate, 0) / pool.length; return money(avg * .9) + '–' + money(avg * 1.15); }
  const base = { 'Superyacht': 3000, 'Catamaran': 1100, 'Motor yacht': 900, 'Sailboat': 450, 'Fishing boat': 400, 'Speedboat': 400, 'RIB': 300, 'Pontoon': 320 }[d.type] || 500;
  return money(base * .85) + '–' + money(base * 1.15);
}
function hostInput(t) {
  if (!S.host) return;
  const k = t.dataset.host; if (k === 'regionName') return;
  if (k === 'marina' && t.value === '__other') { const v = prompt('Marina name'); S.host.d.marina = v ? v.trim() : ''; refreshHostMarinas(); return; }
  S.host.d[k] = t.value;
  if (k === 'desc') { const h = t.parentElement.querySelector('.help'); if (h) h.textContent = t.value.length + '/600'; }
}
ACTIONS['host-type'] = (t) => { S.host.d.type = t.dataset.type; $$('.type-card').forEach(c => c.classList.toggle('on', c.dataset.type === t.dataset.type)); };
ACTIONS['host-chip'] = (t) => { const f = t.dataset.f, a = S.host.d.features, i = a.indexOf(f); if (i >= 0) a.splice(i, 1); else a.push(f); t.classList.toggle('on', i < 0); };
ACTIONS['host-palette'] = (t) => { S.host.d.palette = t.dataset.k; $$('[data-action="host-palette"]').forEach(c => c.classList.toggle('on', c.dataset.k === t.dataset.k)); };
ACTIONS['host-captain'] = (t) => { S.host.d.captain = t.dataset.v; $('#app').innerHTML = HostPage(); window.scrollTo(0, document.body.scrollHeight * .35); };
ACTIONS['host-instant'] = (t) => { S.host.d.instant = !S.host.d.instant; t.classList.toggle('on', S.host.d.instant); };
ACTIONS['host-rm-photo'] = (t) => { S.host.d.photos.splice(Number(t.dataset.i), 1); $('#app').innerHTML = HostPage(); };
function hostPhotos(input) {
  const files = Array.from(input.files || []).slice(0, 6 - S.host.d.photos.length);
  if (!files.length) return;
  let pending = files.length;
  files.forEach(f => {
    if (f.size > 2.5 * 1024 * 1024) { toast(`${esc(f.name)} is over 2.5 MB, skipped`, 'bad'); if (--pending === 0) { $('#app').innerHTML = HostPage(); } return; }
    const rd = new FileReader();
    rd.onload = () => { S.host.d.photos.push(rd.result); if (--pending === 0) { $('#app').innerHTML = HostPage(); window.scrollTo(0, 0); } };
    rd.readAsDataURL(f);
  });
}
function validateHostStep(step) {
  const d = S.host.d;
  const num = (v) => Number(v);
  if (step === 0) {
    if (!d.name.trim()) return 'Give the boat a name.';
    if (!d.type) return 'Choose a boat type.';
    if (!(num(d.length) >= 8 && num(d.length) <= 400)) return 'Length should be between 8 and 400 ft.';
    if (!(num(d.year) >= 1950 && num(d.year) <= 2027)) return 'Enter a realistic year.';
    if (!(num(d.guests) >= 1)) return 'How many guests can it carry?';
    if (!regionById(d.region)) return 'Pick a region from the list.';
    if (!d.marina) return 'Choose the home marina.';
  }
  if (step === 1) {
    if (d.desc.trim().length < 40) return 'Write at least 40 characters so guests know what to expect.';
    if (!(num(d.cabins) >= 0)) return 'Cabins should be 0 or more.';
  }
  if (step === 2) {
    if (!(num(d.rate) >= 20)) return 'Set a daily rate of at least $20.';
    if (!(num(d.minDays) >= 1)) return 'Minimum days should be at least 1.';
    if (d.captain === 'optional' && !(num(d.captainRate) >= 0)) return 'Enter the captain fee per day.';
  }
  return '';
}
ACTIONS['host-next'] = () => {
  const h = S.host; const err = validateHostStep(h.step);
  h.err = err;
  if (err) { const e = $('#host-err'); if (e) { e.hidden = false; e.textContent = err; } const bad = $('.input.bad'); return; }
  h.step++; $('#app').innerHTML = HostPage(); window.scrollTo(0, 0);
};
ACTIONS['host-back'] = () => { S.host.err = ''; S.host.step--; $('#app').innerHTML = HostPage(); window.scrollTo(0, 0); };
ACTIONS['host-publish'] = async (t) => {
  const h = S.host;
  for (let i = 0; i < 3; i++) { const err = validateHostStep(i); if (err) { h.step = i; h.err = err; $('#app').innerHTML = HostPage(); return; } }
  if (!S.user) { openAuth('signup', () => ACTIONS['host-publish'](t)); return; }
  t.disabled = true;
  const d = h.d;
  const payload = { name: d.name.trim(), type: d.type, length: Number(d.length), year: Number(d.year), guests: Number(d.guests), cabins: Number(d.cabins) || 0, region: d.region, marina: d.marina, desc: d.desc.trim(), features: d.features, captain: d.captain, captainRate: d.captain === 'optional' ? Number(d.captainRate) || 0 : 0, rate: Number(d.rate), minDays: Number(d.minDays) || 1, instant: !!d.instant, palette: d.palette, photos: d.photos, pos: [0.25 + Math.random() * .5, 0.25 + Math.random() * .5] };
  try {
    const res = await API.createListing(payload);
    if (res.user) setUser(res.user);
    S.regions = await API.regions();
    S.host = null; S.region = payload.region;
    toast('Published. Your boat is live.');
    celebrate(res.gain);
    go('#/boat/' + res.listing.id);
  } catch (err) { t.disabled = false; toast(err.message, 'bad'); }
};

/* ---------- Account ---------- */
async function AccountPage() {
  const u = S.user;
  const [bookings, mine] = await Promise.all([API.bookings(), API.myListings()]);
  const all = await API.listings();
  const byId = Object.fromEntries(all.map(l => [l.id, l]));
  const lvl = YBER_RULES.level(u.xp || 0);
  const tab = S.acctTab;
  const tabs = { trips: 'Trips', boats: 'My boats', saved: 'Saved', settings: 'Settings' };
  const tripRow = (bk) => { const l = byId[bk.listingId]; if (!l) return ''; return `
    <div class="trip" data-action="open-boat" data-id="${l.id}">
      <div class="th">${listingImg(l)}</div>
      <div><h4>${esc(l.name)}</h4><div class="meta">${esc(l.type)} · ${esc(l.marina)}<br>${fmtDateLong(bk.from)} → ${fmtDate(bk.to)} · ${plural(bk.days, 'day')}</div><span class="status ${bk.status}">${bk.status}</span></div>
      <div class="amt"><b>${money(bk.total)}</b>${bk.status === 'upcoming' ? `<button class="btn btn-ghost btn-sm" data-action="cancel-booking" data-id="${bk.id}">Cancel</button>` : ''}</div>
    </div>`; };
  const content = {
    trips: () => bookings.length ? bookings.map(tripRow).join('') : `<div class="empty"><h3>No trips yet.</h3>Your bookings will show up here.<br><a class="btn btn-primary btn-sm" href="${S.region ? '#/search?region=' + S.region : '#/start'}">Find a boat</a></div>`,
    boats: () => mine.length ? `<div class="cards">${mine.map(Card).join('')}</div><div style="margin-top:20px"><a class="btn btn-outline btn-sm" href="#/host">List another boat</a></div>` : `<div class="empty"><h3>You have not listed a boat.</h3>It takes about four minutes.<br><a class="btn btn-primary btn-sm" href="#/host">List your boat</a></div>`,
    saved: () => { const saved = Array.from(S.wish).map(id => byId[id]).filter(Boolean); return saved.length ? `<div class="cards">${saved.map(Card).join('')}</div>` : `<div class="empty"><h3>Nothing saved yet.</h3>Tap the heart on any boat to keep it here.</div>`; },
    settings: () => `
      <form class="settings" data-form="profile">
        <div class="field"><label>Name</label><input class="input" name="name" value="${esc(u.name)}" required></div>
        <div class="field"><label>Email</label><input class="input" value="${esc(u.email)}" disabled><div class="help">Email changes need verification, which is on the roadmap.</div></div>
        <div class="field"><label>Member since</label><input class="input" value="${fmtDateLong(u.createdAt)}" disabled></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn btn-outline" type="button" data-action="logout">Log out</button></div>
        <div class="demo-hint" style="margin-top:20px">Data mode: <b>${API.mode === 'remote' ? 'server (data/db.json)' : 'in-browser demo'}</b>. ${API.mode === 'remote' ? '' : 'Run <b>node server.js</b> to persist accounts, listings and bookings to disk.'}</div>
      </form>`
  }[tab]();
  $('#app').innerHTML = `${AppNav()}
  <div class="page">
    <div class="acct-hero">
      <span class="avatar lg">${initials(u.name)}</span>
      <div><h1>${esc(u.name)}</h1><div class="email">${esc(u.email)}</div><div style="margin-top:8px"><span class="lvl">${['🪢', '⚓', '🧭', '🎖️', '👑'][lvl.index]} ${lvl.name}</span></div></div>
      <div class="xp"><div class="row"><b>${(u.xp || 0).toLocaleString()} Sea Miles</b><span>${lvl.next ? `${lvl.toNext.toLocaleString()} to ${lvl.next.name}` : 'Top rank'}</span></div><div class="xpbar"><i style="--p:${lvl.pct}%"></i></div></div>
    </div>
    <div class="stats">
      <div class="stat"><b>🔥 ${u.streak || 0}</b><span>Day streak</span></div>
      <div class="stat"><b>${bookings.filter(b => b.status !== 'cancelled').length}</b><span>Trips</span></div>
      <div class="stat"><b>${mine.length}</b><span>Boats listed</span></div>
      <div class="stat"><b>${(u.badges || []).length}<small style="font-size:14px;color:var(--hare)">/${YBER_RULES.BADGES.length}</small></b><span>Badges</span></div>
    </div>
    <div class="badges">${YBER_RULES.BADGES.map(b => `<div class="bdg ${(u.badges || []).includes(b.id) ? '' : 'locked'}"><div class="ic">${b.icon}</div>${b.name}<small>${b.how}</small></div>`).join('')}</div>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${tab === k ? 'on' : ''}" data-action="acct-tab" data-tab="${k}">${v}${k === 'saved' && S.wish.size ? ` (${S.wish.size})` : ''}</button>`).join('')}</div>
    <div id="acct-content">${content}</div>
  </div>`;
}
ACTIONS['acct-tab'] = (t) => { S.acctTab = t.dataset.tab; AccountPage(); };
ACTIONS['cancel-booking'] = async (t, e) => {
  e.stopPropagation();
  if (!confirm('Cancel this trip? Free cancellation applies up to 48 hours before departure.')) return;
  try { await API.cancelBooking(t.dataset.id); toast('Trip cancelled'); AccountPage(); } catch (err) { toast(err.message, 'bad'); }
};

/* ---------- Marinas (Dockwa-style teaser) ---------- */
function MarinasPage() {
  const r = regionById(S.region) || S.regions[0];
  const marinas = S.regions.flatMap(rg => rg.marinas.slice(0, 1).map(m => ({ name: m, region: rg })));
  const svc = ['Fuel', 'Power', 'Water', 'Wi-Fi', 'Pump-out', 'Showers', 'Haul-out'];
  return `${AppNav()}
  <section class="marina-hero">
    <h1>Reserve a slip or mooring</h1>
    <p>Rentals are live today. Slips, fuel and services are the next layer of YBER. Here is the shape of it.</p>
    <form class="marina-search" data-form="marina-search">
      <input class="input" placeholder="Marina or region" value="${esc(r ? r.name : '')}">
      <input class="input" type="date" value="${S.from}">
      <input class="input" type="date" value="${S.to}">
      <input class="input" type="number" placeholder="Boat length (ft)">
      <button class="btn btn-primary" type="submit">Search</button>
    </form>
  </section>
  <div class="marinas">${marinas.map((m, i) => { const h = Art.hash(m.name); const rate = 2 + (h % 5); return `
    <div class="marina"><h3>${esc(m.name)}</h3><div class="meta">${m.region.flag} ${esc(m.region.name)} · ${40 + (h % 260)} slips · up to ${60 + (h % 140)} ft</div>
      <div class="svc">${svc.filter((s, j) => (h >> j) & 1 || j < 2).map(s => `<span class="badge blue">${s}</span>`).join('')}</div>
      <div class="price">$${rate}.${(h % 9)}0 <small>/ ft / night</small></div>
      <div style="margin-top:10px"><button class="btn btn-outline btn-sm" data-action="marina-req">Request availability</button></div>
    </div>`; }).join('')}</div>
  <div class="roadmap"><h2>What "all-in-one marina life" will mean</h2><ul>
    <li><b>Slips &amp; moorings</b>Transient and seasonal dockage, with the boat's LOA and draft saved to your profile.</li>
    <li><b>Fuel &amp; provisioning</b>Order fuel to the slip, ice and groceries to the dock before departure.</li>
    <li><b>Service &amp; repairs</b>Book haul-outs, engine service and detailing from the same account.</li>
    <li><b>Crew marketplace</b>Hire licensed captains and deckhands per trip.</li>
    <li><b>Owner dashboard</b>Earnings, calendar sync, dynamic pricing and insurance documents.</li>
    <li><b>Marina tools</b>Slip maps, arrivals board and messaging for marina staff (the Dockwa / DockMaster side).</li>
  </ul></div>`;
}
ACTIONS['marina-req'] = () => toast('Marina messaging arrives with the slips module');
