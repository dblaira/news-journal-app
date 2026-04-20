const sharp = require('sharp')
const path = require('path')

async function createAppleTouchIcon() {
  const inputPath = path.join(__dirname, '../public/ice-berg-ii.jpg')
  const outputPath = path.join(__dirname, '../public/apple-touch-icon.png')
  
  try {
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath)
    
    console.log('✓ Created apple-touch-icon.png (180x180)')
    
    // Also create a 192x192 version for Android/PWA
    const output192Path = path.join(__dirname, '../public/icon-192.png')
    await sharp(inputPath)
      .resize(192, 192, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(output192Path)
    
    console.log('✓ Created icon-192.png (192x192)')
    
    // Create a 512x512 version for PWA
    const output512Path = path.join(__dirname, '../public/icon-512.png')
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(output512Path)
    
    console.log('✓ Created icon-512.png (512x512)')
    
  } catch (error) {
    console.error('Error creating icon:', error)
    process.exit(1)
  }
}

createAppleTouchIcon()

