// rhyming-clock — Cloudflare Worker: dynamic SVG (current time per request + streak/total, animated).
const LOGIN = "ahkamboh";
const TZ = "Asia/Karachi";
const FONT = "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";

// ---- rhyming time-poems: the rhyme sits on fixed end-words; {t} = the time ----
const COUPLETS = [
  t => [`${t}, and the green light hums —`, `a steady heart in the dark that drums.`],
  t => [`the clock reads ${t} just right,`, `a quiet glow, a pixel light.`],
  t => [`${t} on the glass, serene,`, `the calmest face this screen has seen.`],
  t => [`it's ${t} — the cursor blinks,`, `time slips away in tiny links.`],
  t => [`${t} drifts along the wire,`, `a glowing ember, a soft green fire.`],
  t => [`now ${t}, the moment's here,`, `each second crisp, each pixel clear.`],
  t => [`the screen says ${t}, calm and slow,`, `a tide of minutes ebb and flow.`],
  t => [`${t}, and the hours keep`, `their quiet count while the shadows sleep.`],
  t => [`${t} — the numbers align,`, `a small green pulse on a steady line.`],
  t => [`at ${t} the static stirs,`, `a hum of time that softly purrs.`],
  t => [`${t} glows and will not stay,`, `it folds the night, it folds the day.`],
  t => [`${t} ticks, a gentle ghost,`, `the hour I notice, the one I miss most.`],
  t => [`the terminal whispers ${t},`, `low and warm, like an old machine.`],
  t => [`${t} — a breath, a beat,`, `a row of digits, spare and neat.`],
  t => [`it reads ${t}; the world is hushed,`, `no second wasted, no minute rushed.`],
  t => [`${t} burns in muted green,`, `the quietest light I've ever seen.`],
  t => [`${t}, and the wires glow warm,`, `a tiny calm inside the storm.`],
  t => [`the clock holds ${t} in its hand,`, `letting it fall like grains of sand.`],
];
function timeParts(date) {
  const f = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts });
  const t = f({ hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const h = +p.find(x => x.type === 'hour').value, m = +p.find(x => x.type === 'minute').value;
  return { t, slot: Math.floor((h * 60 + m) / 30) };
}
function timePoem(date) {
  const { t, slot } = timeParts(date);
  return { lines: COUPLETS[slot % COUPLETS.length](t), timeStr: t };
}

// ---- GitHub streak + total contributions via GraphQL ----
async function gql(token, query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'clock' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
async function fetchStats(token) {
  const d0 = await gql(token, `query($l:String!){user(login:$l){createdAt}}`, { l: LOGIN });
  const startY = new Date(d0.user.createdAt).getUTCFullYear();
  const nowY = new Date().getUTCFullYear();
  let total = 0;
  const count = new Map();
  for (let y = startY; y <= nowY; y++) {
    const from = new Date(Date.UTC(y, 0, 1)).toISOString();
    const to = new Date(Date.UTC(y, 11, 31, 23, 59, 59)).toISOString();
    const d = await gql(token,
      `query($l:String!,$f:DateTime!,$t:DateTime!){user(login:$l){contributionsCollection(from:$f,to:$t){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`,
      { l: LOGIN, f: from, t: to });
    const cal = d.user.contributionsCollection.contributionCalendar;
    total += cal.totalContributions;
    for (const w of cal.weeks) for (const dd of w.contributionDays) count.set(dd.date, dd.contributionCount);
  }
  // current streak: consecutive days ending today (today counts even if 0 — day's not over) with > 0
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
  const minus = (s, n) => { const dt = new Date(s + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() - n); return dt.toISOString().slice(0, 10); };
  let cur = (count.get(todayStr) || 0) > 0 ? todayStr : minus(todayStr, 1);
  let streak = 0;
  while (count.has(cur)) { if ((count.get(cur) || 0) > 0) { streak++; cur = minus(cur, 1); } else break; }
  return { total, streak };
}

// ---- SVG ----
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const comma = n => n.toLocaleString('en-US');
const dots = (label, val, width = 30) => {
  const base = label + ' ';
  const d = Math.max(2, width - base.length - String(val).length);
  return base + '.'.repeat(d) + ' ' + val;
};
function buildSVG({ lines, timeStr, total, streak }) {
  const W = 1080, H = 300, G = '#00ff88';
  const poem = lines.map((ln, i) =>
    `<text x="56" y="${118 + i * 48}" class="poem">${esc(ln)}${i === lines.length - 1 ? '<tspan class="cur"> &#9608;</tspan>' : ''}</text>`
  ).join('\n  ');
  const streakLine = dots('current streak', `${streak} day${streak === 1 ? '' : 's'}`, 30);
  const totalLine = dots('total commits', `${comma(total)}`, 30);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="rhyming clock: ${esc(timeStr)}, streak ${streak} days, ${total} contributions">
<defs>
  <style>
    @font-face{font-family:'VT323';src:url(data:font/woff2;base64,${FONT}) format('woff2');}
    .ft{font-family:'VT323','Courier New',monospace;fill:${G};animation:flicker 7s infinite;}
    .poem{font-size:34px;}
    .cur{opacity:.85;animation:blink 1.06s step-end infinite;}
    .hdr{font-size:22px;fill:${G};opacity:.55;}
    .time{font-size:24px;fill:${G};opacity:.6;}
    .stat{font-size:27px;fill:${G};letter-spacing:1px;}
    .pw{transform-origin:center;animation:pulse 2.4s ease-in-out infinite;}
    @keyframes blink{50%{opacity:0;}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
    @keyframes flicker{0%,92%,100%{opacity:1;}94%{opacity:.85;}95%{opacity:1;}98%{opacity:.93;}}
  </style>
  <pattern id="scan" width="6" height="4" patternUnits="userSpaceOnUse">
    <rect width="6" height="2" fill="${G}" opacity="0.04"/>
  </pattern>
  <filter id="glow"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="16" fill="none" stroke="${G}" stroke-width="1.5" opacity="0.32"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="16" fill="url(#scan)"/>
<g class="ft" filter="url(#glow)">
  <text x="40" y="50" class="hdr">ahkamboh@github &#8212; rhyming clock</text>
  <circle class="pw" cx="1042" cy="42" r="6" fill="${G}"/>
  ${poem}
  <text x="56" y="270" class="stat">${esc(streakLine)}</text>
  <text x="540" y="270" text-anchor="middle" class="time">${esc(timeStr)} PKT</text>
  <text x="1024" y="270" text-anchor="end" class="stat">${esc(totalLine)}</text>
</g>
<line x1="40" y1="226" x2="1040" y2="226" stroke="${G}" stroke-width="1" opacity="0.22" stroke-dasharray="2 6"/>
</svg>`;
}

async function getStats(env, ctx){
  const token = env.GH_TOKEN || env.GITHUB_TOKEN || env.CLOCK_TOKEN;
  const cache = caches.default;
  const hit = await cache.match(new Request('https://clock.cache/stats-v3'));
  if (hit) return hit.json();
  let stats = { total: 0, streak: 0 };
  if (token) { try { stats = await fetchStats(token); } catch (e) { stats.err = String(e).slice(0,80); } }
  ctx.waitUntil(cache.put(new Request('https://clock.cache/stats-v3'), new Response(JSON.stringify(stats), { headers: { 'Cache-Control': 'max-age=1800' } })));
  return stats;
}
export default {
  async fetch(request, env, ctx){
    const stats = await getStats(env, ctx);
    const { lines, timeStr } = timePoem(new Date());
    const svg = buildSVG({ lines, timeStr, total: stats.total||0, streak: stats.streak||0 });
    return new Response(svg, { headers: {
      'Content-Type':'image/svg+xml; charset=utf-8',
      'Cache-Control':'no-cache, no-store, max-age=0, must-revalidate',
      'Access-Control-Allow-Origin':'*',
    }});
  },
};
