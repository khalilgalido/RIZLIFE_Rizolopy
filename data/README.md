# Rizalopoly game data

Plain JSON that any front end can load. Nothing here depends on a framework.

| File | What it holds |
| --- | --- |
| `board.json` | 32 tiles in board order (0 = START, counting counter-clockwise like the screenshot), 8 colour groups, prices, rents, and a historical note per property |
| `characters.json` | The 8 playable characters with token icon, colour, tagline and a short bio |
| `cards/noli.json` | 12 NOLI cards (drawn on tiles 2, 11, 25), plus the list of card effect types |
| `cards/fili.json` | 12 FILI cards (drawn on tiles 6, 18, 28) |
| `cards/quiz.json` | 20 multiple choice questions for Quiz Corner (tile 24) |

## Taken from the design screenshots

Tile names, order, colour groups, prices, the four corners, where the NOLI and FILI tiles sit, and the character names, kinds and taglines.

## Guesses (change freely)

- Group names (the board only shows colours).
- Rents, house costs, mortgage values, START salary (₱200) and starting money (₱1500).
- What each corner does: Dapitan Exile works like jail, Café Rest like free parking, Quiz Corner asks a quiz question.
- All card text, card effects and quiz rewards.

## Worth a second look

- `board.json` tile 27 (Fili: Binondo) has `"verifyNote": true`.
- `characters.json` Josephine Bracken has a `flag`: the screenshot says "Irish-born", but she was born in Hong Kong to Irish parents.
