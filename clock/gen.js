#!/usr/bin/env node
// gen.js — render clock.svg: a minimalist rhyming-clock (green CRT terminal) that
// shows a short rhyming poem about the current time + the current GitHub streak and
// total contributions, all in the same retro style. Run on a cron by the workflow.
'use strict';
const fs = require('fs');
const path = require('path');

const LOGIN = process.env.CLOCK_LOGIN || 'ahkamboh';
const TZ = process.env.CLOCK_TZ || 'Asia/Karachi';
const FONT = fs.readFileSync(path.join(__dirname, 'vt323.b64'), 'utf8').trim();

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

(async () => {
  const token = process.env.CLOCK_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  let stats = { total: 0, streak: 0 };
  if (token) { try { stats = await fetchStats(token); } catch (e) { console.error('stats fetch failed:', e.message); } }
  else console.error('no token — stats will show 0');
  const { lines, timeStr } = timePoem(new Date());
  fs.writeFileSync(path.join(process.cwd(), 'clock.svg'), buildSVG({ lines, timeStr, ...stats }));
  console.log(`clock.svg written — ${timeStr} · streak ${stats.streak} · total ${stats.total}`);
})();
