import json, re
from pathlib import Path

HERE = Path(__file__).parent
DATA = HERE.parent.parent / "data" / "states_data.json"
MAP_SVG = HERE.parent.parent / "assets" / "icons" / "INDIA_V3_smaller_viewbox.svg"

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

for name in ["pme-mobile-sheet", "pme-mobile-tabs"]:
    template = open(HERE / f"{name}-template.html", encoding="utf-8").read()
    out = template.replace("__STATES_JSON__", states_json).replace("__MAP_SVG_INNER__", map_inner)
    outpath = HERE / f"{name}.html"
    outpath.write_text(out, encoding="utf-8")
    print(name + ".html", len(out), "bytes")
