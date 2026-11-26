# Rizalopoly

A Monopoly-style Philippine history board game that follows the life of José Rizal, from Calamba to Bagumbayan. Everyone plays on one device (hot seat), 2 to 6 players.

## How to run

No install or build step. Open `index.html` in a web browser.

To host it, turn on GitHub Pages for this repository (Settings → Pages → deploy from the `main` branch, root folder).

## What's in it

- **Landing page**: title, Play Now / How to Play / About, board preview, feature cards and the 8 characters.
- **Setup**: pick 2 to 6 players, names, characters and game length (10 rounds, 20 rounds or no limit).
- **Board**: 32 tiles, 22 places in 8 colour groups (₱60 to ₱360), 3 NOLI and 3 FILI card tiles and 4 corners.
- **Turns**: roll two dice, move, pass START for ₱200, doubles roll again, three doubles in a row sends you to Dapitan Exile.
- **Buying and rent**: buy unowned places; others pay rent. Owning a whole group doubles rent and lets you build up to 3 landmarks 🏛 per place.
- **NOLI / FILI cards**: 8 each, based on the two novels, each with a history fact.
- **Quiz Corner**: a multiple choice Rizal question; a correct answer pays ₱100.
- **Dapitan Exile**: pay ₱50, use Blumentritt's letter card, or roll doubles (max 3 tries).
- **Winning**: last player standing, or highest net worth (cash + places + landmarks) when the round limit is reached.
- The game autosaves in the browser, and "Resume saved game" appears on the home page.

## Files

- `index.html`: page structure (landing, setup, game, modal)
- `css/style.css`: styles
- `js/data.js`: board tiles, characters, cards, quiz questions and rule numbers (edit this to change content or balance)
- `js/game.js`: game logic and UI
