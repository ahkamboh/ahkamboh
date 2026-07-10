// stats/gen.js — neofetch-style profile stats card (Andrew6rant-inspired, ahkamboh-flavored).
// Left: the mascot-maker family (clawd · xo · dash) in block art. Right: live GitHub stats.
// Emits stats-dark.svg + stats-light.svg at repo root; the workflow publishes them to the
// `clock` branch next to clock.svg. Run: GITHUB_TOKEN=... node stats/gen.js
const fs = require('fs');

const LOGIN = process.env.CLOCK_LOGIN || 'ahkamboh';
const TOKEN = process.env.STATS_TOKEN || process.env.CLOCK_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error('need GITHUB_TOKEN'); process.exit(1); }

async function gql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-stats' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

async function fetchStats() {
  // profile + repos (first 2 pages is plenty for OWNER repos)
  const base = await gql(`query($l:String!){ user(login:$l){
    createdAt followers{totalCount}
    repositories(first:100, ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false,
                 orderBy:{field:STARGAZERS, direction:DESC}){
      totalCount pageInfo{hasNextPage endCursor}
      nodes{ stargazerCount languages(first:6){ edges{ size node{name} } } } } } }`, { l: LOGIN });
  const u = base.user;
  let nodes = u.repositories.nodes;
  if (u.repositories.pageInfo.hasNextPage) {
    const more = await gql(`query($l:String!,$c:String!){ user(login:$l){
      repositories(first:100, after:$c, ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false){
        nodes{ stargazerCount languages(first:6){ edges{ size node{name} } } } } } }`,
      { l: LOGIN, c: u.repositories.pageInfo.endCursor });
    nodes = nodes.concat(more.user.repositories.nodes);
  }
  // all-time commits: one aliased contributionsCollection per year of account life
  const y0 = new Date(u.createdAt).getUTCFullYear(), y1 = new Date().getUTCFullYear();
  const parts = [];
  for (let y = y0; y <= y1; y++)
    parts.push(`y${y}: contributionsCollection(from:"${y}-01-01T00:00:00Z", to:"${y}-12-31T23:59:59Z"){ contributionCalendar{ totalContributions } }`);
  const contrib = await gql(`query($l:String!){ user(login:$l){ ${parts.join(' ')} } }`, { l: LOGIN });
  let commits = 0;
  for (let y = y0; y <= y1; y++) commits += contrib.user[`y${y}`].contributionCalendar.totalContributions;

  const stars = nodes.reduce((s, n) => s + n.stargazerCount, 0);
  const langBytes = {};
  for (const n of nodes) for (const e of (n.languages?.edges || [])) langBytes[e.node.name] = (langBytes[e.node.name] || 0) + e.size;
  const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
  const SHORT = { JavaScript:'JS', TypeScript:'TS', Python:'Py', Jupyter:'Jupyter', HTML:'HTML', CSS:'CSS' };
  const langs = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, b]) => `${SHORT[name] || name} ${Math.round(b / totalBytes * 100)}%`);

  // uptime since account creation
  const created = new Date(u.createdAt), now = new Date();
  let yrs = now.getUTCFullYear() - created.getUTCFullYear();
  let mos = now.getUTCMonth() - created.getUTCMonth();
  let days = now.getUTCDate() - created.getUTCDate();
  if (days < 0) { mos--; days += 30; }
  if (mos < 0) { yrs--; mos += 12; }
  const uptime = `${yrs} yrs, ${mos} mos, ${days} days`;

  return { uptime, repos: u.repositories.totalCount, stars, commits, followers: u.followers.totalCount, langs };
}

