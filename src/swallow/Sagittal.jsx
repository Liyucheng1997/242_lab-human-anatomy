// 正中矢状切面示意图（面朝左）。与 3D 共用 timeline.sample()，
// 用简化几何把“气道在前、食道在后、咽部交叉”的关系画清楚。
import React from 'react'
import { segmentOf } from './timeline.js'

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const g = (d, w) => Math.exp(-(d * d) / (2 * w * w))

// 喉上提（满幅）在示意图中的位移：向前（左）上
const EL = [-13, -30]
const EH = [-17, -27]
// 咽、食管、气管随喉被牵拉的权重（与 3D 的 pharynxW 同义，y 向下）
const wy = (y) => sm(470, 362, y) * sm(160, 255, y)

// Catmull-Rom → 三次贝塞尔，画平滑曲线
function smooth(pts, closed = false) {
  const n = pts.length
  const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return closed ? d + ' Z' : d
}

// 折线按弧长取点
function polyline(pts) {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const L = acc[acc.length - 1]
  return (u) => {
    const d = Math.max(0, Math.min(1, u)) * L
    let i = 1
    while (i < acc.length - 1 && acc[i] < d) i++
    const f = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1)
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]
  }
}

const BOLUS = [[108, 149], [155, 144], [204, 172], [252, 214], [266, 262], [272, 306], [274, 350], [274, 382], [274, 468]]
const AIR = [
  [26, 121], [70, 108], [120, 101], [175, 106], [205, 112], [245, 119], [268, 142], [268, 178],
  [258, 220], [250, 258], [238, 290], [232, 312], [232, 332], [232, 362], [232, 410], [232, 470],
]
const FRAG = [[252, 214], [244, 262], [236, 292], [232, 314]]
const airAt = polyline(AIR)
const fragAt = polyline(FRAG)

function bolusAt(s) {
  const { i, u } = segmentOf(s)
  const a = BOLUS[i], b = BOLUS[Math.min(BOLUS.length - 1, i + 1)]
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
}

const N_AIR = 46
const AIR_PHASE = Array.from({ length: N_AIR }, (_, i) => i / N_AIR)

