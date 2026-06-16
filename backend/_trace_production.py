"""Trace each raw PDF image through catalog_service.extract_tiles_from_pdf filters."""
import hashlib
import fitz
from app.services.catalog_service import extract_text_info, _image_hash, _image_extension, _make_filename

PDF_PATH = r"C:\Users\akram\Downloads\SHERGAON.pdf"
doc = fitz.open(PDF_PATH)
total_pages = len(doc)

print("=" * 72)
print("PRODUCTION TRACE (matches catalog_service.extract_tiles_from_pdf)")
print(f"PDF: {PDF_PATH}  pages={total_pages}")
print("Stage1: xref, min 100px, relative_area < 0.98 (NOT mirror dedup)")
print("Then: sort by pixel area desc, extract, xref dedup, hash dedup, name dedup")
print("=" * 72)

seen_hashes = set()
seen_xrefs = set()
seen_tile_numbers = {}
seen_filenames = set()
raw_tiles = []

grand_raw = 0
idx = 0

for page_num in range(total_pages):
    page = doc[page_num]
    page_text = page.get_text("blocks")
    text_blocks = []
    for block in page_text:
        if len(block) >= 5 and isinstance(block[4], str) and block[4].strip():
            text_blocks.append({"bbox": block[:4], "text": block[4].strip()})

    page_rect = page.rect
    page_area = page_rect.width * page_rect.height

    raw_infos = list(page.get_image_info(xrefs=True))
    print(f"\n--- Page {page_num+1}: {len(raw_infos)} raw image entries ---")

    image_infos = []
    for info in raw_infos:
        idx += 1
        grand_raw += 1
        tag = f"RAW#{idx}"
        xref = info.get("xref")
        w = info.get("width", 0) or 0
        h = info.get("height", 0) or 0
        img_bbox = info.get("bbox")
        bbox_area = (
            (img_bbox[2] - img_bbox[0]) * (img_bbox[3] - img_bbox[1])
            if img_bbox
            else w * h
        )
        relative_area = bbox_area / page_area if page_area > 0 else 1

        if not xref:
            print(f"  {tag} [DROP stage1] no xref  {w}x{h} rel={relative_area:.1%}")
            continue
        if w < 100 or h < 100:
            print(f"  {tag} [DROP stage1] too small  xref={xref} {w}x{h} rel={relative_area:.1%}")
            continue
        if relative_area >= 0.98:
            print(f"  {tag} [DROP stage1] full-page bg (>=98%)  xref={xref} {w}x{h} rel={relative_area:.1%}")
            continue

        print(f"  {tag} [PASS stage1] xref={xref} {w}x{h} px_area={w*h} rel={relative_area:.1%}")
        image_infos.append({
            "xref": xref,
            "width": w,
            "height": h,
            "area": w * h,
            "relative_area": relative_area,
            "bbox": img_bbox,
            "raw_tag": tag,
        })

    if not image_infos:
        print("  (no stage1 survivors on this page)")
        continue

    image_infos.sort(key=lambda c: -c["area"])
    print(f"  Processing order after area sort: " + ", ".join(
        f"{c['raw_tag']}(xref={c['xref']})" for c in image_infos
    ))

    for info in image_infos:
        tag = info["raw_tag"]
        xref = info["xref"]
        try:
            base_image = doc.extract_image(xref)
            if not base_image or "image" not in base_image:
                print(f"  {tag} [DROP extract] xref={xref} no image bytes")
                continue
        except Exception as e:
            print(f"  {tag} [DROP extract] xref={xref} {e}")
            continue

        img_bytes = base_image["image"]
        img_bbox = info.get("bbox")
        img_text_blocks = text_blocks
        if img_bbox:
            img_text_blocks = []
            scx = (img_bbox[0] + img_bbox[2]) / 2
            scy = (img_bbox[1] + img_bbox[3]) / 2
            for tb in text_blocks:
                t_bbox = tb["bbox"]
                tcx = (t_bbox[0] + t_bbox[2]) / 2
                tcy = (t_bbox[1] + t_bbox[3]) / 2
                if abs(tcx - scx) < page_rect.width * 0.50 and abs(tcy - scy) < page_rect.height * 0.50:
                    img_text_blocks.append(tb)

        tile_name, tile_number, _, finish, color, sku = extract_text_info(img_text_blocks)
        if not tile_number:
            _, tile_number, _, _, _, _ = extract_text_info(text_blocks)

        tile_name = tile_name or f"Tile Page {page_num+1}"
        tile_number = tile_number or f"PAGE-{page_num+1:03d}"
        img_hash = _image_hash(img_bytes)

        if xref in seen_xrefs:
            print(f"  {tag} [DROP xref-dedup] xref={xref} already seen  hash={img_hash[:8]} num={tile_number} name={tile_name}")
            continue
        seen_xrefs.add(xref)

        if img_hash in seen_hashes:
            print(f"  {tag} [DROP hash-dedup] xref={xref} hash={img_hash[:8]} num={tile_number} name={tile_name}")
            continue
        seen_hashes.add(img_hash)

        final_tile_number = tile_number
        original = final_tile_number
        if final_tile_number in seen_tile_numbers:
            existing_name = seen_tile_numbers[final_tile_number]
            current_name = (tile_name or "").strip().upper()
            if existing_name == current_name:
                print(
                    f"  {tag} [DROP name-dedup] xref={xref} hash={img_hash[:8]} "
                    f"num={final_tile_number} name={tile_name} (same as prior entry)"
                )
                continue
            suffix = 2
            while final_tile_number in seen_tile_numbers:
                final_tile_number = f"{original}-{suffix}"
                suffix += 1
            print(f"  {tag} [RENAME tile_number] {original} -> {final_tile_number} (name clash)")

        seen_tile_numbers[final_tile_number] = (tile_name or "").strip().upper()
        ext = _image_extension(img_bytes)
        filename = _make_filename(final_tile_number, tile_name, ext, seen_filenames)
        print(
            f"  {tag} [KEPT] xref={xref} {info['width']}x{info['height']} "
            f"hash={img_hash[:8]} size={len(img_bytes)//1024}KB "
            f"num={final_tile_number} name={tile_name} file={filename}"
        )
        raw_tiles.append(filename)

doc.close()

print("\n" + "=" * 72)
print(f"SUMMARY: raw entries={grand_raw}  final tiles={len(raw_tiles)}")
for i, fn in enumerate(raw_tiles, 1):
    print(f"  {i}. {fn}")
print("=" * 72)
