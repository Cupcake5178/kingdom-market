// Pure data helpers (no DOM) - also used by test.js
(function (root) {
  var L = {};
  L.fmt = function (n) {
    if (n == null || isNaN(n)) return "-";
    var a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(Math.round(n));
  };
  L.search = function (items, q) {
    q = (q || "").toLowerCase().trim();
    return items.filter(function (i) { return !q || i.name.toLowerCase().indexOf(q) >= 0 || i.id.indexOf(q) >= 0; });
  };
  L.filterSort = function (rows, o) {
    o = o || {};
    var q = (o.q || "").toLowerCase();
    var out = rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && String(r.seller).toLowerCase().indexOf(q) < 0) return false;
      if (o.min != null && o.min !== "" && r.priceEach < +o.min) return false;
      if (o.max != null && o.max !== "" && r.priceEach > +o.max) return false;
      return true;
    });
    var k = o.key || "priceEach", dir = o.dir === "desc" ? -1 : 1;
    out.sort(function (a, b) { var x = a[k], y = b[k]; return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir; });
    return out;
  };
  L.change = function (hist, days) {
    if (!hist || hist.length < 2) return 0;
    var last = hist[hist.length - 1].price, idx = Math.max(0, hist.length - 1 - days), first = hist[idx].price;
    return first ? (last - first) / first * 100 : 0;
  };
  L.portfolioValue = function (holdings, items) {
    var map = {}; items.forEach(function (i) { map[i.id] = i; });
    return holdings.reduce(function (s, h) {
      var it = map[h.itemId]; if (!it) return s;
      s.value += it.price * h.qty; s.cost += h.buy * h.qty; return s;
    }, { value: 0, cost: 0 });
  };
  // Convert raw DonutSMP API results into our format (defensive about field names)
  L.fromApi = function (listRes, txRes) {
    var items = {}, listings = [], sales = [];
    function key(it) { return String((it && it.id) || "unknown").replace("minecraft:", ""); }
    function nice(id) { return id.replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
    function ensure(id) { if (!items[id]) items[id] = { id: id, name: nice(id), color: "#" + (Math.abs(hash(id)) % 0xffffff).toString(16).padStart(6, "0"), history: [], price: 0 }; return items[id]; }
    function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
    (listRes || []).forEach(function (r) {
      var id = key(r.item), c = (r.item && r.item.count) || 1; ensure(id);
      listings.push({ itemId: id, name: items[id].name, count: c, price: r.price, priceEach: r.price / c,
        seller: (r.seller && r.seller.name) || "?", timeLeft: r.time_left || 0 });
    });
    (txRes || []).forEach(function (r) {
      var id = key(r.item), c = (r.item && r.item.count) || 1, it = ensure(id);
      var s = { itemId: id, name: it.name, count: c, price: r.price, priceEach: r.price / c,
        seller: (r.seller && r.seller.name) || "?", time: r.unixMillisDateSold || Date.now() };
      sales.push(s); it.history.push({ t: s.time, price: s.priceEach });
    });
    Object.keys(items).forEach(function (id) {
      var it = items[id]; it.history.sort(function (a, b) { return a.t - b.t; });
      if (it.history.length) it.price = it.history[it.history.length - 1].price;
      else { var ls = listings.filter(function (l) { return l.itemId === id; }).map(function (l) { return l.priceEach; });
        it.price = ls.length ? Math.min.apply(null, ls) : 0; it.history = [{ t: Date.now(), price: it.price }]; }
    });
    return { isExample: false, items: Object.keys(items).map(function (k) { return items[k]; }), listings: listings, sales: sales };
  };
  // Convert bot data (bot/data/listings.json + history.json) into our format
  L.fromBot = function (snap, hist) {
    var items = {}; snap = snap || { listings: [] }; hist = hist || {};
    function col(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return "#" + (Math.abs(h) % 0xffffff).toString(16).padStart(6, "0"); }
    function ensure(id, name) { return items[id] = items[id] || { id: id, name: name || id, color: col(id), history: [], price: 0 }; }
    Object.keys(hist).forEach(function (id) { var it = ensure(id, hist[id].name);
      it.history = hist[id].points.map(function (p) { return { t: p.t, price: p.avg, min: p.min }; }); });
    var listings = (snap.listings || []).map(function (l) { ensure(l.itemId, l.name); return Object.assign({ timeLeft: 0 }, l); });
    Object.keys(items).forEach(function (id) { var it = items[id];
      var ls = listings.filter(function (l) { return l.itemId === id; }).map(function (l) { return l.priceEach; });
      it.price = ls.length ? Math.min.apply(null, ls) : (it.history.length ? it.history[it.history.length - 1].min : 0);
      if (!it.history.length) it.history = [{ t: snap.time || Date.now(), price: it.price }]; });
    return { isExample: false, source: "bot", time: snap.time, items: Object.keys(items).map(function (k) { return items[k]; }), listings: listings, sales: [] };
  };
  L.money = function (n) { return n == null || isNaN(n) ? "-" : "$" + Math.round(n).toLocaleString("en-US"); };
  // "§6Dragon Head" / "minecraft:dragon_head" / "Dragon Head" -> "dragon_head"
  L.iconId = function (s) {
    return String(s || "").replace(/§./g, "").replace(/^minecraft:/, "").toLowerCase().trim()
      .replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
  };
  var ALIAS = { steak: "cooked_beef", block_of_diamond: "diamond_block", block_of_netherite: "netherite_block", block_of_emerald: "emerald_block",
    block_of_gold: "gold_block", block_of_iron: "iron_block", redstone_comparator: "redstone_comparator", comparator: "redstone_comparator",
    enchanted_book: "enchanted_book", god_apple: "enchanted_golden_apple", notch_apple: "enchanted_golden_apple", wither_skeleton_skull: "wither_skeleton_skull" };
  // Pick the best icon path: item id, then display name, then strip common prefixes (e.g. "Sharpness V Netherite Sword")
  L.iconPath = function (item, icons) {
    icons = icons || {};
    var cands = [item && item.id, item && item.name].map(L.iconId).filter(Boolean);
    for (var i = 0; i < cands.length; i++) {
      var c = ALIAS[cands[i]] || cands[i];
      if (icons[c]) return icons[c];
      var parts = c.split("_");
      for (var k = 1; k < parts.length; k++) { var tail = parts.slice(k).join("_"); if (icons[ALIAS[tail] || tail]) return icons[ALIAS[tail] || tail]; }
    }
    return icons._fallback || null;
  };
  L.guessCategory = function (id) {
    id = L.iconId(id);
    if (/sword|pickaxe|axe|shovel|hoe|bow|trident|mace|helmet|chestplate|leggings|boots|shield|arrow/.test(id)) return "Tools & Combat";
    if (/redstone|piston|observer|hopper|comparator|repeater|dropper|dispenser|lever/.test(id)) return "Redstone";
    if (/ingot|diamond$|emerald$|nugget|_ore|raw_|scrap|quartz|lapis|coal/.test(id)) return "Ores";
    if (/apple|carrot|beef|pork|bread|stew|potato|chicken|mutton|cookie|pie|melon|berries/.test(id)) return "Food";
    if (/block|planks|log|stone|brick|glass|wool|concrete|terracotta|obsidian|spawner|sand|dirt/.test(id)) return "Blocks";
    return "Misc";
  };
  root.Logic = L;
  if (typeof module !== "undefined") module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
