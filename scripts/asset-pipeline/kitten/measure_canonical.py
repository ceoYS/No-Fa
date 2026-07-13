#!/usr/bin/env python3
"""Measure the canonical NoF kitten reference image (pure stdlib, no PIL).

Input:  a P6 binary PPM decoded from public/assets/pets/white_kitten_main.webp
        (e.g. via `ffmpeg -i white_kitten_main.webp out.ppm`).
Output: JSON with pixel-sampled colors and auto-detected eye/nose geometry.

The dark-pupil and pink-nose detections are threshold-based centroids; framing
landmarks that cannot be detected reliably (ear tips, head outline) stay
human-annotated in docs/NOF_CANONICAL_KITTEN_MEASURED_REFERENCE.md.
"""
import json
import sys


def load_ppm(path):
    with open(path, "rb") as f:
        data = f.read()
    if not data.startswith(b"P6"):
        sys.exit("not a P6 PPM")
    # header: P6 <w> <h> <maxval> then raw RGB
    parts = []
    i = 2
    while len(parts) < 3:
        while i < len(data) and data[i] in b" \t\r\n":
            i += 1
        if data[i : i + 1] == b"#":
            while data[i] not in b"\r\n":
                i += 1
            continue
        j = i
        while data[j] not in b" \t\r\n":
            j += 1
        parts.append(int(data[i:j]))
        i = j
    i += 1  # single whitespace after maxval
    w, h, maxval = parts
    return w, h, data[i:]


def px(buf, w, x, y):
    o = (y * w + x) * 3
    return buf[o], buf[o + 1], buf[o + 2]


def patch_mean(buf, w, h, x, y, r=2):
    rs = gs = bs = n = 0
    for yy in range(max(0, y - r), min(h, y + r + 1)):
        for xx in range(max(0, x - r), min(w, x + r + 1)):
            rr, gg, bb = px(buf, w, xx, yy)
            rs += rr
            gs += gg
            bs += bb
            n += 1
    return round(rs / n), round(gs / n), round(bs / n)


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def region_stats(points):
    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    return {
        "centroid": [round(cx, 1), round(cy, 1)],
        "bbox": [min(xs), min(ys), max(xs), max(ys)],
        "area_px": len(points),
        "equiv_diameter_px": round(2 * (len(points) / 3.14159) ** 0.5, 1),
    }


def main():
    ppm_path = sys.argv[1]
    w, h, buf = load_ppm(ppm_path)

    # -- fixed sample points (visually chosen landmarks, 5x5 mean) ----------
    samples = {
        "pupil_viewer_left": (528, 618),
        "pupil_viewer_right": (738, 588),
        "iris_ring_L_a": (490, 655),
        "iris_ring_L_b": (528, 676),
        "iris_ring_L_c": (565, 655),
        "iris_ring_R_a": (712, 640),
        "iris_ring_R_b": (745, 655),
        "iris_ring_R_c": (778, 638),
        "iris_ring_R_d": (760, 560),
        "nose_top": (652, 668),
        "nose_bottom": (655, 685),
        "inner_ear_viewer_left": (335, 430),
        "inner_ear_viewer_right": (735, 295),
        "fur_forehead": (560, 470),
        "fur_cheek": (420, 700),
        "fur_body": (560, 950),
        "fur_shadow_side": (400, 1000),
        "fur_rim_light_edge": (885, 540),
        "paw_pad": (555, 1075),
        "background_upper": (120, 250),
        "floor": (950, 1320),
    }
    colors = {}
    for name, (x, y) in samples.items():
        c = patch_mean(buf, w, h, x, y)
        colors[name] = {
            "xy": [x, y],
            "rgb": list(c),
            "hex": "#%02x%02x%02x" % c,
            "lum": round(lum(c), 1),
        }

    # -- auto-detect dark eye regions (pupil + dark iris rim) ----------------
    # scan box excludes the dark background beside the head and the mouth area
    eyes_l, eyes_r = [], []
    for y in range(500, 700):
        for x in range(400, 850):
            if lum(px(buf, w, x, y)) < 60:
                (eyes_l if x < 640 else eyes_r).append((x, y))
    eye_left = region_stats(eyes_l)
    eye_right = region_stats(eyes_r)

    # -- auto-detect pink nose (strict pink, excludes warm fur shadow) -------
    nose_pts = []
    for y in range(630, 720):
        for x in range(600, 720):
            r, g, b = px(buf, w, x, y)
            if r > 185 and (r - g) > 60 and (r - b) > 60:
                nose_pts.append((x, y))
    nose = region_stats(nose_pts)

    derived = {}
    if eye_left and eye_right:
        dx = eye_right["centroid"][0] - eye_left["centroid"][0]
        dy = eye_right["centroid"][1] - eye_left["centroid"][1]
        derived["eye_center_distance_px"] = round((dx * dx + dy * dy) ** 0.5, 1)
        derived["head_tilt_deg_from_eye_line"] = round(
            __import__("math").degrees(__import__("math").atan2(-dy, dx)), 1
        )
        derived["inner_eye_gap_px"] = eye_right["bbox"][0] - eye_left["bbox"][2]

    print(
        json.dumps(
            {
                "image": {"width": w, "height": h, "source": ppm_path},
                "sampled_colors": colors,
                "dark_eye_region_left": eye_left,
                "dark_eye_region_right": eye_right,
                "pink_nose_region": nose,
                "derived": derived,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
