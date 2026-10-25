// Screens. All data goes through backend.js (local storage today, Supabase later).
import * as api from './backend.js';
import { CATEGORIES } from './demo-data.js';
import { shrinkPhoto } from './photo.js';

const $app = document.getElementById('app');
const $modal = document.getElementById('modal');
const ui = { cat: 'all', duets: null, photo: null, hideHow: false };
try { ui.hideHow = localStorage.getItem('celeste-hide-how') === '1'; } catch { /* fine */ }

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(/, (\d+:)/, ' · $1');
const money = (n) => (n ? `$${n}` : 'Free');
const catLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || '';
const wordmark = (cls = '') => `<span class="wordmark ${cls}" aria-label="Celeste">celeste<span class="heart">♥</span></span>`;
// How it works, in four steps (shown on sign-in, the list, each date and the Duets screen).
const STEPS = [
  ['Choose a group date', 'Each one is half women, half men.'],
  ['Save your spot', 'Pay with Venmo. The organizer confirms it.'],
  ['Go', 'Meet everyone in person.'],
  ['Decide in private', 'Duet or Solo for each person.'],
];
const stepsList = (current = -1) => `<ol class="how">${STEPS.map(([t, d], i) =>
  `<li class="${i < current ? 'done' : i === current ? 'now' : ''}"><span>${i < current ? '✓' : `0${i + 1}`}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ol>`;
const DISCLAIMER = 'Celeste is independent. Not made, approved or endorsed by The Church of Jesus Christ of Latter-day Saints, Intellectual Reserve, Inc., the Church Educational System or any school.';

function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}
const openModal = (html) => { $modal.innerHTML = `<div class="backdrop" data-action="close"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`; };
const closeModal = () => { $modal.innerHTML = ''; };
const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

const ICONS = {
  dates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  matches: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  org: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/></svg>',
};
const GOOGLE_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

// A fake QR code for the demo (it doesn't scan to anything).
function demoQr() {
  const n = 25;
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#1D2433"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1D2433"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="Demo QR code"><g fill="#1D2433">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}<rect x="8" y="10.5" width="9" height="4" rx="1" fill="#fff"/><text x="12.5" y="13.6" font-size="3" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#C2412D">DEMO</text></svg>`;
}

function nav(active, me) {
  const tab = (key, href, label) => `<a href="${href}" class="${active === key ? 'on' : ''}">${ICONS[key]}${label}</a>`;
  return `<nav class="tabs">${tab('dates', '#/', 'Group dates')}${tab('matches', '#/matches', 'Matches')}${tab('me', '#/me', 'Me')}${me.organizer ? tab('org', '#/organizer', 'Organizer') : ''}</nav>`;
}

// ---------- screens ----------
// The night sky behind the welcome page: faint stars, and two brighter ones joined by a line (a match).
function sky() {
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let stars = '';
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 100, y = rnd() * 100, r = 0.1 + rnd() * 0.2, o = 0.3 + rnd() * 0.5;
    if (x < 75 && y > 42) continue; // keep the words clear
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" opacity="${o.toFixed(2)}"/>`;
  }
  return `<svg class="sky" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#FFFFFF">${stars}</g></svg>
    <svg class="pair-stars" viewBox="0 0 160 120" aria-hidden="true">
      <line x1="22" y1="28" x2="132" y2="92" stroke="#FFFFFF" stroke-width="1" opacity=".55"/>
      <circle cx="22" cy="28" r="9" fill="#86C8EE" opacity=".18"/><circle cx="22" cy="28" r="3.2" fill="#FFFFFF"/>
      <circle cx="132" cy="92" r="9" fill="#86C8EE" opacity=".18"/><circle cx="132" cy="92" r="3.2" fill="#FFFFFF"/>
    </svg>`;
}

