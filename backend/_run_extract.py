from app.services.catalog_service import extract_tiles_from_pdf
with open(r'C:\Users\akram\Downloads\SHERGAON.pdf', 'rb') as f:
    pdf_bytes = f.read()
tiles, zip_bytes = extract_tiles_from_pdf(pdf_bytes, 'SHERGAON')
print('EXTRACTED:', len(tiles))
for t in tiles:
    print(f"  {t['filename']:40s} page={t['page_number']} num={t['tile_number']} name={t['tile_name']} hash={t['image_hash'][:8]}")