export default function Sagittal({ st, compact }) {
  const eLx = EL[0] * st.elev, eLy = EL[1] * st.elev
  const eHx = EH[0] * st.elev, eHy = EH[1] * st.elev
  // 带权位移：喉附近整段跟随，向下渐弱
  const disp = (x, y, k = 1) => {
    const w = wy(y) * k
    return [x + eLx * w, y + eLy * w]
  }

  // ---- 咽后壁：软腭上抬时 Passavant 嵴前突，咽缩肌自上而下依次内收 ----
  const wallX = (y) => 288
    - 13 * st.palate * g(y - 124, 14)
    - 20 * st.waves[0] * g(y - 168, 22)
    - 20 * st.waves[1] * g(y - 228, 24)
    - 14 * st.waves[2] * g(y - 288, 20)
  const wall = []
  for (let y = 98; y <= 300; y += 6) wall.push([wallX(y), y])

  // ---- 舌：口腔期舌体由前向后压腭，咽期舌根后缩 ----
  const tp = st.tonguePress, tb = st.tongueBack, os = st.oralSeal
  const tongue = [
    [52, 172 - 10 * tp], [74, 160 - 14 * tp], [110, 160 - 9 * tp], [150, 153 - 5 * tp],
    [186, 155 - 10 * os - 4 * tb], [208 + 22 * tb, 180 - 6 * os - 6 * tb], [217 + 46 * tb, 214 - 8 * st.elev],
    [214 + 42 * tb, 250 - 14 * st.elev], [206 + 18 * tb + eHx * 0.5, 272 + eHy * 0.6],
    [175 + eHx * 0.5, 284 + eHy * 0.5], [110, 262], [68, 222], [54, 195],
  ]

  // ---- 食物通道（喉咽下段 + 食管上括约肌 + 食管） ----
  const s = st.bolus
  const inTube = s >= 0.5 && s < 0.995
  const bRest = bolusAt(s)
  const tubeHalf = (y) => {
    let h = 1.2
    // 食管上括约肌（环咽肌）平时紧闭；咽期松弛张开
    const ues = g(y - 352, 9)
    h = h * (1 - ues) + ues * (0.2 + 9 * st.ues)
    if (inTube) h += 10.5 * g(y - bRest[1], 11)
    if (st.peristalsis) h = Math.max(0.6, h - 1.2 * g(y - (bRest[1] - 22), 9))
    return h
  }
  const front = [], back = []
  for (let y = 298; y <= 472; y += 4) {
    const h = tubeHalf(y)
    const w = wy(y)
    front.push([274 - h - 1 + eLx * w, y + eLy * w])
    back.push([274 + h + 1 + eLx * w * 0.25, y + eLy * w])
  }
  const lumen = smooth([...front, ...back.slice().reverse()], true)
  const frontWall = smooth([...front, ...front.slice().reverse().map(([x, y]) => [x - 8, y])], true)
  const backWall = smooth([...back, ...back.slice().reverse().map(([x, y]) => [x + 8, y])], true)
  const uesY = 352 + eLy * wy(352)

  // ---- 气管（上端随喉上提被拉长） ----
  const trA = [], trP = []
  for (let y = 354; y <= 472; y += 6) { trA.push(disp(214, y)); trP.push(disp(250, y)) }
  const rings = []
  for (let y = 360; y <= 466; y += 13) rings.push(disp(213, y))

  // ---- 软腭：绕硬腭后缘旋转，上抬约 50° 贴向咽后壁 ----
  const palAng = -52 * st.palate

  // ---- 会厌：绕根部顺时针（向后下）翻转约 82° ----
  const epiAng = 82 * st.epi

  // ---- 声门：声带、室襞从前后两侧向中线合拢 ----
  const breathe = Math.max(0, st.flow) * 2
  const vf = 6 + 12 * st.glottis - breathe * (1 - st.glottis)
  const vt = 5 + 8 * st.vestib

  // ---- 食团位置 ----
  const wB = s < 0.18 ? 0 : s < 0.3 ? (s - 0.18) / 0.12 : 1
  let [bx, by] = bRest
  if (s < 0.18) by -= 4 * tp
  const bw = wy(by) * wB
  bx += eLx * bw * (s > 0.5 ? 0.7 : 0.4); by += eLy * bw
  const bInTube = s > 0.5 && s < 0.995
  const showBolus = s < 0.995

  // ---- 气流粒子 ----
  const offset = st.airOffset * 0.32
  const strength = Math.min(1, Math.abs(st.flow))
  const airColor = st.cough > 0.1 ? '#ff7a7a' : '#7cd3ff'

  const frag = st.fragOn ? (() => { const [x, y] = fragAt(st.frag); return [x + eLx, y + eLy] })() : null

  const chip = (x, label, val, onTxt, offTxt, on, color) => (
    <g transform={`translate(${x} 0)`}>
      <rect width="92" height="22" rx="11" fill={on ? color : '#202733'} opacity={on ? 0.9 : 1} />
      <text x="46" y="15" textAnchor="middle" fontSize="11" fill={on ? '#0e1116' : '#9aa4b2'} fontWeight="600">
        {label}：{on ? onTxt : offTxt}
      </text>
    </g>
  )
  const breathTxt = st.cough > 0.1 ? '咳嗽' : st.apnea ? '暂停' : st.flow > 0.05 ? '吸气' : st.flow < -0.05 ? '呼气' : '转换'

  return (
    <svg viewBox="0 0 360 470" className="sagittal" role="img" aria-label="咽喉正中矢状切面示意图">
      <defs>
        <pattern id="vbStripe" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#3a3530" />
          <rect width="2" height="4" fill="#423c36" />
        </pattern>
        <radialGradient id="bolusG" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="1" stopColor="#ff8a1f" />
        </radialGradient>
      </defs>

      {/* 颈前软组织、面部轮廓 */}
      <path d="M 60 6 C 44 30, 36 58, 30 82 L 8 112 C 5 118, 14 121, 28 121 L 33 128 C 38 136, 33 141, 39 147 C 34 153, 35 160, 41 164 C 35 171, 35 178, 42 184 C 39 206, 38 226, 52 240 C 86 266, 140 272, 168 282 C 180 306, 186 360, 190 470 L 360 470 L 360 6 Z"
        fill="#161b23" stroke="#2b3340" strokeWidth="1.5" />

      {/* 鼻腔（气道） */}
      <path d="M 30 121 C 48 96, 90 80, 150 80 C 180 82, 196 88, 202 96 L 196 131 L 58 131 C 48 129, 38 126, 30 122 Z" fill="#1d3a5c" />
      <path d="M 92 96 C 120 92, 150 92, 178 98 M 82 110 C 112 106, 150 106, 184 112 M 84 122 C 112 118, 150 118, 186 124" stroke="#2c5584" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* 咽腔（气、食共用段） */}
      <path d="M 196 92 C 232 90, 270 96, 292 104 L 292 300 L 252 300 L 238 280 L 200 280 Z" fill="#33285a" />

      {/* 咽后壁与椎前组织 */}
      <path d={`${smooth(wall)} L 300 300 L 300 98 Z`} fill="#7a3a38" />
      <path d={smooth(wall)} fill="none" stroke="#b05a52" strokeWidth="2" />

      {/* 颈椎 */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="302" y={168 + i * 33} width="40" height="27" rx="5" fill="url(#vbStripe)" stroke="#5a5248" />
      ))}
      <ellipse cx="310" cy="146" rx="9" ry="7" fill="#3a3530" stroke="#5a5248" />

      {/* 颅底、硬腭、牙 */}
      <path d="M 60 62 C 120 70, 190 78, 240 88 C 266 92, 292 97, 336 104" stroke="#6b6152" strokeWidth="6" fill="none" />
      <path d="M 58 131 C 100 129, 160 129, 194 132 L 194 141 C 160 139, 100 139, 60 141 Z" fill="#d9cfb8" />
      <rect x="50" y="139" width="9" height="13" rx="3" fill="#efe9dc" />
      <rect x="50" y="163" width="9" height="12" rx="3" fill="#efe9dc" />

      {/* 舌 */}
      <path d={smooth(tongue, true)} fill="#c65f69" stroke="#e08a92" strokeWidth="1.2" />

      {/* 软腭 + 腭垂 */}
      <g transform={`translate(194 136) rotate(${palAng})`}>
        <path d="M 0 -5 C 22 -4, 44 10, 62 34 C 70 46, 74 54, 70 58 C 64 60, 58 52, 52 44 C 38 26, 20 12, 0 6 Z" fill="#e88aa0" stroke="#ffb3c4" strokeWidth="1" />
      </g>

      {/* 食物通道：食管与喉咽下段 */}
      <path d={frontWall} fill="#a8522e" />
      <path d={backWall} fill="#a8522e" />
      <path d={lumen} fill="#ff9a3c" opacity={0.35 + 0.4 * (inTube ? 1 : 0)} />
      {/* 环咽肌（食管上括约肌） */}
      <g opacity={1 - 0.75 * st.ues}>
        <rect x={257 + eLx * wy(352)} y={uesY - 6} width="34" height="12" rx="6" fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeDasharray="4 3" />
      </g>

      {/* 气管 */}
      <path d={smooth([...trA, ...trP.slice().reverse()], true)} fill="#1d3a5c" />
      <path d={smooth(trP)} stroke="#e8a0a8" strokeWidth="2" strokeDasharray="3 3" fill="none" />
      {rings.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="4.5" ry="3.5" fill="#dce6ef" />)}

      {/* 喉（整体随喉上提平移） */}
      <g transform={`translate(${eLx} ${eLy})`}>
        <path d="M 214 288 L 252 300 L 252 356 L 214 356 Z" fill="#1d3a5c" />
        {/* 甲状软骨 */}
        <path d="M 216 290 C 204 298, 198 308, 200 318 C 202 328, 206 338, 214 344 L 221 343 C 213 334, 209 324, 209 314 C 209 304, 214 298, 223 294 Z" fill="#dce6ef" />
        {/* 环状软骨：前弓 + 后板 */}
        <path d="M 212 346 C 218 351, 226 354, 234 354 L 234 347 C 228 347, 220 345, 214 342 Z" fill="#dce6ef" />
        <rect x="250" y="322" width="10" height="35" rx="3" fill="#dce6ef" />
        {/* 杓状软骨 */}
        <path d="M 250 302 L 259 300 L 260 322 L 250 322 Z" fill="#c8d4df" />
        {/* 杓会厌襞 */}
        <path d="M 226 280 C 236 286, 246 294, 254 300" stroke="#e58a96" strokeWidth="3" fill="none" />
        {/* 室襞、声带 */}
        <path d={`M 214 310 L ${214 + vt} 313 L 214 316 Z M 250 310 L ${250 - vt} 313 L 250 316 Z`} fill="#e58a96" />
        <path d={`M 214 321 L ${214 + vf} 324 L 214 327 Z M 250 321 L ${250 - vf} 324 L 250 327 Z`} fill="#f6f1e8" />
        {/* 会厌 */}
        <g transform={`translate(219 300) rotate(${epiAng})`}>
          <path d="M 0 0 C 4 -14, 6 -32, 12 -46 C 15 -54, 22 -62, 26 -58 C 24 -50, 18 -34, 7 0 Z" fill="#ffd166" stroke="#fff0b8" strokeWidth="1" />
        </g>
      </g>

      {/* 舌骨 */}
      <ellipse cx={194 + eHx} cy={284 + eHy} rx="11" ry="5" fill="#f1ead8" />

      {/* 气流 */}
      {AIR_PHASE.map((p, i) => {
        const u = (((p + offset) % 1) + 1) % 1
        let [x, y] = airAt(u)
        if (u > 0.5) { const w = wy(y); x += eLx * w; y += eLy * w }
        return <circle key={i} cx={x} cy={y} r={1.5 + 1.2 * strength} fill={airColor} opacity={0.15 + 0.8 * strength} />
      })}

      {/* 食团 */}
      {showBolus && (
        <ellipse cx={bx} cy={by} rx={bInTube ? 9 : 10} ry={bInTube ? 13 : 9.5} fill="url(#bolusG)" stroke="#ffe0b0" strokeWidth="1" />
      )}
      {frag && <circle cx={frag[0]} cy={frag[1]} r="4.2" fill="#ff5d2e" stroke="#ffd0b0" />}

      {/* 标注 */}
      <g className="sg-lbl">
        <text x="98" y="92">鼻腔</text>
        <text x="236" y="112">鼻咽</text>
        <text x="96" y="214">舌</text>
        <text x="96" y="136" fontSize="9" className="dim">硬腭</text>
        <text x="222" y="160">软腭</text>
        <text x="262" y="196" className="purple">口咽</text>
        <text x={244 + eLx * 0.8} y={235 + eLy}>会厌</text>
        <text x={160 + eHx} y={287 + eHy} className="dim">舌骨</text>
        <text x={170 + eLx} y={322 + eLy} className="dim">甲状软骨</text>
        <text x={168 + eLx} y={337 + eLy} fontSize="10" className="white">声带 →</text>
        <text x="196" y="420" className="blue">气管</text>
        <text x="296" y={uesY + 4} className="red">环咽肌</text>
        <text x="296" y="430" className="orange">食管</text>
        <text x="336" y="160" fontSize="9" className="dim">颈椎</text>
      </g>

      {/* 状态胶囊 */}
      {!compact && (
        <g transform="translate(6 6)">
          {chip(0, '呼吸', 0, breathTxt, breathTxt, !st.apnea && st.cough < 0.1, '#7cd3ff')}
          <g transform="translate(0 26)">{chip(0, '鼻咽', 0, '封闭', '开放', st.palate > 0.5, '#f59ab0')}</g>
          <g transform="translate(0 52)">{chip(0, '喉口', 0, '封闭', '开放', st.glottis > 0.5, '#ffd166')}</g>
          <g transform="translate(0 78)">{chip(0, '食管口', 0, '开放', '关闭', st.ues > 0.5, '#ff9a3c')}</g>
        </g>
      )}
    </svg>
  )
}

