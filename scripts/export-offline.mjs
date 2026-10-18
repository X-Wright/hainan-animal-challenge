import { readFile, writeFile, lstat } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = join(projectRoot, 'dist')
const outputPath = join(projectRoot, '海南动物科学知识大挑战-离线版.html')
const animalIds = ['chicken', 'duck', 'pig', 'goat', 'goose']

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3]
}

async function readBuildAsset(reference) {
  if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) {
    throw new Error(`离线导出仅支持构建目录中的本地资源：${reference}`)
  }
  const decoded = decodeURIComponent(reference.split(/[?#]/, 1)[0]).replace(/\\/g, '/')
  const assetPath = resolve(distRoot, decoded.replace(/^\/+/, ''))
  if (!assetPath.startsWith(`${distRoot}${sep}`)) {
    throw new Error(`资源路径超出了 dist 目录：${reference}`)
  }
  let current = distRoot
  for (const part of ['', ...relative(distRoot, assetPath).split(sep)]) {
    current = join(current, part)
    if ((await lstat(current)).isSymbolicLink()) {
      throw new Error(`离线导出不读取符号链接：${reference}`)
    }
  }
  return readFile(assetPath, 'utf8')
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)]
  const replacements = await Promise.all(matches.map(replacer))
  let result = ''
  let cursor = 0
  matches.forEach((match, index) => {
    result += source.slice(cursor, match.index) + replacements[index]
    cursor = match.index + match[0].length
  })
  return result + source.slice(cursor)
}

async function main() {
  let html
  try {
    html = await readFile(join(distRoot, 'index.html'), 'utf8')
  } catch {
    throw new Error('未找到 dist/index.html。请先执行 npm run build，再执行 npm run offline。')
  }

  const animalAssets = Object.fromEntries(await Promise.all(animalIds.map(async (id) => {
    const svg = await readFile(join(projectRoot, 'public', 'animals', `${id}.svg`))
    return [id, `data:image/svg+xml;base64,${svg.toString('base64')}`]
  })))

  let stylesheetCount = 0
  html = await replaceAsync(html, /<link\b[^>]*>/gi, async ([tag]) => {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/)
    if (rel.includes('icon') || rel.includes('modulepreload')) return ''
    if (!rel.includes('stylesheet')) return tag
    stylesheetCount += 1
    const css = await readBuildAsset(attribute(tag, 'href'))
    const cssUrls = [...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)].map((match) => match[2].trim())
    if (/@import\s/i.test(css) || cssUrls.some((url) => !/^(?:data:|#)/i.test(url))) {
      throw new Error('CSS 中存在尚未内联的外部资源，请先将其改为本地 SVG 或 data URL。')
    }
    return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`
  })

  let scriptCount = 0
  html = await replaceAsync(html, /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, async ([tag]) => {
    const source = attribute(tag.slice(0, tag.indexOf('>') + 1), 'src')
    if (!source) return tag
    if (attribute(tag, 'type')?.toLowerCase() !== 'module') {
      throw new Error('发现非 module 外部脚本，无法安全打包为离线单文件。')
    }
    const js = await readBuildAsset(source)
    if (/\bimport\s*\(\s*['"](?:\.|\/|https?:)/.test(js) || /\b(?:import|export)\s[^;\n]*\bfrom\s*['"]/.test(js)) {
      throw new Error('构建包含独立 JS 分块，请使用单入口构建后重新导出离线版。')
    }
    scriptCount += 1
    return `<script>window.__ANIMAL_ASSETS__=${JSON.stringify(animalAssets)};</script>\n<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`
  })

  const favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#177B56"/><text x="32" y="46" text-anchor="middle" font-size="42">🐔</text></svg>')
  html = html.replace('</head>', `<link rel="icon" href="${favicon}">\n</head>`)
  if (!scriptCount || !stylesheetCount) throw new Error('构建入口缺少 JS 或 CSS，离线导出中止。')
  if (/<script\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i.test(html)) {
    throw new Error('离线文件仍然引用外部脚本或样式，导出中止。')
  }
  if (!html.includes('window.__ANIMAL_ASSETS__=')) throw new Error('动物插画未成功内联。')

  await writeFile(outputPath, html, 'utf8')
  console.log(`离线单文件已生成：${outputPath}`)
  console.log('可以直接双击此 HTML 文件使用；原 dist 目录保持不变。')
}

main().catch((error) => {
  console.error(`离线导出失败：${error.message}`)
  process.exitCode = 1
})
