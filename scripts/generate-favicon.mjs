import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateFavicon() {
  const inputPath = path.join(__dirname, '../public/apple-touch-icon.png')
  const outputPath = path.join(__dirname, '../public/favicon.ico')
  
  console.log('Reading source icon from:', inputPath)
  
  // Generate multiple sizes for the ICO file
  const sizes = [16, 32, 48]
  const pngBuffers = []
  
  for (const size of sizes) {
    const buffer = await sharp(inputPath)
      .resize(size, size)
      .png()
      .toBuffer()
    pngBuffers.push(buffer)
    console.log(`Generated ${size}x${size} PNG`)
  }
  
  // Convert to ICO
  const icoBuffer = await pngToIco(pngBuffers)
  fs.writeFileSync(outputPath, icoBuffer)
  
  console.log('Favicon generated successfully at:', outputPath)
}

generateFavicon().catch(console.error)

