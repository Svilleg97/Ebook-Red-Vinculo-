"""Limpia los PNG del logo: elimina restos de recorte y el fringe de color."""
from PIL import Image
from collections import Counter

ALPHA_FLOOR = 24  # por debajo de esto el pixel se descarta


def dominant_colors(im, k=4):
    px = im.load()
    w, h = im.size
    c = Counter()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 240:
                c[(r // 8 * 8, g // 8 * 8, b // 8 * 8)] += 1
    tops = []
    for col, _ in c.most_common(60):
        if all(sum((col[i] - t[i]) ** 2 for i in range(3)) > 40 ** 2 for t in tops):
            tops.append(col)
        if len(tops) == k:
            break
    return tops


def nearest(col, palette):
    return min(palette, key=lambda p: sum((col[i] - p[i]) ** 2 for i in range(3)))


def clean(src, dst, force_white=False):
    im = Image.open(src).convert("RGBA")
    palette = dominant_colors(im)
    px = im.load()
    w, h = im.size
    fixed = dropped = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if a < ALPHA_FLOOR:
                px[x, y] = (0, 0, 0, 0)
                dropped += 1
                continue
            if force_white:
                px[x, y] = (255, 255, 255, a)
            elif a < 250:
                nr, ng, nb = nearest((r, g, b), palette)
                if (nr, ng, nb) != (r, g, b):
                    px[x, y] = (nr, ng, nb, a)
                    fixed += 1
    im = im.crop(im.getbbox())
    im.save(dst)
    return palette, fixed, dropped, im.size


for src, base in [("Icono.png", "icono"), ("Logo.png", "logo")]:
    pal, fx, dr, size = clean(src, f"assets/img/{base}.png")
    clean(src, f"assets/img/{base}-blanco.png", force_white=True)
    hexes = ["#%02X%02X%02X" % c for c in pal]
    print(f"{src} -> assets/img/{base}.png  {size}  paleta={hexes}  fringe_corregido={fx}  restos_eliminados={dr}")
