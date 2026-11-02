"""Builds icons/ from a Minecraft client jar's textures (run locally; output is for personal use).
usage: python make_icons.py <extracted assets/minecraft/textures dir> <out icons dir>"""
import sys, os, json, numpy as np
from PIL import Image, ImageEnhance
T, OUT = sys.argv[1], sys.argv[2]
def tex(p): return Image.open(os.path.join(T, p)).convert("RGBA")
def crop(im, x, y, w, h): return im.crop((x, y, x + w, y + h))

def warp(face, o, a, b, size):
    """map face texture onto parallelogram origin o, edge vectors a (u dir), b (v dir)"""
    w, h = face.size
    M = np.array([[a[0] / w, b[0] / h], [a[1] / w, b[1] / h]]); Mi = np.linalg.inv(M)
    # inverse: tex = Mi @ (screen - o)
    c = (Mi[0, 0], Mi[0, 1], -(Mi[0, 0] * o[0] + Mi[0, 1] * o[1]), Mi[1, 0], Mi[1, 1], -(Mi[1, 0] * o[0] + Mi[1, 1] * o[1]))
    big = face.resize((w * 8, h * 8), Image.NEAREST)  # supersample texels for crisp edges
    c = tuple(v * 8 for v in c)
    return big.transform((size, size), Image.AFFINE, c, resample=Image.NEAREST)

def shade(im, f): r, g, b, a = im.split(); rgb = ImageEnhance.Brightness(Image.merge("RGB", (r, g, b))).enhance(f); return Image.merge("RGBA", (*rgb.split(), a))

def iso(boxes, size=128, pad=6):
    """boxes: list of (x,y,z,w,h,d, top, front, side) in model units; front faces +z (screen left), side faces +x (screen right)."""
    # projection
    def P(x, y, z): return (x * 0.866 - z * 0.866, (x + z) * 0.5 - y)
    pts = [P(bx + dx * bw, by + dy * bh, bz + dz * bd) for (bx, by, bz, bw, bh, bd, *_ ) in boxes for dx in (0, 1) for dy in (0, 1) for dz in (0, 1)]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    s = (size - 2 * pad) / max(max(xs) - min(xs), max(ys) - min(ys))
    ox, oy = size / 2 - s * (max(xs) + min(xs)) / 2, size / 2 - s * (max(ys) + min(ys)) / 2
    def S(x, y, z): p = P(x, y, z); return (ox + p[0] * s, oy + p[1] * s)
    out = Image.new("RGBA", (size, size))
    for (x, y, z, w, h, d, top, front, side) in sorted(boxes, key=lambda b: b[0] + b[2] - b[1] * 0.01):
        V = lambda a, b: (b[0] - a[0], b[1] - a[1])
        # top: u along +x, v along +z  (texture top edge = back)
        o = S(x, y + h, z); out.alpha_composite(warp(top, o, V(o, S(x + w, y + h, z)), V(o, S(x, y + h, z + d)), size))
        # front (+z): u along +x, v down
        o = S(x, y + h, z + d); out.alpha_composite(shade(warp(front, o, V(o, S(x + w, y + h, z + d)), V(o, S(x, y, z + d)), size), 0.82))
        # side (+x): u along -z, v down
        o = S(x + w, y + h, z + d); out.alpha_composite(shade(warp(side, o, V(o, S(x + w, y + h, z)), V(o, S(x + w, y, z + d)), size), 0.64))
    return out

def flat(p, size=128): return tex(p).resize((size, size), Image.NEAREST)
def cube(top, front=None, side=None, size=128):
    t = tex(top); f = tex(front) if front else t; sd = tex(side) if side else f
    t, f, sd = [crop(i, 0, 0, 16, 16) for i in (t, f, sd)]  # animated textures: first frame
    return iso([(0, 0, 0, 16, 16, 16, t, f, sd)], size)

def mcbox(skin, u, v, w, h, d):  # standard MC box UV: returns top, front, entity-left side
    return crop(skin, u + d, v, w, d), crop(skin, u + d, v + d, w, h), crop(skin, u + d + w, v + d, d, h)

def glint(im):
    a = np.array(im).astype(float); m = a[..., 3] > 0
    a[m, 0] = a[m, 0] * .82 + 190 * .2; a[m, 2] = a[m, 2] * .72 + 255 * .3; a[m, 1] *= .9
    return Image.fromarray(np.clip(a, 0, 255).astype("uint8"))