// Why Celeste exists, and what the site does (only what it really does). Shown before sign-in and in Me → About.
// Speaks about Latter-day Saints, never as the Church; no school names, no prices (see CLAUDE.md).
function aboutSections() {
  const value = (k, v) => `<div class="value"><dt>${k}</dt><dd>${v}</dd></div>`;
  const q = (k, v) => `<details><summary>${k}</summary><p>${v}</p></details>`;
  return `
    <section class="band ink">
      <div class="in">
        <p class="eyebrow">Why Celeste</p>
        <p class="manifesto">Dating apps keep people swiping.<br><em>We want people meeting.</em></p>
        <p class="lede">Celeste is for Latter-day Saint college students who date with intention: to know someone in person, with respect, toward a lasting relationship.</p>
      </div>
    </section>
    <section class="band">
      <div class="in">
        <p class="eyebrow">How it works</p>
        <h2 class="title">One evening, four steps.</h2>
        ${stepsList()}
      </div>
    </section>
    <section class="band sky-band">
      <div class="in">
        <p class="eyebrow">After the date</p>
        <h2 class="title">Duet or Solo. Only you know.</h2>
        <div class="pair">
          <div class="choice duet"><span>Duet</span><p>I'd like to see you again.</p></div>
          <div class="choice solo"><span>Solo</span><p>Not for me.</p></div>
        </div>
        <p class="note">A match happens only when both say Duet. Then each sees the contact the other chose to share. Nobody ever sees a Solo.</p>
      </div>
    </section>
    <section class="band">
      <div class="in">
        <p class="eyebrow">What we stand for</p>
        <dl class="values">
          ${value('Intention', 'Dating toward a lasting relationship.')}
          ${value('Respect', 'For everyone, every time.')}
          ${value('Standards', 'Activities without alcohol, coffee or tea.')}
          ${value('Privacy', 'Your choices stay yours.')}
          ${value('Safety', 'Report anyone from your matches.')}
        </dl>
      </div>
    </section>
    <section class="band">
      <div class="in">
        <p class="eyebrow">Questions</p>
        ${q('Who can join?', 'Single adults, 18 or older.')}
        ${q('Who sees my Duets?', 'No one. Only a mutual Duet becomes a match.')}
        ${q('What does a match see?', 'Your photo, first name, age and the contact you chose.')}
        ${q('Why sign in with Google?', 'One tap. No new password.')}
        ${q('Can I delete my account?', 'Yes, any time, from Me.')}
      </div>
    </section>`;
}

function signInScreen() {
  const google = `<button class="btn google" data-action="google"><span class="g">${GOOGLE_G}</span>Continue with Google</button>`;
  return `<div class="landing">
    <header class="hero">
      ${sky()}
      <div class="in">
        <div class="topbar">${wordmark()}<button class="link-light" data-action="google">Sign in</button></div>
        <div class="hero-copy">
          <p class="eyebrow">Group dates · Rexburg, Idaho</p>
          <h1 class="display">Meant to be met.</h1>
          <p class="lede">Group dates for Latter-day Saint college students who would rather meet in person.</p>
          ${google}
          <a class="scroll" href="#why" data-action="scroll-why">How it works ↓</a>
        </div>
      </div>
    </header>
    <div id="why">${aboutSections()}</div>
    <section class="band ink final"><div class="in"><h2 class="manifesto">See you there.</h2>${google}</div></section>
    <footer class="foot"><div class="in">${wordmark()}<p>${DISCLAIMER}</p></div></footer>
  </div>`;
}

function aboutScreen(me) {
  return `<div class="landing"><div class="page" style="padding-bottom:0"><a class="back" href="#/me">‹ Me</a></div>${aboutSections()}
    <footer class="foot"><div class="in"><p>${DISCLAIMER}</p></div></footer></div>${nav('me', me)}`;
}

async function googleSheet() {
  const accounts = await api.demoAccounts();
  openModal(`<h3>Demo sign-in</h3>
    <p class="muted small" style="margin:4px 0 14px">The real site opens Google here.</p>
    ${accounts.map((a) => `<button class="account" data-action="pick" data-email="${esc(a.email)}" data-name="${esc(a.name)}"><b>${esc(a.name)}</b><br><span class="muted small">${esc(a.email)}</span></button>`).join('')}
    <form data-form="new-account" class="stack" style="margin-top:16px">
      <label class="field">Name<input name="name" required autocomplete="given-name"></label>
      <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
      <button class="btn">New demo account</button>
    </form>`);
}

