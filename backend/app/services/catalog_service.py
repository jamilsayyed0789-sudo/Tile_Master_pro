import hashlib
import logging
import re
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Tuple



logger = logging.getLogger(__name__)

SIZE_PATTERN = re.compile(r'(\d{2,4})\s*[xX×*/]\s*(\d{2,4})')
CODE_PATTERN = re.compile(r'(?:^|\s)([A-Za-z]{1,5}[-_.]?\d{1,8}|[A-Za-z]{0,5}[-_.]?\d{3,8})(?:\s|$)')

import math

UPLOAD_WORKERS = 6
PAGE_WORKERS = 4

# Threshold for scanned/digital detection
TEXT_DENSITY_THRESHOLD = 50  # chars per page

TILE_NUMBER_REGEXES = [
    re.compile(r'\b\d{1,10}[-_./\s]+[A-Za-z]{1,20}[-_./\s]+\d{1,10}\b'), # Digits-Letters-Digits (e.g. 10775-HL-1)
    re.compile(r'\b[A-Za-z]{1,20}[-_./]?\d{1,8}[A-Za-z]{0,5}\b'),       # Letters then digits (e.g. P3, P-04, Calacatta6012, 1234A)
    re.compile(r'\b[A-Za-z]{1,20}\s+\d{1,8}[A-Za-z]{0,5}\b'),           # Letters space digits (e.g. P 3, Calacatta 6012)
    re.compile(r'\b\d{1,8}[-_./]?[A-Za-z]{1,20}\b'),                    # Digits then letters (e.g. 1234A)
    re.compile(r'(?<!\d)\d{3,8}(?!\d)'),                                # 3 to 8 digits
]

def detect_nearest_tile_number(img_bbox, text_blocks):
    if not img_bbox or not text_blocks:
        return None
        
    img_cx = (img_bbox[0] + img_bbox[2]) / 2
    img_cy = (img_bbox[1] + img_bbox[3]) / 2
    
    best_match = None
    min_dist = float('inf')
    
    for tb in text_blocks:
        if "bbox" not in tb or "text" not in tb:
            continue
            
        # Ignore box numbers/codes
        if "box" in tb["text"].lower():
            continue
            
        tb_bbox = tb["bbox"]
        tb_cx = (tb_bbox[0] + tb_bbox[2]) / 2
        tb_cy = (tb_bbox[1] + tb_bbox[3]) / 2
        
        dist = math.hypot(tb_cx - img_cx, tb_cy - img_cy)
        
        for pattern in TILE_NUMBER_REGEXES:
            matches = pattern.findall(tb["text"])
            for m in matches:
                if dist < min_dist:
                    min_dist = dist
                    best_match = m
                    
    return best_match

def detect_nearest_tile_name(img_bbox, text_blocks, tile_number=None):
    if not img_bbox or not text_blocks:
        return None

    img_cx = (img_bbox[0] + img_bbox[2]) / 2
    img_cy = (img_bbox[1] + img_bbox[3]) / 2

    # Words to ignore as tile names
    IGNORE_WORDS = {"email", "website", "address", "www", "http", "page", "finish", "mm", "cm",
                    "glossy", "matte", "matt", "satin", "polished", "lappato", "sugar", "box"}
    STONE_KEYWORDS = ["stone", "marble", "granite", "wood", "slate", "cement", "concrete",
                      "bianco", "nero", "crema", "dark", "light", "grey", "gray", "white",
                      "black", "beige", "ivory", "brown", "green", "blue", "gold", "silver",
                      "travertine", "onyx", "quartz", "ceramic", "porcelain", "vitrified",
                      "calacatta", "statuario", "carrara", "azul", "verde", "rosso"]

    scored = []
    for tb in text_blocks:
        if "bbox" not in tb or "text" not in tb:
            continue
        text = tb["text"].strip()
        if len(text) < 3 or len(text) > 60:
            continue
        # Skip if it IS the tile number
        if tile_number and text.lower() == tile_number.lower():
            continue
        # Skip pure numbers
        if re.match(r'^[\d\s\.\-_/x×X]+$', text):
            continue
        # Skip dimension strings like 600x1200
        if re.search(r'\d+\s*[xX×]\s*\d+', text):
            continue
        # Skip ignored words
        text_lower = text.lower()
        if any(w in text_lower for w in IGNORE_WORDS):
            continue
        # Must have at least 2 letters
        letter_count = sum(1 for c in text if c.isalpha())
        if letter_count < 2:
            continue

        tb_bbox = tb["bbox"]
        tb_cx = (tb_bbox[0] + tb_bbox[2]) / 2
        tb_cy = (tb_bbox[1] + tb_bbox[3]) / 2
        dist = math.hypot(tb_cx - img_cx, tb_cy - img_cy)

        # Scoring: prefer text below the image, prefer stone keywords, prefer title/upper case
        score = 1.0
        # Below image is most likely to be the label
        if tb_cy > img_cy:
            score += 2.0
        # Known stone/tile keywords get a big boost
        if any(kw in text_lower for kw in STONE_KEYWORDS):
            score += 3.0
        # Title or upper case is more likely a product name
        if text.isupper() or text.istitle():
            score += 1.0
        # Longer names are more likely to be tile names (vs short codes)
        if len(text) >= 6:
            score += 0.5

        # Use score/dist so closer AND better scored text wins
        weighted = score / (dist + 1)
        scored.append((weighted, text))

    if not scored:
        return None

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]