os.makedirs(OUT + "/custom", exist_ok=True); os.makedirs(OUT + "/item", exist_ok=True); os.makedirs(OUT + "/block", exist_ok=True)
manifest = {}
def save(im, rel, ids):
    im.save(f"{OUT}/{rel}", optimize=True)
    for i in ids: manifest[i] = "icons/" + rel

# --- hand-made hero icons -------------------------------------------------
pig = tex("entity/piglin/piglin.png")
t, f, s = mcbox(pig, 0, 0, 10, 8, 8); st, sf, ss = mcbox(pig, 31, 1, 4, 4, 1)
save(iso([(0, 0, 0, 10, 8, 8, t, f, s), (3, 0.5, 8, 4, 4, 1, st, sf, ss)]), "custom/piglin_head.png", ["piglin_head"])
dr = tex("entity/enderdragon/dragon.png")
ht, hf, hs = mcbox(dr, 112, 30, 16, 16, 16)
lt, lf, ls = mcbox(dr, 176, 44, 12, 5, 16)   # upper jaw
jt, jf, js = mcbox(dr, 176, 65, 12, 4, 16)   # lower jaw
save(iso([(0, 0, 0, 16, 16, 16, ht, hf, hs), (2, 4, 16, 12, 5, 16, lt, lf, ls), (2, 0, 16, 12, 4, 16, jt, jf, js)]), "custom/dragon_head.png", ["dragon_head"])
save(glint(flat("item/golden_apple.png")), "custom/enchanted_golden_apple.png", ["enchanted_golden_apple"])
save(cube("block/observer_top.png", "block/observer_front.png", "block/observer_side.png"), "custom/observer.png", ["observer"])
save(cube("block/piston_top.png", "block/piston_side.png"), "custom/piston.png", ["piston"])
save(cube("block/piston_top_sticky.png", "block/piston_side.png"), "custom/sticky_piston.png", ["sticky_piston"])
save(flat("item/comparator.png"), "custom/redstone_comparator.png", ["redstone_comparator"])
g = crop(tex("block/glass.png"), 0, 0, 16, 16); ob = crop(tex("block/obsidian.png"), 0, 0, 16, 16); core = crop(tex("block/beacon.png"), 0, 0, 16, 16)
save(iso([(1, 0, 1, 14, 3, 14, crop(ob,1,1,14,14), crop(ob,1,0,14,3), crop(ob,1,0,14,3)), (3, 3, 3, 10, 10, 10, crop(core,3,3,10,10), crop(core,3,3,10,10), crop(core,3,3,10,10)), (0, 0, 0, 16, 16, 16, g, g, g)]), "custom/beacon.png", ["beacon"])
save(cube("block/shulker_box.png"), "custom/shulker_box.png", ["shulker_box"])
skip_suffix = ("_top", "_bottom", "_side", "_front", "_back", "_on", "_inner", "_end", "_stage0", "_stage1", "_stage2", "_stage3")
# --- every item texture (flat) -------------------------------------------
for f in sorted(os.listdir(T + "/item")):
    if not f.endswith(".png"): continue
    i = f[:-4]
    if i in manifest: continue
    im = tex("item/" + f); im = crop(im, 0, 0, im.width, im.width)
    save(im.resize((64, 64), Image.NEAREST), "item/" + f, [i])
# --- every full block without an item texture (isometric cube) -----------
for f in sorted(os.listdir(T + "/block")):
    if not f.endswith(".png"): continue
    i = f[:-4]
    if i in manifest or i.endswith(skip_suffix): continue
    side = next((x for x in (i + "_side", i) if os.path.exists(f"{T}/block/{x}.png")), None)
    top = i + "_top" if os.path.exists(f"{T}/block/{i}_top.png") else i
    front = i + "_front" if os.path.exists(f"{T}/block/{i}_front.png") else side
    try: save(cube(f"block/{top}.png", f"block/{front}.png", f"block/{side}.png", 64), "block/" + f, [i])
    except Exception as e: print("skip", i, e)
for k, v in {"barrier": "barrier"}.items(): manifest["_fallback"] = manifest.get(v)
with open(OUT + "/icons.js", "w") as fh:
    fh.write("// Generated by tools/make_icons.py - maps Minecraft item ids to local icon files\nwindow.ICONS = " + json.dumps(manifest, separators=(",", ":")) + ";\n")
print(len(manifest), "icons")