function profileScreen(me, editing) {
  ui.photo = me.photo || null;
  const g = (v) => `<label><input type="radio" name="gender" value="${v}" ${me.gender === v ? 'checked' : ''} required><span>${v}</span></label>`;
  return `<main class="page">
    ${editing ? '<a class="back" href="#/me">‹ Me</a>' : wordmark()}
    <h1 style="margin:${editing ? 0 : 18}px 0 20px">${editing ? 'Edit profile' : 'Your profile'}</h1>
    <form data-form="profile" class="stack">
      <label class="photo-pick ${ui.photo ? 'has' : ''}" style="${ui.photo ? `background-image:url(${ui.photo})` : ''}">
        <input type="file" accept="image/*" data-change="photo">Add photo</label>
      <label class="field">First name<input name="name" value="${esc(me.name)}" required maxlength="30"></label>
      <label class="field">Age<input name="age" type="number" inputmode="numeric" min="18" max="99" value="${esc(me.age)}" required></label>
      <div class="field"><b class="small">I'm a</b><div class="toggle">${g('Woman')}${g('Man')}</div></div>
      <label class="field">About me<input name="bio" value="${esc(me.bio)}" maxlength="60" placeholder="Short and sweet"></label>
      <label class="field">How matches reach you<input name="contact" value="${esc(me.contact)}" required maxlength="60" placeholder="Phone or Instagram"></label>
      ${editing ? '' : '<label class="check"><input type="checkbox" required> I\'m 18 or older and single.</label>'}
      <button class="btn">Save</button>
    </form>
  </main>`;
}

async function datesScreen(me) {
  const [events, mine] = await Promise.all([api.listEvents(), api.mySignups()]);
  const signup = (id) => mine.find((s) => s.eventId === id);
  const shown = events.filter((e) => ui.cat === 'all' || e.category === ui.cat);
  const left = (e) => e.half - (me.gender === 'Woman' ? e.women : e.men);
  const card = (e) => {
    const s = signup(e.id);
    const d = new Date(e.start);
    let status;
    if (e.status === 'done') status = s?.status === 'paid' ? '<span class="tag coral">Give your Duets</span>' : '<span class="tag">Done</span>';
    else if (s) status = s.status === 'paid' ? '<span class="tag ok">Going ✓</span>' : '<span class="tag coral">Payment pending</span>';
    else status = left(e) > 0 ? `<span class="muted small">${money(e.price)} · ${left(e)} left</span>` : '<span class="muted small">Full</span>';
    return `<a class="card event" href="#/date/${e.id}">
      <div class="dateblock"><b>${d.getDate()}</b><span>${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span></div>
      <div class="ev-text"><h3>${esc(e.title)}</h3><p class="muted small">${when(e.start).split(' · ')[1]} · ${esc(e.place.split(',')[0])}</p>${status}</div></a>`;
  };
  const yours = shown.filter((e) => signup(e.id));
  const rest = shown.filter((e) => !signup(e.id) && e.status === 'open');
  return `<main class="page">
    <div class="row spread">${wordmark()}<span class="muted small">Rexburg</span></div>
    <div class="chips">${[{ key: 'all', label: 'All' }, ...CATEGORIES].map((c) => `<button class="chip ${ui.cat === c.key ? 'on' : ''}" data-action="cat" data-cat="${c.key}">${c.label}</button>`).join('')}</div>
    ${yours.length ? `<h2>Your spots</h2>${yours.map(card).join('')}` : ''}
    ${ui.hideHow ? '' : `<div class="card" style="margin-top:16px"><div class="row spread"><h3>How it works</h3><button class="link" data-action="hide-how">Got it</button></div>${stepsList()}</div>`}
    <h2>Upcoming</h2>${rest.length ? rest.map(card).join('') : '<p class="muted">Nothing here yet.</p>'}
  </main>${nav('dates', me)}`;
}

