// The only file that stores data. Demo: the browser's local storage.
// For launch, replace it with Supabase calls that keep the same function names,
// and do the matching on the server so nobody can read other people's Duets.
import { PEOPLE, demoEvents, demoDuet } from './demo-data.js';

const KEY = 'celeste-group-dates-demo-v1';
const fresh = () => ({
  users: {}, session: null, events: demoEvents(), signups: [], picks: {}, reports: [],
  settings: { venmo: '@Celeste-Demo', qr: null },
});

let db = load();
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { return fresh(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { alert('This browser could not save. Try a smaller photo.'); }
}
const uid = () => Math.random().toString(36).slice(2, 10);
const ok = (x) => Promise.resolve(x);

export const person = (id) => db.users[id] || PEOPLE.find((p) => p.id === id) || null;
const otherGender = (g) => (g === 'Woman' ? 'Man' : 'Woman');

// ---- Account ----
export const me = () => ok(db.session ? db.users[db.session] : null);
export const demoAccounts = () => ok(Object.values(db.users));

export function signInWithGoogle({ name, email }) {
  let u = Object.values(db.users).find((x) => x.email === email.toLowerCase());
  if (!u) {
    u = { id: `u${uid()}`, email: email.toLowerCase(), name: name.split(' ')[0], organizer: false };
    db.users[u.id] = u;
  }
  db.session = u.id;
  save();
  return ok(u);
}
export function signOut() { db.session = null; save(); return ok(); }
export function saveProfile(fields) {
  Object.assign(db.users[db.session], fields);
  save();
  return ok(db.users[db.session]);
}
export function deleteAccount() {
  const id = db.session;
  delete db.users[id];
  db.signups = db.signups.filter((s) => s.userId !== id);
  Object.values(db.picks).forEach((byFrom) => delete byFrom[id]);
  db.session = null;
  save();
  return ok();
}
export function resetDemo() { localStorage.removeItem(KEY); db = fresh(); return ok(); }

// ---- Group dates ----
const holding = (e) => [
  ...e.going,
  ...db.signups.filter((s) => s.eventId === e.id && s.status !== 'cancelled').map((s) => s.userId),
].map(person).filter(Boolean);

function withCounts(e) {
  const people = holding(e);
  const half = e.size / 2;
  return {
    ...e,
    women: people.filter((p) => p.gender === 'Woman').length,
    men: people.filter((p) => p.gender === 'Man').length,
    half,
  };
}
export const listEvents = () => ok(db.events.map(withCounts).sort((a, b) => a.start.localeCompare(b.start)));
export const getEvent = (id) => ok(withCounts(db.events.find((e) => e.id === id)));

export const mySignup = (eventId) =>
  ok(db.signups.find((s) => s.eventId === eventId && s.userId === db.session && s.status !== 'cancelled') || null);
export const mySignups = () => ok(db.signups.filter((s) => s.userId === db.session && s.status !== 'cancelled'));

export function saveSpot(eventId) {
  const e = withCounts(db.events.find((x) => x.id === eventId));
  const mine = db.users[db.session];
  if ((mine.gender === 'Woman' ? e.women : e.men) >= e.half) return Promise.reject(new Error('Full'));
  const s = { id: uid(), eventId, userId: db.session, status: e.price ? 'pending' : 'paid', at: Date.now() };
  db.signups.push(s);
  save();
  return ok(s);
}
export function cancelSpot(eventId) {
  db.signups.forEach((s) => { if (s.eventId === eventId && s.userId === db.session) s.status = 'cancelled'; });
  save();
  return ok();
}

// ---- Duets after the date ----
// Everyone of the other gender who was there (paid spots only).
export function peopleToRate(eventId) {
  const e = db.events.find((x) => x.id === eventId);
  const mine = db.users[db.session];
  const there = [...e.going, ...db.signups.filter((s) => s.eventId === eventId && s.status === 'paid').map((s) => s.userId)];
  return ok(there.map(person).filter((p) => p && p.id !== mine.id && p.gender === otherGender(mine.gender)));
}
export const myPicks = (eventId) => ok(db.picks[eventId]?.[db.session] || null);
export function submitDuets(eventId, picks) {
  db.picks[eventId] = { ...(db.picks[eventId] || {}), [db.session]: picks };
  save();
  return ok();
}
// A match = both gave a Duet. Only mutual Duets are ever shown, never who said Solo.
function duetFrom(fromId, toId, eventId) {
  const from = person(fromId);
  if (from?.demo) return demoDuet(fromId, eventId);
  return db.picks[eventId]?.[fromId]?.[toId] === true;
}
export function myMatches() {
  const out = [];
  for (const [eventId, byFrom] of Object.entries(db.picks)) {
    const mine = byFrom[db.session];
    if (!mine) continue;
    for (const [toId, duet] of Object.entries(mine)) {
      if (duet && duetFrom(toId, db.session, eventId) && person(toId)) {
        out.push({ person: person(toId), event: db.events.find((e) => e.id === eventId) });
      }
    }
  }
  return ok(out);
}
export function report(personId, eventId, reason) {
  db.reports.push({ id: uid(), from: db.session, about: personId, eventId, reason, at: Date.now() });
  save();
  return ok();
}

// ---- Organizer ----
export const settings = () => ok(db.settings);
export function saveSettings(s) { Object.assign(db.settings, s); save(); return ok(db.settings); }
export const signupsFor = (eventId) =>
  ok(db.signups.filter((s) => s.eventId === eventId && s.status !== 'cancelled').map((s) => ({ ...s, user: person(s.userId) })));
export function setPaid(signupId, paid) {
  const s = db.signups.find((x) => x.id === signupId);
  s.status = paid ? 'paid' : 'cancelled';
  save();
  return ok();
}
export function createEvent(e) {
  db.events.push({ ...e, id: `e${uid()}`, status: 'open', going: [] });
  save();
  return ok();
}
export function markDone(eventId) {
  db.events.find((e) => e.id === eventId).status = 'done';
  save();
  return ok();
}
export const reports = () => ok(db.reports.map((r) => ({ ...r, fromUser: person(r.from), aboutUser: person(r.about) })));
