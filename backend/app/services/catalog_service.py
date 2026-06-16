import hashlib
import logging
import re
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Tuple

from app.services.cloudinary_service import upload_image

logger = logging.getLogger(__name__)

SIZE_PATTERN = re.compile(r'(\d{2,4})\s*[xX×*/]\s*(\d{2,4})')
CODE_PATTERN = re.compile(r'(?:^|\s)([A-Za-z]{0,5}[-_.]?\d{3,8})(?:\s|$)')

import math

UPLOAD_WORKERS = 6
PAGE_WORKERS = 4

# Threshold for scanned/digital detection
TEXT_DENSITY_THRESHOLD = 50  # chars per page


def extract_text_info(text_blocks: List[dict]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    tile_number = None
    tile_size = None
    tile_name = None

    all_lines = [b.get("text", "").strip() for b in text_blocks if b.get("text", "").strip()]
    all_text = " ".join(all_lines)

    size_match = SIZE_PATTERN.search(all_text)
    if size_match:
        w, h = size_match.groups()
        tile_size = f"{w}x{h}"

    for line in all_lines:
        codes = CODE_PATTERN.findall(line)
        if codes:
            tile_number = codes[0]
            break

    for line in all_lines:
        if len(line) < 3 or len(line) > 80:
            continue
        if re.match(r'^[\d\s\.,\-_/#\[\]()]+$', line):
            continue

        cleaned = re.sub(r'\d{2,4}\s*[xX×*/]\s*\d{2,4}', '', line).strip()
        cleaned = re.sub(r'^[\s•\-_|/\\()\[\]{}]+', '', cleaned).strip()
        cleaned = re.sub(r'[\s•\-_|/\\()\[\]{}]+$', '', cleaned).strip()

        if cleaned and len(cleaned) > 2 and re.search(r'[A-Za-z]{2,}', cleaned):
            tile_name = cleaned
            break

    if not tile_name:
        for line in all_lines:
            cleaned = re.sub(r'\d{2,4}\s*[xX×*/]\s*\d{2,4}', '', line).strip()
            if cleaned and len(cleaned) > 2:
                tile_name = cleaned
                break

    if not tile_number and tile_name:
        codes = CODE_PATTERN.findall(tile_name)
        if codes:
            tile_number = codes[0]

    return tile_name, tile_number, tile_size


def _image_hash(img_bytes: bytes) -> str:
    return hashlib.md5(img_bytes).hexdigest()


def _upload_to_cloudinary(img_bytes: bytes, public_id: str) -> Optional[str]:
    try:
        return upload_image(img_bytes, public_id)
    except Exception as e:
        logger.warning(f"Cloudinary upload failed for {public_id}: {e}")
        return None


def _tile_score(img: dict, page_area: float) -> float:
    aspect = img["width"] / max(img["height"], 1)
    rel_area = img.get("bbox_area", img["width"] * img["height"]) / max(page_area, 1)

    score = 1.0

    if 0.33 <= aspect <= 3.0:
        score *= 1.5
    else:
        score *= 0.3

    if 0.02 <= rel_area <= 0.45:
        score *= 1.5
    elif rel_area < 0.005:
        score *= 0.1
    elif rel_area > 0.6:
        score *= 0.2

    if img["width"] >= 100 and img["height"] >= 100:
        score *= 1.3
    else:
        score *= 0.3

    return score


def _detect_pdf_type(pdf_bytes: bytes) -> str:
    import fitz
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if len(doc) == 0:
        doc.close()
        return "scanned"
    if _is_template_pdf(doc):
        doc.close()
        return "template"
    total_chars = 0
    pages_to_check = min(len(doc), 3)
    for i in range(pages_to_check):
        page = doc[i]
        text = page.get_text("text")
        total_chars += len(text.strip())
    doc.close()
    avg_chars = total_chars / max(pages_to_check, 1)
    if avg_chars < TEXT_DENSITY_THRESHOLD:
        return "scanned"
    return "digital"


def _detect_grid_layout(candidates: List[dict], page_width: float, page_height: float) -> Tuple[int, int, float, float]:
    if len(candidates) <= 1:
        return 1, 1, page_width, page_height

    y_centers = sorted([(c["bbox"][1] + c["bbox"][3]) / 2 for c in candidates if c.get("bbox")])
    if len(y_centers) < 2:
        return 1, len(candidates), page_width, page_height

    gaps_y = [y_centers[i+1] - y_centers[i] for i in range(len(y_centers)-1)]
    median_gap_y = sorted(gaps_y)[len(gaps_y)//2] if gaps_y else page_height
    rows = 0
    if median_gap_y > 0:
        total_h = y_centers[-1] - y_centers[0] + median_gap_y
        rows = max(1, round(total_h / median_gap_y))

    x_centers = sorted([(c["bbox"][0] + c["bbox"][2]) / 2 for c in candidates if c.get("bbox")])
    if len(x_centers) < 2:
        return max(1, rows), 1, page_width, page_height

    gaps_x = [x_centers[i+1] - x_centers[i] for i in range(len(x_centers)-1)]
    median_gap_x = sorted(gaps_x)[len(gaps_x)//2] if gaps_x else page_width
    cols = 0
    if median_gap_x > 0:
        total_w = x_centers[-1] - x_centers[0] + median_gap_x
        cols = max(1, round(total_w / median_gap_x))

    return max(1, rows), max(1, cols), median_gap_x, median_gap_y


def _assign_text_to_cells(
    candidates: List[dict],
    text_blocks: List[dict],
    cols: int,
    rows: int,
    cell_w: float,
    cell_h: float,
) -> dict:
    if not candidates or not candidates[0].get("bbox"):
        return {i: text_blocks for i in range(len(candidates))}

    min_x = min(c["bbox"][0] for c in candidates if c.get("bbox"))
    min_y = min(c["bbox"][1] for c in candidates if c.get("bbox"))

    cell_text_map = {}
    for idx, c in enumerate(candidates):
        bbox = c["bbox"]
        if not bbox:
            cell_text_map[idx] = text_blocks
            continue
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        col = int((cx - min_x) / cell_w) if cell_w > 0 else 0
        row = int((cy - min_y) / cell_h) if cell_h > 0 else 0
        col = max(0, min(col, cols - 1))
        row = max(0, min(row, rows - 1))

        cell_x0 = min_x + col * cell_w
        cell_y0 = min_y + row * cell_h
        cell_x1 = cell_x0 + cell_w
        cell_y1 = cell_y0 + cell_h

        assigned = []
        for tb in text_blocks:
            tb_cx = (tb["bbox"][0] + tb["bbox"][2]) / 2
            tb_cy = (tb["bbox"][1] + tb["bbox"][3]) / 2
            if cell_x0 <= tb_cx <= cell_x1 and cell_y0 <= tb_cy <= cell_y1:
                assigned.append(tb)
        cell_text_map[idx] = assigned
    return cell_text_map


def extract_tiles_from_pdf(
    pdf_bytes: bytes,
    catalog_name: str,
    tile_size_override: Optional[str] = None,
    page_start: Optional[int] = None,
    page_end: Optional[int] = None,
    min_width: int = 100,
    min_height: int = 100,
    tiles_per_page: Optional[int] = None,
) -> List[dict]:
    import fitz

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    logger.info(f"Processing catalog '{catalog_name}': {total_pages} pages")

    start_page = (page_start or 1) - 1
    end_page = min(page_end or total_pages, total_pages)

    for page_num in range(start_page, end_page):
        try:
            page = doc[page_num]
            page_text = page.get_text("blocks")
            page_rect = page.rect
            page_area = page_rect.width * page_rect.height

            candidates = []
            for info in page.get_image_info(xrefs=True):
                xref = info.get("xref")
                if not xref:
                    continue
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image or "image" not in base_image:
                        continue
                    w = base_image["width"]
                    h = base_image["height"]
                    img_bbox = info.get("bbox")
                    if img_bbox:
                        bbox_area = (img_bbox[2] - img_bbox[0]) * (img_bbox[3] - img_bbox[1])
                    else:
                        bbox_area = w * h
                    candidates.append({
                        "xref": xref,
                        "width": w,
                        "height": h,
                        "area": w * h,
                        "bbox_area": bbox_area,
                        "bytes": base_image["image"],
                        "bbox": img_bbox,
                    })
                except Exception as e:
                    logger.debug(f"Page {page_num+1} image {xref} extract error: {e}")

            if not candidates:
                continue

            for c in candidates:
                c["score"] = _tile_score(c, page_area)

            scored = sorted(candidates, key=lambda x: x["score"], reverse=True)
            selected = [s for s in scored if s["score"] >= 0.3]
            if not selected:
                selected = scored[:1]

            if tiles_per_page and len(selected) > tiles_per_page:
                selected = selected[:tiles_per_page]

            text_blocks = []
            for block in page_text:
                if len(block) >= 5 and isinstance(block[4], str) and block[4].strip():
                    text_blocks.append({"bbox": block[:4], "text": block[4].strip()})

            selection_with_bbox = [s for s in selected if s.get("bbox")]
            if len(selection_with_bbox) >= 2:
                rows, cols, cell_w, cell_h = _detect_grid_layout(selection_with_bbox, page_rect.width, page_rect.height)
                cell_text_map = _assign_text_to_cells(selection_with_bbox, text_blocks, cols, rows, cell_w, cell_h)
            else:
                cell_text_map = None

            for idx, sel in enumerate(selected):
                sel_bbox = sel.get("bbox")

                if cell_text_map is not None and idx < len(selection_with_bbox):
                    actual_idx = next(
                        (i for i, s in enumerate(selection_with_bbox) if s["xref"] == sel["xref"]),
                        idx
                    )
                    paired_text = cell_text_map.get(actual_idx, text_blocks)
                else:
                    below_text = []
                    overlapping_text = []
                    other_text = []

                    for tb in text_blocks:
                        t_bbox = tb["bbox"]
                        t_cx = (t_bbox[0] + t_bbox[2]) / 2
                        t_cy = (t_bbox[1] + t_bbox[3]) / 2

                        if sel_bbox:
                            if t_cy > sel_bbox[3] and t_cx > sel_bbox[0] and t_cx < sel_bbox[2]:
                                below_text.append(tb)
                            elif t_cx > sel_bbox[0] and t_cx < sel_bbox[2]:
                                overlapping_text.append(tb)
                            else:
                                other_text.append(tb)
                        else:
                            other_text.append(tb)

                    if below_text:
                        paired_text = below_text
                    elif overlapping_text:
                        paired_text = overlapping_text
                    else:
                        paired_text = other_text

                tile_name, tile_number, tile_size = extract_text_info(paired_text)
                if tile_size_override:
                    tile_size = tile_size_override

                final_tile_number = tile_number or f"PAGE-{page_num+1:03d}"
                original_number = final_tile_number
                suffix = 2
                while final_tile_number in seen_tile_numbers:
                    final_tile_number = f"{original_number}-{suffix}"
                    suffix += 1
                seen_tile_numbers.add(final_tile_number)

                img_hash = _image_hash(sel["bytes"])
                public_id = None
                if img_hash not in seen_hashes:
                    seen_hashes.add(img_hash)
                    public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"

                raw_tiles.append({
                    "tile_name": tile_name or f"Tile Page {page_num+1}",
                    "tile_number": final_tile_number,
                    "tile_size": tile_size,
                    "img_hash": img_hash,
                    "img_bytes": sel["bytes"] if public_id else None,
                    "public_id": public_id,
                    "catalog_name": catalog_name,
                    "page_number": page_num + 1,
                })

            if (page_num + 1) % 20 == 0:
                logger.info(f"  ... extracted {page_num+1}/{total_pages} pages, {len(raw_tiles)} tiles queued")

        except Exception as e:
            logger.error(f"Page {page_num+1} failed: {e}", exc_info=True)
            continue

    doc.close()
    logger.info(f"Extraction complete: {len(raw_tiles)} tiles from '{catalog_name}'. Uploading in parallel ({UPLOAD_WORKERS} workers)...")

    unique_uploads = [
        (t["img_bytes"], t["public_id"])
        for t in raw_tiles
        if t["img_bytes"] is not None
    ]
    hash_to_url = {}

    if unique_uploads:
        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_public = {
                executor.submit(_upload_to_cloudinary, img_bytes, public_id): public_id
                for img_bytes, public_id in unique_uploads
            }
            for future in as_completed(future_to_public):
                public_id = future_to_public[future]
                try:
                    url = future.result()
                    hash_to_url[public_id] = url
                except Exception as e:
                    logger.warning(f"Upload failed for {public_id}: {e}")
                    hash_to_url[public_id] = None

    tiles = []
    for t in raw_tiles:
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": hash_to_url.get(t["public_id"]) if t["public_id"] else None,
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"],
        })

    success_count = sum(1 for t in tiles if t["image_url"])
    logger.info(f"Done: {success_count}/{len(tiles)} tiles uploaded successfully for '{catalog_name}'")
    return tiles


# ── Template-based extraction (fixed coordinates) ──────────────────────────

TEMPLATE_CONFIG = {
    "page_width": 595.28,
    "page_height": 841.89,
    "margin": 50,
    "header_height": 45,
    "cols": 3,
    "rows": 4,
    "image_ratio": 0.6,
    "expected_label": "TileMaster Pro Standard Template",
}


def _template_cell_bounds(page_num: int):
    cfg = TEMPLATE_CONFIG
    cell_w = (cfg["page_width"] - 2 * cfg["margin"]) / cfg["cols"]
    cell_h = (cfg["page_height"] - 2 * cfg["margin"] - cfg["header_height"]) / cfg["rows"]
    cells = []
    for r in range(cfg["rows"]):
        for c in range(cfg["cols"]):
            x0 = cfg["margin"] + c * cell_w
            y0 = cfg["margin"] + cfg["header_height"] + r * cell_h
            x1 = x0 + cell_w
            y1 = y0 + cell_h

            img_y1 = y0 + cell_h * cfg["image_ratio"]
            img_rect = (x0 + 5, y0 + 5, x1 - 5, img_y1 - 5)

            ty = img_y1 + 2
            line_h = 9
            fields = {
                "sku":   (x0 + 30, ty, x1 - 5, ty + line_h),
                "size":  (x0 + 30, ty + line_h, x1 - 5, ty + 2 * line_h),
                "brand": (x0 + 30, ty + 2 * line_h, x1 - 5, ty + 3 * line_h),
                "finish":(x0 + 30, ty + 3 * line_h, x1 - 5, ty + 4 * line_h),
                "model": (x0 + 30, ty + 4 * line_h, x1 - 5, ty + 5 * line_h),
            }
            cells.append((img_rect, fields))
    return cells


def _is_template_pdf(doc) -> bool:
    if len(doc) == 0:
        return False
    page = doc[0]
    page_width = round(page.rect.width, 1)
    page_height = round(page.rect.height, 1)
    expected_w = round(TEMPLATE_CONFIG["page_width"], 1)
    expected_h = round(TEMPLATE_CONFIG["page_height"], 1)
    if abs(page_width - expected_w) > 5 or abs(page_height - expected_h) > 5:
        logger.info(f"Page size mismatch: got {page_width}x{page_height}, expected {expected_w}x{expected_h}")
        return False
    return True


def extract_tiles_from_template(pdf_bytes: bytes, catalog_name: str) -> List[dict]:
    import fitz
    from collections import OrderedDict

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    if not _is_template_pdf(doc):
        doc.close()
        raise ValueError("PDF does not match the standard template dimensions. Please use the TileMaster template for 100% accurate extraction.")

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text_blocks = page.get_text("blocks")
        page_text = {tb[4].strip() for tb in page_text_blocks if len(tb) >= 5 and isinstance(tb[4], str) and tb[4].strip()}

        cells = _template_cell_bounds(page_num)

        for cell_idx, (img_rect, fields) in enumerate(cells):
            clip = fitz.Rect(*img_rect)
            pix = page.get_pixmap(clip=clip)
            img_bytes = pix.tobytes("png")
            img_hash = _image_hash(img_bytes)

            if img_hash in seen_hashes:
                continue
            seen_hashes.add(img_hash)

            field_values = {}
            for field_name, (fx0, fy0, fx1, fy1) in fields.items():
                field_rect = fitz.Rect(fx0, fy0, fx1, fy1)
                text_parts = []
                for tb in page_text_blocks:
                    if len(tb) < 5:
                        continue
                    tb_rect = fitz.Rect(tb[:4])
                    if tb_rect.intersects(field_rect):
                        t = tb[4].strip()
                        if t:
                            text_parts.append(t)
                val = " ".join(text_parts).strip()
                if val and val.lower() not in ("sku:", "size:", "brand:", "finish:", "model:", "sku-xxxx", "600x1200", "brand", "finish", "model"):
                    field_values[field_name] = val

            sku = field_values.get("sku", "")
            size = field_values.get("size", "") or "600x1200"
            brand = field_values.get("brand", "")
            finish = field_values.get("finish", "")
            model = field_values.get("model", "")
            tile_name = f"{sku} {brand} {finish} {model}".strip()
            tile_number = sku or f"CELL-{page_num+1:03d}-{cell_idx+1:02d}"

            original_number = tile_number
            suffix = 2
            while tile_number in seen_tile_numbers:
                tile_number = f"{original_number}-{suffix}"
                suffix += 1
            seen_tile_numbers.add(tile_number)

            public_id = f"{catalog_name}_p{page_num+1}_c{cell_idx+1}_{uuid.uuid4().hex[:8]}"

            raw_tiles.append({
                "tile_name": tile_name or f"Tile {page_num+1}-{cell_idx+1}",
                "tile_number": tile_number,
                "tile_size": size,
                "img_hash": img_hash,
                "img_bytes": img_bytes,
                "public_id": public_id,
                "catalog_name": catalog_name,
                "page_number": page_num + 1,
            })

    doc.close()

    unique_uploads = [(t["img_bytes"], t["public_id"]) for t in raw_tiles]
    hash_to_url = {}
    if unique_uploads:
        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_public = {executor.submit(_upload_to_cloudinary, ib, pid): pid for ib, pid in unique_uploads}
            for future in as_completed(future_to_public):
                pid = future_to_public[future]
                try:
                    url = future.result()
                    hash_to_url[pid] = url
                except Exception:
                    hash_to_url[pid] = None

    tiles = []
    for t in raw_tiles:
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": hash_to_url.get(t["public_id"]),
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"],
        })

    logger.info(f"Template extraction: {len(tiles)} tiles from '{catalog_name}'")
    return tiles


