"""
Diagnostic script: run against test_tiles.pdf and show exactly
which images are dropped at each filter stage and why.

Usage (from backend/ folder):
  python diagnose_images.py [path_to_pdf]
"""
import sys
import hashlib

try:
    import fitz
except ImportError:
    print("PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)

PDF_PATH = sys.argv[1] if len(sys.argv) > 1 else "test_tiles.pdf"

doc = fitz.open(PDF_PATH)
total_pages = len(doc)
print(f"\n{'='*60}")
print(f"PDF: {PDF_PATH}  |  Pages: {total_pages}")
print(f"{'='*60}\n")

grand_total   = 0
dropped_size  = 0
dropped_area  = 0
dropped_xref0 = 0
dropped_mirror= 0
dropped_xref_seen = 0
dropped_hash  = 0
dropped_name  = 0
kept          = 0

seen_xrefs = set()
seen_hashes = set()
seen_tile_numbers = {}  # tile_number -> tile_name

for page_num in range(total_pages):
    page = doc[page_num]
    page_rect = page.rect
    page_area = page_rect.width * page_rect.height
    page_x_center = page_rect.width / 2

    raw_infos = list(page.get_image_info(xrefs=True))
    grand_total += len(raw_infos)

    print(f"--- Page {page_num+1} ({len(raw_infos)} raw images) ---")

    stage1 = []
    for info in raw_infos:
        xref = info.get("xref")
        w    = info.get("width", 0) or 0
        h    = info.get("height", 0) or 0
        img_bbox = info.get("bbox")
        bbox_area = (
            (img_bbox[2]-img_bbox[0])*(img_bbox[3]-img_bbox[1])
            if img_bbox else w*h
        )
        rel_area = bbox_area / page_area if page_area > 0 else 1

        reason = None
        if not xref:
            reason = "no xref"
            dropped_xref0 += 1
        elif w < 100 or h < 100:
            reason = f"too small ({w}x{h})"
            dropped_size += 1
        elif rel_area > 0.90:
            reason = f"full-page background ({rel_area:.0%} of page)"
            dropped_area += 1

        if reason:
            print(f"  [DROP-size/area] xref={xref} {w}x{h} rel={rel_area:.1%}  reason={reason}")
        else:
            stage1.append({
                "xref": xref, "width": w, "height": h,
                "area": w*h, "relative_area": rel_area, "bbox": img_bbox
            })
            print(f"  [PASS-stage1]    xref={xref} {w}x{h} rel={rel_area:.1%}")

    # Mirror dedup
    filtered_infos = []
    for a in stage1:
        is_mirror = False
        for b in filtered_infos:
            if a["width"] == b["width"] and a["height"] == b["height"]:
                ba, bb = a["bbox"], b["bbox"]
                if ba and bb:
                    ay = (ba[1]+ba[3])/2; by = (bb[1]+bb[3])/2
                    if abs(ay-by)/max(page_rect.height,1) < 0.15:
                        ax = (ba[0]+ba[2])/2; bx = (bb[0]+bb[2])/2
                        mirrored_x = abs((ax-page_x_center)+(bx-page_x_center))
                        if mirrored_x/max(page_rect.width,1) < 0.15:
                            is_mirror = True
                            break
        if is_mirror:
            dropped_mirror += 1
            print(f"  [DROP-mirror]    xref={a['xref']} {a['width']}x{a['height']}")
        else:
            filtered_infos.append(a)

    # Sort by area desc (largest first = preferred)
    filtered_infos.sort(key=lambda c: -c["area"])

    for info in filtered_infos:
        xref = info["xref"]

        # xref dedup
        if xref in seen_xrefs:
            dropped_xref_seen += 1
            print(f"  [DROP-xref-dup]  xref={xref} already seen in earlier page")
            continue
        seen_xrefs.add(xref)

        # Extract bytes
        try:
            base_image = doc.extract_image(xref)
            if not base_image or "image" not in base_image:
                print(f"  [DROP-extract]   xref={xref} extract failed")
                continue
        except Exception as e:
            print(f"  [DROP-extract]   xref={xref} exception: {e}")
            continue

        img_bytes = base_image["image"]
        img_hash  = hashlib.md5(img_bytes).hexdigest()

        # Hash dedup
        if img_hash in seen_hashes:
            dropped_hash += 1
            print(f"  [DROP-hash-dup]  xref={xref} hash={img_hash[:8]}... duplicate bytes")
            continue
        seen_hashes.add(img_hash)

        # Name dedup (simplified — no text extraction here)
        print(f"  [KEPT]           xref={xref} {info['width']}x{info['height']} "
              f"hash={img_hash[:8]}... size={len(img_bytes)//1024}KB")
        kept += 1

    print()

print(f"{'='*60}")
print(f"SUMMARY")
print(f"  Total raw image entries in PDF : {grand_total}")
print(f"  Dropped (no xref)             : {dropped_xref0}")
print(f"  Dropped (too small <100px)    : {dropped_size}")
print(f"  Dropped (full-page >90% area) : {dropped_area}")
print(f"  Dropped (mirror dedup)        : {dropped_mirror}")
print(f"  Dropped (xref already seen)   : {dropped_xref_seen}")
print(f"  Dropped (identical bytes/hash): {dropped_hash}")
print(f"  KEPT (would be extracted)     : {kept}")
print(f"{'='*60}")
print(f"\nExpected 11, got {kept}. Missing: {11 - kept}")
