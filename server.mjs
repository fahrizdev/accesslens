import { createServer } from 'node:http'
import { readFile, access } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import areaHandler from './api/area.js'

const root = fileURLToPath(new URL('.', import.meta.url))
const dist = resolve(root, 'dist')
try {
  const envText = await readFile(resolve(root, '.env.local'), 'utf8')
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.*?)\s*$/)
    if (match && !process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = match[1].replace(/^(['"])(.*)\1$/, '$2')
  }
} catch {}
const categories = ['Blocked curb ramp', 'Stairs-only entrance', 'Obstructed pathway', 'Uneven surface', 'Heavy or difficult door', 'Missing signage', 'Other']
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' }
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)) }
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  if (url.pathname === '/api/area') return areaHandler(req, res)
  if (url.pathname === '/api/status' && req.method === 'GET') return json(res, 200, { available: Boolean(process.env.OPENAI_API_KEY) })
  if (url.pathname === '/api/analyze' && req.method === 'POST') {
    // Server is loopback-only; reject cross-origin requests in browsers as an extra safeguard.
    const origin = req.headers.origin
    if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) return json(res, 403, { error: 'Request origin rejected.' })
    if (!process.env.OPENAI_API_KEY) return json(res, 503, { error: 'GPT is not connected yet. Add an OpenAI API key to .env.local, then restart AccessLens.' })
    let body = ''
    try {
      for await (const chunk of req) { body += chunk; if (body.length > 9_000_000) return json(res, 413, { error: 'That photo is too large to analyze. Choose a smaller photo.' }) }
      const parsed = JSON.parse(body); const image = parsed?.image
      if (typeof image !== 'string' || !/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 8_500_000) return json(res, 400, { error: 'Choose a valid JPG or PNG photo.' })
      const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(60000), body: JSON.stringify({
        model: 'gpt-6-luna', store: false,
        input: [{ role: 'user', content: [{ type: 'input_text', text: 'Describe only visible physical details that may affect access along a public route. Do not infer a legal violation, disability, intent, or facts outside the image. If the image is unclear or shows no barrier, say so and select Other. Write a concise draft that the user must review.' }, { type: 'input_image', image_url: image, detail: 'high' }] }],
        text: { format: { type: 'json_schema', name: 'accesslens_photo_draft', strict: true, schema: { type: 'object', additionalProperties: false, properties: { observation: { type: 'string' }, suggested_category: { type: 'string', enum: categories }, draft_description: { type: 'string' }, uncertainty: { type: 'string' } }, required: ['observation', 'suggested_category', 'draft_description', 'uncertainty'] } } },
      }) })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return json(res, 502, { error: 'The OpenAI key was rejected. Check .env.local.' })
        if (response.status === 429) return json(res, 502, { error: 'OpenAI rate limit or API balance reached. Check API billing and try again.' })
        return json(res, 502, { error: 'OpenAI could not analyze this photo right now. Please try again.' })
      }
      const result = await response.json(); const text = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text
      if (!text) return json(res, 502, { error: 'No draft was returned. Please try another photo.' })
      let suggestion
      try { suggestion = JSON.parse(text) } catch { return json(res, 502, { error: 'The returned draft could not be read. Please try again.' }) }
      if (!categories.includes(suggestion.suggested_category)) suggestion.suggested_category = 'Other'
      return json(res, 200, { suggestion })
    } catch (error) { return json(res, 502, { error: error?.name === 'TimeoutError' ? 'Photo analysis took too long. Please try again.' : 'Could not analyze this photo. Please try again.' }) }
  }
  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' })
  let requested
  try { requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname) } catch { return json(res, 400, { error: 'Bad path' }) }
  const file = resolve(dist, `.${requested}`)
  if (!(file === dist || file.startsWith(dist + sep))) return json(res, 400, { error: 'Bad path' })
  try { await access(file); res.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); createReadStream(file).pipe(res) }
  catch { const index = resolve(dist, 'index.html'); try { await access(index); res.writeHead(200, { 'Content-Type': mimeTypes['.html'], 'X-Content-Type-Options': 'nosniff' }); createReadStream(index).pipe(res) } catch { json(res, 503, { error: 'Build the app first with npm run build.' }) } }
})
const port = Number(process.env.PORT || 4173)
server.listen(port, '127.0.0.1', () => console.log(`AccessLens ready on this computer at port ${port}`))
