// Invented people and group dates for the demo. Photos: people/SOURCES.txt (Unsplash License).
// Places marked "(example)" are invented. No coffee, tea or alcohol anywhere (Word of Wisdom).

const P = (id, name, age, gender, bio) => ({
  id: `p${id}`, name, age, gender, bio, photo: `people/${id}.jpg`, demo: true,
  contact: `@${name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.demo`,
});

export const PEOPLE = [
  P(1, 'Elena', 24, 'Woman', 'Nursing. Always brings snacks.'),
  P(3, 'Nadia', 23, 'Woman', 'Architecture. Fixes bikes for fun.'),
  P(5, 'Lucía', 22, 'Woman', 'Statistics and jazz.'),
  P(7, 'Sara', 25, 'Woman', 'Future vet. Dog person.'),
  P(9, 'Ana', 21, 'Woman', 'Writes for the student paper.'),
  P(13, 'Brooke', 22, 'Woman', 'Hikes every Saturday.'),
  P(15, 'Kaylee', 21, 'Woman', 'Graphic design. Loud laugh.'),
  P(19, 'Mei', 23, 'Woman', 'Counseling. Great listener.'),
  P(21, 'Hannah', 24, 'Woman', 'History nerd and pie baker.'),
  P(23, 'Rachel', 22, 'Woman', 'Accounting. Board game champion.'),
  P(25, 'Maggie', 23, 'Woman', 'Pediatric nursing. Sings off-key.'),
  P(34, 'Leilani', 22, 'Woman', 'Elementary ed. From Hawaii.'),
  P(2, 'Tomás', 25, 'Man', 'Teaching. Makes great empanadas.'),
  P(4, 'Caleb', 26, 'Man', 'Physical therapy. Climber.'),
  P(6, 'Marco', 24, 'Man', 'Builds furniture.'),
  P(8, 'Daniel', 25, 'Man', 'Culinary arts. Will cook for you.'),
  P(10, 'Javier', 23, 'Man', 'Photography. Early riser.'),
  P(12, 'Leo', 22, 'Man', 'Music. Plays five instruments badly.'),
  P(14, 'Samuel', 24, 'Man', 'Computer science.'),
  P(16, 'Tyler', 25, 'Man', 'Finance. Pickleball fan.'),
  P(18, 'Mateo', 26, 'Man', 'Firefighter in training.'),
  P(20, 'Andrés', 24, 'Man', 'Civil engineering.'),
  P(22, 'Isaiah', 23, 'Man', 'Coaches youth basketball.'),
  P(24, 'Logan', 22, 'Man', 'Electrician. Loves the outdoors.'),
];

export const CATEGORIES = [
  { key: 'dinner', label: 'Dinner' },
  { key: 'sports', label: 'Sports' },
  { key: 'outdoors', label: 'Outdoors' },
  { key: 'games', label: 'Games' },
  { key: 'classes', label: 'Classes' },
  { key: 'music', label: 'Dance' },
  { key: 'service', label: 'Service' },
];

// Days from today, so the demo never runs out of upcoming dates.
function inDays(n, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // no Sundays
  return d.toISOString();
}

const E = (id, category, title, days, hour, place, size, price, about, women, men) =>
  ({ id, category, title, start: inDays(days, hour), place, size, price, about, status: 'open', going: [...women, ...men].map((n) => `p${n}`) });

export function demoEvents() {
  return [
    E('e1', 'dinner', 'Dinner for eight', 2, 19, 'Rocky Mountain Grill (example), Main St', 8, 5, 'One long table, eight seats.', [1, 5, 9], [2, 8, 14]),
    E('e2', 'sports', 'Pickleball mixer', 3, 18, 'Porter Park courts', 8, 6, 'Rotating doubles. Paddles to lend.', [3, 13, 21], [4, 16]),
    E('e3', 'outdoors', 'Sand dunes sunset hike', 4, 16, 'St. Anthony Sand Dunes', 10, 8, 'An easy hike at sunset.', [7, 15, 19, 25], [10, 18, 24]),
    E('e4', 'games', 'Board game night', 5, 19, 'Game Loft (example), downtown', 8, 5, 'Quick social games. Tables change hourly.', [23, 34, 9], [12, 20, 22]),
    E('e5', 'classes', 'Pie baking class', 8, 18, 'Teton Kitchen (example)', 8, 12, 'Bake in pairs, take a pie home.', [21, 1], [6, 8, 14]),
    E('e6', 'music', 'Swing dance night', 10, 20, 'Hall 1912 (example)', 12, 7, 'Lesson first. Partners rotate.', [3, 5, 13, 15], [2, 4, 10, 18]),
    E('e7', 'service', 'Food pantry morning', 11, 9, 'Community food pantry (example)', 10, 0, 'Sort food, then hot chocolate.', [19, 25, 34], [16, 20, 24]),
  ];
}

// Demo only: would this invented person give you a Duet? (Real members decide for themselves.)
export const demoDuet = (personId, eventId) => (parseInt(personId.slice(1), 10) + eventId.length + eventId.charCodeAt(1)) % 3 !== 0;
