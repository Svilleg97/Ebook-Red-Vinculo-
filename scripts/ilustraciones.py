# -*- coding: utf-8 -*-
"""Genera las ilustraciones del ebook. Trazo de linea, paleta del brandbook."""
import math, os

TRAZO   = "#A8563F"
CLARO   = "#D28C72"
ARENA   = "#EADCC8"
SALVIA  = "#8FA48E"
TINTA   = "#3F342E"

W, H = 400, 260
OUT = "assets/svg"
os.makedirs(OUT, exist_ok=True)

def svg(nombre, cuerpo, w=W, h=H):
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
           f'fill="none" stroke-linecap="round" stroke-linejoin="round">\n{cuerpo}\n</svg>\n')
    open(f"{OUT}/{nombre}.svg", "w", encoding="utf-8").write(doc)
    return nombre

def hoja(x, y, ang, largo=30, ancho=13):
    """Hoja de la rama del brandbook."""
    a = largo; b = ancho
    d = (f'M0,0 C{a*0.34},{-b} {a*0.74},{-b*0.72} {a},0 '
         f'C{a*0.74},{b*0.72} {a*0.34},{b} 0,0 Z')
    return (f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})">'
            f'<path d="{d}" stroke="{TRAZO}" stroke-width="2"/>'
            f'<path d="M{a*0.12:.1f},0 L{a*0.86:.1f},0" stroke="{TRAZO}" stroke-width="1.4" opacity=".55"/>'
            f'</g>')

def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
    y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return x, y, math.degrees(math.atan2(dy, dx))

def figura(x, y, escala=1.0, color=TRAZO, sentada=False):
    """Persona muy simple: cabeza y cuerpo."""
    s = escala
    if sentada:
        cuerpo = (f'<path d="M{-13*s},{26*s} C{-13*s},{6*s} {-6*s},{2*s} 0,{2*s} '
                  f'C{6*s},{2*s} {13*s},{6*s} {13*s},{26*s} Z" stroke="{color}" stroke-width="{2.2*s:.1f}"/>')
    else:
        cuerpo = (f'<path d="M{-10*s},{34*s} C{-10*s},{8*s} {-4*s},{2*s} 0,{2*s} '
                  f'C{4*s},{2*s} {10*s},{8*s} {10*s},{34*s}" stroke="{color}" stroke-width="{2.2*s:.1f}"/>')
    return (f'<g transform="translate({x},{y})">'
            f'<circle cx="0" cy="{-9*s}" r="{8.5*s:.1f}" stroke="{color}" stroke-width="{2.2*s:.1f}"/>'
            f'{cuerpo}</g>')

# ---------------------------------------------------------------- antes
p0, p1, p2, p3 = (78, 232), (128, 196), (150, 118), (312, 54)
partes = [f'<path d="M{p0[0]},{p0[1]} C{p1[0]},{p1[1]} {p2[0]},{p2[1]} {p3[0]},{p3[1]}" stroke="{TRAZO}" stroke-width="2.4"/>']
for i, t in enumerate([.2, .34, .48, .62, .76, .9]):
    x, y, ang = bezier(p0, p1, p2, p3, t)
    partes.append(hoja(x, y, ang + (-46 if i % 2 == 0 else 46), 30 - i * 1.6, 13 - i * .6))
for i in range(4):
    partes.append(f'<circle cx="{92+i*13}" cy="{242-i*3}" r="2.1" fill="{CLARO}" stroke="none"/>')
svg("antes", "\n".join(partes))

# ---------------------------------------------------------------- cap-1 · la escalera
esc = []
x0, y0, pa, hu = 56, 228, 44, 26
perfil = [f"M{x0},{y0}"]
for i in range(6):
    perfil.append(f"h{pa} v{-hu}")
perfil.append("h22")
# los dos primeros escalones, donde todavia se puede frenar
esc.append(f'<path d="M{x0},{y0} h{pa} v{-hu} h{pa} v{-hu} h{pa} v{-hu} L{x0+pa*3},{y0} Z" fill="{ARENA}" stroke="none"/>')
esc.append(f'<path d="M{x0-16},{y0} H{x0+pa*6+30}" stroke="{TRAZO}" stroke-width="1.5" opacity=".4"/>')
esc.append(f'<path d="{" ".join(perfil)}" stroke="{TRAZO}" stroke-width="2.8"/>')
esc.append(figura(x0 + pa*4.5, y0 - hu*4 - 36, 1.0))
for i in range(6):
    o = .28 + i*.12
    esc.append(f'<circle cx="{x0+pa*i+pa/2}" cy="{y0-hu*i-7}" r="2.5" fill="{CLARO}" stroke="none" opacity="{o:.2f}"/>')
