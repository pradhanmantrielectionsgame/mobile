
import sys
import json
from lxml import etree
from svgpathtools import parse_path
import math


SVG_FILE = "assets/icons/INDIA_V2.svg"  # Change to your SVG file path
MIN_TOUCH = 44  # px
VIEWPORTS = [320, 360, 375, 414, 480]
STATES_DATA_FILE = "data/states_data.json"

def get_viewbox(svg_root):
    vb = svg_root.attrib.get("viewBox")
    if vb:
        return list(map(float, vb.strip().split()))
    width = float(svg_root.attrib.get("width", 0))
    height = float(svg_root.attrib.get("height", 0))
    return [0, 0, width, height]

def get_bbox(path_d):
    path = parse_path(path_d)
    xmin, xmax, ymin, ymax = path.bbox()
    return xmin, xmax, ymin, ymax


def load_state_mapping():
    with open(STATES_DATA_FILE, encoding="utf-8-sig") as f:
        data = json.load(f)
    return {entry["SvgId"]: entry["State"] for entry in data}

def main():
    state_map = load_state_mapping()
    tree = etree.parse(SVG_FILE)
    root = tree.getroot()
    viewbox = get_viewbox(root)
    vb_width = viewbox[2]
    vb_height = viewbox[3]

    # Find all paths/groups with id or label
    elements = []
    for el in root.iter():
        if el.tag.endswith('path') and 'd' in el.attrib:
            svg_id = el.attrib.get('id')
            label = state_map.get(svg_id, svg_id or "unnamed")
            try:
                xmin, xmax, ymin, ymax = get_bbox(el.attrib['d'])
                elements.append({
                    "label": label,
                    "width": xmax - xmin,
                    "height": ymax - ymin
                })
            except Exception as e:
                print(f"Error parsing {label}: {e}")

    for vp in VIEWPORTS:
        scale = vp / vb_width
        print(f"\nViewport: {vp}px wide (scale: {scale:.3f})")
        too_small = []
        for el in elements:
            w = el["width"] * scale
            h = el["height"] * scale
            if w < MIN_TOUCH or h < MIN_TOUCH:
                too_small.append((el["label"], round(w,1), round(h,1)))
        if too_small:
            print("States too small for touch:")
            for label, w, h in too_small:
                print(f"  {label}: {w} x {h} px")
        else:
            print("All states are large enough.")

if __name__ == "__main__":
    main()