/* ------------------------------ SVG ------------------------------ */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card(s, mode) {
  const dark = mode === 'dark';
  const BG = dark ? '#171310' : '#faf5ec';
  const BORDER = dark ? '#2c241c' : '#e5d9c3';
  const INK = dark ? '#f2e8d8' : '#3b2f24';       // values
  const KEY = dark ? '#ff7a45' : '#ca4b15';       // labels (terracotta)
  const DIM = dark ? '#8a7a66' : '#a08e76';       // captions
  const TERRA = dark ? '#e0451f' : '#ca4b15';     // mascot ink
  const AMBER = '#F2A03A';

  const W = 900, H = 400;
  const art = (lines, x, y, fs, fill) => lines.map((ln, i) =>
    `<tspan x="${x}" y="${y + i * fs}">${esc(ln)}</tspan>`).join('') &&
    `<text x="${x}" y="${y}" font-size="${fs}px" fill="${fill}" xml:space="preserve">${lines.map((ln, i) =>
      `<tspan x="${x}" y="${y + i * fs}">${esc(ln)}</tspan>`).join('')}</text>`;

  // the mascot family — ANIMATED (mascot-maker pose frames, CSS-cycled inside the SVG)
  const txt = (lines, x, y, fs, fill, dy = 0) =>
    `<text x="${x}" y="${y + dy}" font-size="${fs}px" fill="${fill}" xml:space="preserve">${lines.map((ln, i) =>
      `<tspan x="${x}" y="${y + dy + i * fs}">${esc(ln)}</tspan>`).join('')}</text>`;

  let css = '', body = '';
  // frames: [lines, startMs, endMs, bobPx]
  const animArt = (id, frames, dur, x, y, fs, fill) => {
    frames.forEach((f, i) => {
      const [lines, a, b, bob] = f;
      const p0 = (a / dur * 100).toFixed(2), p1 = (b / dur * 100).toFixed(2);
      body += `<g class="${id}${i}">` + txt(lines, x, y, fs, fill, bob || 0) + '</g>';
      css += `.${id}${i}{opacity:0;animation:${id}k${i} ${dur}ms step-end infinite}` +
        `@keyframes ${id}k${i}{${p0 === '0.00' ? '' : `0%{opacity:0}`}${p0}%{opacity:1}${p1 === '100.00' ? '' : `${p1}%{opacity:0}`}100%{opacity:${p1 === '100.00' ? 1 : 0}}}`;
    });
  };

  // clawd — looks around, then jumps (arms up), 5s loop
  const cD  = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝'];
  const cLL = [' ▐▟███▟▌', '▝▜█████▛▘', '  ▘▘ ▝▝'];
  const cLR = [' ▐▙███▙▌', '▝▜█████▛▘', '  ▘▘ ▝▝'];
  const cAU = ['▗▟▛███▜▙▖', ' ▜█████▛', ' ▘▘   ▝▝'];
  animArt('ca', [
    [cD, 0, 800, 0], [cLL, 800, 1300, -3], [cD, 1300, 1600, 0], [cLR, 1600, 2100, -3],
    [cD, 2100, 2400, 0], [cAU, 2400, 3000, -10], [cAU, 3000, 3600, -14],
    [cD, 3600, 4300, 0], [cLL, 4300, 4700, -3], [cD, 4700, 5000, 0],
  ], 5000, 88, 120, 34, TERRA);

  // xo — blinks and glances, 4.2s loop
  const xoE = e => [' ▄▄▄ ', e, ' ▀▀▀ '];
  animArt('xa', [
    [xoE('▐█ █▌'), 0, 1400, 0], [xoE('▐███▌'), 1400, 1550, 0], [xoE('▐█ █▌'), 1550, 2400, 0],
    [xoE('▐ ██▌'), 2400, 2900, 0], [xoE('▐██ ▌'), 2900, 3400, 0], [xoE('▐   ▌'), 3400, 3700, 0],
    [xoE('▐█ █▌'), 3700, 4200, 0],
  ], 4200, 92, 286, 22, TERRA);

  // dash — hovering with a flickering exhaust, little launch, 3s loop
  const dB = [' ▟▙ ', '▟██▙', '▐██▌', '▝▙▟▘'];
  const dashF = (fl, a, b, bob) => {
    const p0 = (a / 30).toFixed(2), p1 = (b / 30).toFixed(2);   // /3000*100
    body += `<g class="da${a}">` + txt(dB, 235, 278, 18, TERRA, bob) + txt([fl], 235, 278 + 4 * 18, 18, AMBER, bob) + '</g>';
    css += `.da${a}{opacity:0;animation:dak${a} 3000ms step-end infinite}` +
      `@keyframes dak${a}{${p0 === '0.00' ? '' : '0%{opacity:0}'}${p0}%{opacity:1}${p1 === '100.00' ? '' : `${p1}%{opacity:0}`}100%{opacity:${p1 === '100.00' ? 1 : 0}}}`;
  };
  dashF(' ▘▝ ', 0, 600, 0); dashF('    ', 600, 900, 0); dashF(' ▘▝ ', 900, 1500, 0);
  dashF(' ██ ', 1500, 2100, -2); dashF('▗██▖', 2100, 2700, -6); dashF(' ▘▝ ', 2700, 3000, 0);

  const row = (i, k, v) => {
    const y = 118 + i * 34;
    return `<text x="450" y="${y}" font-size="17px"><tspan fill="${KEY}" font-weight="bold">${esc(k)}</tspan><tspan fill="${INK}"> ${esc(v)}</tspan></text>`;
  };
  const rows = [
    ['uptime    ›', s.uptime],
    ['repos     ›', `${s.repos} public · ★ ${s.stars}`],
    ['commits   ›', `${s.commits.toLocaleString('en-US')} contributions`],
    ['followers ›', String(s.followers)],
    ['langs     ›', s.langs.join(' · ')],
    ['building  ›', 'content engines for AI'],
  ].map((r, i) => row(i, r[0], r[1])).join('\n');

  const today = new Date().toISOString().slice(0, 10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Menlo,Consolas,'DejaVu Sans Mono',monospace" role="img" aria-label="ahkamboh github stats: ${esc(s.commits)} contributions, ${esc(s.repos)} repos, ${esc(s.followers)} followers">
<style>text,tspan{white-space:pre}${css}</style>\n<rect width="${W}" height="${H}" fill="${BG}" rx="16"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${BORDER}" stroke-width="2" rx="15"/>
${body}
<text x="150" y="230" font-size="13px" fill="${DIM}">clawd</text>
<text x="112" y="360" font-size="13px" fill="${DIM}">xo</text>
<text x="242" y="372" font-size="13px" fill="${DIM}">dash</text>
<text x="450" y="64" font-size="20px" font-weight="bold"><tspan fill="${KEY}">ahkamboh</tspan><tspan fill="${DIM}">@</tspan><tspan fill="${INK}">github</tspan></text>
<text x="450" y="86" font-size="15px" fill="${DIM}">――――――――――――――――――――――――</text>
${rows}
<text x="450" y="${118 + 6 * 34 + 6}" font-size="12.5px" fill="${DIM}">auto-updated daily · ${today} · mascots by mascot-maker</text>
</svg>`;
}

(async () => {
  const s = await fetchStats();
  console.log('[stats]', JSON.stringify(s));
  fs.writeFileSync('stats-dark.svg', card(s, 'dark'));
  fs.writeFileSync('stats-light.svg', card(s, 'light'));
  console.log('✓ stats-dark.svg + stats-light.svg written');
})();