svg("cap-1", "\n".join(esc))

# ---------------------------------------------------------------- cap-2 · la retícula de los siete días
g = []
cols, filas = 7, 5
gx, gy, px, py = 74, 62, 42, 34
ventana = 3
g.append(f'<rect x="{gx-22}" y="{gy+py*ventana-17}" width="{px*(cols-1)+44}" height="34" rx="17" fill="{ARENA}" stroke="none"/>')
for f in range(filas):
    for c in range(cols):
        cx, cy = gx + c*px, gy + f*py
        if f == ventana:
            g.append(f'<circle cx="{cx}" cy="{cy}" r="5.4" fill="{TRAZO}" stroke="none"/>')
        else:
            lleno = (f, c) in {(0,1),(1,4),(2,2),(4,5),(1,0)}
            if lleno:
                g.append(f'<circle cx="{cx}" cy="{cy}" r="4.4" fill="{CLARO}" stroke="none" opacity=".85"/>')
            else:
                g.append(f'<circle cx="{cx}" cy="{cy}" r="3.4" stroke="{TRAZO}" stroke-width="1.5" opacity=".38"/>')
g.append(f'<path d="M{gx-26},{gy+py*ventana} H{gx-44}" stroke="{TRAZO}" stroke-width="3"/>')
svg("cap-2", "\n".join(g))

# ---------------------------------------------------------------- cap-3 · los quince minutos
q = []
cx, cy, r = 200, 118, 78
q.append(f'<path d="M{cx},{cy-r} A{r},{r} 0 0 1 {cx+r},{cy} L{cx},{cy} Z" fill="{ARENA}" stroke="none"/>')
q.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="{TRAZO}" stroke-width="2.4"/>')
q.append(f'<path d="M{cx},{cy-r} A{r},{r} 0 0 1 {cx+r},{cy}" stroke="{TRAZO}" stroke-width="5"/>')
q.append(f'<circle cx="{cx}" cy="{cy}" r="3.4" fill="{TRAZO}" stroke="none"/>')
q.append(f'<path d="M{cx},{cy} V{cy-r+14}" stroke="{TRAZO}" stroke-width="2.2"/>')
q.append(f'<path d="M{cx},{cy} H{cx+r-24}" stroke="{TRAZO}" stroke-width="2.2"/>')
q.append(figura(cx - 54, 210, 1.15, sentada=True))
q.append(figura(cx + 52, 216, .88, sentada=True))
for i, (bx, by) in enumerate([(-12, 232), (2, 232), (-5, 220)]):
    q.append(f'<rect x="{cx+bx}" y="{by}" width="13" height="13" rx="3" stroke="{TRAZO}" stroke-width="1.9"/>')
q.append(f'<path d="M92,246 H308" stroke="{TRAZO}" stroke-width="1.5" opacity=".35"/>')
svg("cap-3", "\n".join(q))

# ---------------------------------------------------------------- cap-4 · la reparación
rp = []
rp.append(f'<circle cx="207" cy="140" r="78" fill="{ARENA}" stroke="none" opacity=".7"/>')
# el hilo sube, se corta
rp.append(f'<path d="M40,214 C86,212 112,190 146,176 C160,170 172,166 182,162" stroke="{TRAZO}" stroke-width="3"/>')
# y sigue del otro lado
rp.append(f'<path d="M232,142 C244,138 258,130 274,120 C310,98 330,86 362,78" stroke="{CLARO}" stroke-width="3"/>')
# la vuelta despues del mal momento
rp.append(f'<path d="M182,162 C186,118 232,110 232,142" stroke="{TRAZO}" stroke-width="2.4" stroke-dasharray="1.5 7"/>')
rp.append(f'<circle cx="182" cy="162" r="4.8" fill="{TRAZO}" stroke="none"/>')
rp.append(f'<circle cx="232" cy="142" r="4.8" fill="{TRAZO}" stroke="none"/>')
for i in range(3):
    rp.append(f'<circle cx="{64+i*14}" cy="{240}" r="2.2" fill="{CLARO}" stroke="none" opacity="{.8-i*.2:.2f}"/>')
svg("cap-4", "\n".join(rp))

# ---------------------------------------------------------------- cap-5 · rutinas ancla
on = []
base, amp, largo = 150, 40, 74
d = [f"M52,{base}"]
anclas = []
for i in range(4):
    x = 52 + largo*i
    d.append(f"C{x+largo*0.22:.0f},{base-amp} {x+largo*0.78:.0f},{base+amp} {x+largo},{base}")
    anclas.append(x + largo)