def resolve_tile_number(extracted_num: Optional[str], page_text_blocks: List[dict], img_bbox: Optional[list] = None) -> Optional[str]:
    if not extracted_num:
        return extracted_num

    extracted_num = extracted_num.strip()
    num_clean = extracted_num
    num_lower = num_clean.lower()
    is_suffix = False
    if re.match(r'^[pPfFrR]\d+$', num_clean):
        is_suffix = True
    elif re.match(r'^(?:face|pattern|random|p|f|r)[-_\s]*\d+$', num_lower):
        is_suffix = True
    elif len(num_clean) <= 2:
        is_suffix = True
        
    if is_suffix:
        # Search the page text blocks for a valid parent series number (3+ digits)
        parent_num = None
        min_dist = float('inf')
        
        # Calculate image center if bbox is available
        img_cx, img_cy = None, None
        if img_bbox:
            img_cx = (img_bbox[0] + img_bbox[2]) / 2
            img_cy = (img_bbox[1] + img_bbox[3]) / 2
            
        for tb in page_text_blocks:
            text = tb.get("text", "").strip()
            if not text or "box" in text.lower():
                continue
            
            # Find any pattern matching 3 to 8 digits
            for pattern in TILE_NUMBER_REGEXES:
                matches = pattern.findall(text)
                for m in matches:
                    # Make sure it's not a short code (must have at least 3 digits or be longer)
                    cleaned_digits = re.sub(r'\D', '', m)
                    if len(cleaned_digits) >= 3:
                        # If bbox is available, find the closest one
                        if img_cx is not None and "bbox" in tb:
                            tb_bbox = tb["bbox"]
                            tb_cx = (tb_bbox[0] + tb_bbox[2]) / 2
                            tb_cy = (tb_bbox[1] + tb_bbox[3]) / 2
                            dist = math.hypot(tb_cx - img_cx, tb_cy - img_cy)
                            if dist < min_dist:
                                min_dist = dist
                                parent_num = m
                        else:
                            parent_num = m
                            break
            if parent_num and img_cx is None:
                break
                
        if parent_num and parent_num.lower() != num_lower:
            # Combine them, e.g. "2150-P3"
            return f"{parent_num}-{num_clean}"
            
    return extracted_num


