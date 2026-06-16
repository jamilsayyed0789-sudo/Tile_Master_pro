import type { AIExtractionResult } from "@/types/tile";

const TILE_NAME_PATTERNS = [
  /(?:tile|series|collection|model|design|style|name)\s*[:\-]?\s*(.+)/i,
  /([A-Z][A-Za-z\s]+(?:Marble|Granite|Stone|Ceramic|Porcelain|Wood|Slate|Travertine|Limestone|Onyx|Oceano|Bianco|Nero|Crema|Statuario|Calacatta))/i,
  /^([A-Za-z][A-Za-z\s\-\']{3,20})$/m,
  // Fallback: grab any long word sequence that looks like a name (e.g. STATUARIO CLASSICO)
  /\b([A-Z]{3,}\s+[A-Z]{3,})\b/,
  /\b([A-Z][A-Za-z]{3,}\s+[A-Z][A-Za-z]{3,})\b/
];

const TILE_NUMBER_PATTERNS = [
  /(?:SKU|Code|No|Number|#|Ref|Item)\s*[:\-]?\s*([A-Z0-9][\w\-\/]+)/i,
  /\b([A-Z]{1,4}[\-\.]?\d{2,6}[A-Z]{0,2})\b/,
  /\b(\d{3,6}[A-Z]{0,3})\b/,
  // Fallback: any alphanumeric sequence that has both letters and numbers
  /\b([A-Za-z]+\d+[\w\-]*|\d+[A-Za-z]+[\w\-]*)\b/
];

const TILE_SIZE_PATTERNS = [
  /(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*(?:mm|cm|in|")?/,
  /\b(\d{3,4})\s*(?:mm|cm)\b/,
  /\b(\d+["])\s*[xX×]\s*(\d+["])/,
];

const FINISH_PATTERNS = [
  /\b(Glossy|Matt?|Matte|Satin|Polished|Honed|Brushed|Leather|Lappato|Structured|Rustic|Natural|Raw|Bush\-hammered|Flamed|Sandblasted|Split|Tumbled|Antique|Distressed|Crystalline|Sugar|Super\s*Polished)\b/i,
];

const COLOR_PATTERNS = [
  /\b(White|Black|Grey|Gray|Beige|Cream|Ivory|Brown|Red|Blue|Green|Gold|Silver|Tan|Charcoal|Anthracite|Nero|Bianco|Noir|Taupe|Ecru|Sand|Honey|Walnut|Oak|Ebony|Onyx|Marble\s*White|Carrara|Statuario|Emperador|Crema\s*Marfil)\b/i,
  /\b(Colo[u]?r)\s*[:\-]?\s*([A-Za-z\s]+)/i,
];

function extractFirstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return (match[1] || match[0]).trim();
    }
  }
  return "";
}

export function extractTileInfo(text: string): AIExtractionResult {
  if (!text.trim()) {
    return {
      tileName: "",
      tileNumber: "",
      tileSize: "",
      finish: "",
      color: "",
      confidence: 0,
      rawText: text,
    };
  }

  const tileName = extractFirstMatch(text, TILE_NAME_PATTERNS);
  const tileNumber = extractFirstMatch(text, TILE_NUMBER_PATTERNS);

  let tileSize = "";
  for (const pattern of TILE_SIZE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        tileSize = `${match[1]}x${match[2]}`;
      } else {
        tileSize = match[1];
      }
      break;
    }
  }

  const finish = extractFirstMatch(text, FINISH_PATTERNS);
  const color = extractFirstMatch(text, COLOR_PATTERNS);

  let confidence = 0;
  if (tileName) confidence += 30;
  if (tileNumber) confidence += 25;
  if (tileSize) confidence += 20;
  if (finish) confidence += 15;
  if (color) confidence += 10;

  return {
    tileName,
    tileNumber,
    tileSize,
    finish,
    color,
    confidence: Math.min(100, confidence),
    rawText: text,
  };
}

export function generateTileNameSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  for (const pattern of TILE_NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && !suggestions.includes(name)) {
        suggestions.push(name);
      }
    }
  }
  return suggestions.slice(0, 5);
}
