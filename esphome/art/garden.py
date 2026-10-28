#!/usr/bin/env python3
"""Draws the kid panel's garden and writes it out as PNGs for packages/garden.yaml.

    python3 esphome/art/garden.py        # needs Pillow; writes into esphome/art/

The art is generated, not drawn by hand: a pastel sky, sun, clouds, two hills and a row of
flowers by day; the same flowers asleep under a navy sky, a moon and stars by night, with a
butterfly asleep on a flower. Four butterflies in three wing positions and a firefly are the
sprites that packages/garden.yaml moves about. Everything is drawn at 4x and scaled down, so
the edges are smooth on a 320x240 panel that has no anti-aliasing of its own to give.

It began as tools/art.py in the author's own Arduino firmware for the same panel; the garden
here is that garden, redrawn for ESPHome. ESPHome turns the PNGs into RGB565 (backgrounds,
dithered) and RGB565 with alpha (sprites) at compile time, so the files here are the source
and the previews both. Generic art, no names, free to publish with the rest of the repo.
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 320, 240
SS = 4                       # supersampling factor
OUT = os.path.dirname(os.path.abspath(__file__))


def hexc(s, a=255):
    s = s.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)


def mix(c1, c2, t):
    return tuple(int(round(c1[i] * (1 - t) + c2[i] * t)) for i in range(3)) + ((c1[3] if len(c1) > 3 else 255),)


# ---- shapes -------------------------------------------------------------------------------------

def ellipse_pts(cx, cy, rx, ry, rot=0.0, n=48):
    c, s = math.cos(rot), math.sin(rot)
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts


def vgrad(w, h, stops):
    """Vertical gradient through (y_fraction, colour) stops."""
    im = Image.new("RGBA", (w, h))
    px = im.load()
    for y in range(h):
        f = y / (h - 1)
        for i in range(len(stops) - 1):
            if stops[i][0] <= f <= stops[i + 1][0]:
                t = (f - stops[i][0]) / max(1e-6, stops[i + 1][0] - stops[i][0])
                c = mix(stops[i][1], stops[i + 1][1], t)
                break
        else:
            c = stops[-1][1]
        for x in range(w):
            px[x, y] = c
    return im


def hill(d, base_y, amp, phase, freq, colour, w):
    pts = [(0, H * SS)]
    for x in range(0, w + 1, 4):
        y = base_y + amp * math.sin(x / w * math.pi * freq + phase)
        pts.append((x, y))
    pts.append((w, H * SS))
    d.polygon(pts, fill=colour)


# Flowers are placed once and drawn twice, by day and by night, so the night garden is the same
# garden asleep rather than a different one.
FLOWERS = []


def plan_flowers():
    rnd = random.Random(8)
    kinds = ["daisy", "round", "tulip", "round", "daisy", "tulip", "round", "bell"]
    palette = {
        "round": [("#F7A9C4", "#E784A8"), ("#C9B5F0", "#A28BDB"), ("#FFC9A3", "#F29E6B"), ("#A9D8F2", "#7DBBE3")],
        "tulip": [("#F59CB8", "#E0779A"), ("#FFB9A0", "#EE8E70"), ("#D2B6F2", "#AF8CE0")],
        "daisy": [("#FFFFFF", "#F1E6EE")],
        "bell": [("#B8A6EE", "#9581D6"), ("#9CCDEF", "#76AEDC")],
    }
    # Tall flowers peek over the two light buttons (which sit at y 184..230), short ones fill the
    # gaps either side and underneath.
    xs = [10, 38, 66, 92, 120, 160, 196, 224, 252, 282, 308]
    for i, x in enumerate(xs):
        k = kinds[i % len(kinds)]
        fill, edge = rnd.choice(palette[k])
        head_y = rnd.randint(146, 168)
        size = rnd.uniform(9.5, 12.5) if k != "bell" else 8
        FLOWERS.append(dict(kind=k, x=x + rnd.uniform(-4, 4), y=head_y, r=size, fill=fill, edge=edge,
                            tilt=rnd.uniform(-0.25, 0.25), leaf=rnd.choice([-1, 1])))
    # little ones low down, mostly seen in the gaps
    for x in [2, 24, 52, 80, 108, 136, 160, 184, 212, 240, 268, 296, 318]:
        k = rnd.choice(["round", "daisy"])
        fill, edge = rnd.choice(palette[k])
        FLOWERS.append(dict(kind=k, x=x + rnd.uniform(-5, 5), y=rnd.randint(214, 234), r=rnd.uniform(5, 7),
                            fill=fill, edge=edge, tilt=0, leaf=0))


def draw_flower(d, f, tint):
    s = SS
    x, y, r = f["x"] * s, f["y"] * s, f["r"] * s
    stem = tint("#7CC48A")
    leafc = tint("#94D49E")
    # stem down to the ground, with a lean
    top = (x, y)
    bot = (x - f["tilt"] * 40 * s, H * s)
    d.line([top, bot], fill=stem, width=int(2.4 * s))
    if f["leaf"]:
        ly = y + (H * s - y) * 0.35
        lx = x - f["tilt"] * 40 * s * 0.35
        d.polygon(ellipse_pts(lx + f["leaf"] * 6 * s, ly, 7 * s, 3 * s, f["leaf"] * -0.5), fill=leafc)
    k = f["kind"]
    fill, edge = tint(f["fill"]), tint(f["edge"])
    if k == "daisy":
        for p in range(10):
            a = p / 10 * 2 * math.pi + f["tilt"]
            d.polygon(ellipse_pts(x + math.cos(a) * r * 0.62, y + math.sin(a) * r * 0.62, r * 0.55, r * 0.22, a),
                      fill=edge)
            d.polygon(ellipse_pts(x + math.cos(a) * r * 0.6, y + math.sin(a) * r * 0.6, r * 0.5, r * 0.18, a),
                      fill=fill)
        d.ellipse([x - r * 0.36, y - r * 0.36, x + r * 0.36, y + r * 0.36], fill=tint("#FFD15C"))
        d.ellipse([x - r * 0.2, y - r * 0.28, x + r * 0.12, y - r * 0.02], fill=tint("#FFE89A"))
    elif k == "round":
        for p in range(5):
            a = p / 5 * 2 * math.pi - math.pi / 2 + f["tilt"]
            cx, cy = x + math.cos(a) * r * 0.55, y + math.sin(a) * r * 0.55
            d.ellipse([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], fill=edge)
            d.ellipse([cx - r * 0.47, cy - r * 0.47, cx + r * 0.47, cy + r * 0.47], fill=fill)
        d.ellipse([x - r * 0.3, y - r * 0.3, x + r * 0.3, y + r * 0.3], fill=tint("#FFE07A"))
    elif k == "tulip":
        # a cup: three petals, the middle one in front
        for dx in (-0.45, 0.45):
            d.polygon(ellipse_pts(x + dx * r, y, r * 0.5, r * 0.85, dx * 0.5), fill=edge)
        d.polygon(ellipse_pts(x, y + r * 0.1, r * 0.55, r * 0.9), fill=fill)
        d.polygon([(x - r * 0.95, y - r * 0.2), (x - r * 0.5, y - r * 1.0), (x - r * 0.15, y - r * 0.35)], fill=fill)
        d.polygon([(x + r * 0.95, y - r * 0.2), (x + r * 0.5, y - r * 1.0), (x + r * 0.15, y - r * 0.35)], fill=fill)
        d.polygon([(x - r * 0.3, y - r * 0.4), (x, y - r * 1.05), (x + r * 0.3, y - r * 0.4)], fill=fill)
    elif k == "bell":
        for i in range(3):
            by = y + i * r * 1.3
            bx = x + (i - 1) * r * 0.4
            d.ellipse([bx - r * 0.7, by - r * 0.6, bx + r * 0.7, by + r * 0.7], fill=edge)
            d.ellipse([bx - r * 0.6, by - r * 0.55, bx + r * 0.6, by + r * 0.55], fill=fill)


def cloud(d, cx, cy, sc, colour):
    for dx, dy, rr in [(-18, 4, 11), (-6, -4, 14), (9, -1, 12), (20, 5, 9), (0, 7, 11)]:
        x, y, r = (cx + dx * sc) * SS, (cy + dy * sc) * SS, rr * sc * SS
        d.ellipse([x - r, y - r, x + r, y + r], fill=colour)


# ---- butterflies --------------------------------------------------------------------------------

BUTTERFLIES = [
    ("pink",  "#F9B4CF", "#E06C9C", "#FFE6F0"),
    ("lilac", "#CDB8F5", "#8F74D6", "#F1EAFF"),
    ("peach", "#FFD39A", "#EE9A4E", "#FFF2DA"),
    ("blue",  "#A9DBF7", "#5FA9DD", "#E8F7FF"),
]
BW, BH = 30, 26
FLAP = [1.0, 0.62, 0.26]     # wing spread per frame


def butterfly(fill, edge, spot, spread, sleeping=False):
    s = 8
    im = Image.new("RGBA", (BW * s, BH * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = BW * s / 2, BH * s / 2 + 1 * s
    f, e, sp = hexc(fill), hexc(edge), hexc(spot)
    body = hexc("#5B3A6E")

    def wing(ox, oy, rx, ry, rot, colour):
        pts = ellipse_pts(ox, oy, rx, ry, rot)
        # squash towards the body for the flap
        return [(cx + (px - cx) * spread, py) for px, py in pts]

    for side in (-1, 1):
        up = wing(cx + side * 7.5 * s, cy - 4.5 * s, 7.6 * s, 6.4 * s, side * -0.45, f)
        lo = wing(cx + side * 5.6 * s, cy + 4.2 * s, 5.2 * s, 4.6 * s, side * 0.5, f)
        d.polygon(up, fill=e)
        d.polygon(lo, fill=e)
        upi = [(cx + (px - cx) * 0.86 + side * 0.5 * s * spread, cy + (py - cy) * 0.86 - 0.4 * s) for px, py in up]
        loi = [(cx + (px - cx) * 0.82 + side * 0.4 * s * spread, cy + (py - cy) * 0.82 + 0.4 * s) for px, py in lo]
        d.polygon(upi, fill=f)
        d.polygon(loi, fill=f)
        # spots
        sx = cx + side * 9 * s * spread
        d.ellipse([sx - 1.8 * s * spread, cy - 6.5 * s, sx + 1.8 * s * spread, cy - 2.9 * s], fill=sp)
        sx2 = cx + side * 5.5 * s * spread
        d.ellipse([sx2 - 1.2 * s * spread, cy + 3.5 * s, sx2 + 1.2 * s * spread, cy + 5.9 * s], fill=sp)
    # body, head, antennae
    d.ellipse([cx - 1.4 * s, cy - 7 * s, cx + 1.4 * s, cy + 7.5 * s], fill=body)
    d.ellipse([cx - 2.1 * s, cy - 9.6 * s, cx + 2.1 * s, cy - 5.6 * s], fill=body)
    for side in (-1, 1):
        pts = [(cx + side * 1.0 * s, cy - 9 * s), (cx + side * 3.0 * s, cy - 11.6 * s), (cx + side * 4.6 * s, cy - 12.6 * s)]
        d.line(pts, fill=body, width=int(0.9 * s))
        ex, ey = pts[-1]
        d.ellipse([ex - 1.1 * s, ey - 1.1 * s, ex + 1.1 * s, ey + 1.1 * s], fill=body)
    if sleeping:
        # closed eyes: two little arcs
        for side in (-1, 1):
            ex = cx + side * 0.9 * s
            d.arc([ex - 0.7 * s, cy - 8.2 * s, ex + 0.7 * s, cy - 7.0 * s], 0, 180, fill=hexc("#F3E6FF"), width=int(0.35 * s))
    return down(im, s)


def down(im, s):
    w, h = im.size[0] // s, im.size[1] // s
    return im.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")


def firefly():
    n = 16
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    px = im.load()
    c = (n - 1) / 2
    for y in range(n):
        for x in range(n):
            r = math.hypot(x - c, y - c)
            if r < 1.6:
                px[x, y] = (255, 250, 200, 255)
            else:
                a = max(0.0, 1 - (r - 1.6) / 6.2) ** 2.2
                px[x, y] = (236, 232, 140, int(a * 200))
    return im


# ---- scenes -------------------------------------------------------------------------------------

def scene_day():
    w, h = W * SS, H * SS
    im = vgrad(W, H, [(0, hexc("#BFE2F6")), (0.42, hexc("#E4F1FA")), (0.66, hexc("#FDEFF4")), (1, hexc("#FDEFF4"))])
    im = im.resize((w, h), Image.BILINEAR)
    d = ImageDraw.Draw(im)
    # a soft sun in the top-left corner, mostly off screen
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, (r, a) in enumerate([(70, 50), (56, 70), (44, 255)]):
        gd.ellipse([(-14 - r) * SS, (-14 - r) * SS, (-14 + r) * SS, (-14 + r) * SS],
                   fill=hexc("#FFF0B8", a) if i < 2 else hexc("#FFE38F"))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(3 * SS)))
    d = ImageDraw.Draw(im)
    cloud(d, 276, 24, 1.15, hexc("#FFFFFF", 235))
    cloud(d, 300, 100, 0.7, hexc("#FFFFFF", 225))
    cloud(d, 22, 112, 0.75, hexc("#FFFFFF", 225))
    hill(d, 160 * SS, 7 * SS, 0.6, 1.6, hexc("#D3F0DA"), w)
    hill(d, 176 * SS, 6 * SS, 2.2, 2.3, hexc("#BEE8C8"), w)
    for f in FLOWERS:
        draw_flower(d, f, hexc)
    return im.resize((W, H), Image.LANCZOS)


def scene_night():
    w, h = W * SS, H * SS
    im = vgrad(W, H, [(0, hexc("#0A0D26")), (0.62, hexc("#191A3E")), (1, hexc("#191A3E"))])
    im = im.resize((w, h), Image.BILINEAR)
    d = ImageDraw.Draw(im)
    rnd = random.Random(3)
    for _ in range(46):
        x, y = rnd.uniform(4, 316), rnd.uniform(4, 150)
        big = rnd.random() < 0.18
        c = mix(hexc("#5E6496"), hexc("#D7D9F2"), rnd.random() ** 1.5)
        if big:
            for (dx, dy) in [(1, 0), (0, 1)]:
                d.line([((x - 3 * dx) * SS, (y - 3 * dy) * SS), ((x + 3 * dx) * SS, (y + 3 * dy) * SS)], fill=c, width=SS)
            d.ellipse([(x - 1.1) * SS, (y - 1.1) * SS, (x + 1.1) * SS, (y + 1.1) * SS], fill=c)
        else:
            r = rnd.uniform(0.5, 0.95)
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=c)
    # a crescent moon, top right, with a faint halo
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    mx, my, mr = 290, 30, 15
    hd.ellipse([(mx - 26) * SS, (my - 26) * SS, (mx + 26) * SS, (my + 26) * SS], fill=hexc("#8A86C0", 40))
    im = Image.alpha_composite(im, halo.filter(ImageFilter.GaussianBlur(6 * SS)))
    moon = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(moon)
    md.ellipse([(mx - mr) * SS, (my - mr) * SS, (mx + mr) * SS, (my + mr) * SS], fill=255)
    md.ellipse([(mx - mr + 8) * SS, (my - mr - 5) * SS, (mx + mr + 8) * SS, (my + mr - 5) * SS], fill=0)
    im.paste(Image.new("RGBA", (w, h), hexc("#E6DCB4")), (0, 0), moon)
    d = ImageDraw.Draw(im)
    hill(d, 160 * SS, 7 * SS, 0.6, 1.6, hexc("#161C3A"), w)
    hill(d, 176 * SS, 6 * SS, 2.2, 2.3, hexc("#121731"), w)
    night = hexc("#131833")

    def tint(c):
        return mix(hexc(c), night, 0.76)
    for f in FLOWERS:
        draw_flower(d, f, tint)
    im = im.resize((W, H), Image.LANCZOS)
    # a butterfly asleep on a flower on the right, wings shut, and a couple of z's drifting up. Off
    # to the side so neither it nor its z's sit on the date.
    sleeper = butterfly("#7F6FA8", "#5E4F8A", "#9A8CC4", 0.22, sleeping=True)
    centre = min(FLOWERS[:11], key=lambda f: abs(f["x"] - 282))
    im.alpha_composite(sleeper, (int(centre["x"] - BW / 2), int(centre["y"] - BH + 4)))
    zd = ImageDraw.Draw(im)
    zd.text((centre["x"] + 9, centre["y"] - 30), "z", font=ImageFont.load_default(11), fill=hexc("#8E89B8"))
    zd.text((centre["x"] + 16, centre["y"] - 42), "z", font=ImageFont.load_default(14), fill=hexc("#7A76A6"))
    return im


# ---- output -------------------------------------------------------------------------------------

def main():
    plan_flowers()
    day, night = scene_day(), scene_night()
    day.convert("RGB").save(os.path.join(OUT, "bg_day.png"))
    night.convert("RGB").save(os.path.join(OUT, "bg_night.png"))
    sheet = Image.new("RGBA", (BW * 3 + 16 + 8, BH * len(BUTTERFLIES)), (230, 240, 250, 255))
    for row, (name, fill, edge, spot) in enumerate(BUTTERFLIES):
        for k, spread in enumerate(FLAP):
            im = butterfly(fill, edge, spot, spread)
            sheet.alpha_composite(im, (k * BW, row * BH))
            im.save(os.path.join(OUT, f"fly_{name}_{k}.png"))
    ff = firefly()
    sheet.alpha_composite(ff, (BW * 3 + 4, 4))
    ff.save(os.path.join(OUT, "firefly.png"))
    sheet.resize((sheet.size[0] * 4, sheet.size[1] * 4), Image.NEAREST).save(os.path.join(OUT, "preview-sprites.png"))
    print("garden: wrote", OUT)


if __name__ == "__main__":
    sys.exit(main())
