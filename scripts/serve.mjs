import http from 'node:http'
import { createReadStream } from 'node:fs'
import { lstat, stat } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = join(projectRoot, 'dist')
const port = Number(process.env.PORT || process.argv[2] || 4173)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('端口号无效。使用方法：node scripts/serve.mjs [端口号]')
  process.exit(1)
}

try {
  await stat(join(distRoot, 'index.html'))
  if ((await lstat(distRoot)).isSymbolicLink()) throw new Error('dist 不能是符号链接')
} catch {
  console.error('未找到构建文件。请先运行 npm install 和 npm run build。')
  process.exit(1)
}

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed')
    return
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/\\/g, '/')
    if (pathname.includes('\0')) throw new Error('Invalid path')
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const filePath = resolve(distRoot, relativePath)
    if (!filePath.startsWith(`${distRoot}${sep}`)) {
      response.writeHead(403).end('Forbidden')
      return
    }
    let current = distRoot
    for (const part of relative(distRoot, filePath).split(sep)) {
      current = join(current, part)
      if ((await lstat(current)).isSymbolicLink()) {
        response.writeHead(403).end('Forbidden')
        return
      }
    }
    const info = await stat(filePath)
    if (!info.isFile()) {
      response.writeHead(404).end('Not found')
      return
    }
    response.writeHead(200, {
      'Content-Type': mime[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(filePath).on('error', () => response.destroy()).pipe(response)
  } catch (error) {
    const status = error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400
    response.writeHead(status).end(status === 404 ? 'Not found' : 'Bad request')
  }
})

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被占用，可运行 node scripts/serve.mjs 4174。` : error.message)
  process.exitCode = 1
})

server.listen(port, '0.0.0.0', () => {
  console.log(`海南动物科学知识大挑战已启动：http://localhost:${port}`)
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) console.log(`同一 Wi-Fi 下的平板访问：http://${address.address}:${port}`)
    }
  }
  console.log('保持此窗口打开；按 Ctrl+C 停止服务。')
})
