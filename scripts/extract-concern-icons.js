/**
 * extract-concern-icons.js
 * Extracts individual concern icons from the Shop by Concern composite image.
 * Run: node scripts/extract-concern-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT = path.join(__dirname, '../C:/Users/HP/.gemini/antigravity/brain/f35221d7-d18d-4b01-b221-1751f698e767/media__1783417792636.jpg');
const OUTPUT_DIR = path.join(__dirname, '../public/images/concerns');

// The image is 1024×576 (approx). 
// Layout: 5 columns, 3 rows of icons.
// Let's measure by the actual image dimensions.
async function main() {
  // Ensure output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const meta = await sharp(INPUT).metadata();
  console.log(`Image size: ${meta.width}×${meta.height}`);
  
  const W = meta.width;
  const H = meta.height;

  // From visual inspection:
  // - Title header takes ~top 15% of height (~y offset 150px out of ~1000px at full res)
  // - Icons arranged 5 cols, 3 rows
  // - Left margin ~90px, right margin ~90px
  // - Top of first row circles: ~150px
  // - Row height: ~280px
  // - Col width: (W - 180) / 5 ≈ 165px  (for 1024px wide)
  // Scale everything relative to actual width

  const scale = W / 1024;
  
  const concerns = [
    // Row 1
    { name: 'brain-wellness',    col: 0, row: 0 },
    { name: 'cardiac-wellness',  col: 1, row: 0 },
    { name: 'daily-wellness',    col: 2, row: 0 },
    { name: 'diabetic-wellness', col: 3, row: 0 },
    { name: 'digestive-wellness',col: 4, row: 0 },
    // Row 2
    { name: 'hair-wellness',     col: 0, row: 1 },
    { name: 'immunity-wellness', col: 1, row: 1 },
    { name: 'kidney-wellness',   col: 2, row: 1 },
    { name: 'liver-wellness',    col: 3, row: 1 },
    { name: 'mens-wellness',     col: 4, row: 1 },
    // Row 3
    { name: 'pain-reliever',     col: 0, row: 2 },
    { name: 'skin-wellness',     col: 1, row: 2 },
    { name: 'stamina-booster',   col: 2, row: 2 },
    { name: 'womens-wellness',   col: 3, row: 2 },
    { name: 'blood-purify',      col: 4, row: 2 },
  ];

  // Visual crop offsets (for 1024px wide source image)
  // Title zone ends around y=135
  // Row heights are ~193px each (content height approx 580)
  // Each cell is ~205px wide

  const leftPad = Math.round(55 * scale);
  const topStart = Math.round(115 * scale);
  const cellW = Math.round(195 * scale);
  const cellH = Math.round(200 * scale);

  for (const c of concerns) {
    const left = leftPad + c.col * cellW;
    const top = topStart + c.row * cellH;
    const width = Math.min(cellW, W - left);
    const height = Math.min(cellH, H - top);

    const outFile = path.join(OUTPUT_DIR, `${c.name}.png`);
    await sharp(INPUT)
      .extract({ left, top, width, height })
      .resize(120, 120, { fit: 'contain', background: { r: 250, g: 248, b: 240, alpha: 1 } })
      .png()
      .toFile(outFile);
    
    console.log(`✅ Extracted: ${c.name} → left=${left}, top=${top}, w=${width}, h=${height}`);
  }
  
  console.log(`\n🎉 All ${concerns.length} icons saved to ${OUTPUT_DIR}`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
