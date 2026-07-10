import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import handler from '../dist/server/server.js'

const port = Number(process.env.PORT ?? 3000)
const clientDir = path.resolve('dist/client')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function safeClientPath(urlPath) {
  const pathname = decodeURIComponent(new URL(`http://local${urlPath}`).pathname)
  const resolved = path.resolve(clientDir, `.${pathname}`)
  if (!resolved.startsWith(clientDir + path.sep) && resolved !== clientDir) return null
  return resolved
}

async function tryStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  const filePath = safeClientPath(req.url ?? '/')
  if (!filePath) return false

  try {
    const info = await stat(filePath)
    if (!info.isFile()) return false
    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': filePath.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=60',
    })
    if (req.method === 'HEAD') return res.end(), true
    createReadStream(filePath).pipe(res)
    return true
  } catch {
    return false
  }
}

function requestUrl(req) {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? `localhost:${port}`
  const proto = req.headers['x-forwarded-proto'] ?? 'http'
  return `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}${req.url ?? '/'}`
}

function toWebRequest(req) {
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req)
  return new Request(requestUrl(req), {
    method: req.method,
    headers: req.headers,
    body,
    duplex: body ? 'half' : undefined,
  })
}

async function sendWebResponse(res, webResponse) {
  res.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => {
    if (key !== 'set-cookie') res.setHeader(key, value)
  })
  const setCookies = webResponse.headers.getSetCookie()
  if (setCookies.length > 0) res.setHeader('set-cookie', setCookies)
  if (!webResponse.body) return res.end()
  for await (const chunk of webResponse.body) res.write(chunk)
  res.end()
}

http
  .createServer(async (req, res) => {
    try {
      if (await tryStatic(req, res)) return
      const webResponse = await handler.fetch(toWebRequest(req), {}, {
        waitUntil: () => undefined,
        passThroughOnException: () => undefined,
      })
      await sendWebResponse(res, webResponse)
    } catch (error) {
      console.error(error)
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Internal Server Error')
    }
  })
  .listen(port, () => {
    console.log(`[server] listening on 0.0.0.0:${port}`)
  })