# ── Scanned PDF extraction (OCR-based) ──────────────────────────────────────

TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def _perform_ocr_on_page(image_bytes: bytes) -> List[dict]:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    from PIL import Image
    import io

    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        ocd_data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT)
        blocks = []
        n = len(ocd_data["text"])
        for i in range(n):
            text = (ocd_data["text"][i] or "").strip()
            if not text:
                continue
            conf = int(ocd_data["conf"][i]) if ocd_data["conf"][i] != "-1" else 0
            x = ocd_data["left"][i]
            y = ocd_data["top"][i]
            w = ocd_data["width"][i]
            h = ocd_data["height"][i]
            blocks.append({
                "bbox": (x, y, x + w, y + h),
                "text": text,
                "confidence": conf,
            })
        return blocks
    except Exception as e:
        logger.warning(f"OCR page failed: {e}")
        return []


def _detect_image_regions_opencv(page_image_bytes: bytes) -> List[dict]:
    import cv2
    import numpy as np

    try:
        nparr = np.frombuffer(page_image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 10)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        h, w = img.shape[:2]
        page_area = w * h
        regions = []
        for cnt in contours:
            x, y, cw, ch = cv2.boundingRect(cnt)
            area = cw * ch
            if area < 0.005 * page_area or area > 0.6 * page_area:
                continue
            aspect = cw / max(ch, 1)
            if aspect < 0.1 or aspect > 10:
                continue
            regions.append({
                "bbox": (x, y, x + cw, y + ch),
                "width": cw,
                "height": ch,
                "area": area,
            })

        regions.sort(key=lambda r: (r["bbox"][1], r["bbox"][0]))
        return regions
    except Exception as e:
        logger.warning(f"OpenCV region detection failed: {e}")
        return []


