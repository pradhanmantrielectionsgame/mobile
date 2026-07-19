import json, re
from urllib.parse import quote

BASE = r"C:/Users/swesr/AppData/Local/Temp/claude/D--Samit-s-Data-Python-Scripts/e802ba07-9a68-4a21-9cd0-1ba2fc2de5dc/scratchpad"
DATA = r"D:/Samit's Data/Python Scripts/PradhanMantri Elections Game Mobile/data/states_data.json"
MAP_SVG = r"D:/Samit's Data/Python Scripts/PradhanMantri Elections Game Mobile/assets/icons/INDIA_V3_smaller_viewbox.svg"
TEMPLATE = BASE + "/pme-play-template.html"

GROUP_KEYS = ["UnionTerritory","CoastalIndia","NortheastIndia","SouthIndia","HindiHeartland",
              "AgriculturalRegion","BorderLands","Pilgrimage","IndustrialCorridor","Manufacturing",
              "Education","TribalLands","TravelAndTourism","NaturalResources","MinorityAreas"]

raw = json.load(open(DATA, encoding="utf-8-sig"))
states = []
for s in raw:
    groups = [k for k in GROUP_KEYS if s.get(k) == "TRUE"]
    states.append({
        "name": s["State"],
        "seats": int(s["LokSabhaSeats"]),
        "svgId": s["SvgId"],
        "groups": groups,
    })
states_json = json.dumps(states, separators=(",", ":"))

src = open(MAP_SVG, encoding="utf-8").read()
m = re.search(r"<svg[^>]*>(.*)</svg>", src, re.S)
map_inner = m.group(1)

template = open(TEMPLATE, encoding="utf-8").read()

skins = {
    "A": dict(
        file="pme-play-evm.html",
        title="Pradhan Mantri — EVM Console",
        short_name="PME EVM",
        C_BG="#3E5A82", C_CHROME="#EAE2C8", C_CHROME2="#DCD2AE",
        C_INK="#1D2027", C_INKSOFT="#3A4356",
        C_P1="#3FA34D", C_P2="#C23B32", C_MAPBASE="#8FA0BE", C_MAPSTROKE="#2E4463",
        C_ACCENT="#E0A73B",
        F_DISPLAY='"Bahnschrift","Arial Narrow","Segoe UI",sans-serif',
        F_BODY='-apple-system,"Segoe UI",sans-serif',
        F_MONO='ui-monospace,"Consolas","Cascadia Mono",monospace',
        EXTRA_CSS="""
.header{ box-shadow:inset 0 -2px 4px rgba(0,0,0,.15); }
.pchip, .iconbtn{ box-shadow:inset 0 1px 3px rgba(0,0,0,.3); }
.gbtn{ box-shadow:inset 0 1px 2px rgba(0,0,0,.25); }
.groups-grid{ box-shadow:inset 0 2px 4px rgba(0,0,0,.15); }
""",
    ),
    "B": dict(
        file="pme-play-broadcast.html",
        title="Pradhan Mantri — Election Night Live",
        short_name="PME Live",
        C_BG="#0A1B36", C_CHROME="#0E2547", C_CHROME2="#16305E",
        C_INK="#F3EEDF", C_INKSOFT="#B9C3D6",
        C_P1="#E0812C", C_P2="#3E8F5E", C_MAPBASE="#26314A", C_MAPSTROKE="#0A1B36",
        C_ACCENT="#D9A94A",
        F_DISPLAY='"Segoe UI","Helvetica Neue",sans-serif',
        F_BODY='-apple-system,"Segoe UI",sans-serif',
        F_MONO='ui-monospace,"Consolas","Cascadia Mono",monospace',
        EXTRA_CSS="""
.header{ border-bottom:2px solid var(--accent); }
.pchip{ border:1px solid var(--accent); }
.info-row{ border-left:3px solid var(--accent); padding-left:8px; }
.groups-grid{ border-top:2px solid var(--accent); }
.gbtn{ border-bottom:2px solid transparent; }
.gbtn.on{ border-bottom-color:var(--accent); background:var(--chrome-bg2); box-shadow:none; }
""",
    ),
    "C": dict(
        file="pme-play-gazette.html",
        title="Pradhan Mantri — The Gazette",
        short_name="PME Gazette",
        C_BG="#EFE6D2", C_CHROME="#F1E9D8", C_CHROME2="#E3D6B8",
        C_INK="#2B241C", C_INKSOFT="#6B6152",
        C_P1="#8C2A24", C_P2="#233A54", C_MAPBASE="#E3D6B8", C_MAPSTROKE="#2B241C",
        C_ACCENT="#8C2A24",
        F_DISPLAY='Georgia,"Iowan Old Style","Times New Roman",serif',
        F_BODY='Georgia,"Iowan Old Style","Times New Roman",serif',
        F_MONO='ui-monospace,"Consolas","Cascadia Mono",monospace',
        EXTRA_CSS="""
.header, .groups-grid{ background-image:
  repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 1px, transparent 1px, transparent 3px); }
.header{ border-bottom:2px solid var(--ink); }
.pchip{ border:1px solid var(--map-stroke); border-radius:3px; background:var(--chrome-bg2); }
.iconbtn{ border-radius:3px; border:1px solid var(--map-stroke); background:var(--chrome-bg2); }
.groups-grid{ border-top:2px solid var(--ink); }
.gbtn{ border-radius:3px; border:1px solid var(--map-stroke); }
.gbtn.on{ box-shadow:none; background:var(--ink); }
.gbtn.on span{ filter:grayscale(1) invert(1); }
""",
    ),
}

for key, sk in skins.items():
    icon_svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">'
        f'<rect width="180" height="180" rx="38" fill="{sk["C_ACCENT"]}"/>'
        f'<rect width="180" height="180" rx="38" fill="{sk["C_BG"]}" fill-opacity="0.12"/>'
        f'<text x="90" y="122" font-size="92" text-anchor="middle">\U0001F5F3</text>'
        f'</svg>'
    )
    icon_uri = "data:image/svg+xml," + quote(icon_svg)

    out = template
    out = out.replace("__SKIN_TITLE__", sk["title"])
    out = out.replace("__SHORT_NAME__", sk["short_name"])
    out = out.replace("__ICON_DATA_URI__", icon_uri)
    out = out.replace("__C_BG__", sk["C_BG"])
    out = out.replace("__C_CHROME2__", sk["C_CHROME2"])
    out = out.replace("__C_CHROME__", sk["C_CHROME"])
    out = out.replace("__C_INKSOFT__", sk["C_INKSOFT"])
    out = out.replace("__C_INK__", sk["C_INK"])
    out = out.replace("__C_P1__", sk["C_P1"])
    out = out.replace("__C_P2__", sk["C_P2"])
    out = out.replace("__C_MAPBASE__", sk["C_MAPBASE"])
    out = out.replace("__C_MAPSTROKE__", sk["C_MAPSTROKE"])
    out = out.replace("__C_ACCENT__", sk["C_ACCENT"])
    out = out.replace("__F_DISPLAY__", sk["F_DISPLAY"])
    out = out.replace("__F_BODY__", sk["F_BODY"])
    out = out.replace("__F_MONO__", sk["F_MONO"])
    out = out.replace("__SKIN_EXTRA_CSS__", sk["EXTRA_CSS"])
    out = out.replace("__STATES_JSON__", states_json)
    out = out.replace("__MAP_SVG_INNER__", map_inner)
    outpath = BASE + "/" + sk["file"]
    open(outpath, "w", encoding="utf-8").write(out)
    print(sk["file"], len(out), "bytes")
