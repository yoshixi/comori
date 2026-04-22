#!/usr/bin/env node
/**
 * Generates app icons from resources/icon-source.svg.
 * Produces build/icon.png (1024×1024), build/icon.icns (macOS), build/icon.ico (Windows).
 * Run from the electron app directory: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = join(root, 'resources', 'icon-source.svg')
const buildDir = join(root, 'build')
const iconsetDir = join(root, 'icon.iconset')

mkdirSync(buildDir, { recursive: true })
mkdirSync(iconsetDir, { recursive: true })

// 1. Render SVG → 1024×1024 PNG (used as Linux icon and ICO source)
const png1024 = join(buildDir, 'icon.png')
await sharp(svg).resize(1024, 1024).png().toFile(png1024)
console.log('✓ build/icon.png (1024×1024)')

// 2. Also update the resources logos used at runtime
await sharp(svg).resize(420, 420).png().toFile(join(root, 'resources', 'logo.png'))
await sharp(svg).resize(840, 840).png().toFile(join(root, 'resources', 'logo@2x.png'))
console.log('✓ resources/logo.png + logo@2x.png')

// 3. Build macOS iconset (all required sizes)
const macSizes = [
  { size: 16,   name: 'icon_16x16.png' },
  { size: 32,   name: 'icon_16x16@2x.png' },
  { size: 32,   name: 'icon_32x32.png' },
  { size: 64,   name: 'icon_32x32@2x.png' },
  { size: 128,  name: 'icon_128x128.png' },
  { size: 256,  name: 'icon_128x128@2x.png' },
  { size: 256,  name: 'icon_256x256.png' },
  { size: 512,  name: 'icon_256x256@2x.png' },
  { size: 512,  name: 'icon_512x512.png' },
  { size: 1024, name: 'icon_512x512@2x.png' },
]

for (const { size, name } of macSizes) {
  await sharp(svg).resize(size, size).png().toFile(join(iconsetDir, name))
}
console.log('✓ iconset PNGs generated')

// 4. Convert iconset → .icns
execSync(`iconutil -c icns "${iconsetDir}" -o "${join(buildDir, 'icon.icns')}"`)
console.log('✓ build/icon.icns')

// 5. Generate .ico using sips (macOS) via the 256×256 PNG as source
//    sips can write ico from an existing PNG
const ico256 = join(iconsetDir, 'icon_256x256.png')
execSync(`sips -s format ico "${ico256}" --out "${join(buildDir, 'icon.ico')}"`)
console.log('✓ build/icon.ico')

// 6. Cleanup iconset
rmSync(iconsetDir, { recursive: true })
console.log('✓ Cleaned up iconset directory')

console.log('\nAll icons generated successfully.')
