"""Diagnose why your PDF has only 4 detectable images."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

pdf_path = input("Drag your PDF file here and press Enter: ").strip().strip('"').strip("'")
if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    sys.exit(1)

import fitz
doc = fitz.open(pdf_path)
print(f"\nPDF: {os.path.basename(pdf_path)}")
print(f"Pages: {len(doc)}")

for page_num in range(len(doc)):
    page = doc[page_num]
    pr = page.rect
    print(f"\n--- Page {page_num + 1} ({pr.width:.0f}x{pr.height:.0f}) ---")

    # Check get_image_info
    infos = page.get_image_info()
    print(f"get_image_info: {len(infos)} images")
    for i, info in enumerate(infos[:20]):  # first 20
        b = info["bbox"]
        w, h = b[2]-b[0], b[3]-b[1]
        xr = info.get("xref", 0)
        print(f"  [{i}] bbox=({b[0]:.0f},{b[1]:.0f},{b[2]:.0f},{b[3]:.0f})  {w:.0f}x{h:.0f}  xref={xr}")

    if len(infos) > 20:
        print(f"  ... and {len(infos)-20} more")

    # Check get_images
    imgs = page.get_images(full=True)
    print(f"get_images (unique xrefs): {len(imgs)}")
    for i, img in enumerate(imgs[:10]):
        xref, width, height = img[0], img[2], img[3]
        print(f"  [{i}] xref={xref}  {width}x{height}")

    # Check text blocks
    blocks = page.get_text("blocks")
    text_count = sum(1 for b in blocks if len(b) >= 5 and isinstance(b[4], str) and len(b[4].strip()) > 1)
    print(f"text blocks with content: {text_count}")

# Check if it's a scanned/image-only PDF
page0 = doc[0]
text0 = page0.get_text()
if not text0.strip():
    print("\n⚠ WARNING: No text found on page 1 — this may be a scanned/image-only PDF.")

doc.close()
print("\nDone. Share this output so I can fix the extractor.")