on.append(f'<path d="{" ".join(d)}" stroke="{TRAZO}" stroke-width="2.6"/>')
on.append(f'<path d="M40,214 H360" stroke="{TRAZO}" stroke-width="1.4" opacity=".3"/>')
for x in [52] + anclas:
    on.append(f'<path d="M{x},{base} V206" stroke="{TRAZO}" stroke-width="1.4" opacity=".45" stroke-dasharray="2 6"/>')
    on.append(f'<circle cx="{x}" cy="{base}" r="5.2" fill="{TRAZO}" stroke="none"/>')
    on.append(f'<path d="M{x},200 V{219}" stroke="{TRAZO}" stroke-width="2.6"/>')
svg("cap-5", "\n".join(on))

# ---------------------------------------------------------------- cap-6 · dos adultos
dc = []
r1 = 66
dc.append(f'<circle cx="162" cy="126" r="{r1}" fill="{ARENA}" stroke="none" opacity=".8"/>')
dc.append(f'<circle cx="238" cy="126" r="{r1}" fill="{SALVIA}" stroke="none" opacity=".32"/>')
dc.append(f'<circle cx="162" cy="126" r="{r1}" stroke="{TRAZO}" stroke-width="2.6"/>')
dc.append(f'<circle cx="238" cy="126" r="{r1}" stroke="{TRAZO}" stroke-width="2.6"/>')
dc.append(f'<circle cx="200" cy="126" r="17" fill="{TRAZO}" stroke="none"/>')
dc.append(f'<path d="M96,214 H304" stroke="{TRAZO}" stroke-width="1.4" opacity=".3"/>')
for i in range(5):
    dc.append(f'<circle cx="{168+i*16}" cy="230" r="2.1" fill="{CLARO}" stroke="none"/>')
svg("cap-6", "\n".join(dc))

# ---------------------------------------------------------------- cap-7 · pedir ayuda
pa_ = []
ax, ay, aw, ah = 132, 232, 136, 132
pa_.append(f'<path d="M{ax},{ay} V{ay-ah} A{aw/2},{aw/2} 0 0 1 {ax+aw},{ay-ah} V{ay}" fill="{ARENA}" stroke="none" opacity=".7"/>')
pa_.append(f'<path d="M{ax},{ay} V{ay-ah} A{aw/2},{aw/2} 0 0 1 {ax+aw},{ay-ah} V{ay}" stroke="{TRAZO}" stroke-width="2.6"/>')
pa_.append(f'<path d="M{ax-34},{ay} H{ax+aw+34}" stroke="{TRAZO}" stroke-width="1.6" opacity=".45"/>')
q0, q1, q2, q3 = (168, 238), (196, 200), (176, 150), (246, 106)
pa_.append(f'<path d="M{q0[0]},{q0[1]} C{q1[0]},{q1[1]} {q2[0]},{q2[1]} {q3[0]},{q3[1]}" stroke="{TRAZO}" stroke-width="2.2"/>')
for i, t in enumerate([.3, .55, .8]):
    x, y, ang = bezier(q0, q1, q2, q3, t)
    pa_.append(hoja(x, y, ang + (-50 if i % 2 == 0 else 50), 25, 11))
for i in range(4):
    pa_.append(f'<circle cx="{300+i*15}" cy="{224-i*10}" r="2.2" fill="{CLARO}" stroke="none" opacity="{.9-i*.18:.2f}"/>')
svg("cap-7", "\n".join(pa_))

# ---------------------------------------------------------------- cierre · catorce días
cd = []
gx, gy, px, py = 96, 108, 33, 44
for f in range(2):
    for c in range(7):
        x, y = gx + c*px, gy + f*py
        n = f*7 + c
        if n < 7:
            cd.append(f'<circle cx="{x}" cy="{y}" r="4.6" stroke="{TRAZO}" stroke-width="1.8" opacity=".55"/>')
        else:
            cd.append(f'<circle cx="{x}" cy="{y}" r="5.4" fill="{TRAZO}" stroke="none"/>')
cd.insert(0, f'<rect x="{gx-20}" y="{gy-20}" width="{px*6+40}" height="{py+40}" rx="20" fill="{ARENA}" stroke="none" opacity=".8"/>')
cd.append(f'<path d="M{gx-6},{gy+py+34} H{gx+px*6+6}" stroke="{TRAZO}" stroke-width="2.2"/>')
cd.append(f'<path d="M{gx+px*6+6},{gy+py+34} l-9,-6 M{gx+px*6+6},{gy+py+34} l-9,6" stroke="{TRAZO}" stroke-width="2.2"/>')
svg("cierre", "\n".join(cd))