async function eventScreen(me, id) {
  const [e, s, picks] = await Promise.all([api.getEvent(id), api.mySignup(id), api.myPicks(id)]);
  if (!e) return go('#/');
  const left = e.half - (me.gender === 'Woman' ? e.women : e.men);
  let action;
  if (e.status === 'done') {
    if (s?.status !== 'paid') action = '<p class="muted">This date is over.</p>';
    else if (picks) action = '<a class="btn sky" href="#/matches">See matches</a>';
    else action = `<a class="btn sky" href="#/duets/${id}">Give your Duets</a>`;
  } else if (s?.status === 'paid') {
    action = `<span class="tag ok">You're going ✓</span><button class="link" data-action="cancel" data-id="${id}">I can't go</button>`;
  } else if (s) {
    action = `<span class="tag coral">Payment being checked</span><button class="link" data-action="pay" data-id="${id}">Show Venmo again</button><button class="link" data-action="cancel" data-id="${id}">Cancel</button>`;
  } else {
    action = left > 0 ? `<button class="btn" data-action="spot" data-id="${id}">Save my spot · ${money(e.price)}</button>` : '<button class="btn" disabled>Full</button>';
  }
  const demo = e.status === 'done' ? '' : `<div class="demo-box"><p>DEMO</p>
    ${s && s.status !== 'paid' ? `<button class="link" data-action="demo-paid" data-id="${s.id}">Confirm my payment (organizer)</button>` : ''}
    <button class="link" data-action="demo-done" data-id="${id}">Pretend the date happened</button></div>`;
  return `<main class="page">
    <a class="back" href="#/">‹ Group dates</a>
    <span class="tag">${catLabel(e.category)}</span>
    <h1 style="margin-top:10px">${esc(e.title)}</h1>
    <div class="facts"><p>${when(e.start)}</p><p class="muted">${esc(e.place)}</p><p>${esc(e.about)}</p></div>
    <div class="spots"><div class="card"><b>${e.women}/${e.half}</b><span class="muted small">Women</span></div><div class="card"><b>${e.men}/${e.half}</b><span class="muted small">Men</span></div><div class="card"><b>${money(e.price)}</b><span class="muted small">Spot</span></div></div>
    <div class="actions">${action}</div>
    <h2>Your steps</h2>
    <div class="card">${stepsList(e.status === 'done' ? (picks ? 4 : s?.status === 'paid' ? 3 : -1) : s?.status === 'paid' ? 2 : s ? 1 : 1)}</div>
    ${demo}
  </main>${nav('dates', me)}`;
}

async function paySheet(me, id) {
  const [e, st] = await Promise.all([api.getEvent(id), api.settings()]);
  const note = `${me.name} · ${e.title}`;
  openModal(`<h3>Pay ${money(e.price)} with Venmo</h3>
    <div class="qr">${st.qr ? `<img src="${st.qr}" alt="Venmo QR code">` : demoQr()}</div>
    <p style="text-align:center"><b>${esc(st.venmo)}</b></p>
    <p class="muted small" style="margin:14px 0 6px">Add this note:</p>
    <div class="copy-note">${esc(note)}</div>
    <div class="stack" style="margin-top:18px">
      <button class="btn" data-action="sent" data-id="${id}">I've sent it</button>
      <button class="btn ghost" data-action="close">Not now</button>
    </div>`);
}

