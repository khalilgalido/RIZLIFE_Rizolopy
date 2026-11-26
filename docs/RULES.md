# Rizalopoly rules

Rizalopoly plays like a simplified Monopoly on a 32-tile loop: 2 to 6 players share one device, buy places from Rizal's life, collect rent, and the richest player wins.

The live, editable version of this spec is the [Rizalopoly rules spec](https://claude.ai/artifact/QcEf2oHxwN2aSEzqbppDdk). Items marked **(guess)** are proposals not yet confirmed.

**Confirmed by Khalil, 26 Nov 2026:** one device with 2 to 6 players, Dapitan Exile works as jail, Café Rest is a free space, a right quiz answer pays ₱100, the richest player after 20 rounds wins, and each property takes up to 3 landmarks.

## One device, pass and play

- Play is hot-seat on one screen: players take turns on the same browser, no accounts, no network.
- 2 to 6 players, each picking a different character from the 8 available.
- Characters are cosmetic tokens with no special powers. **(guess)**
- Simplifications from Monopoly: no mortgages, no trading between players, no auctions, no taxes (the board has no tax tiles). **(guess)**

## Board

The board has 32 tiles: 4 corners, 22 properties in 8 colour groups, 3 NOLI and 3 FILI card tiles. Players move counter-clockwise on screen, from START at bottom right toward Calamba. Group names are **(guess)**.

| # | Tile | Group | Price | Base rent | Landmark cost |
| --- | --- | --- | --- | --- | --- |
| 0 | START | Corner | | | |
| 1 | Calamba | Brown: Childhood | ₱60 | ₱6 | ₱30 |
| 2 | NOLI | Card | | | |
| 3 | Biñan | Brown: Childhood | ₱70 | ₱7 | ₱35 |
| 4 | Ateneo | Light blue: Schooling | ₱100 | ₱10 | ₱50 |
| 5 | UST | Light blue: Schooling | ₱110 | ₱11 | ₱55 |
| 6 | FILI | Card | | | |
| 7 | Intramuros | Light blue: Schooling | ₱120 | ₱12 | ₱60 |
| 8 | Dapitan Exile | Corner | | | |
| 9 | Madrid | Pink: Spain and France | ₱140 | ₱14 | ₱70 |
| 10 | Barcelona | Pink: Spain and France | ₱150 | ₱15 | ₱75 |
| 11 | NOLI | Card | | | |
| 12 | Paris | Pink: Spain and France | ₱160 | ₱16 | ₱80 |
| 13 | Heidelberg | Orange: Germany and Austria | ₱180 | ₱18 | ₱90 |
| 14 | Berlin | Orange: Germany and Austria | ₱190 | ₱19 | ₱95 |
| 15 | Leitmeritz | Orange: Germany and Austria | ₱200 | ₱20 | ₱100 |
| 16 | Café Rest | Corner | | | |
| 17 | London | Red: Later travels | ₱220 | ₱22 | ₱110 |
| 18 | FILI | Card | | | |
| 19 | Ghent | Red: Later travels | ₱230 | ₱23 | ₱115 |
| 20 | Hong Kong | Red: Later travels | ₱240 | ₱24 | ₱120 |
| 21 | Relief Map | Yellow: Dapitan years | ₱260 | ₱26 | ₱130 |
| 22 | Talisay Home | Yellow: Dapitan years | ₱270 | ₱27 | ₱135 |
| 23 | Dapitan School | Yellow: Dapitan years | ₱280 | ₱28 | ₱140 |
| 24 | Quiz Corner | Corner | | | |
| 25 | NOLI | Card | | | |
| 26 | Noli: San Diego | Green: The novels | ₱300 | ₱30 | ₱150 |
| 27 | Fili: Binondo | Green: The novels | ₱310 | ₱31 | ₱155 |
| 28 | FILI | Card | | | |
| 29 | Ibarra's School | Green: The novels | ₱320 | ₱32 | ₱160 |
| 30 | Fort Santiago | Dark blue: Final days | ₱350 | ₱35 | ₱175 |
| 31 | Bagumbayan | Dark blue: Final days | ₱360 | ₱36 | ₱180 |

Base rent is price ÷ 10 and a landmark costs half the price. Each property carries a one or two sentence historical note shown when a player lands on it or views the deed.

## Setup and turns

Each player starts with ₱1,500 on START, and turns pass in the order players joined.

1. Each player picks a character; a character can be taken once.
2. On your turn, roll two six-sided dice and move that many tiles. The game animates the token and resolves the tile you land on.
3. Passing or landing on START pays ₱200 from the bank.
4. Rolling doubles gives another roll after the first move resolves. A third doubles in one turn sends you straight to Dapitan Exile without moving. **(guess, standard Monopoly)**
5. Before ending your turn you may build landmarks (see below). Then press End Turn and pass the device.

The bank has unlimited money. All amounts are in Piso (₱).

## Buying, rent and landmarks

Land on an unowned property and you may buy it at its price; if you decline, it stays unowned. No auction.

- **Rent.** Landing on another player's property costs its rent, paid to the owner. Rent is still due while the owner is in Dapitan Exile.
- **Full group.** Owning every property in a colour group doubles base rent on properties in it that have no landmarks.
- **Landmarks.** With a full group you may build up to 3 landmarks on each property, one at a time, on your own turn. A landmark costs half the property's price.
- **Selling.** Players do not sell voluntarily; selling only happens when raising money to pay a debt (see Bankruptcy).

| Landmarks | Rent | Calamba (base ₱6, landmark ₱30) | Bagumbayan (base ₱36, landmark ₱180) |
| --- | --- | --- | --- |
| None, partial group | 1× base | ₱6 | ₱36 |
| None, full group | 2× base | ₱12 | ₱72 |
| 1 landmark | 5× base | ₱30 | ₱180 |
| 2 landmarks | 12× base | ₱72 | ₱432 |
| 3 landmarks | 25× base | ₱150 | ₱900 |

## Corners and the Rizal quiz

- **START.** Collect ₱200 when passing or landing.
- **Dapitan Exile.** Works as the jail. Landing here normally means "just visiting". You are sent into exile by a card or by a third doubles. While exiled you skip moving, but still collect rent. On each of your turns, leave by paying ₱50, rolling doubles (move by that roll), answering a quiz question correctly **(guess)**, or using a Pardon card. After 3 failed turns you must pay ₱50 and move.
- **Café Rest.** A free space. Nothing happens; the screen shows a short note about Rizal's café circles in Europe.
- **Quiz Corner.** You get one multiple-choice question (4 options, 20 second timer **(guess)**). A correct answer pays ₱100 from the bank; a wrong one pays nothing and shows the right answer with a short explanation.

Quiz questions come from one bank grouped by topic (life, travels, schooling, novels). A question is not repeated until the bank runs out. Starting size: 40 questions. **(guess)**

## NOLI and FILI cards

Landing on a NOLI or FILI tile draws the top card of that deck, which states a Rizal fact and an effect. NOLI cards lean toward rewards and FILI cards toward setbacks, echoing the hopeful first novel and the darker second. **(guess)**

- Each deck holds 16 cards, shuffled at the start and reshuffled when empty. **(guess)**
- A Pardon card is kept until used; every other card resolves at once and goes to the bottom.
- Effects use a small fixed set: gain or pay the bank, collect from or pay each player, move to a named tile (collecting ₱200 if START is passed), move back 3 tiles, go to Dapitan Exile, Pardon, and pay per landmark.

Sample cards (draft; facts to double-check before shipping):

| Deck | Card text | Effect |
| --- | --- | --- |
| NOLI | Maximo Viola lends Rizal the money to print the Noli in Berlin, 1887. | Collect ₱100 |
| NOLI | Rizal studies ophthalmology in Heidelberg. | Advance to Heidelberg |
| NOLI | Rizal annotates Morga's Sucesos at the British Museum. | Advance to London |
| NOLI | Rizal shares a winning lottery ticket in Dapitan, 1892. | Collect ₱150 |
| NOLI | La Liga Filipina is founded in Tondo, 1892. | Collect ₱20 from each player |
| NOLI | A friend's letter frees you. | Pardon: leave Dapitan Exile free |
| FILI | Printing money runs short in Ghent, 1891. | Pay ₱100 |
| FILI | Valentin Ventura funds the rest of the Fili. | Collect ₱50 |
| FILI | The Calamba land dispute drives Rizal's family off their land. | Pay ₱40 per landmark |
| FILI | Rizal is deported to Dapitan, 1892. | Go to Dapitan Exile |
| FILI | Rizal is held in Fort Santiago, 1896. | Advance to Fort Santiago |
| FILI | The censors ban your book. | Move back 3 tiles |

## Bankruptcy and winning

The game ends after 20 rounds (10 rounds or no limit can be picked at setup) or when one player is left, and the richest player wins.

- **Can't pay.** If you owe more cash than you have, the game sells your landmarks back to the bank at half their cost, most expensive property first. If that is not enough, it sells your properties to the bank at half price, cheapest first.
- **Bankrupt.** If you still can't pay, any cash left goes to the player you owed (or the bank), your properties return to the bank unowned, and you leave the game.
- **Wealth** = cash + price of every property owned + the full cost of each landmark built.
- **Ties** go to the player with more cash. **(guess)**
- The end screen ranks every player by wealth.

## Open questions

- Should characters have small perks, or stay cosmetic?
- Is this for a class with rules a teacher expects, such as a set number of quiz questions?
- The game is spelled Rizalopoly on screen and Rizolopy in the repo name. Keep both, or rename one?
