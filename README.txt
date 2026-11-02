Kingdom Market - Auction Price Tracker for Kingdom SMP (kingdom-smp.net) - fan made, not affiliated
========================================================

QUICK START (no install needed)
1. Unzip this folder anywhere (right-click the zip > Extract All).
2. Double-click index.html. It opens in your browser.
3. That's it! You'll see EXAMPLE data (fake prices) so you can try everything.

WHAT YOU CAN DO
- Items page: search items, sort by name / price / 7-day change.
- Click an item: price, lowest listing, % change, price-history chart,
  active listings and recent sales (click column headers to sort).
- Auction House / Recent Sales: every listing, filter by item, seller,
  min/max price per item, sortable columns.
- Portfolio: track items you own and your profit/loss (saved in your browser).

REAL LIVE DATA (optional)
1. Install Node.js (LTS) from https://nodejs.org (just click Next).
2. In Minecraft, join DonutSMP and type  /api  in chat. Copy the key.
3. Double-click start-proxy.bat. Leave the black window open.
4. In the site, go to Settings, tick Live Mode, paste your key, click Save.
Keep your API key private. Untick Live Mode to go back to example data.
Note: live price history only covers recent sales the API returns
(the site does not store a long history database).

FILES
index.html, style.css, app.js  - the website
data.js   - EXAMPLE (fake) data
logic.js  - search/sort/price math
proxy.js, start-proxy.bat - optional live-data helper
mod/      - Fabric mod jar + full source (mod/src-project, build: gradlew build, Java 25)

MOD MODE (recommended for servers with NO API)
Mod: mod/KingdomMarket-AHLogger-1.0.0.jar  (Minecraft Java 26.2, Fabric)
It only WATCHES screens you open yourself. It never clicks, never
types in chat, never sends commands. (Still check the server's rules
on client mods.)
1. Install Fabric Loader 0.20.1+ for Minecraft 26.2 (fabricmc.net/use).
2. Put BOTH files in your .minecraft\mods folder
   (Win+R, type %appdata%\.minecraft\mods, Enter):
     - KingdomMarket-AHLogger-1.0.0.jar
     - Fabric API for 26.2 (from modrinth.com/mod/fabric-api)
3. Start Minecraft with the Fabric profile, join the server.
4. Type /ah yourself and flip through the pages. Each new page shows
   "Kingdom Market: saved N listings" above your hotbar.
5. Open index.html > Settings > "Mod / Bot mode" > Save.
   (Minecraft must be running; the mod serves data on
   http://localhost:3000.)
Data is saved in .minecraft\blockbazaar\ (listings.json, history.json).
Settings: .minecraft\config\blockbazaar.json  (titleRegex = which
screen titles count as the auction house; priceRegex / sellerRegex /
timeRegex = how to read tooltips). Restart Minecraft after editing.
Don't run start-bot.bat or start-proxy.bat at the same time (same port).

BOT MODE (alternative, for servers with NO API)
A small bot logs into the server with a Minecraft account, opens the
auction house (/ah), reads every listing's price/seller from the item
tooltips, and saves it every few minutes. The website reads that data.

!! IMPORTANT !!
- CHECK THE SERVER RULES FIRST. Many servers ban bots / AFK clients.
  You are responsible for following them. If unsure, ask staff.
- Use an ALT (second) Minecraft account, never your main one.

Setup:
1. Install Node.js LTS from https://nodejs.org (if not done).
2. Open the "bot" folder, right-click config.json > Open with > Notepad.
   Set "host" (server address), "username" (the alt account's
   Microsoft email). Leave "version" as "auto". Save.
   Cracked/offline server? set "auth": "offline", username = bot name,
   and "loginCommand": "/login yourpassword".
3. Double-click start-bot.bat. First run installs things (1-2 min).
4. FIRST LOGIN: the window shows a Microsoft link + code. Open the link
   in your browser, type the code, sign in with the ALT account.
   (Only needed once; it remembers you.)
5. When it says "Saved N listings", open index.html > Settings >
   choose "Bot mode" > Save. The site refreshes every minute.
Keep the bot window open. Close it to stop the bot.

Troubleshooting:
- "no auction window opened": change "ahCommand" in config.json.
- Prices missing / 0 listings: the server's tooltip wording differs.
  Edit "priceRegex" / "sellerRegex" in config.json to match the lines
  you see when hovering an auction item in-game.
- Next page not found: set "nextPageSlot" to the slot number of the
  arrow (top-left slot is 0, counting left-to-right, row by row).
- Version error: Mineflayer currently supports up to Minecraft 26.1.
  If the server is newer (e.g. 26.2) the bot tries 26.1, which works
  only if the server accepts older clients. Otherwise wait for a
  Mineflayer update, then run "npm update" in the bot folder.
- start-proxy.bat (API mode) and the bot both use port 3000; run one.

ITEM ICONS
----------
The item pictures in the icons\ folder are real Minecraft textures taken from the
Minecraft 26.2 game files (block items/heads are drawn as 3D isometric cubes).
They are Mojang's assets - fine for your own personal use, but don't sell them or
put them on a public commercial site. Regenerate with: python tools/make_icons.py
<minecraft textures folder> icons   (needs Python + Pillow + numpy).
Unknown items show a barrier icon. Tip: dark mode = the sun/moon button top-right.

ONLINE SITE (shared live prices)
--------------------------------
Live site:  https://cupcake5178.github.io/blockbazaar/
Repo:       https://github.com/Cupcake5178/blockbazaar
The hosted site uses "Online" mode by default: it reads data/listings.json and
data/history.json from the repo. Until something is uploaded it shows example data.

To make the mod upload your prices automatically:
 1. Go to https://github.com/settings/personal-access-tokens/new  (fine-grained token)
    - Token name: Kingdom Market   - Expiration: whatever you like (e.g. 90 days)
    - Repository access: "Only select repositories" -> blockbazaar
    - Permissions -> Repository permissions -> Contents: "Read and write"
    - Click Generate token and copy it (starts with github_pat_).
 2. Start Minecraft once with the mod so it creates .minecraft\config\blockbazaar.json, then close it.
 3. Open that file in Notepad and paste the token between the quotes:
        "githubToken": "github_pat_....",
    (githubRepo "Cupcake5178/blockbazaar", githubBranch "main", uploadMinutes 5 are already set.)
 4. Play and open /ah. After you browse, the mod uploads at most once every uploadMinutes
    and the action bar shows "Kingdom Market: uploaded". Errors go to the Minecraft log.
 5. The website updates about 1-2 minutes later (GitHub Pages caching). Refresh the page.
The bot works the same way: put the token in bot\config.json "githubToken".

!! NEVER share blockbazaar.json / bot\config.json or post them anywhere once the token is in.
!! Never put the token in the repo. If it leaks, delete it on GitHub's token page and make a new one.

NOTE (rename): the site is now called Kingdom Market. If you installed the older
BlockBazaar-AHLogger-1.0.0.jar, DELETE it from .minecraft\mods and use
KingdomMarket-AHLogger-1.0.0.jar instead (your config\blockbazaar.json and saved data
keep working - the internal file names stayed the same). The GitHub repo is still
called "blockbazaar" so the website address and the uploader config stay valid.
