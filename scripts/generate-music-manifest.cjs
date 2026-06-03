/**
 * @file generate-music-manifest.cjs
 * @description 扫描 public/music/ 目录 → 生成 music-manifest.json
 * 取代 audio-engine.ts 中的硬编码目录/文件列表
 * 每次 dev/build 前自动执行
 */
const fs = require('fs')
const path = require('path')

const MUSIC_DIR = path.resolve(__dirname, '..', 'public', 'music')
const OUT_FILE = path.resolve(__dirname, '..', 'public', 'music-manifest.json')

/** 从文件名解析歌手和曲名 */
function parseFileName(fileName) {
  const name = fileName.replace(/\.mp3$/i, '')
  // 匹配 "沫言 & 沫语 - 歌曲名"、"沫言 - 歌曲名" 等模式
  const match = name.match(/^([^-]+?)\s*[-–—]\s*(.+)$/)
  if (match) {
    return {
      artist: match[1].trim(),
      title: match[2].trim(),
    }
  }
  // 无分隔符的 fallback
  return { artist: '', title: name }
}

function encodeUrlSegment(str) {
  // encodeURIComponent 编码所有非 ASCII 和特殊字符，
  // 但 & 在 URL path 中合法，Vite 对 %26 处理有 bug，故保留为字面 &
  return encodeURIComponent(str).replace(/%26/g, '&')
}

function scanDirectory(dirPath, relativeBase) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const subdirs = []
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const child = scanDirectory(fullPath, path.join(relativeBase, entry.name))
      subdirs.push(child)
    } else if (entry.isFile() && /\.mp3$/i.test(entry.name)) {
      const parsed = parseFileName(entry.name)
      files.push({
        fileName: entry.name,
        ...parsed,
        url: path.posix.join('/music', relativeBase, encodeUrlSegment(entry.name)),
      })
    }
  }

  return {
    name: path.basename(dirPath),
    relativePath: relativeBase,
    artistName: inferArtistName(dirPath),
    tags: [],
    subdirs,
    files,
  }
}

function inferArtistName(dirPath) {
  const basename = path.basename(dirPath).toLowerCase()
  if (basename.includes('ab')) return '沫言 & 沫语'
  if (basename.includes('a')) return '沫言'
  if (basename.includes('b')) return '沫语'
  return 'YYC³'
}

function buildManifest() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.warn('[MusicManifest] ⚠️ music/ 目录不存在，跳过:', MUSIC_DIR)
    fs.writeFileSync(OUT_FILE, JSON.stringify({ directories: [], tracks: [], total: 0, updatedAt: Date.now() }, null, 2))
    return
  }

  const root = scanDirectory(MUSIC_DIR, '')
  const allFiles = []

  function collectFiles(node) {
    for (const f of node.files) {
      allFiles.push({
        ...f,
        artistName: node.artistName || f.artist || 'YYC³',
        album: node.name,
      })
    }
    for (const sub of node.subdirs) {
      collectFiles(sub)
    }
  }

  collectFiles(root)

  const manifest = {
    directories: root.subdirs,
    tracks: allFiles,
    total: allFiles.length,
    updatedAt: Date.now(),
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2))
  console.log(`[MusicManifest] ✅ 生成完成: ${allFiles.length} 首歌曲 → music-manifest.json`)
}

buildManifest()