def normalize_filename(
    tile_name: Optional[str],
    tile_number: Optional[str],
    has_name: Optional[bool] = None,
    has_number: Optional[bool] = None
) -> str:
    # 1. Determine if name is valid/selected
    is_name_valid = False
    if tile_name:
        name_lower = tile_name.lower().strip()
        # Heuristic checks for invalid/placeholder names
        if name_lower not in ("", "unknown", "untitled") and not name_lower.startswith("untitled page") and not name_lower.startswith("tile page"):
            is_name_valid = True
    
    # If has_name is explicitly passed, let it override heuristic
    if has_name is not None:
        is_name_valid = has_name and bool(tile_name)

    # 2. Determine if number is valid/selected
    is_number_valid = False
    if tile_number:
        num_lower = tile_number.lower().strip()
        # Heuristic check: ignore pattern of unknown/empty
        if num_lower not in ("", "unknown"):
            is_number_valid = True

    # If has_number is explicitly passed, let it override heuristic
    if has_number is not None:
        is_number_valid = has_number and bool(tile_number)

    # Clean the name if valid
    name_clean = ""
    if is_name_valid and tile_name:
        name_clean = tile_name.strip()
        name_clean = re.sub(r'\s+', '', name_clean)
        name_clean = "".join(c for c in name_clean if c.isalnum() or c in "_-")

    # Clean the number if valid
    number_clean = ""
    if is_number_valid and tile_number:
        number_clean = tile_number.strip()
        number_clean = re.sub(r'\s+', '', number_clean)
        number_clean = "".join(c for c in number_clean if c.isalnum() or c in "_-")

    # Construct name based on user rules
    if name_clean and number_clean:
        if name_clean.lower() == number_clean.lower():
            return f"{number_clean}.png"
        return f"{name_clean}_{number_clean}.png"
    elif name_clean:
        return f"{name_clean}.png"
    elif number_clean:
        return f"{number_clean}.png"
    else:
        # If neither is valid, fallback: use whatever we have, or generate a uuid
        fallback_name = "".join(c for c in (tile_name or "").strip() if c.isalnum() or c in "_-")
        fallback_num = "".join(c for c in (tile_number or "").strip() if c.isalnum() or c in "_-")
        if fallback_name and fallback_num:
            if fallback_name.lower() == fallback_num.lower():
                return f"{fallback_num}.png"
            return f"{fallback_name}_{fallback_num}.png"
        elif fallback_name:
            return f"{fallback_name}.png"
        elif fallback_num:
            return f"{fallback_num}.png"
        else:
            return f"tile_{uuid.uuid4().hex[:8]}.png"



def extract_metadata_from_crop(ocr_blocks) -> Tuple[Optional[str], Optional[str]]:
    tile_name = None
    tile_number = None
    candidate_names = []

    IGNORE_WORDS = {"email", "website", "address", "www", "http", "page", "finish", "mm", "cm", "box"}

    for block in ocr_blocks:
        text = block.get("text", "").strip()
        if not text:
            continue

        # Ignore box numbers/codes
        if "box" in text.lower():
            continue

        # Check for Tile Number (only if no number found yet)
        if not tile_number:
            for pattern in TILE_NUMBER_REGEXES:
                match = pattern.search(text)
                if match:
                    tile_number = match.group(0).strip()
                    # Remove the matched number from remaining text
                    remaining = text.replace(tile_number, "").strip()
                    # If there's meaningful text left after removing the number, keep as name candidate
                    if remaining and len(remaining) >= 3 and sum(c.isalpha() for c in remaining) >= 2:
                        candidate_names.append(remaining)
                    break
            else:
                # No tile number matched in this block — evaluate as name candidate
                # Skip pure numbers / sizes / ignored words
                if re.match(r'^[\d\s\.\-_/x×X]+$', text):
                    continue
                if re.search(r'\d+\s*[xX×]\s*\d+', text):
                    continue
                text_lower = text.lower()
                if any(w in text_lower for w in IGNORE_WORDS):
                    continue
                letter_count = sum(1 for c in text if c.isalpha())
                if letter_count < 2:
                    continue
                if len(text) >= 3:
                    candidate_names.append(text)
        else:
            # Already found number — any remaining text block could be the name
            if re.match(r'^[\d\s\.\-_/x×X]+$', text):
                continue
            if re.search(r'\d+\s*[xX×]\s*\d+', text):
                continue
            text_lower = text.lower()
            if any(w in text_lower for w in IGNORE_WORDS):
                continue
            letter_count = sum(1 for c in text if c.isalpha())
            if letter_count < 2:
                continue
            if len(text) >= 3:
                candidate_names.append(text)

    if candidate_names:
        # Prefer the candidate with the most letters (most likely a proper name)
        tile_name = max(candidate_names, key=lambda t: sum(c.isalpha() for c in t))

    return tile_name, tile_number

