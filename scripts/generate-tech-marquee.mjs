// Builds a scrolling "tech marquee" SVG from skillicons.dev icons (+ a Phoenix tile).
// Usage (from the repo root):
//   curl -so /tmp/strip.svg "https://skillicons.dev/icons?i=html,css,js,ts,java,python,elixir,react,nextjs,tailwind,vite,nodejs,express,spring,postgres,git,github,docker,postman,figma,linux&perline=21"
//   curl -so /tmp/phoenix.svg https://icon.icepanel.io/Technology/svg/Phoenix-Framework.svg
//   node scripts/generate-tech-marquee.mjs /tmp/strip.svg /tmp/phoenix.svg assets/tech-marquee.svg
// Keep NAMES below in the same order as the icons (Phoenix is inserted after Elixir).
import { readFileSync, writeFileSync } from 'node:fs'

const [, , stripPath, phoenixPath, outPath] = process.argv

const NAMES = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Java', 'Python', 'Elixir', 'Phoenix',
  'React', 'Next.js', 'Tailwind CSS', 'Vite', 'Node.js', 'Express', 'Spring Boot', 'PostgreSQL',
  'Git', 'GitHub', 'Docker', 'Postman', 'Figma', 'Linux']
const PHOENIX_AFTER = 6 // insert after the 7th skillicons icon (Elixir)

const W = 840          // visible width
const H = 72           // visible height
const ICON = 52        // icon size in pixels
const SPEED = 40       // pixels per second
const STEP = 300       // skillicons grid step (256 icon + 44 gap)
const scale = ICON / 256

// 1. Cut the skillicons strip into one inner <svg> per icon.
const text = readFileSync(stripPath, 'utf8')
const marker = /<g transform="translate\(\d+, 0\)">/g
const starts = [...text.matchAll(marker)].map((m) => ({ at: m.index, end: m.index + m[0].length }))
const outerClose = text.lastIndexOf('</svg>')
const icons = starts.map((s, i) => {
  const chunk = text.slice(s.end, i + 1 < starts.length ? starts[i + 1].at : outerClose)
  return chunk.slice(chunk.indexOf('<svg'), chunk.lastIndexOf('</svg>') + 6)
})

// 2. Phoenix in the same dark rounded tile as the skillicons dark theme.
const phoenix = readFileSync(phoenixPath, 'utf8')
const phoenixInner = phoenix.slice(phoenix.indexOf('>') + 1, phoenix.lastIndexOf('</svg>'))
icons.splice(PHOENIX_AFTER + 1, 0,
  `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">` +
  `<rect width="256" height="256" rx="60" fill="#242938"/>` +
  `<g transform="translate(38 38) scale(1.40625)">${phoenixInner}</g></svg>`)

if (icons.length !== NAMES.length) throw new Error(`expected ${NAMES.length} icons, got ${icons.length}`)

// 3. One strip, repeated so the loop is seamless, moved left by exactly one strip width.
const stripW = Math.round(icons.length * STEP * scale * 100) / 100
const copies = Math.ceil(W / stripW) + 1
const duration = Math.round((stripW / SPEED) * 10) / 10
const list = NAMES.join(', ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Languages and tools: ${list}">
<title>Languages and tools: ${list}</title>
<style>
.track{animation:slide ${duration}s linear infinite}
@keyframes slide{from{transform:translateX(0)}to{transform:translateX(-${stripW}px)}}
@media (prefers-reduced-motion: reduce){.track{animation:none}}
</style>
<defs>
<g id="strip" transform="scale(${scale})">
${icons.map((icon, i) => `<g transform="translate(${i * STEP}, 0)">${icon}</g>`).join('\n')}
</g>
<linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff"/>
<stop offset=".92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<mask id="edges"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
</defs>
<g mask="url(#edges)">
<g transform="translate(0 ${(H - ICON) / 2})"><g class="track">
${Array.from({ length: copies }, (_, i) => `<use href="#strip" xlink:href="#strip"${i ? ` x="${Math.round(i * stripW * 100) / 100}"` : ''}/>`).join('\n')}
</g></g>
</g>
</svg>
`
writeFileSync(outPath, svg)
console.log(`${icons.length} icons, strip ${stripW}px, ${copies} copies, ${duration}s loop -> ${outPath}`)