# ---------------------------------------------------------------- portada
pc = []
CW, CH = 400, 300
pc.append(f'<circle cx="352" cy="46" r="128" stroke="{ARENA}" stroke-width="2" opacity=".38"/>')
pc.append(f'<circle cx="258" cy="80" r="86" stroke="{ARENA}" stroke-width="2" opacity=".5"/>')
r0, r1_, r2, r3 = (146, 268), (192, 250), (214, 178), (338, 128)
pc.append(f'<path d="M{r0[0]},{r0[1]} C{r1_[0]},{r1_[1]} {r2[0]},{r2[1]} {r3[0]},{r3[1]}" stroke="{ARENA}" stroke-width="2.2" opacity=".9"/>')
for i, t in enumerate([.2, .42, .64, .86]):
    x, y, ang = bezier(r0, r1_, r2, r3, t)
    a = 26 - i*1.6; b = 11 - i*.7
    d = f'M0,0 C{a*0.34:.1f},{-b} {a*0.74:.1f},{-b*0.72:.1f} {a},0 C{a*0.74:.1f},{b*0.72:.1f} {a*0.34:.1f},{b} 0,0 Z'
    pc.append(f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang+(-46 if i%2==0 else 46):.1f})">'
              f'<path d="{d}" stroke="{ARENA}" stroke-width="1.8" opacity=".9"/></g>')
for i in range(5):
    for j in range(3):
        pc.append(f'<circle cx="{34+i*13}" cy="{214+j*13}" r="1.9" fill="{ARENA}" stroke="none" opacity=".4"/>')
svg("portada", "\n".join(pc), CW, CH)

# ---------------------------------------------------------------- hoja de referencia
hj = []
hx, hy, hw, hh = 92, 42, 216, 176
hj.append(f'<rect x="{hx}" y="{hy}" width="{hw}" height="{hh}" rx="10" fill="{ARENA}" stroke="none" opacity=".55"/>')
hj.append(f'<rect x="{hx}" y="{hy}" width="{hw}" height="{hh}" rx="10" stroke="{TRAZO}" stroke-width="2.2"/>')
cx1, cx2 = hx + hw*0.28, hx + hw*0.72
cy1, cy2 = hy + hh*0.3, hy + hh*0.72
# uno · la retícula de la ventana
for f in range(3):
    for c in range(4):
        x, y = cx1 - 21 + c*14, cy1 - 14 + f*14
        if f == 1: hj.append(f'<circle cx="{x}" cy="{y}" r="3.2" fill="{TRAZO}" stroke="none"/>')
        else: hj.append(f'<circle cx="{x}" cy="{y}" r="2.6" stroke="{TRAZO}" stroke-width="1.3" opacity=".45"/>')
# dos · el cuarto de hora
hj.append(f'<circle cx="{cx2}" cy="{cy1}" r="22" stroke="{TRAZO}" stroke-width="2"/>')
hj.append(f'<path d="M{cx2},{cy1-22} A22,22 0 0 1 {cx2+22},{cy1}" stroke="{TRAZO}" stroke-width="4"/>')
hj.append(f'<circle cx="{cx2}" cy="{cy1}" r="2.4" fill="{TRAZO}" stroke="none"/>')
# tres · el hilo que vuelve
hj.append(f'<path d="M{cx1-26},{cy2+8} C{cx1-14},{cy2+8} {cx1-10},{cy2-4} {cx1-2},{cy2-6}" stroke="{TRAZO}" stroke-width="2.4"/>')
hj.append(f'<path d="M{cx1+10},{cy2-10} C{cx1+18},{cy2-12} {cx1+22},{cy2-2} {cx1+28},{cy2}" stroke="{CLARO}" stroke-width="2.4"/>')
hj.append(f'<path d="M{cx1-2},{cy2-6} C{cx1+1},{cy2-22} {cx1+9},{cy2-24} {cx1+10},{cy2-10}" stroke="{TRAZO}" stroke-width="1.8" stroke-dasharray="1.2 5"/>')
hj.append(f'<circle cx="{cx1-2}" cy="{cy2-6}" r="3" fill="{TRAZO}" stroke="none"/>')
hj.append(f'<circle cx="{cx1+10}" cy="{cy2-10}" r="3" fill="{TRAZO}" stroke="none"/>')
# cuatro · la onda con anclas
d = [f"M{cx2-30},{cy2}"]
for i in range(3):
    x = cx2 - 30 + 21*i
    d.append(f"C{x+5},{cy2-11} {x+16},{cy2+11} {x+21},{cy2}")
hj.append(f'<path d="{" ".join(d)}" stroke="{TRAZO}" stroke-width="2.2"/>')
for i in range(4):
    hj.append(f'<circle cx="{cx2-30+21*i}" cy="{cy2}" r="3" fill="{TRAZO}" stroke="none"/>')
svg("hoja", "\n".join(hj))

print("ilustraciones generadas:", ", ".join(sorted(os.listdir(OUT))))
