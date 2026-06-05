"""
Diagnostic: dump all text blocks from the PDF so we can see what data is available.
"""
import sys
import fitz

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "test_tiles.pdf"

doc = fitz.open(pdf_path)
print(f"Total pages: {len(doc)}\n")

for page_num in range(min(5, len(doc))):  # show first 5 pages
    page = doc[page_num]
    blocks = page.get_text("blocks")
    print(f"{'='*60}")
    print(f"PAGE {page_num+1}  |  images: {len(page.get_images(full=True))}")
    print(f"{'='*60}")
    for b in blocks:
        if len(b) >= 5 and isinstance(b[4], str) and b[4].strip():
            text = b[4].strip().replace("\n", " | ")
            bbox = (round(b[0]), round(b[1]), round(b[2]), round(b[3]))
            print(f"  [{bbox}]  '{text}'")
    print()

doc.close()