def extract_metadata_near_image(page, sel_bbox, page_rect) -> Tuple[Optional[str], Optional[str]]:
    import os
    x0, y0, x1, y1 = sel_bbox
    
    # Try cropping below the image first (width bounds, y1 to y1 + 120 points)
    tx0 = max(0, x0 - 15)
    ty0 = y1
    tx1 = min(page_rect.width, x1 + 15)
    ty1 = min(page_rect.height, y1 + 120)
    
    # 1. Try PyMuPDF native text extraction below the image (extremely fast!)
    import fitz
    tile_name, tile_number = None, None
    clip_below = fitz.Rect(tx0, ty0, tx1, ty1)
    text_below = page.get_text("text", clip=clip_below).strip()
    if text_below:
        blocks_below = [{"text": line.strip(), "bbox": clip_below} for line in text_below.split("\n") if line.strip()]
        tile_name, tile_number = extract_metadata_from_crop(blocks_below)
        
    # 2. Try PyMuPDF native text extraction above the image (y0 - 80 to y0 points) if number is still missing
    if not tile_number:
        tx0_above = max(0, x0 - 15)
        ty0_above = max(0, y0 - 80)
        tx1_above = min(page_rect.width, x1 + 15)
        ty1_above = y0
        clip_above = fitz.Rect(tx0_above, ty0_above, tx1_above, ty1_above)
        text_above = page.get_text("text", clip=clip_above).strip()
        if text_above:
            blocks_above = [{"text": line.strip(), "bbox": clip_above} for line in text_above.split("\n") if line.strip()]
            tile_name_above, tile_number_above = extract_metadata_from_crop(blocks_above)
            if tile_number_above:
                tile_number = tile_number_above
                tile_name = tile_name_above or tile_name
            elif tile_name_above and not tile_name:
                tile_name = tile_name_above
                
    # 3. If we successfully extracted a number from the PDF text layer, return immediately!
    if tile_number:
        return tile_name, tile_number

    # 4. Fallback to Tesseract OCR if the PDF has no text layer in the regions
    text_blocks = []
    if ty1 > ty0:
        try:
            pix = page.get_pixmap(clip=clip_below, dpi=200)
            img_bytes = pix.tobytes("png")
            
            # Create a temporary text crop near the tile image.
            temp_crop_path = f"temp_crop_{uuid.uuid4().hex[:8]}.png"
            with open(temp_crop_path, "wb") as f:
                f.write(img_bytes)
                
            text_blocks = _perform_ocr_on_page(img_bytes)
            
            if os.path.exists(temp_crop_path):
                try:
                    os.remove(temp_crop_path)
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Failed below text crop: {e}")
            
    tile_name_ocr, tile_number_ocr = extract_metadata_from_crop(text_blocks)
    if tile_number_ocr:
        tile_number = tile_number_ocr
        tile_name = tile_name_ocr or tile_name
    elif tile_name_ocr and not tile_name:
        tile_name = tile_name_ocr
        
    if not tile_number:
        tx0_above = max(0, x0 - 15)
        ty0_above = max(0, y0 - 80)
        tx1_above = min(page_rect.width, x1 + 15)
        ty1_above = y0
        
        if ty1_above > ty0_above:
            try:
                clip_above = fitz.Rect(tx0_above, ty0_above, tx1_above, ty1_above)
                pix = page.get_pixmap(clip=clip_above, dpi=200)
                img_bytes = pix.tobytes("png")
                
                temp_crop_path = f"temp_crop_{uuid.uuid4().hex[:8]}.png"
                with open(temp_crop_path, "wb") as f:
                    f.write(img_bytes)
                    
                text_blocks_above = _perform_ocr_on_page(img_bytes)
                
                if os.path.exists(temp_crop_path):
                    try:
                        os.remove(temp_crop_path)
                    except Exception:
                        pass
                        
                tile_name_above, tile_number_above = extract_metadata_from_crop(text_blocks_above)
                if tile_number_above:
                    tile_number = tile_number_above
                    tile_name = tile_name_above or tile_name
                elif tile_name_above and not tile_name:
                    tile_name = tile_name_above
            except Exception as e:
                logger.warning(f"Failed above text crop: {e}")
                
    return tile_name, tile_number

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
        if "box" in line.lower():
            continue
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


