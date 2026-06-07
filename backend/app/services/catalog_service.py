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


def extract_tiles_from_pdf(pdf_bytes: bytes, catalog_name: str) -> List[dict]:
    import fitz

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    logger.info(f"Processing catalog '{catalog_name}': {total_pages} pages")

    for page_num in range(total_pages):
        try:
            page = doc[page_num]
            page_text = page.get_text("blocks")

            text_blocks = []
            for block in page_text:
                if len(block) >= 5 and isinstance(block[4], str) and block[4].strip():
                    text_blocks.append({
                        "bbox": block[:4],
                        "text": block[4].strip(),
                    })

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
                    area = w * h

                    img_bbox = info.get("bbox")
                    if img_bbox:
                        bbox_area = (img_bbox[2] - img_bbox[0]) * (img_bbox[3] - img_bbox[1])
                    else:
                        bbox_area = area

                    relative_area = bbox_area / page_area if page_area > 0 else 0

                    candidates.append({
                        "xref": xref,
                        "width": w,
                        "height": h,
                        "area": area,
                        "relative_area": relative_area,
                        "bytes": base_image["image"],
                        "bbox": img_bbox,
                    })
                except Exception as e:
                    logger.debug(f"Page {page_num+1} image {xref} extract error: {e}")

            logger.debug(f"Page {page_num+1}: {len(candidates)} image candidates")

            if not candidates:
                continue

            filtered = [c for c in candidates if c["width"] >= 100 and c["height"] >= 100 and c["relative_area"] <= 0.95]
            if not filtered:
                filtered = candidates
            candidates = filtered

            if not candidates:
                continue

            selected_images = candidates

            for selected in selected_images:
                img_text_blocks = text_blocks
                img_bbox = selected.get("bbox")

                if img_bbox and len(selected_images) > 1:
                    img_text_blocks = []
                    for tb in text_blocks:
                        t_bbox = tb["bbox"]
                        tcx = (t_bbox[0] + t_bbox[2]) / 2
                        tcy = (t_bbox[1] + t_bbox[3]) / 2

                        min_dist = float('inf')
                        closest_img = None
                        for cand_img in selected_images:
                            c_bbox = cand_img.get("bbox")
                            if not c_bbox:
                                continue
                            icx = (c_bbox[0] + c_bbox[2]) / 2
                            icy = (c_bbox[1] + c_bbox[3]) / 2
                            dist = math.hypot(tcx - icx, tcy - icy)
                            if dist < min_dist:
                                min_dist = dist
                                closest_img = cand_img

                        if closest_img == selected:
                            img_text_blocks.append(tb)

                tile_name, tile_number, tile_size = extract_text_info(img_text_blocks)

                final_tile_number = tile_number or f"PAGE-{page_num+1:03d}"

                original_number = final_tile_number
                suffix = 2
                while final_tile_number in seen_tile_numbers:
                    final_tile_number = f"{original_number}-{suffix}"
                    suffix += 1
                seen_tile_numbers.add(final_tile_number)

                img_hash = _image_hash(selected["bytes"])
                public_id = None
                if img_hash not in seen_hashes:
                    seen_hashes.add(img_hash)
                    public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"

                raw_tiles.append({
                    "tile_name": tile_name or f"Tile Page {page_num+1}",
                    "tile_number": final_tile_number,
                    "tile_size": tile_size,
                    "img_hash": img_hash,
                    "img_bytes": selected["bytes"] if public_id else None,
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