async function duetsScreen(me, id) {
  if (!ui.duets || ui.duets.id !== id) {
    const e = await api.getEvent(id);
    ui.duets = { id, title: e.title, list: await api.peopleToRate(id), i: -1, picks: {}, result: null };
  }
  const d = ui.duets;
  let body;
  if (d.result) {
    body = d.result.length
      ? `<div class="result"><div class="big-heart">♥</div><h1 style="margin-top:10px">${d.result.length === 1 ? "It's a match!" : `${d.result.length} matches!`}</h1>
          <div class="faces">${d.result.map((m) => `<img class="avatar" src="${m.person.photo}" alt="${esc(m.person.name)}">`).join('')}</div>
          <a class="btn sky" href="#/matches" data-action="end-duets">See how to reach them</a></div>`
      : `<div class="result"><h1>No mutual Duets this time</h1><p class="muted" style="margin:10px 0 24px">There's another date soon.</p>
          <a class="btn sky" href="#/" data-action="end-duets">Group dates</a></div>`;
  } else if (d.i < 0) {
    body = `<div class="result"><p class="muted">YOU WENT TO</p><h1 style="margin:8px 0 14px">${esc(d.title)}</h1>
      <div class="rules"><p><b>Duet</b> I'd like to see you again.</p><p><b>Solo</b> Not for me.</p><p class="muted">Nobody sees your Solos. A match shows only if you both say Duet.</p></div>
      <button class="btn sky" data-action="duet-start" ${d.list.length ? '' : 'disabled'}>Start · ${d.list.length} people</button></div>`;
  } else {
    const p = d.list[d.i];
    body = `<p class="muted small">${d.i + 1} of ${d.list.length}</p>
      <img class="duet-photo" src="${p.photo}" alt="">
      <h1>${esc(p.name)}, ${esc(p.age)}</h1><p class="muted" style="margin-top:4px">${esc(p.bio)}</p>
      <div class="duet-buttons"><button class="btn ghost" data-action="pick-duet" data-v="0">Solo</button><button class="btn sky" data-action="pick-duet" data-v="1">Duet ♥</button></div>`;
  }
  return `<div class="duets"><main class="page">${d.result || d.i >= 0 ? '' : '<a class="back" href="#/" data-action="end-duets" style="color:#CCCED3">‹ Later</a>'}${body}</main></div>`;
}

async function matchesScreen(me) {
  const list = await api.myMatches();
  return `<main class="page"><h1>Matches</h1>
    ${list.length ? `<h2>Both said Duet</h2>${list.map((m) => `<div class="card row" style="margin-bottom:10px">
      <img class="avatar" src="${m.person.photo}" alt="">
      <div style="flex:1;min-width:0"><h3>${esc(m.person.name)}, ${esc(m.person.age)}</h3><p class="muted small">${esc(m.event.title)}</p><p style="margin-top:4px"><b>${esc(m.person.contact)}</b></p></div>
      <button class="link danger" data-action="report" data-person="${m.person.id}" data-event="${m.event.id}">Report</button></div>`).join('')}`
      : `<p class="muted" style="margin:12px 0 16px">No matches yet.</p><div class="card">${stepsList()}</div>`}
  </main>${nav('matches', me)}`;
}

function meScreen(me) {
  return `<main class="page">
    <div class="row"><img class="avatar big" src="${me.photo}" alt=""><div><h1>${esc(me.name)}, ${esc(me.age)}</h1><p class="muted">${esc(me.bio)}</p></div></div>
    <div class="stack" style="margin-top:24px">
      <a class="btn ghost" href="#/me/edit">Edit profile</a>
      <a class="btn ghost" href="#/me/about">About Celeste</a>
      <button class="btn ghost" data-action="sign-out">Sign out</button>
    </div>
    <div class="demo-box"><p>DEMO</p>
      <button class="link" data-action="organizer">${me.organizer ? 'Hide organizer view' : 'Organizer view'}</button>
      <button class="link" data-action="reset">Reset the demo</button></div>
    <button class="link danger" data-action="delete" style="margin-top:16px">Delete my account</button>
    <p class="fineprint">${DISCLAIMER}</p>
  </main>${nav('me', me)}`;
}