def _save_to_local_storage(img_bytes: bytes, tile_number: str) -> Optional[tuple[str, str]]:
    try:
        from app.routers.local_storage import _get_storage_path, _build_relative_path
        import os
        from datetime import datetime
        
        # Guard: reject suspiciously tiny images (< 3.5 KB).
        # Real tile images are always significantly larger, whereas small logo,
        # text, or crop images are tiny.
        MIN_TILE_BYTES = 3500
        if len(img_bytes) < MIN_TILE_BYTES:
            logger.info(f"Skipping local save for {tile_number} — image is too small ({len(img_bytes)} bytes)")
            return None

        storage_path = _get_storage_path()
        relative_path, filename = _build_relative_path(tile_number)
        
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        folder = os.path.join(storage_path, year, month)
        os.makedirs(folder, exist_ok=True)
        abs_path = os.path.join(folder, filename)
        
        with open(abs_path, "wb") as f:
            f.write(img_bytes)
            
        image_serve_url = f"/api/local/image?path={relative_path}"
        return (image_serve_url, relative_path)
    except Exception as e:
        logger.warning(f"Local storage save failed for {tile_number}: {e}")
        return None


def _tile_score(img: dict, page_area: float, min_width: int = 30, min_height: int = 30) -> float:
    # Reject small logo, icon, or text images
    if img["width"] < min_width or img["height"] < min_height:
        return 0.0

    aspect = img["width"] / max(img["height"], 1)
    if aspect < 0.25 or aspect > 4.0:
        return 0.0

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
    min_width: int = 30,
    min_height: int = 30,
    tiles_per_page: Optional[int] = None,
) -> List[dict]:
    import fitz
    import uuid
    import os
    from app.database import SessionLocal
    from app.models.catalog import TileCatalog

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()
    hash_to_url = {}

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    logger.info(f"Processing catalog '{catalog_name}': {total_pages} pages")

    start_page = (page_start or 1) - 1
    end_page = min(page_end or total_pages, total_pages)

    db = SessionLocal()
    try:
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
                    c["score"] = _tile_score(c, page_area, min_width, min_height)

                scored = sorted(candidates, key=lambda x: x["score"], reverse=True)
                selected = [s for s in scored if s["score"] >= 0.3]
                if not selected and scored and scored[0]["score"] > 0.0:
                    selected = scored[:1]

                if not selected:
                    continue

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

                    # ONLY call crop OCR if we are missing either name or number
                    extracted_name, extracted_number = None, None
                    if sel_bbox and (not tile_name or not tile_number):
                        extracted_name, extracted_number = extract_metadata_near_image(page, sel_bbox, page_rect)

                    final_tile_number = tile_number or extracted_number
                    final_tile_number = resolve_tile_number(final_tile_number, text_blocks, sel_bbox)
                    final_tile_name = tile_name or extracted_name

                    img_hash = _image_hash(sel["bytes"])
                    image_url = None
                    relative_path = None

                    # Deduplicate filenames/images
                    if img_hash in hash_to_url:
                        image_url, relative_path = hash_to_url[img_hash]
                    else:
                        public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"
                        if final_tile_number:
                            filename_base = normalize_filename(final_tile_name, final_tile_number)
                            original_number = filename_base
                            suffix = 1
                            while filename_base in seen_tile_numbers:
                                filename_base = f"{os.path.splitext(original_number)[0]}_{suffix}.png"
                                suffix += 1
                            seen_tile_numbers.add(filename_base)
                        else:
                            filename_base = public_id

                        # Save image to disk immediately
                        res = _save_to_local_storage(sel["bytes"], filename_base)
                        if res:
                            image_url, relative_path = res
                            hash_to_url[img_hash] = (image_url, relative_path)

                    # Save to database page-by-page immediately
                    existing = None
                    if final_tile_number:
                        existing = db.query(TileCatalog).filter(
                            TileCatalog.tile_number == final_tile_number,
                            TileCatalog.catalog_name == catalog_name,
                        ).first()
                        
                        if existing:
                            # Append a suffix so we don't drop duplicate tile faces/crops
                            base_number = final_tile_number
                            suffix_counter = 2
                            while existing:
                                final_tile_number = f"{base_number}-{suffix_counter}"
                                existing = db.query(TileCatalog).filter(
                                    TileCatalog.tile_number == final_tile_number,
                                    TileCatalog.catalog_name == catalog_name,
                                ).first()
                                suffix_counter += 1

                    db_tile = TileCatalog(
                        tile_name=final_tile_name or f"Tile Page {page_num+1}",
                        tile_number=final_tile_number,
                        tile_size=tile_size,
                        image_url=image_url,
                        catalog_name=catalog_name,
                        page_number=page_num + 1,
                        relative_image_path=relative_path,
                    )
                    db.add(db_tile)
                    db.commit()

                    raw_tiles.append({
                        "tile_name": final_tile_name or f"Tile Page {page_num+1}",
                        "tile_number": final_tile_number,
                        "tile_size": tile_size,
                        "image_url": image_url,
                        "relative_image_path": relative_path,
                        "catalog_name": catalog_name,
                        "page_number": page_num + 1,
                    })

                # Explicitly free page object to avoid PyMuPDF memory build-up
                page = None

                if (page_num + 1) % 10 == 0:
                    logger.info(f"  ... processed {page_num+1}/{total_pages} pages, {len(raw_tiles)} tiles saved")

            except Exception as e:
                logger.error(f"Page {page_num+1} failed: {e}", exc_info=True)
                continue
    finally:
        db.close()

    doc.close()
    logger.info(f"Done: {len(raw_tiles)} tiles extracted and saved successfully for '{catalog_name}'")
    return raw_tiles


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