def extract_tiles_from_scanned_pdf(pdf_bytes: bytes, catalog_name: str) -> List[dict]:
    import fitz
    import cv2
    import numpy as np

    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    except ImportError:
        logger.error("pytesseract not installed. Cannot process scanned PDF.")
        raise ValueError("pytesseract is required for scanned PDF extraction. Install with: pip install pytesseract")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    logger.info(f"Processing scanned catalog '{catalog_name}': {total_pages} pages (OCR mode)")

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()

    for page_num in range(total_pages):
        try:
            page = doc[page_num]
            page_rect = page.rect
            page_area = page_rect.width * page_rect.height

            pix = page.get_pixmap(dpi=200)
            page_img_bytes = pix.tobytes("png")

            ocr_blocks = _perform_ocr_on_page(page_img_bytes)

            regions = _detect_image_regions_opencv(page_img_bytes)

            if not regions:
                logger.info(f"  Page {page_num+1}: no image regions detected via OpenCV, falling back to full-page extraction")
                clip = fitz.Rect(0, 0, page_rect.width, page_rect.height)
                page_pix = page.get_pixmap(clip=clip, dpi=150)
                img_bytes = page_pix.tobytes("png")
                img_hash = _image_hash(img_bytes)

                if img_hash not in seen_hashes:
                    seen_hashes.add(img_hash)
                    all_text = " ".join(b["text"] for b in ocr_blocks)
                    tile_name_match = re.search(r'([A-Za-z]{3,})', all_text)
                    tile_name = tile_name_match.group(1) if tile_name_match else None
                    size_match = SIZE_PATTERN.search(all_text)
                    tile_size = f"{size_match.group(1)}x{size_match.group(2)}" if size_match else None
                    code_match = CODE_PATTERN.search(all_text)
                    tile_number = code_match.group(1) if code_match else f"PAGE-{page_num+1:03d}"

                    public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"
                    raw_tiles.append({
                        "tile_name": tile_name or f"Full Page {page_num+1}",
                        "tile_number": tile_number,
                        "tile_size": tile_size,
                        "img_hash": img_hash,
                        "img_bytes": img_bytes,
                        "public_id": public_id,
                        "catalog_name": catalog_name,
                        "page_number": page_num + 1,
                    })
                continue

            if len(regions) >= 2:
                rows, cols, cell_w, cell_h = _detect_grid_layout(
                    [{"bbox": r["bbox"], "width": r["width"], "height": r["height"]} for r in regions],
                    page_rect.width, page_rect.height
                )
            else:
                rows, cols, cell_w, cell_h = 1, 1, page_rect.width, page_rect.height

            for idx, region in enumerate(regions):
                bx0, by0, bx1, by1 = region["bbox"]
                clip = fitz.Rect(
                    bx0 * page_rect.width / pix.width,
                    by0 * page_rect.height / pix.height,
                    bx1 * page_rect.width / pix.width,
                    by1 * page_rect.height / pix.height,
                )
                page_pix = page.get_pixmap(clip=clip, dpi=150)
                img_bytes = page_pix.tobytes("png")
                img_hash = _image_hash(img_bytes)

                if img_hash in seen_hashes:
                    continue
                seen_hashes.add(img_hash)

                cx = (bx0 + bx1) / 2
                cy = (by0 + by1) / 2
                col = int((cx - (regions[0]["bbox"][0] if regions else 0)) / cell_w) if cell_w > 0 else 0
                row = int((cy - (regions[0]["bbox"][1] if regions else 0)) / cell_h) if cell_h > 0 else 0
                col = max(0, min(col, cols - 1))
                row = max(0, min(row, rows - 1))

                cell_x0 = (regions[0]["bbox"][0] if regions else 0) + col * cell_w
                cell_y0 = (regions[0]["bbox"][1] if regions else 0) + row * cell_h
                cell_x1 = cell_x0 + cell_w
                cell_y1 = cell_y0 + cell_h

                cell_text = [b for b in ocr_blocks if
                    cell_x0 <= (b["bbox"][0] + b["bbox"][2]) / 2 <= cell_x1 and
                    cell_y0 <= (b["bbox"][1] + b["bbox"][3]) / 2 <= cell_y1]

                tile_name, tile_number, tile_size = extract_text_info(cell_text)

                final_tile_number = tile_number or f"PAGE-{page_num+1:03d}"
                original_number = final_tile_number
                suffix = 2
                while final_tile_number in seen_tile_numbers:
                    final_tile_number = f"{original_number}-{suffix}"
                    suffix += 1
                seen_tile_numbers.add(final_tile_number)

                public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"

                raw_tiles.append({
                    "tile_name": tile_name or f"Tile Page {page_num+1}",
                    "tile_number": final_tile_number,
                    "tile_size": tile_size,
                    "img_hash": img_hash,
                    "img_bytes": img_bytes,
                    "public_id": public_id,
                    "catalog_name": catalog_name,
                    "page_number": page_num + 1,
                })

        except Exception as e:
            logger.error(f"Scanned page {page_num+1} failed: {e}", exc_info=True)
            continue

    doc.close()
    logger.info(f"Scanned extraction complete: {len(raw_tiles)} tiles from '{catalog_name}'. Uploading...")

    unique_uploads = [(t["img_bytes"], t["public_id"]) for t in raw_tiles if t["img_bytes"] is not None]
    hash_to_url = {}
    if unique_uploads:
        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_public = {executor.submit(_upload_to_cloudinary, ib, pid): pid for ib, pid in unique_uploads}
            for future in as_completed(future_to_public):
                pid = future_to_public[future]
                try:
                    url = future.result()
                    hash_to_url[pid] = url
                except Exception:
                    hash_to_url[pid] = None

    tiles = []
    for t in raw_tiles:
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": hash_to_url.get(t["public_id"]),
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"],
        })

    logger.info(f"Scanned extraction done: {len(tiles)} tiles from '{catalog_name}'")
    return tiles
