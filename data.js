// ============================================================
//  EXAMPLE DATA ONLY - these prices, sellers and sales are FAKE,
//  generated so the site works offline. Turn on Live Mode
//  (Settings page) to load real DonutSMP data with your API key.
// ============================================================
(function (root) {
  // [id, display name, category, starting price, popular?]
  var ITEMS = [
    ["elytra","Elytra","Misc",368000000,1],["dragon_head","Dragon Head","Misc",56000000,1],
    ["piglin_head","Piglin Head","Misc",778000,1],["enchanted_golden_apple","Enchanted Golden Apple","Food",1600000,1],
    ["totem_of_undying","Totem of Undying","Misc",31000],["end_crystal","End Crystal","Misc",37800],
    ["shulker_box","Shulker Box","Misc",450000],["beacon","Beacon","Misc",3500000],
    ["ender_pearl","Ender Pearl","Misc",1500],["blaze_rod","Blaze Rod","Misc",2200],
    ["golden_apple","Golden Apple","Food",31600],["cooked_beef","Steak","Food",90],["golden_carrot","Golden Carrot","Food",350],
    ["netherite_ingot","Netherite Ingot","Ores",900000],["diamond","Diamond","Ores",9000],["emerald","Emerald","Ores",3000],
    ["iron_ingot","Iron Ingot","Ores",300],["gold_ingot","Gold Ingot","Ores",450],
    ["spawner","Spawner","Blocks",8000000],["obsidian","Obsidian","Blocks",800],["diamond_block","Block of Diamond","Blocks",81000],
    ["netherite_block","Block of Netherite","Blocks",8100000],["slime_block","Slime Block","Blocks",9000],
    ["hopper","Hopper","Redstone",6000],["observer","Observer","Redstone",4500],["piston","Piston","Redstone",2500],
    ["sticky_piston","Sticky Piston","Redstone",4000],["redstone_comparator","Redstone Comparator","Redstone",3500],
    ["netherite_sword","Netherite Sword","Tools & Combat",4000000],["netherite_pickaxe","Netherite Pickaxe","Tools & Combat",3600000],
    ["mace","Mace","Tools & Combat",18000000],["trident","Trident","Tools & Combat",2400000],["bow","Bow","Tools & Combat",1200]
  ];
  var SELLERS = ["CreeperKing","xXMinerXx","DiamondDave","PixelPam","RedstoneRick","EndermanEmma","BlockBob","LavaLuke","OreOlivia","SteveFan99"];
  var seed = 42;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  var DAY = 86400000, NOW = Date.UTC(2026, 10, 2, 20, 0, 0);
  var items = [], listings = [], sales = [];
  ITEMS.forEach(function (r) {
    var it = { id: r[0], name: r[1], category: r[2], popular: !!r[4], stack: /sword|pickaxe|elytra|totem|mace|trident|bow|shulker|head/.test(r[0]) ? 1 : 64, history: [] };
    var p = r[3];
    for (var d = 60; d >= 0; d--) {           // 60 days of daily average price per item
      p = Math.max(1, p * (1 + (rnd() - 0.48) * 0.08));
      it.history.push({ t: NOW - d * DAY, price: Math.round(p) });
    }
    it.price = it.history[it.history.length - 1].price;
    items.push(it);
    var n = 3 + Math.floor(rnd() * 8);
    for (var i = 0; i < n; i++) {
      var c = it.stack === 1 ? 1 : 1 + Math.floor(rnd() * 64);
      var each = Math.round(it.price * (0.85 + rnd() * 0.4));
      listings.push({ itemId: it.id, name: it.name, count: c, priceEach: each, price: each * c,
        seller: SELLERS[Math.floor(rnd() * SELLERS.length)], timeLeft: Math.floor(rnd() * 48 * 3600000) });
    }
    for (var s = 0; s < 12; s++) {
      var cc = it.stack === 1 ? 1 : 1 + Math.floor(rnd() * 64);
      var e = Math.round(it.price * (0.9 + rnd() * 0.2));
      sales.push({ itemId: it.id, name: it.name, count: cc, priceEach: e, price: e * cc,
        seller: SELLERS[Math.floor(rnd() * SELLERS.length)], time: NOW - Math.floor(rnd() * 3 * DAY) });
    }
  });
  root.EXAMPLE_DATA = { isExample: true, items: items, listings: listings, sales: sales };
})(typeof window !== "undefined" ? window : globalThis);
