import io
import re
import fitz  # PyMuPDF
from typing import List, Dict, Tuple, Optional
import logging
import math

try:
    from PIL import Image
    import numpy as np
    import cv2
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

logger = logging.getLogger(__name__)

class TextExtractionService:
    """
    Hybrid text extraction service that automatically detects text-based vs scanned PDFs
    and uses the appropriate extraction method. Never interferes with image extraction.
    """

    def __init__(self):
        self.tile_number_pattern = re.compile(r'\b[A-Z0-9-]{4,20}\b', re.IGNORECASE)
        self.tile_size_pattern = re.compile(r'\b\d+\s?[xX×]\s?\d+\b')
        self.ignore_words = ['email', 'website', 'address', 'ph:', 'tel:', 'mob:', 'com', 'www', 'info@', 'page', 'mm', 'cm']
        
        # Enhanced patterns for intelligent extraction
        self.strict_number_pattern = re.compile(r'^(?:#|No\.|Ref|Code)?\s*([A-Za-z]{0,5}[-_.]?\s?\d{3,8})$', re.IGNORECASE)
        self.dimensions_pattern = re.compile(r'\d+\s?[xX×]\s?\d+|\d+\s?mm|\d+\s?cm', re.IGNORECASE)
        self.finish_pattern = re.compile(r'\b(Glossy|Matt?|Satin|Polished|Rustic|Lappato|Sugar|High\s*Gloss)\b', re.IGNORECASE)

    def process_tile_data(self, page_text: str, image_base64: str) -> Dict:
        """Extract metadata using frontend-provided text, fallback to OCR on the cropped image."""
        try:
            text_blocks = []
            if page_text and len(page_text.strip()) > 3:
                # The frontend joins all PDF text with spaces.
                # Use robust regexes to find tile numbers directly
                from app.services.catalog_service import TILE_NUMBER_REGEXES
                for pattern in TILE_NUMBER_REGEXES:
                    matches = pattern.findall(page_text)
                    for m in matches:
                        text_blocks.append({"text": m, "x": 0, "y": 0, "center_x": 0, "center_y": 0, "dist_to_center": 0})
                
                # Also split by spaces to let the normal extraction work on chunks
                for chunk in page_text.split(' '):
                    if len(chunk.strip()) > 2:
                        text_blocks.append({"text": chunk.strip(), "x": 0, "y": 0, "center_x": 0, "center_y": 0, "dist_to_center": 0})
            
            result = self._empty_result()
            if text_blocks:
                result = self._extract_metadata(text_blocks, 0, 0)
                
            ocr_blocks = []
            if image_base64 and HAS_TESSERACT:
                ocr_blocks = self._extract_from_base64_image(image_base64)
                
                # If basic extraction failed or we want to run the intelligent layer
                if not result["tileName"] or not result["tileNumber"]:
                    ocr_result = self._extract_metadata(ocr_blocks, 0, 0)
                    if not result["tileName"]: result["tileName"] = ocr_result["tileName"]
                    if not result["tileNumber"]: result["tileNumber"] = ocr_result["tileNumber"]
                    if not result["tileSize"]: result["tileSize"] = ocr_result["tileSize"]
            
            # --- INTELLIGENT EXTRACTION ENHANCEMENT LAYER ---
            # Combine all available blocks for intelligent analysis
            all_blocks = text_blocks + ocr_blocks
            if all_blocks:
                intelligent_res = self._intelligent_extraction(all_blocks)
                if intelligent_res["tileName"]:
                    result["tileName"] = intelligent_res["tileName"]
                if intelligent_res["tileNumber"]:
                    result["tileNumber"] = intelligent_res["tileNumber"]

            # Per user request: Use the Tile Number as the Tile Name to prevent duplicate names
            if result["tileNumber"] and result["tileNumber"].strip():
                result["tileName"] = result["tileNumber"]

            # DEBUG: Output raw page text and Tesseract status to the 'finish' field so it shows up in the UI
            debug_text = f"Tesseract: {HAS_TESSERACT} | Text: {page_text[:100]}"
            result["finish"] = debug_text

            return result
        except Exception as e:
            logger.error(f"process_tile_data failed: {e}")
            return self._empty_result()

    def _extract_from_base64_image(self, b64_str: str) -> List[Dict]:
        blocks = []
        try:
            import base64
            from app.services.catalog_service import _perform_ocr_on_page
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_str)
            
            ocr_res = _perform_ocr_on_page(img_bytes)
            
            from PIL import Image
            import io
            pil_image = Image.open(io.BytesIO(img_bytes))
            w, h = pil_image.size
            img_center_x, img_center_y = w / 2, h / 2
            
            for b in ocr_res:
                xmin, ymin, xmax, ymax = b["bbox"]
                cx = (xmin + xmax) / 2
                cy = (ymin + ymax) / 2
                blocks.append({
                    "text": b["text"],
                    "x": xmin,
                    "y": ymin,
                    "center_x": cx,
                    "center_y": cy,
                    "dist_to_center": math.hypot(cx - img_center_x, cy - img_center_y)
                })
        except Exception as e:
            logger.error(f"OCR failed: {e}")
        return blocks

    def _intelligent_extraction(self, blocks: List[Dict]) -> Dict:
        """
        Intelligent extraction module that:
        1. Analyzes text around tile image.
        2. Identifies most probable Name and Number.
        3. Removes duplicates.
        4. Ignores dimensions and finish names.
        5. Uses proximity to select the best candidate.
        """
        res = {"tileName": None, "tileNumber": None}
        if not blocks:
            return res

        candidates = []
        seen_texts = set()

        for b in blocks:
            text = b["text"].strip()
            # Deduplication
            if text.lower() in seen_texts:
                continue
            seen_texts.add(text.lower())
            
            # Ignore random catalog text, sizes, and finishes
            if len(text) < 3 or len(text) > 40:
                continue
            if any(junk in text.lower() for junk in self.ignore_words):
                continue
            if self.dimensions_pattern.search(text):
                continue
            if self.finish_pattern.search(text):
                continue

            dist = b.get("dist_to_center", 9999)
            candidates.append({"text": text, "dist": dist})

        if not candidates:
            return res

        # Score candidates for Tile Name and Tile Number
        best_name = None
        best_name_score = -1
        best_number = None
        best_number_score = -1

        for c in candidates:
            text = c["text"]
            dist = c["dist"]
            
            # Distance penalty: closer to center = higher score
            dist_score = max(0, 100 - (dist * 0.1))

            # --- Score for Tile Number ---
            num_score = 0
            if self.strict_number_pattern.match(text):
                num_score += 50
                # Mix of letters and numbers is highly indicative of a Tile Number (e.g. RSB6012)
                if any(char.isdigit() for char in text) and any(char.isalpha() for char in text):
                    num_score += 30
                elif any(char.isdigit() for char in text):
                    num_score += 10
            
            total_num_score = num_score + dist_score
            if num_score > 0 and total_num_score > best_number_score:
                best_number_score = total_num_score
                best_number = text

            # --- Score for Tile Name ---
            name_score = 0
            # Names usually don't have numbers
            if not any(char.isdigit() for char in text):
                name_score += 30
                # Title case or ALL CAPS is highly indicative of a Tile Name
                if text.istitle():
                    name_score += 20
                elif text.isupper():
                    name_score += 20
                
                # Length heuristic: 5 to 25 chars
                if 5 <= len(text) <= 25:
                    name_score += 10
            
            total_name_score = name_score + dist_score
            if name_score > 0 and total_name_score > best_name_score:
                # Ensure the best name isn't exactly the best number
                if text != best_number:
                    best_name_score = total_name_score
                    best_name = text

        # Final pass: If best_name is still the best_number, clear it
        if best_name and best_name == best_number:
            best_name = None

        # Return null (None) if not confident
        if best_name_score > 40:
            res["tileName"] = best_name
        if best_number_score > 40:
            
            # Clean up the number if it has prefixes
            match = self.strict_number_pattern.match(best_number)
            if match:
                res["tileNumber"] = match.group(1)
            else:
                res["tileNumber"] = best_number

        return res

    def _extract_metadata(self, text_blocks: List[Dict], crop_cx: float, crop_cy: float) -> Dict:
        """Analyze text blocks to find Tile Number, Size, and Name."""
        result = self._empty_result()
        
        if not text_blocks:
            return result

        lines = []
        for b in text_blocks:
            for part in b["text"].split('\n'):
                if part.strip():
                    lines.append({
                        "text": part.strip(),
                        "distance": 0
                    })

        for line in lines:
            if not result["tileSize"]:
                size_match = self.tile_size_pattern.search(line["text"])
                if size_match:
                    result["tileSize"] = size_match.group(0).lower().replace(' ', '')
                    line["text"] = line["text"].replace(size_match.group(0), "").strip()

        for line in lines:
            if not result["tileNumber"]:
                words = line["text"].split()
                for word in words:
                    num_match = self.tile_number_pattern.match(word)
                    if num_match:
                        if sum(c.isdigit() for c in word) > 0 or len(word) >= 4:
                            result["tileNumber"] = word
                            line["text"] = line["text"].replace(word, "").strip()
                            break

        best_name_score = -1
        best_name = ""

        for line in lines:
            text = line["text"].strip()
            if not text or len(text) < 3:
                continue
                
            lower_text = text.lower()
            if any(junk in lower_text for junk in self.ignore_words):
                continue

            score = 0
            
            if 5 <= len(text) <= 25:
                score += 20
                
            upper_count = sum(1 for c in text if c.isupper())
            if upper_count / len(text) > 0.5:
                score += 15
            elif text.istitle():
                score += 10
                
            if score > best_name_score:
                best_name_score = score
                best_name = text

        if best_name:
            result["tileName"] = best_name

        return result

    def _empty_result(self) -> Dict:
        return {
            "tileName": "",
            "tileNumber": "",
            "tileSize": ""
        }
