// 喉镜俯视图（从咽部往下看，前方在上）。
// 矢状图看不见左右方向，而“食团从喉口两侧绕过去”恰恰是左右方向的事，所以补这一张。
import React from 'react'

const lerp = (a, b, u) => a + (b - a) * u
function along(pts, u) {
  const n = pts.length - 1
  const f = Math.max(0, Math.min(0.9999, u)) * n
  const i = Math.floor(f), k = f - i
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]
}

// 食团绕行路线：舌根 → 会厌谷 → 梨状隐窝 → 食管入口
const LEFT = [[110, 14], [86, 38], [60, 82], [64, 128], [86, 164], [106, 180]]
const RIGHT = LEFT.map(([x, y]) => [220 - x, y])

export default function Laryngoscope({ st }) {
  const s = st.bolus
  const u = (s - 0.3) / (0.62 - 0.3)
  const breathe = Math.max(0, st.flow)
  // 声带后端（声带突）的横向位置：开放时外展，关闭时并拢
  const open = (12 + 4 * breathe) * (1 - st.glottis) + 1.2
  const vopen = 17 * (1 - st.vestib) + 6
  const ary = 12 * (1 - st.glottis) + 7
  const epiDrop = 108 * st.epi
  const ues = st.ues

  const air = []
  if (Math.abs(st.flow) > 0.05 && st.glottis < 0.6) {
    const dir = st.flow > 0 ? 1 : -1
    for (let i = 0; i < 5; i++) {
      const p = (((st.airOffset * 1.6 * dir + i / 5) % 1) + 1) % 1
      const y = dir > 0 ? lerp(50, 125, p) : lerp(125, 50, p)
      air.push(<circle key={i} cx={110 + (i - 2) * 2.2} cy={y} r="2.2" fill={st.cough > 0.1 ? '#ff7a7a' : '#7cd3ff'} opacity={Math.min(1, Math.abs(st.flow)) * 0.9} />)
    }
  }

  let bolus = null
  if (s >= 0.3 && s < 0.64) {
    if (u < 0.12) {
      bolus = <ellipse cx="110" cy={lerp(6, 24, u / 0.12)} rx="15" ry="9" fill="#ff9a3c" stroke="#ffe0b0" />
    } else {
      const v = Math.min(1, (u - 0.12) / 0.88)
      const [lx, ly] = along(LEFT, v)
      const [rx, ry] = along(RIGHT, v)
      const r = v > 0.9 ? 8 * (1 - (v - 0.9) / 0.1) + 2 : 8
      bolus = (
        <g fill="#ff9a3c" stroke="#ffe0b0">
          <ellipse cx={lx} cy={ly} rx={r} ry={r * 1.25} />
          <ellipse cx={rx} cy={ry} rx={r} ry={r * 1.25} />
        </g>
      )
    }
  }

  const frag = st.fragOn ? (() => {
    const f = st.frag
    return <circle cx="110" cy={lerp(30, 118, f)} r="4.5" fill="#ff5d2e" stroke="#ffd0b0" />
  })() : null

  return (
    <svg viewBox="0 0 220 200" className="scope" role="img" aria-label="喉镜俯视示意图">
      <defs>
        <radialGradient id="scopeBg" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#4a2632" />
          <stop offset="1" stopColor="#1c1016" />
        </radialGradient>
        <clipPath id="scopeClip"><circle cx="110" cy="100" r="98" /></clipPath>
      </defs>
      <circle cx="110" cy="100" r="98" fill="url(#scopeBg)" stroke="#2b3340" strokeWidth="2" />
      <g clipPath="url(#scopeClip)">
        {/* 舌根 */}
        <path d="M 0 0 L 220 0 L 220 22 C 180 38, 140 30, 110 30 C 80 30, 40 38, 0 22 Z" fill="#c65f69" />
        {/* 会厌谷 */}
        <ellipse cx="88" cy="38" rx="13" ry="6" fill="#1c0c12" />
        <ellipse cx="132" cy="38" rx="13" ry="6" fill="#1c0c12" />
        {/* 梨状隐窝 */}
        <path d="M 72 54 C 50 70, 44 110, 58 140 C 66 156, 80 166, 96 170 C 82 150, 76 120, 80 90 Z" fill="#1c0c12" />
        <path d="M 148 54 C 170 70, 176 110, 162 140 C 154 156, 140 166, 124 170 C 138 150, 144 120, 140 90 Z" fill="#1c0c12" />
        {/* 杓会厌襞围成的喉口 */}
        <path d="M 78 58 C 72 90, 80 130, 96 150 L 124 150 C 140 130, 148 90, 142 58 C 128 50, 92 50, 78 58 Z" fill="#d97a86" />
        <path d="M 86 62 C 82 92, 88 126, 100 142 L 120 142 C 132 126, 138 92, 134 62 C 122 56, 98 56, 86 62 Z" fill="#2a1420" />
        {/* 室襞 */}
        <path d={`M 104 70 L ${110 - vopen} 138 L ${110 - vopen + 7} 138 L 108 72 Z M 116 70 L ${110 + vopen} 138 L ${110 + vopen - 7} 138 L 112 72 Z`} fill="#e58a96" />
        {/* 声门裂与声带 */}
        <path d={`M 110 76 L ${110 - open} 136 L ${110 + open} 136 Z`} fill="#06030a" />
        {open > 6 && <path d={`M ${110 - open * 0.5} 112 Q 110 116 ${110 + open * 0.5} 112 M ${110 - open * 0.7} 124 Q 110 128 ${110 + open * 0.7} 124`} stroke="#3b4a5c" strokeWidth="1.5" fill="none" />}
        <path d={`M 109 76 L ${110 - open - 4} 136 L ${110 - open} 137 Z M 111 76 L ${110 + open + 4} 136 L ${110 + open} 137 Z`} fill="#f6f1e8" />
        {/* 杓状软骨 */}
        <ellipse cx={110 - ary - 4} cy="146" rx="10" ry="8" fill="#e09aa4" />
        <ellipse cx={110 + ary + 4} cy="146" rx="10" ry="8" fill="#e09aa4" />
        {/* 食管入口（环咽肌） */}
        <ellipse cx="110" cy="180" rx={14 + 6 * ues} ry={1.5 + 9 * ues} fill="#06030a" stroke={ues > 0.5 ? '#5ee08a' : '#ff4d4d'} strokeWidth="2" />
        {/* 会厌：直立时只露出上缘，翻转时向下盖住喉口 */}
        <path d={`M 74 58 C 86 ${44 + epiDrop * 0.2}, 134 ${44 + epiDrop * 0.2}, 146 58 C 140 ${62 + epiDrop}, 80 ${62 + epiDrop}, 74 58 Z`} fill="#ffd166" stroke="#fff0b8" strokeWidth="1" opacity={0.95} />
        {air}
        {bolus}
        {frag}
      </g>
      <g className="sg-lbl" fontSize="9.5">
        <text x="110" y="12" textAnchor="middle">舌根</text>
        <text x="40" y="44" textAnchor="middle" className="dim">会厌谷</text>
        <text x="110" y="54" textAnchor="middle" className="yellow">会厌</text>
        <text x="30" y="118" textAnchor="middle" className="dim">梨状</text>
        <text x="30" y="130" textAnchor="middle" className="dim">隐窝</text>
        <text x="190" y="118" textAnchor="middle" className="dim">梨状</text>
        <text x="190" y="130" textAnchor="middle" className="dim">隐窝</text>
        <text x="150" y="104" className="white">声带</text>
        <text x="110" y="196" textAnchor="middle" className="orange">食管入口</text>
      </g>
    </svg>
  )
}
