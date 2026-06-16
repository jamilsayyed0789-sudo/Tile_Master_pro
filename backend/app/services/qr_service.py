import io
import logging
import re
import uuid
from typing import Optional, Tuple

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

SIZE_PATTERN = re.compile(r'(\d+)\s*[xX×]\s*(\d+)')


def parse_tile_size(size_str: str) -> Tuple[int, int]:
    m = SIZE_PATTERN.match(size_str.strip())
    if m:
        return int(m.group(1)), int(m.group(2))
    return 600, 600


def generate_qr_code(tile_url: str, tile_name: str) -> bytes:
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2,
    )
    qr.add_data(tile_url)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=SolidFillColorMask(
            back_color=(255, 255, 255),
            front_color=(30, 30, 30),
        ),
    )
    img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def generate_qr_label_pdf(
    qr_image_bytes: bytes,
    tile_name: str,
    tile_number: str,
    tile_size: str,
    tile_image_bytes: Optional[bytes] = None,
    label_size_inches: float = 3.0,
    price_per_sqft: Optional[float] = None,
) -> bytes:
    from fpdf import FPDF

    pdf = FPDF(unit="mm", format=(label_size_inches * 25.4 + 10, label_size_inches * 25.4 + 10))
    pdf.add_page()

    margin = 3
    usable = label_size_inches * 25.4

    qr_pil = Image.open(io.BytesIO(qr_image_bytes))
    qr_buf = io.BytesIO()
    qr_pil.save(qr_buf, format="PNG")
    qr_buf.seek(0)

    qr_size = usable * 0.55
    qr_x = margin + (usable - qr_size) / 2
    qr_y = margin + 2
    pdf.image(qr_buf, x=qr_x, y=qr_y, w=qr_size, h=qr_size)

    text_y = qr_y + qr_size + 2
    pdf.set_font("Helvetica", "B", 9 if label_size_inches >= 3 else 7)
    pdf.set_xy(margin, text_y)
    pdf.cell(usable, 4, text=tile_name[:30], align="C")

    pdf.set_font("Helvetica", "", 7 if label_size_inches >= 3 else 5)
    pdf.set_xy(margin, text_y + 4)
    pdf.cell(usable, 3, text=f"SKU: {tile_number}  |  {tile_size}", align="C")

    if price_per_sqft is not None:
        pdf.set_font("Helvetica", "B", 8 if label_size_inches >= 3 else 6)
        pdf.set_xy(margin, text_y + 8)
        pdf.cell(usable, 3, text=f"Price: Rs.{price_per_sqft:.0f} / sq.ft", align="C")
        pdf.set_font("Helvetica", "I", 5)
        pdf.set_xy(margin, text_y + 12)
        pdf.cell(usable, 3, text="Scan to see this tile in your room in 3D", align="C")
    else:
        pdf.set_font("Helvetica", "I", 5)
        pdf.set_xy(margin, text_y + 8)
        pdf.cell(usable, 3, text="Scan to see this tile in your room in 3D", align="C")

    result = pdf.output(dest="S")
    if isinstance(result, bytearray):
        return bytes(result)
    if isinstance(result, str):
        return result.encode("latin-1")
    return result


def generate_qr_label_png(
    qr_image_bytes: bytes,
    tile_name: str,
    tile_number: str,
    tile_size: str,
    price_per_sqft: Optional[float] = None,
    tile_image_bytes: Optional[bytes] = None,
) -> bytes:
    qr_pil = Image.open(io.BytesIO(qr_image_bytes)).convert("RGBA")
    
    width = 1200
    height = 800
    label = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    
    # Optional Tile Image on the left
    tile_w = 600
    if tile_image_bytes:
        try:
            tile_img = Image.open(io.BytesIO(tile_image_bytes)).convert("RGBA")
            tile_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
            tx = (tile_w - tile_img.width) // 2
            ty = 100 + (500 - tile_img.height) // 2
            label.paste(tile_img, (tx, ty), tile_img)
        except Exception as e:
            logger.warning(f"Could not process tile image for PNG: {e}")
            tile_w = 0
    else:
        tile_w = 0
    
    qr_size = 400
    qr_resized = qr_pil.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    qr_x = tile_w + (width - tile_w - qr_size) // 2
    qr_y = 60
    label.paste(qr_resized, (qr_x, qr_y), qr_resized)
    
    draw = ImageDraw.Draw(label)
    
    def get_font(name="arial.ttf", size=30):
        try:
            return ImageFont.truetype(name, size)
        except IOError:
            try:
                return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
            except IOError:
                return ImageFont.load_default()

    font_title = get_font("arialbd.ttf", 36)
    font_sub = get_font("arial.ttf", 26)
    font_small = get_font("arial.ttf", 20)
    
    def draw_centered(text, y, font, color=(0,0,0)):
        if hasattr(font, "getbbox"):
            bbox = font.getbbox(text)
            w = bbox[2] - bbox[0]
        else:
            w = len(text) * 6 
        x = tile_w + (width - tile_w - w) / 2
        draw.text((x, y), text, font=font, fill=color)

    y_offset = qr_y + qr_size + 30
    
    draw_centered(tile_name[:30], y_offset, font_title)
    y_offset += 50
    
    draw_centered(f"SKU: {tile_number}  |  {tile_size}", y_offset, font_sub, color=(80, 80, 80))
    y_offset += 40
    
    if price_per_sqft is not None:
        draw_centered(f"Price: Rs.{price_per_sqft:.0f} / sq.ft", y_offset, font_sub, color=(30, 130, 70))
        y_offset += 50
    
    draw_centered("Scan to see this tile in your room in 3D", y_offset, font_small, color=(120, 120, 120))
    
    buf = io.BytesIO()
    label.save(buf, format="PNG")
    return buf.getvalue()


def calculate_tiles_required(
    room_length_ft: float,
    room_width_ft: float,
    tile_size_str: str,
) -> int:
    tw_mm, th_mm = parse_tile_size(tile_size_str)
    tw_ft = tw_mm / 304.8
    th_ft = th_mm / 304.8

    tiles_length = max(1, round(room_length_ft / tw_ft + 0.5))
    tiles_width = max(1, round(room_width_ft / th_ft + 0.5))
    total = tiles_length * tiles_width
    total_with_waste = int(total * 1.1) + 1
    return total_with_waste
