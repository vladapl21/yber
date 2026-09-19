/* ===== YBER Art: procedural SVG (no external assets) ===== */
const Art = (() => {
  let n = 0;
  const uid = () => 'g' + (n++).toString(36);

  const SKY = {
    day:   { top:'#e6f5ff', bot:'#a6dcff', sun:'#ffd23f', w1:'#3ec0f8', w2:'#118fd3', hill:'#bfe1f5', foam:'#ffffff' },
    dusk:  { top:'#ffe3b8', bot:'#ff9db4', sun:'#ff7a59', w1:'#4a86c9', w2:'#25518f', hill:'#f1b3c4', foam:'#ffe9ef' },
    night: { top:'#1a2947', bot:'#3d5b92', sun:'#f7f2dd', w1:'#1f4c80', w2:'#0e2b50', hill:'#2b4674', foam:'#c9d8f0' }
  };
  const PAL = {
    navy:   { hull:'#1f3f8f', trim:'#f9c81a', deck:'#f4eee0' },
    white:  { hull:'#f4f4f2', trim:'#1cb0f6', deck:'#f4eee0' },
    red:    { hull:'#e63946', trim:'#ffffff', deck:'#f4eee0' },
    teal:   { hull:'#12a5a5', trim:'#ffe08a', deck:'#f4eee0' },
    black:  { hull:'#28323d', trim:'#ff8a3d', deck:'#e9e4d6' },
    sand:   { hull:'#e6cf9f', trim:'#1f3f8f', deck:'#faf6ec' },
    forest: { hull:'#1f6f4a', trim:'#ffffff', deck:'#f4eee0' },
    sky:    { hull:'#49b9f2', trim:'#ffffff', deck:'#f4eee0' }
  };
  const PALETTE_KEYS = Object.keys(PAL);
  const GLASS = '#2b3a55';
  const METAL = '#8c9aa8';

  // Hull drawings are centred on x=0 with the waterline at y=0 (negative y is up).
  function hullShape(type, p) {
    const stripe = (x, w, y = 6) => `<rect x="${x}" y="${y}" width="${w}" height="5" fill="${p.trim}"/>`;
    const outboard = (x) => `<rect x="${x}" y="-24" width="18" height="34" rx="5" fill="${GLASS}"/>`;
    switch (type) {
      case 'Sailboat': return `
        <path d="M-118 0 L-100 30 Q0 44 100 30 L124 0 Z" fill="${p.hull}"/>${stripe(-110, 228)}
        <rect x="-100" y="-6" width="216" height="6" rx="3" fill="${p.deck}"/>
        <rect x="8" y="-160" width="5" height="156" fill="#555"/>
        <rect x="10" y="-14" width="90" height="4" fill="#555"/>
        <path d="M14 -154 L14 -14 L98 -14 Z" fill="#fff" stroke="#e2e2e2"/>
        <path d="M6 -150 L-96 -8 L6 -8 Z" fill="${p.trim}"/>`;
      case 'Motor yacht': return `
        <path d="M-128 0 L-112 34 Q0 48 112 34 L136 0 Z" fill="${p.hull}"/>${stripe(-120, 250)}
        <rect x="-80" y="-42" width="132" height="42" rx="10" fill="${p.deck}"/>
        <rect x="-68" y="-34" width="106" height="12" rx="6" fill="${GLASS}"/>
        <rect x="-44" y="-70" width="78" height="30" rx="10" fill="${p.deck}"/>
        <rect x="-38" y="-64" width="66" height="10" rx="5" fill="${GLASS}"/>
        <path d="M-10 -70 Q-10 -98 22 -98 Q54 -98 54 -70" fill="none" stroke="${METAL}" stroke-width="5"/>
        <path d="M60 -8 L124 -8" stroke="${METAL}" stroke-width="3"/>`;
      case 'Catamaran': return `
        <path d="M-120 -10 L-108 18 Q0 30 108 18 L128 -10 Z" fill="${p.hull}" opacity=".78"/>
        <path d="M-124 0 L-110 30 Q0 42 110 30 L132 0 Z" fill="${p.hull}"/>${stripe(-116, 244)}
        <rect x="-100" y="-26" width="212" height="18" rx="7" fill="${p.deck}"/>
        <rect x="-62" y="-58" width="114" height="34" rx="10" fill="${p.deck}"/>
        <rect x="-52" y="-50" width="94" height="10" rx="5" fill="${GLASS}"/>
        <rect x="-4" y="-196" width="5" height="140" fill="#555"/>
        <path d="M2 -190 L2 -60 L82 -60 Z" fill="#fff" stroke="#e2e2e2"/>
        <path d="M-6 -184 L-98 -56 L-6 -56 Z" fill="${p.trim}"/>`;
      case 'Superyacht': return `
        <path d="M-160 0 L-145 36 Q0 50 145 36 L174 0 Z" fill="${p.hull}"/>${stripe(-150, 318)}
        <rect x="-132" y="-36" width="256" height="36" rx="9" fill="${p.deck}"/>
        <rect x="-120" y="-28" width="230" height="10" rx="5" fill="${GLASS}"/>
        <rect x="-94" y="-66" width="176" height="32" rx="10" fill="${p.deck}"/>
        <rect x="-84" y="-58" width="152" height="10" rx="5" fill="${GLASS}"/>
        <rect x="-52" y="-92" width="104" height="28" rx="10" fill="${p.deck}"/>
        <rect x="-44" y="-86" width="84" height="9" rx="4" fill="${GLASS}"/>
        <rect x="-8" y="-124" width="4" height="32" fill="${METAL}"/>
        <circle cx="-6" cy="-126" r="6" fill="${METAL}"/>
        <path d="M120 -10 L160 -10" stroke="${METAL}" stroke-width="3"/>`;
      case 'Speedboat': return `
        <path d="M-96 0 L-84 26 Q0 36 84 26 L110 0 Z" fill="${p.hull}"/>${stripe(-88, 188)}
        <rect x="-86" y="-6" width="192" height="6" rx="3" fill="${p.deck}"/>
        <path d="M-6 -6 L2 -28 L46 -28 L54 -6 Z" fill="#bfe6ff" stroke="#7fb7d9" stroke-width="2"/>
        <rect x="-62" y="-16" width="44" height="10" rx="4" fill="${GLASS}"/>
        <rect x="-20" y="-16" width="16" height="10" rx="4" fill="${GLASS}"/>${outboard(-108)}`;
      case 'RIB': return `
        <path d="M-96 0 L-84 24 Q0 34 84 24 L108 0 Z" fill="${p.hull}"/>
        <path d="M-100 -4 Q0 -14 114 -4" stroke="${p.trim}" stroke-width="14" fill="none" stroke-linecap="round"/>
        <path d="M-100 -4 Q0 -14 114 -4" stroke="rgba(0,0,0,.08)" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-2 -8 L4 -30 L40 -30 L46 -8 Z" fill="#bfe6ff" stroke="#7fb7d9" stroke-width="2"/>
        <rect x="-58" y="-20" width="40" height="12" rx="4" fill="${GLASS}"/>${outboard(-108)}`;
      case 'Pontoon': return `
        <rect x="-108" y="4" width="226" height="22" rx="11" fill="#aab6c2"/>
        <rect x="-118" y="-6" width="232" height="22" rx="11" fill="#d1d9e2"/>
        <rect x="-122" y="-18" width="244" height="12" rx="3" fill="${p.deck}"/>
        <path d="M-112 -18 V-44 H112 V-18 M-72 -18 V-44 M-32 -18 V-44 M8 -18 V-44 M48 -18 V-44" stroke="${METAL}" stroke-width="3" fill="none"/>
        <rect x="-64" y="-88" width="128" height="12" rx="6" fill="${p.hull}"/>
        <rect x="-58" y="-76" width="3" height="34" fill="${METAL}"/><rect x="55" y="-76" width="3" height="34" fill="${METAL}"/>
        <rect x="-96" y="-34" width="34" height="16" rx="4" fill="${p.trim}"/><rect x="60" y="-34" width="34" height="16" rx="4" fill="${p.trim}"/>${outboard(-136)}`;
      case 'Fishing boat': return `
        <path d="M-108 0 L-94 30 Q0 42 94 30 L122 0 Z" fill="${p.hull}"/>${stripe(-100, 210)}
        <rect x="-96" y="-6" width="210" height="6" rx="3" fill="${p.deck}"/>
        <path d="M8 -4 L14 -46 L72 -46 L86 -4 Z" fill="${p.deck}"/>
        <rect x="22" y="-40" width="48" height="12" rx="4" fill="${GLASS}"/>
        <rect x="2" y="-58" width="90" height="8" rx="4" fill="${p.hull}"/>
        <path d="M40 -58 L-62 -150 M60 -58 L142 -150" stroke="${METAL}" stroke-width="3"/>
        <path d="M-80 -6 L-84 -40 M-60 -6 L-62 -36" stroke="${METAL}" stroke-width="3"/>`;
      default: return hullShape('Motor yacht', p);
    }
  }

  function boat(type, paletteKey, time = 'day') {
    const s = SKY[time] || SKY.day;
    const p = PAL[paletteKey] || PAL.navy;
    const id = uid();
    const stars = time === 'night'
      ? [[40,40],[90,25],[140,60],[230,30],[300,50],[360,22],[180,90],[70,110]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".8"/>`).join('')
      : '';
    const hull = hullShape(type, p);
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${type}">
      <defs>
        <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.top}"/><stop offset="1" stop-color="${s.bot}"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.w1}"/><stop offset="1" stop-color="${s.w2}"/></linearGradient>
        <clipPath id="${id}c"><rect x="0" y="185" width="400" height="115"/></clipPath>
      </defs>
      <rect width="400" height="300" fill="url(#${id}s)"/>
      ${stars}
      <circle cx="316" cy="72" r="30" fill="${s.sun}"/>
      <path d="M0 200 Q70 165 150 192 T300 184 T400 190 V210 H0Z" fill="${s.hill}"/>
      <rect x="0" y="185" width="400" height="115" fill="url(#${id}w)"/>
      <g clip-path="url(#${id}c)" opacity=".22" transform="translate(200 188) scale(1 -0.45)">${hull}</g>
      <ellipse cx="200" cy="188" rx="130" ry="7" fill="rgba(0,0,0,.18)"/>
      <g transform="translate(200 185)">${hull}</g>
      <path d="M-20 214 Q20 208 60 214 T140 214 T220 214 T300 214 T380 214 T460 214" fill="none" stroke="${s.foam}" stroke-width="3" opacity=".55"/>
      <path d="M-40 246 Q0 240 40 246 T120 246 T200 246 T280 246 T360 246 T440 246" fill="none" stroke="${s.foam}" stroke-width="3" opacity=".35"/>
      <path d="M-10 278 Q30 272 70 278 T150 278 T230 278 T310 278 T390 278" fill="none" stroke="${s.foam}" stroke-width="3" opacity=".22"/>
    </svg>`;
  }

  // Small monochrome boat glyph for the type picker
  function typeGlyph(type) {
    const p = { hull:'currentColor', trim:'rgba(0,0,0,.18)', deck:'rgba(0,0,0,.35)' };
    return `<svg viewBox="-190 -210 380 270" xmlns="http://www.w3.org/2000/svg"><g>${hullShape(type, p).replace(/#bfe6ff|#fff|#555|#8c9aa8|#2b3a55|#aab6c2|#d1d9e2/g, 'currentColor')}</g></svg>`;
  }

  function mascotScene() {
    return `<svg viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="YBER buoy mascot bobbing on the water">
      <circle cx="220" cy="220" r="204" fill="#eaf7ff"/>
      <circle cx="330" cy="120" r="34" fill="#ffd23f"/>
      <g class="gull" stroke="#8ca0b3" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M78 150 q10 -10 20 0 q10 -10 20 0"/><path d="M120 118 q8 -8 16 0 q8 -8 16 0"/>
      </g>
      <g transform="translate(120 268) scale(.3)" opacity=".9">
        <path d="M-118 0 L-100 30 Q0 44 100 30 L124 0 Z" fill="#1f3f8f"/>
        <rect x="8" y="-160" width="6" height="156" fill="#555"/>
        <path d="M14 -154 L14 -14 L98 -14 Z" fill="#fff"/><path d="M6 -150 L-96 -8 L6 -8 Z" fill="#ffc800"/>
      </g>
      <path d="M16 300 Q60 282 110 300 T210 300 T310 300 T410 300 T510 300 V440 H16 Z" fill="#3ec0f8"/>
      <g transform="translate(250 268)"><g class="bob">
        <ellipse cx="0" cy="120" rx="70" ry="10" fill="rgba(0,0,0,.12)"/>
        <path d="M-58 -20 L-50 118 Q0 132 50 118 L58 -20 Z" fill="#ff4b4b"/>
        <path d="M-55 32 L-53 72 L53 72 L55 32 Z" fill="#fff"/>
        <rect x="-64" y="-32" width="128" height="18" rx="9" fill="#d63a3a"/>
        <rect x="-9" y="-74" width="18" height="44" rx="4" fill="#4b4b4b"/>
        <circle cx="0" cy="-92" r="28" fill="#ffc800" opacity=".28"/>
        <circle cx="0" cy="-92" r="16" fill="#ffc800"/>
        <circle cx="-6" cy="-98" r="5" fill="#fff" opacity=".8"/>
        <ellipse cx="-22" cy="14" rx="15" ry="17" fill="#fff"/><ellipse cx="22" cy="14" rx="15" ry="17" fill="#fff"/>
        <circle cx="-18" cy="17" r="7" fill="#3c3c3c"/><circle cx="26" cy="17" r="7" fill="#3c3c3c"/>
        <circle cx="-15" cy="14" r="2.5" fill="#fff"/><circle cx="29" cy="14" r="2.5" fill="#fff"/>
        <path d="M-18 50 Q0 64 18 50" stroke="#3c3c3c" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="-42" cy="40" r="7" fill="#ffb3b3" opacity=".8"/><circle cx="42" cy="40" r="7" fill="#ffb3b3" opacity=".8"/>
      </g></g>
      <path d="M16 372 Q60 354 110 372 T210 372 T310 372 T410 372 T510 372 V440 H16 Z" fill="#118fd3"/>
      <path d="M40 388 Q70 380 100 388 T160 388 T220 388 T280 388 T340 388 T400 388" stroke="#fff" stroke-width="3" fill="none" opacity=".45"/>
    </svg>`;
  }

  function xpBadgeScene() {
    return `<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sea Miles progress badge">
      <rect x="20" y="20" width="400" height="300" rx="28" fill="#fff8e1"/>
      <g transform="translate(220 128)">
        <circle r="78" fill="#ffc800"/><circle r="64" fill="#ffd84d"/>
        <path d="M0 -40 L11 -12 L41 -10 L18 9 L25 38 L0 22 L-25 38 L-18 9 L-41 -10 L-11 -12 Z" fill="#fff"/>
      </g>
      <text x="220" y="240" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="22" fill="#9a5b00">SKIPPER  ·  2,150 SEA MILES</text>
      <rect x="70" y="262" width="300" height="20" rx="10" fill="#f0e2b6"/>
      <rect x="70" y="262" width="186" height="20" rx="10" fill="#ffc800"/>
      <rect x="78" y="266" width="170" height="5" rx="2.5" fill="rgba(255,255,255,.5)"/>
      <text x="220" y="304" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="13" fill="#b27a1a">1,350 to Captain</text>
    </svg>`;
  }

  function marinaScene() {
    return `<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A marina with slips, fuel dock and boats">
      <rect width="440" height="340" rx="28" fill="#e9f6ff"/>
      <rect x="0" y="180" width="440" height="160" fill="#3ec0f8"/>
      <rect x="40" y="150" width="360" height="24" rx="6" fill="#c9a06a"/>
      <rect x="60" y="174" width="8" height="40" fill="#a67c4a"/><rect x="372" y="174" width="8" height="40" fill="#a67c4a"/>
      ${[100,190,280].map(x => `<rect x="${x}" y="174" width="20" height="90" rx="4" fill="#d8b47e"/>`).join('')}
      <g transform="translate(150 246) scale(.32)"><path d="M-118 0 L-100 30 Q0 44 100 30 L124 0 Z" fill="#e63946"/><rect x="8" y="-160" width="6" height="156" fill="#555"/><path d="M14 -154 L14 -14 L98 -14 Z" fill="#fff"/></g>
      <g transform="translate(240 252) scale(.32)"><path d="M-128 0 L-112 34 Q0 48 112 34 L136 0 Z" fill="#1f3f8f"/><rect x="-80" y="-42" width="132" height="42" rx="10" fill="#f4eee0"/><rect x="-68" y="-34" width="106" height="12" rx="6" fill="#2b3a55"/></g>
      <g transform="translate(330 250) scale(.3)"><path d="M-96 0 L-84 24 Q0 34 84 24 L108 0 Z" fill="#12a5a5"/><path d="M-100 -4 Q0 -14 114 -4" stroke="#ffe08a" stroke-width="14" fill="none" stroke-linecap="round"/></g>
      <rect x="60" y="96" width="70" height="54" rx="8" fill="#fff"/><rect x="72" y="108" width="46" height="8" rx="4" fill="#ff9600"/><rect x="72" y="122" width="30" height="8" rx="4" fill="#ffc800"/>
      <rect x="300" y="86" width="90" height="64" rx="8" fill="#fff"/><rect x="312" y="98" width="66" height="8" rx="4" fill="#1cb0f6"/><rect x="312" y="112" width="40" height="8" rx="4" fill="#58cc02"/><rect x="312" y="126" width="54" height="8" rx="4" fill="#ce82ff"/>
      <circle cx="380" cy="52" r="24" fill="#ffd23f"/>
    </svg>`;
  }

  // Deterministic pseudo-random coastline for the placeholder map
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function smoothPath(p) {
    const n = p.length; let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  function mapBackground(seedStr, W = 600, H = 800) {
    const r = rng(hash(seedStr));
    let land = '';
    const blobs = 2 + Math.floor(r() * 2);
    for (let i = 0; i < blobs; i++) {
      const left = r() < .5;
      const cx = left ? -60 + r() * 140 : W - 80 + r() * 140;
      const cy = r() * H;
      const rad = 150 + r() * 170;
      const pts = [];
      for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2; const rr = rad * (.7 + r() * .6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      land += `<path d="${smoothPath(pts)}" fill="#eef2e6" stroke="#cfdac3" stroke-width="2"/>`;
      // a couple of "roads"
      land += `<path d="M${cx.toFixed(0)} ${(cy - rad).toFixed(0)} Q${(cx + 40).toFixed(0)} ${cy.toFixed(0)} ${(cx - 30).toFixed(0)} ${(cy + rad).toFixed(0)}" fill="none" stroke="#fff" stroke-width="3"/>`;
    }
    // small island
    const ix = W * (.3 + r() * .4), iy = H * (.3 + r() * .4), ir = 26 + r() * 30;
    const ipts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ipts.push([ix + Math.cos(a) * ir * (.75 + r() * .5), iy + Math.sin(a) * ir * (.75 + r() * .5)]); }
    land += `<path d="${smoothPath(ipts)}" fill="#eef2e6" stroke="#cfdac3" stroke-width="2"/>`;
    let grid = '';
    for (let x = 0; x <= W; x += 100) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#c4e2f5" stroke-width="1"/>`;
    for (let y = 0; y <= H; y += 100) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#c4e2f5" stroke-width="1"/>`;
    return `<rect width="${W}" height="${H}" fill="#d6ecfa"/>${grid}${land}`;
  }

  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.8 5c2 0 3.4 1 4.2 2.3C11.8 6 13.2 5 15.2 5c3.6 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>',
    heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.8 5c2 0 3.4 1 4.2 2.3C11.8 6 13.2 5 15.2 5c3.6 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8z"/></svg>',
    anchor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V21M5 12H2c0 5 4.5 9 10 9s10-4 10-9h-3M8 21l-4-4M16 21l4-4"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5a3 3 0 010 6M21.5 20c0-3-2-5.2-4.8-5.8"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 18V8M3 12h18v6M3 12V8a2 2 0 012-2h5a2 2 0 012 2v4M21 18v-4a2 2 0 00-2-2"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    wheel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h14M15 9h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3M7 7h6v5H7z"/></svg>'
  };
  const icon = (name) => ICONS[name] || '';

  const logo = () => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#1cb0f6"/><path d="M6 18c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M6 23c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/><circle cx="21" cy="10" r="3" fill="#ffc800"/></svg>`;

  return { boat, typeGlyph, mascotScene, xpBadgeScene, marinaScene, mapBackground, icon, logo, PALETTE_KEYS, hash };
})();
