CELESTE GROUP DATES (website demo)
==================================

A separate project from the phone app (../app) and the main website (../website).
It only does group dates: sign in with Google, save a spot, pay by Venmo QR code,
go to the date, then give private Duets. Two people match only when both chose each other.

THIS IS A DEMO
- Nothing is sent anywhere. Everything is saved only in the browser you use
  (its "local storage"), so each computer or phone has its own copy.
- "Continue with Google" is simulated: it shows demo accounts instead of Google's window.
- The Venmo QR code is a fake picture. No money moves.
- The 24 people are invented. Their photos are free Unsplash stock photos of models
  (see people/SOURCES.txt), not real members.

HOW TO OPEN IT
- Double-clicking index.html does not work (browsers block some features for files).
- In Terminal:   cd ~/Desktop/universities/group-dates-website && python3 -m http.server 8090
  then open http://localhost:8090 in a browser. Press Control+C in Terminal to stop.

HOW TO TRY THE WHOLE STORY
1. Continue with Google -> pick "New demo account" -> fill in your profile.
2. Group dates -> choose one -> Save my spot -> "I've sent the payment".
3. Your spot shows "Payment being checked". Tap "Demo: confirm my payment" (in the
   real site the organizer does this in the Organizer page after checking Venmo).
4. Tap "Demo: pretend the date already happened".
5. Give your Duets (one person at a time) -> see your mutual matches and how to reach them.
6. Me -> "Organizer view (demo)" shows what the organizer sees: payments to confirm,
   creating group dates, marking dates as done, the Venmo QR code picture.
To test a match from both sides, create two demo accounts (a woman and a man), sign both up
for the same date, and switch between them with Me -> Sign out.

FILES
- index.html, styles.css    the page and its look (Celeste colors and fonts)
- js/app.js                 the screens
- js/backend.js             THE ONLY PART THAT STORES DATA. Today it uses local storage.
                            For launch it is replaced by Supabase (same function names).
- js/demo-data.js           invented people and group dates (Rexburg, Idaho)
- js/photo.js               shrinks profile photos to 800 pixels wide (about 100 KB)
- people/                   demo photos

NEXT STEP (not done yet): Supabase
- Create a free Supabase project, turn on Google sign-in (needs a free Google Cloud
  "OAuth client"), create the tables, and the private matching rules so nobody can read
  other people's Duets. Then rewrite js/backend.js to use Supabase.
