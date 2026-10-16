# Padel Tactics (test version)

Static, mobile-first padel game-plan tool. Plain HTML/CSS/JS, no build step, no network calls, all data stays in your browser (localStorage).

## Run
    cd padel-tactics && python3 -m http.server 8765
Open http://localhost:8765 (or just open index.html).

## Use
1. New opponent pair -> tap through 29 short questions (opponents A and B, teamwork, how they beat you, you and your partner). Level, hand, side and communication are single-choice and advance on tap; style, strokes, overhead, back glass, serve, lobs, weaknesses (up to 3) and strengths are multi-select with a Next button. Pairs saved by the earlier single-select version are migrated to arrays on load.
2. Get 3-4 tactics (what to do / why it works / switch to this when), plus counter, turn-around and drill for each way they beat you.
3. Open the match card for a one-glance view between games.
4. Saved pairs: view, card, edit (wizard reopens prefilled), delete.

## Files
- index.html, style.css, app.js - UI and wizard
- engine.js - rules engine (scores ~11 standard tactics from the answers, picks the top 3-4)
- profile.js - "My profile" (Part 4) helpers, localStorage key padelTactics.profile.v1
- test/engine.test.js, test/profile.test.js - run with node

Contradictory picks (e.g. "Struggles" plus "Attacking drive" off the back glass) are auto-removed with a short note; saved pairs with conflicts are cleaned on load (last pick wins). Rules: CONFLICTS in engine.js.

My profile: after the first completed run your side, hand and strengths are saved on this device. Later runs skip those 4 questions and show "Using your profile: ..." with an Edit button. Header "My profile" button views/edits/clears it. Saved pairs keep their own copy.