async function organizerScreen(me) {
  const [events, st, reps] = await Promise.all([api.listEvents(), api.settings(), api.reports()]);
  const all = (await Promise.all(events.map((e) => api.signupsFor(e.id)))).flat();
  const pending = all.filter((s) => s.status === 'pending');
  const title = (id) => events.find((e) => e.id === id)?.title;
  const cats = CATEGORIES.map((c) => `<option value="${c.key}">${c.label}</option>`).join('');
  return `<main class="page"><h1>Organizer</h1>
    <h2>Payments to check</h2>
    ${pending.length ? `<table class="list">${pending.map((s) => `<tr><td><b>${esc(s.user?.name)}</b><br><span class="muted small">${esc(title(s.eventId))}</span></td>
      <td style="text-align:right;white-space:nowrap"><button class="btn small sky" data-action="org-paid" data-id="${s.id}">Paid</button> <button class="btn small ghost" data-action="org-unpaid" data-id="${s.id}">Not paid</button></td></tr>`).join('')}</table>`
      : '<p class="muted">All checked.</p>'}
    <h2>Group dates</h2>
    <table class="list">${events.map((e) => `<tr><td><b>${esc(e.title)}</b><br><span class="muted small">${when(e.start)} · ${e.women + e.men}/${e.size}</span></td>
      <td style="text-align:right">${e.status === 'done' ? '<span class="tag">Done</span>' : `<button class="btn small ghost" data-action="org-done" data-id="${e.id}">Mark done</button>`}</td></tr>`).join('')}</table>
    <h2>New group date</h2>
    <form data-form="event" class="stack card">
      <label class="field">Name<input name="title" required maxlength="40"></label>
      <label class="field">Type<select name="category">${cats}</select></label>
      <label class="field">When<input name="start" type="datetime-local" required></label>
      <label class="field">Place<input name="place" required maxlength="60"></label>
      <label class="field">About<input name="about" maxlength="80"></label>
      <div class="row"><label class="field" style="flex:1">People<select name="size"><option>6</option><option selected>8</option><option>10</option><option>12</option></select></label>
      <label class="field" style="flex:1">Price ($)<input name="price" type="number" min="0" value="5" required></label></div>
      <button class="btn">Add</button>
    </form>
    <h2>Venmo</h2>
    <form data-form="venmo" class="stack card">
      <label class="field">Venmo username<input name="venmo" value="${esc(st.venmo)}" required></label>
      <label class="field">QR code picture<input type="file" accept="image/*" data-change="qr"></label>
      <div class="qr">${st.qr ? `<img src="${st.qr}" alt="">` : demoQr()}</div>
      <button class="btn">Save</button>
    </form>
    <h2>Reports</h2>
    ${reps.length ? `<table class="list">${reps.map((r) => `<tr><td><b>${esc(r.aboutUser?.name)}</b> by ${esc(r.fromUser?.name)}<br><span class="muted small">${esc(r.reason)}</span></td></tr>`).join('')}</table>` : '<p class="muted">None.</p>'}
  </main>${nav('org', me)}`;
}