def extract_tiles_from_template(
    pdf_bytes: bytes,
    catalog_name: str,
    tile_size_override: Optional[str] = None,
) -> List[dict]:
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
            size = tile_size_override or field_values.get("size", "") or "600x1200"
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

    unique_uploads = [(t["img_bytes"], t["tile_number"]) for t in raw_tiles if t["img_bytes"] is not None]
    hash_to_url = {}
    if unique_uploads:
        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_num = {
                executor.submit(_save_to_local_storage, img_bytes, num): num
                for img_bytes, num in unique_uploads
            }
            for future in as_completed(future_to_num):
                num = future_to_num[future]
                try:
                    res = future.result()
                    hash_to_url[num] = res
                except Exception as e:
                    logger.warning(f"Local save failed for {num}: {e}")
                    hash_to_url[num] = None

    tiles = []
    for t in raw_tiles:
        res = hash_to_url.get(t["tile_number"])
        url = res[0] if res else None
        rel = res[1] if res else None
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": url,
            "relative_image_path": rel,
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"],
        })

    logger.info(f"Template extraction: {len(tiles)} tiles from '{catalog_name}'")
    return tiles


# ── Scanned PDF extraction (OCR-based) ───────────    # PaddleOCR OCR implementation
def _perform_ocr_on_page(image_bytes: bytes) -> List[dict]:
    try:
        from app.main import get_ocr_engine
        import numpy as np
        from PIL import Image
        import io
        ocr_engine = get_ocr_engine()
        if ocr_engine is None:
            logger.warning("PaddleOCR engine not initialized; OCR skipped.")
            return []
        # Load image
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_np = np.array(pil_image)

        # --- PaddleOCR v2 vs v3 compatibility ---
        # v2: ocr(img, cls=False) → List[List[[bbox,(text,conf)]]]
        # v3: ocr(img)            → List[Result] or flat List[[bbox,(text,conf)]]
        # Call without 'cls' to work on both versions.
        results = ocr_engine.ocr(img_np)
        blocks = []

        if not results:
            return []

        # ── Detect v3 Result objects (have .boxes/.txts/.scores attrs) ──────────
        first = results[0] if results else None
        if first is not None and hasattr(first, 'boxes') and hasattr(first, 'txts'):
            # PaddleOCR v3 single-image result object
            res_obj = first
            for bbox, text, conf in zip(res_obj.boxes or [], res_obj.txts or [], res_obj.scores or []):
                text = (text or "").strip()
                if not text:
                    continue
                try:
                    xs = [pt[0] for pt in bbox]
                    ys = [pt[1] for pt in bbox]
                    left, top, right, bottom = min(xs), min(ys), max(xs), max(ys)
                except Exception:
                    continue
                blocks.append({
                    "bbox": (left, top, right, bottom),
                    "text": text,
                    "confidence": round(float(conf) * 100) if float(conf) <= 1.0 else int(conf)
                })
            logger.info(f"PaddleOCR v3 extracted {len(blocks)} text blocks")
            return blocks

        # ── v2 nested list format ─────────────────────────────────────────────
        # Flatten: support [[bbox,(text,conf)], ...] and [[[bbox,(text,conf)],...]]
        page_results = results[0] if results and isinstance(results[0], list) else results

        if not page_results:
            return []

        for line in page_results:
            if not line:
                continue
            # Each line: [bbox, (text, confidence)]
            if len(line) < 2:
                continue
            bbox = line[0]
            text_info = line[1]
            if not bbox or not text_info:
                continue
            text = text_info[0] if isinstance(text_info, (list, tuple)) else str(text_info)
            conf = text_info[1] if isinstance(text_info, (list, tuple)) and len(text_info) > 1 else 1.0
            text = text.strip()
            if not text:
                continue
            # bbox is list of four corner points [[x,y],[x,y],[x,y],[x,y]]
            try:
                xs = [pt[0] for pt in bbox]
                ys = [pt[1] for pt in bbox]
                left, top, right, bottom = min(xs), min(ys), max(xs), max(ys)
            except Exception:
                continue
            blocks.append({
                "bbox": (left, top, right, bottom),
                "text": text,
                "confidence": round(float(conf) * 100) if float(conf) <= 1.0 else int(conf)
            })
        logger.info(f"PaddleOCR extracted {len(blocks)} text blocks")
        return blocks
    except Exception as e:
        logger.error(f"PaddleOCR failed: {e}", exc_info=True)
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
            if cw < 50 or ch < 50:
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


