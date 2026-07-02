import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates', 'bathrooms');
    
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json([]);
    }

    const folders = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const templates = [];

    for (const folder of folders) {
      const metaPath = path.join(templatesDir, folder, 'metadata.json');
      if (fs.existsSync(metaPath)) {
        try {
          const metaContent = fs.readFileSync(metaPath, 'utf8');
          const metaJson = JSON.parse(metaContent);
          templates.push(metaJson);
        } catch (e) {
          console.error(`Failed to parse metadata for ${folder}`, e);
        }
      }
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching visualizer templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