// ---------- router ----------
async function render() {
  const me = await api.me();
  const [, page, id] = (location.hash || '#/').split('/');
  let html;
  if (!me) html = signInScreen();
  else if (!me.gender || !me.photo) html = profileScreen(me, false);
  else if (page === 'date') html = await eventScreen(me, id);
  else if (page === 'duets') html = await duetsScreen(me, id);
  else if (page === 'matches') html = await matchesScreen(me);
  else if (page === 'me') html = id === 'edit' ? profileScreen(me, true) : id === 'about' ? aboutScreen(me) : meScreen(me);
  else if (page === 'organizer' && me.organizer) html = await organizerScreen(me);
  else html = await datesScreen(me);
  if (html !== undefined) $app.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------- actions ----------
const actions = {
  close: (el, ev) => { if (ev.target === el || el.tagName === 'BUTTON') closeModal(); },
  google: () => googleSheet(),
  'scroll-why': (el, ev) => { ev.preventDefault(); document.getElementById('why').scrollIntoView({ behavior: 'smooth' }); },
  pick: async (el) => { await api.signInWithGoogle({ name: el.dataset.name, email: el.dataset.email }); closeModal(); go('#/'); },
  cat: (el) => { ui.cat = el.dataset.cat; render(); },
  spot: async (el) => {
    const e = await api.getEvent(el.dataset.id);
    if (e.price) return paySheet(await api.me(), e.id);
    await api.saveSpot(e.id);
    toast("You're going!");
    render();
  },
  pay: async (el) => paySheet(await api.me(), el.dataset.id),
  sent: async (el) => {
    const id = el.dataset.id;
    closeModal();
    if (!(await api.mySignup(id))) {
      try { await api.saveSpot(id); } catch { toast('Sorry, it just filled up.'); return render(); }
    }
    toast('Thanks! The organizer will confirm.');
    render();
  },
  cancel: async (el) => { if (confirm('Give up your spot?')) { await api.cancelSpot(el.dataset.id); render(); } },
  'demo-paid': async (el) => { await api.setPaid(el.dataset.id, true); toast('Payment confirmed'); render(); },
  'demo-done': async (el) => { await api.markDone(el.dataset.id); render(); },
  'duet-start': () => { ui.duets.i = 0; render(); },
  'pick-duet': async (el) => {
    const d = ui.duets;
    d.picks[d.list[d.i].id] = el.dataset.v === '1';
    if (d.i < d.list.length - 1) { d.i += 1; return render(); }
    await api.submitDuets(d.id, d.picks);
    d.result = (await api.myMatches()).filter((m) => m.event.id === d.id);
    render();
  },
  'end-duets': () => { ui.duets = null; },
  'hide-how': () => { ui.hideHow = true; try { localStorage.setItem('celeste-hide-how', '1'); } catch { /* fine */ } render(); },
  report: async (el) => {
    const reason = prompt('What happened?');
    if (reason?.trim()) { await api.report(el.dataset.person, el.dataset.event, reason.trim()); toast('Reported. Thank you.'); }
  },
  'sign-out': async () => { await api.signOut(); go('#/'); },
  organizer: async () => { const on = !(await api.me()).organizer; await api.saveProfile({ organizer: on }); go(on ? '#/organizer' : '#/me'); },
  reset: async () => { if (confirm('Erase all demo data?')) { await api.resetDemo(); go('#/'); } },
  delete: async () => { if (confirm('Delete your account and matches?')) { await api.deleteAccount(); go('#/'); } },
  'org-paid': async (el) => { await api.setPaid(el.dataset.id, true); render(); },
  'org-unpaid': async (el) => { await api.setPaid(el.dataset.id, false); render(); },
  'org-done': async (el) => { if (confirm('Mark as done? Duets open for those who went.')) { await api.markDone(el.dataset.id); render(); } },
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) actions[el.dataset.action](el, ev);
});

document.addEventListener('change', async (ev) => {
  const kind = ev.target.dataset.change;
  const file = ev.target.files?.[0];
  if (!kind || !file) return;
  try {
    const url = await shrinkPhoto(file);
    if (kind === 'photo') {
      ui.photo = url;
      const pick = ev.target.closest('.photo-pick');
      pick.classList.add('has');
      pick.style.backgroundImage = `url(${url})`;
    } else {
      await api.saveSettings({ qr: url });
      render();
    }
  } catch { toast('That file is not a picture.'); }
});

document.addEventListener('submit', async (ev) => {
  const form = ev.target.dataset.form;
  if (!form) return;
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  if (form === 'new-account') {
    await api.signInWithGoogle(f);
    closeModal();
    go('#/');
  } else if (form === 'profile') {
    if (!ui.photo) return toast('Add a photo first.');
    if (Number(f.age) < 18) return toast('You must be 18 or older.');
    await api.saveProfile({ name: f.name.trim(), age: Number(f.age), gender: f.gender, bio: f.bio.trim(), contact: f.contact.trim(), photo: ui.photo });
    toast('Saved');
    go(location.hash.startsWith('#/me') ? '#/me' : '#/');
  } else if (form === 'event') {
    await api.createEvent({ title: f.title.trim(), category: f.category, start: new Date(f.start).toISOString(), place: f.place.trim(), about: f.about.trim(), size: Number(f.size), price: Number(f.price) });
    toast('Added');
    render();
  } else if (form === 'venmo') {
    await api.saveSettings({ venmo: f.venmo.trim() });
    toast('Saved');
  }
});

window.addEventListener('hashchange', render);
render();