def extract_tiles_from_scanned_pdf(
    pdf_bytes: bytes,
    catalog_name: str,
    tile_size_override: Optional[str] = None,
) -> List[dict]:
    import fitz
    import cv2
    import numpy as np
    import uuid
    import os
    from app.database import SessionLocal
    from app.models.catalog import TileCatalog

    # PaddleOCR will be used for OCR; if initialization fails, OCR will be skipped for scanned PDFs.
    # No pytesseract dependency required.

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    logger.info(f"Processing scanned catalog '{catalog_name}': {total_pages} pages (OCR mode)")

    raw_tiles = []
    seen_hashes = set()
    seen_tile_numbers = set()
    hash_to_url = {}

    db = SessionLocal()
    try:
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
                        
                        tile_name, tile_number = extract_metadata_from_crop(ocr_blocks)
                        
                        size_match = SIZE_PATTERN.search(all_text)
                        tile_size = f"{size_match.group(1)}x{size_match.group(2)}" if size_match else None
                        if tile_size_override:
                            tile_size = tile_size_override

                        final_tile_number = tile_number
                        final_tile_number = resolve_tile_number(final_tile_number, ocr_blocks, None)
                        final_tile_name = tile_name
                        public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"

                        image_url = None
                        relative_path = None
                        if final_tile_number:
                            filename_base = normalize_filename(final_tile_name, final_tile_number)
                            original_number = filename_base
                            suffix = 1
                            while filename_base in seen_tile_numbers:
                                filename_base = f"{os.path.splitext(original_number)[0]}_{suffix}.png"
                                suffix += 1
                            seen_tile_numbers.add(filename_base)
                        else:
                            filename_base = public_id

                        res = _save_to_local_storage(img_bytes, filename_base)
                        if res:
                            image_url, relative_path = res
                            hash_to_url[img_hash] = (image_url, relative_path)

                        existing = None
                        if final_tile_number:
                            existing = db.query(TileCatalog).filter(
                                TileCatalog.tile_number == final_tile_number,
                                TileCatalog.catalog_name == catalog_name,
                            ).first()

                        if not existing:
                            db_tile = TileCatalog(
                                tile_name=final_tile_name or f"Full Page {page_num+1}",
                                tile_number=final_tile_number,
                                tile_size=tile_size,
                                image_url=image_url,
                                catalog_name=catalog_name,
                                page_number=page_num + 1,
                                relative_image_path=relative_path,
                            )
                            db.add(db_tile)
                            db.commit()

                        raw_tiles.append({
                            "tile_name": final_tile_name or f"Full Page {page_num+1}",
                            "tile_number": final_tile_number,
                            "tile_size": tile_size,
                            "image_url": image_url,
                            "relative_image_path": relative_path,
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
                    if tile_size_override:
                        tile_size = tile_size_override

                    nearest_tile_number = detect_nearest_tile_number(region["bbox"], ocr_blocks)

                    # For scanned PDFs, use full page OCR results instead of crop OCR
                    final_tile_number = nearest_tile_number or tile_number
                    final_tile_number = resolve_tile_number(final_tile_number, ocr_blocks, region["bbox"])
                    final_tile_name = tile_name

                    image_url = None
                    relative_path = None

                    # Deduplicate filenames/images
                    if img_hash in hash_to_url:
                        image_url, relative_path = hash_to_url[img_hash]
                    else:
                        public_id = f"{catalog_name}_p{page_num+1}_{uuid.uuid4().hex[:8]}"
                        if final_tile_number:
                            filename_base = normalize_filename(final_tile_name, final_tile_number)
                            original_number = filename_base
                            suffix = 1
                            while filename_base in seen_tile_numbers:
                                filename_base = f"{os.path.splitext(original_number)[0]}_{suffix}.png"
                                suffix += 1
                            seen_tile_numbers.add(filename_base)
                        else:
                            filename_base = public_id

                        # Save image to disk immediately
                        res = _save_to_local_storage(img_bytes, filename_base)
                        if res:
                            image_url, relative_path = res
                            hash_to_url[img_hash] = (image_url, relative_path)

                    # Save to database page-by-page immediately
                    existing = None
                    if final_tile_number:
                        existing = db.query(TileCatalog).filter(
                            TileCatalog.tile_number == final_tile_number,
                            TileCatalog.catalog_name == catalog_name,
                        ).first()

                        if existing:
                            # Append a suffix so we don't drop duplicate tile faces/crops
                            base_number = final_tile_number
                            suffix_counter = 2
                            while existing:
                                final_tile_number = f"{base_number}-{suffix_counter}"
                                existing = db.query(TileCatalog).filter(
                                    TileCatalog.tile_number == final_tile_number,
                                    TileCatalog.catalog_name == catalog_name,
                                ).first()
                                suffix_counter += 1

                    db_tile = TileCatalog(
                        tile_name=final_tile_name or f"Tile Page {page_num+1}",
                        tile_number=final_tile_number,
                        tile_size=tile_size,
                        image_url=image_url,
                        catalog_name=catalog_name,
                        page_number=page_num + 1,
                        relative_image_path=relative_path,
                    )
                    db.add(db_tile)
                    db.commit()

                    raw_tiles.append({
                        "tile_name": final_tile_name or f"Tile Page {page_num+1}",
                        "tile_number": final_tile_number,
                        "tile_size": tile_size,
                        "image_url": image_url,
                        "relative_image_path": relative_path,
                        "catalog_name": catalog_name,
                        "page_number": page_num + 1,
                    })

                # Explicitly free page object to avoid memory build-up
                page = None

                if (page_num + 1) % 10 == 0:
                    logger.info(f"  ... processed scanned page {page_num+1}/{total_pages}")

            except Exception as e:
                logger.error(f"Scanned page {page_num+1} failed: {e}", exc_info=True)
                continue
    finally:
        db.close()

    doc.close()
    logger.info(f"Scanned extraction done: {len(raw_tiles)} tiles from '{catalog_name}'")
    return raw_tiles



