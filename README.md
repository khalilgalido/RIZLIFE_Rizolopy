# Rizolopy

A Monopoly-style Philippine history board game that follows the life of José Rizal, from Calamba to Bagumbayan. 2 to 6 players share one device (hot seat).


## Develop

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # writes the single-file game to dist/index.html
```

## Tech

- **Phaser 3** draws the board, the tumbling dice, the hopping tokens, the card decks and the particle effects (`src/board.js`).
- **GSAP** animates the turn splash, dialogs and menus.
- **Howler.js** plays sounds. Drop your own files into `src/assets/audio/` (see the README there). Without them, the game uses built-in synthesized sounds and a small 3/4 background tune.
- **Vite** builds everything into one HTML file.
- **Original art**: the character portraits and the emblem for every place, corner and card are SVGs drawn in code in `tools/art/` (`portraits.mjs`, `emblems.mjs`). Run `npm run art` after editing them to regenerate `src/assets/svg/`. The board itself uses Filipino heritage motifs: a capiz-window centre, a banig-weave frame and "Rizal" in baybayin. Small UI symbols fall back to Fluent Emoji 3D (MIT). See `LICENSES.md`.

## Files

- `src/data.js`: board tiles, characters, cards, quiz questions and rule numbers. Edit this to change content or balance.
- `src/game.js`: rules, turn flow, menus and dialogs.
- `src/trade.js`: trade offers between players, and how CPUs judge and make them.
- `src/board.js`: the Phaser board scene.
- `src/fx.js`: sound, music, confetti and floating money text.
- `src/art.js`: loads the artwork (original SVGs first, Fluent Emoji 3D as fallback) and swaps it in for emoji across the page.
- `tools/art/`: source for the original illustrations.
- `src/style.css`: page styles.

## Rules (guessed where the design did not say)

- Everyone starts with ₱1,500 and gets ₱200 for passing START. Rolling doubles lets you roll again.
- Rent is 10% of a place's price, and doubles when you own its whole colour group. With a whole group you can build up to 3 landmarks per place, which multiply rent by ×5, ×12 and ×25. Build evenly across the group, and sell landmarks back for half their cost whenever you like.
- Skip buying a place and it goes to auction: players take turns raising the bid or dropping out.
- Trade places, Piso and Blumentritt letters with other players on your turn (up to 3 offers a turn). Places in a group with landmarks can't be traded.
- Mortgage a place for half its price. It charges no rent until you pay that back plus 10%.
- NOLI and FILI cards (8 of each) and the Quiz Corner (a correct answer pays ₱100) each teach a Rizal fact.
- Dapitan Exile: pay ₱50, use Blumentritt's letter, or roll doubles (3 tries).
- If you can't pay, the bank mortgages your places and sells your landmarks for you. If that still isn't enough, you're bankrupt, and what you have left goes to the player you owe (or back to the bank).
- The game ends when one player is left, or at the round limit (10, 20 or none). The highest net worth wins.



## Play online
Live at https://rizolopy.vercel.app

Made by 
Rico Albania
Sheila Cheng
Joshmar Clavero
Khalil Galido
Gwyneth Salud
Nina Ramos
for RIZLIFE.
