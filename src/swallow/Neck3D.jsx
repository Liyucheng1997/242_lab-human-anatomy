// 吞咽专题的 3D 场景：从全身模型里取出头颈部相关结构，按时间轴驱动。
//
// 源模型是静态网格、没有骨骼绑定，所以动作分两类实现：
//   刚体：舌骨、喉软骨、会厌（绕根部旋转）、软腭+腭垂（绕硬腭后缘旋转）
//   形变：咽、食管、气管、舌、舌骨上肌群——逐顶点按权重叠加位移，
//         喉上提时它们随之被拉长，食团经过时食管局部膨出。
// 坐标系（米）：x 向左，y 向上，z 向前。
import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { resolveName } from '../labels.js'
import { sample, segmentOf, splitOf } from './timeline.js'

const URLS = ['models/visceral.glb', 'models/skeleton.glb', 'models/muscular.glb']

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const gauss = (d, w) => Math.exp(-(d * d) / (2 * w * w))

// 词典键 → 角色
const RULES = [
  [/^(mucosa of nasal cavity|nasopharynx|trachea|left main bronchus|right main bronchus)$/, 'air'],
  [/^(oropharynx|laryngopharynx)$/, 'shared'],
  [/^oesophagus$/, 'food'],
  [/^tongue$/, 'tongue'],
  [/^(soft palate|uvula of palate)$/, 'palate'],
  [/^epiglottis$/, 'epi'],
  [/^hyoid bone$/, 'hyoid'],
  [/^(thyroid|cricoid|arytenoid|corniculate) cartilage$/, 'cart'],
  [/crico-arytenoid|thyro-arytenoid|transverse arytenoid|cricothyroid|ary-epiglottic|thyro-epiglottic/, 'musLar'],
  [/pharyngeal constrictor$|^palatopharyngeus muscle$/, 'musPhar'],
  [/^(geniohyoid|mylohyoid|thyrohyoid|stylohyoid|stylopharyngeus) muscle$|digastric/, 'musLift'],
  [/^(mandible|maxilla|palatine bone|vomer|sphenoid bone|occipital bone|ethmoid bone|nasal bone|frontal bone|inferior nasal concha bone|nasal septal cartilage|lateral process of nasal septal cartilage|major alar cartilage|atlas \(c1\)|axis \(c2\)|vertebra (c[3-7]|t1|t2))$|incisor$|canine$|premolar$|molar tooth$/, 'bone'],
]
const roleOf = (key) => {
  if (!key) return null
  for (const [re, role] of RULES) if (re.test(key)) return role
  return null
}

const STYLE = {
  air:     { color: '#4FA3FF', opacity: 0.92 },
  shared:  { color: '#A77BFF', opacity: 0.36 },
  food:    { color: '#FF9A3C', opacity: 0.95 },
  tongue:  { color: '#D9727C', opacity: 1 },
  palate:  { color: '#F59AB0', opacity: 1 },
  epi:     { color: '#FFD166', opacity: 1 },
  hyoid:   { color: '#F1EAD8', opacity: 1 },
  cart:    { color: '#DCE6EF', opacity: 1 },
  musLar:  { color: '#C2554B', opacity: 0.9 },
  musPhar: { color: '#B14A42', opacity: 0.32 },
  musLift: { color: '#B5524A', opacity: 0.55 },
  bone:    { color: '#CFC6B0', opacity: 0.16 },
}

// 个别结构单独调透明度：鼻腔、鼻咽是大块黏膜，太实会挡住气流
const KEY_STYLE = {
  'mucosa of nasal cavity': { opacity: 0.4 },
  nasopharynx: { opacity: 0.45 },
}

// 喉上提的位移量（满幅时）：喉上移约 1.8 cm、前移约 1 cm；舌骨前移更多
const E_LARYNX = new THREE.Vector3(0, 0.018, 0.010)
const E_HYOID = new THREE.Vector3(0, 0.016, 0.014)

// 咽、食管、气管随喉上提被牵拉的权重：喉所在高度为 1，向下沿食管/气管渐减，
// 向上到颅底（咽的上端固定在颅底）渐减。
const pharynxW = (y) => sm(1.385, 1.465, y) * (1 - sm(1.495, 1.55, y))

const EPI_PIVOT = new THREE.Vector3(0, 1.481, 0.0265)
const EPI_ANGLE = 1.4
const PALATE_PIVOT = new THREE.Vector3(0, 1.5525, 0.055)
const VF_ANCHOR = new THREE.Vector3(0, 1.475, 0.026) // 前联合

// 食团路径（静止坐标）。下标与 timeline.WAYPOINTS 前 8 个一一对应，
// 第 8 个之后沿食管中心线下行。
const BOLUS_PTS = [
  [0, 1.541, 0.063], [0, 1.5425, 0.044], [0, 1.5345, 0.025], [0, 1.5185, 0.0155],
  [0, 1.5005, 0.0115], [0, 1.4835, 0.0045], [0, 1.4715, 0.0025],
]
// 误吸碎块路线：口咽 → 喉口 → 声带上方的喉前庭
const FRAG_PTS = [[0, 1.5185, 0.0155], [0, 1.497, 0.016], [0, 1.4885, 0.016], [0, 1.4795, 0.016]]

// 呼吸气流路线：鼻孔 → 鼻腔 → 后鼻孔 → 鼻咽 → 口咽 → 喉口 → 声门 → 气管（后段取中心线）
const AIR_PTS = [
  [0, 1.556, 0.103], [0, 1.566, 0.082], [0, 1.568, 0.056], [0, 1.566, 0.03], [0, 1.553, 0.0125],
  [0, 1.535, 0.0115], [0, 1.517, 0.0125], [0, 1.5, 0.013], [0, 1.487, 0.0155], [0, 1.4755, 0.016],
  [0, 1.466, 0.0115],
]

// 把网格按 y 分层求中心线，用于食管/咽的径向膨出和路径取点
function centerline(pos, y0, y1, step = 0.0015) {
  const n = Math.ceil((y1 - y0) / step) + 1
  const sx = new Float32Array(n), sz = new Float32Array(n), c = new Float32Array(n)
  for (let i = 0; i < pos.length; i += 3) {
    const k = Math.round((pos[i + 1] - y0) / step)
    if (k < 0 || k >= n) continue
    sx[k] += pos[i]; sz[k] += pos[i + 2]; c[k] += 1
  }
  // 空层用邻层填补，再做一次平滑
  let lx = 0, lz = 0, seen = false
  for (let k = 0; k < n; k++) {
    if (c[k]) { sx[k] /= c[k]; sz[k] /= c[k]; lx = sx[k]; lz = sz[k]; seen = true }
    else if (seen) { sx[k] = lx; sz[k] = lz }
  }
  for (let k = n - 1; k >= 0 && !c[k]; k--) { sx[k] = lx; sz[k] = lz }
  const fx = Float32Array.from(sx), fz = Float32Array.from(sz)
  for (let k = 0; k < n; k++) {
    let ax = 0, az = 0, m = 0
    for (let j = -3; j <= 3; j++) {
      const q = Math.min(n - 1, Math.max(0, k + j))
      ax += sx[q]; az += sz[q]; m++
    }
    fx[k] = ax / m; fz[k] = az / m
  }
  return {
    at(y) {
      const f = Math.min(n - 1, Math.max(0, (y - y0) / step))
      const a = Math.floor(f), b = Math.min(n - 1, a + 1), u = f - a
      return [fx[a] + (fx[b] - fx[a]) * u, fz[a] + (fz[b] - fz[a]) * u]
    },
  }
}

function buildScene(scenes) {
  const meshes = []
  const byKey = new Map()
  let oesoPos = null, trachPos = null

  scenes.forEach((scene) => {
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      if (!o.isMesh) return
      const key = resolveName(o.name)
      const role = roleOf(key)
      if (!role) return
      if (o.geometry.attributes.position.count < 10) return // 源模型里的占位小片
      const g = o.geometry.clone()
      g.applyMatrix4(o.matrixWorld)
      const st = KEY_STYLE[key] ? { ...STYLE[role], ...KEY_STYLE[key] } : STYLE[role]
      const mat = new THREE.MeshStandardMaterial({
        color: st.color, roughness: 0.55, metalness: 0,
        transparent: st.opacity < 1, opacity: st.opacity,
        depthWrite: st.opacity > 0.5, side: THREE.DoubleSide,
        emissive: new THREE.Color('#000000'),
      })
      const m = new THREE.Mesh(g, mat)
      m.name = o.name
      m.userData = { key, role, base: st }
      if (role === 'bone' || role === 'musPhar' || role === 'musLift') m.renderOrder = 2
      meshes.push(m)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(m)
      if (key === 'oesophagus') oesoPos = g.attributes.position.array
      if (key === 'trachea') trachPos = g.attributes.position.array
    })
  })

  const oesoCL = centerline(oesoPos, 1.19, 1.48)
  const trachCL = centerline(trachPos, 1.35, 1.465)

  // 形变网格：预存静止位置与逐顶点权重
  for (const m of meshes) {
    const { role, key } = m.userData
    const deformable = ['air', 'shared', 'food', 'tongue', 'musPhar', 'musLift'].includes(role)
    if (!deformable) continue
    const pos = m.geometry.attributes.position
    pos.setUsage(THREE.DynamicDrawUsage)
    const rest = Float32Array.from(pos.array)
    const n = pos.count
    const wL = new Float32Array(n), wH = new Float32Array(n), wT = new Float32Array(n), wP = new Float32Array(n)
    let radial = null
    if (key === 'oesophagus' || key === 'laryngopharynx') radial = new Float32Array(n * 3) // dirx, dirz, r
    for (let i = 0; i < n; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2]
      if (role === 'tongue') {
        // 舌根（后下部）随喉上提被带向后上方；舌体前部在口腔期上抬压腭
        wT[i] = sm(0.062, 0.03, z) * sm(1.545, 1.51, y)
        wP[i] = sm(0.03, 0.06, z)
        wH[i] = 0.35 * sm(1.53, 1.505, y) * sm(0.06, 0.035, z)
      } else if (role === 'musLift') {
        if (/thyrohyoid/.test(key)) wL[i] = 1
        else if (/stylo|posterior belly/.test(key)) wH[i] = 1 - sm(1.505, 1.56, y)
        else wH[i] = sm(0.074, 0.034, z)
      } else {
        wL[i] = pharynxW(y)
      }
      if (radial) {
        const [cx, cz] = key === 'oesophagus' ? oesoCL.at(y) : [0, 0.016]
        const dx = x - cx, dz = z - cz
        const r = Math.hypot(dx, dz) || 1e-6
        radial[i * 3] = dx / r; radial[i * 3 + 1] = dz / r; radial[i * 3 + 2] = r
      }
    }
    m.userData.def = { rest, wL, wH, wT, wP, radial }
  }

  // 刚体分组：会厌、软腭各自绕枢轴旋转
  const epiPivot = new THREE.Group()
  const palatePivot = new THREE.Group()
  for (const m of meshes) {
    const { role } = m.userData
    if (role === 'epi') {
      m.geometry.translate(-EPI_PIVOT.x, -EPI_PIVOT.y, -EPI_PIVOT.z)
      epiPivot.add(m)
    } else if (role === 'palate') {
      m.geometry.translate(-PALATE_PIVOT.x, -PALATE_PIVOT.y, -PALATE_PIVOT.z)
      palatePivot.add(m)
    }
  }

  const v = (a) => new THREE.Vector3(...a)
  const [tx, tz] = oesoCL.at(1.448)
  const bolusCurve = new THREE.CatmullRomCurve3([...BOLUS_PTS.map(v), new THREE.Vector3(tx, 1.448, tz)], false, 'centripetal')
  const fragCurve = new THREE.CatmullRomCurve3(FRAG_PTS.map(v), false, 'centripetal')
  const airPts = AIR_PTS.map(v)
  for (const y of [1.452, 1.43, 1.405, 1.385, 1.37]) {
    const [cx, cz] = trachCL.at(y)
    airPts.push(new THREE.Vector3(cx, y, cz))
  }
  const airCurve = new THREE.CatmullRomCurve3(airPts, false, 'centripetal')
  const [ux, uz] = oesoCL.at(1.469)

  return { meshes, byKey, epiPivot, palatePivot, bolusCurve, fragCurve, airCurve, oesoCL, trachCL, uesCenter: new THREE.Vector3(ux, 1.469, uz) }
}

// 喉上提在任意静止位置 p 处造成的位移
function fieldAt(p, st, out) {
  const w = pharynxW(p.y)
  return out.copy(E_LARYNX).multiplyScalar(st.elev * w)
}

// 食团在 s 处的静止坐标
function bolusRest(model, s, out) {
  if (s >= 0.64) {
    const y = 1.448 + (1.215 - 1.448) * Math.min(1, (s - 0.64) / 0.36)
    const [cx, cz] = model.oesoCL.at(y)
    return out.set(cx, y, cz)
  }
  const { i, u } = segmentOf(s)
  const n = model.bolusCurve.points.length - 1
  return model.bolusCurve.getPoint(Math.min(1, (i + u) / n), out)
}

const tmpV = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()
const GLOW = new THREE.Color('#ff5a3c')
const FOCUS = new THREE.Color('#38e1ff')
const HOVER = new THREE.Color('#ffd24a')

const LABELS = [
  { id: 'nasal',   zh: '鼻腔',   c: '#4FA3FF' },
  { id: 'naso',    zh: '鼻咽',   c: '#4FA3FF' },
  { id: 'palate',  zh: '软腭',   c: '#F59AB0' },
  { id: 'tongue',  zh: '舌',     c: '#D9727C' },
  { id: 'oroph',   zh: '咽（气食共用段）', c: '#A77BFF' },
  { id: 'epi',     zh: '会厌',   c: '#FFD166' },
  { id: 'hyoid',   zh: '舌骨',   c: '#F1EAD8' },
  { id: 'glottis', zh: '声门',   c: '#DCE6EF' },
  { id: 'ues',     zh: '食管上括约肌', c: '#ff6b6b' },
  { id: 'trachea', zh: '气管',   c: '#4FA3FF' },
  { id: 'oeso',    zh: '食管',   c: '#FF9A3C' },
]

export default function NeckScene({ clockRef, scenarioRef, clip, showMuscles, showBones, showLabels, focus, hover, onPick }) {
  const gltfs = useGLTF(URLS, 'draco/')
  const model = useMemo(() => buildScene(gltfs.map((g) => g.scene)), [gltfs])

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.0004), [])
  useEffect(() => {
    for (const m of model.meshes) {
      m.material.clippingPlanes = clip ? [plane] : null
      m.material.needsUpdate = true
    }
  }, [clip, model, plane])

  useEffect(() => {
    for (const m of model.meshes) {
      const r = m.userData.role
      if (r === 'bone') m.visible = showBones
      if (r === 'musPhar' || r === 'musLift' || r === 'musLar') m.visible = showMuscles
    }
  }, [showMuscles, showBones, model])

  const focusSet = useMemo(() => new Set(focus || []), [focus])
  const hoveredRef = useRef(null)

  // 程序化补充的结构：声带、室襞、食管上括约肌环、食团、误吸碎块、气流粒子
  const vfRef = useRef()
  const uesRef = useRef()
  const bolusRefs = [useRef(), useRef()]
  const fragRef = useRef()
  const airRef = useRef()
  const labelRefs = useRef({})
  const air = useMemo(() => {
    const N = 90
    return {
      N,
      phase: Float32Array.from({ length: N }, (_, i) => (i / N + Math.random() * 0.01) % 1),
      jx: Float32Array.from({ length: N }, () => -Math.random() * 0.0035),
      jz: Float32Array.from({ length: N }, () => (Math.random() - 0.5) * 0.004),
    }
  }, [])
  const airMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#7cd3ff', transparent: true, opacity: 0.9, depthWrite: false }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const folds = useMemo(() => {
    const mk = (len, w, h, color) => {
      const g = new THREE.BoxGeometry(w, h, len)
      g.translate(0, 0, -len / 2)
      return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.4, side: THREE.DoubleSide }))
    }
    return {
      vr: mk(0.0165, 0.0022, 0.0018, '#f6f1e8'), vl: mk(0.0165, 0.0022, 0.0018, '#f6f1e8'),
      fr: mk(0.015, 0.003, 0.0026, '#e58a96'), fl: mk(0.015, 0.003, 0.0026, '#e58a96'),
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clockRef.current.t
    const st = sample(t, scenarioRef.current)

    // 刚体：舌骨、喉软骨、喉内肌随喉上提平移
    const eL = tmpV.copy(E_LARYNX).multiplyScalar(st.elev)
    const eH = tmpV2.copy(E_HYOID).multiplyScalar(st.elev)
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 5)

    for (const m of model.meshes) {
      const { role, key, def, base } = m.userData
      if (role === 'cart' || role === 'musLar') m.position.copy(eL)
      else if (role === 'hyoid') m.position.copy(eH)

      if (def && m.visible) {
        const arr = m.geometry.attributes.position.array
        const { rest, wL, wH, wT, wP, radial } = def
        const n = rest.length / 3
        let yb = -1, bulge = 0
        if (radial && st.bolus > 0.44) {
          yb = bolusRest(model, st.bolus, tmpBolus).y
          bulge = st.bolus < 0.995 ? 1 : 0
        }
        const tbY = 0.002 * st.tongueBack, tbZ = -0.0075 * st.tongueBack
        const tpY = 0.0045 * st.tonguePress
        for (let i = 0; i < n; i++) {
          const j = i * 3
          let x = rest[j], y = rest[j + 1], z = rest[j + 2]
          if (radial) {
            const ry = y
            let k = 0.0042 * bulge * gauss(ry - yb, 0.0075)
            k += 0.0026 * st.ues * gauss(ry - 1.469, 0.006)
            if (st.peristalsis) k -= 0.0016 * gauss(ry - (yb + 0.02), 0.008)
            k = Math.max(k, -0.6 * radial[j + 2])
            x += radial[j] * k; z += radial[j + 1] * k
          }
          const a = wL[i] * st.elev, b = wH[i] * st.elev
          x += E_LARYNX.x * a + E_HYOID.x * b
          y += E_LARYNX.y * a + E_HYOID.y * b + wT[i] * tbY + wP[i] * tpY
          z += E_LARYNX.z * a + E_HYOID.z * b + wT[i] * tbZ
          arr[j] = x; arr[j + 1] = y; arr[j + 2] = z
        }
        m.geometry.attributes.position.needsUpdate = true
        m.geometry.computeBoundingSphere()
      }

      // 发光：肌肉按“谁在出力”点亮；聚焦与悬停优先
      let glow = 0
      if (role === 'musLift') glow = /stylo|posterior belly/.test(key) ? st.elev * 0.6 : st.elev
      else if (role === 'musPhar') {
        if (/^superior/.test(key)) glow = Math.max(st.waves[0], st.palate * 0.3)
        else if (/^middle/.test(key)) glow = st.waves[1]
        else if (/^inferior/.test(key)) glow = st.waves[2]
        else glow = st.palate * 0.7
      } else if (role === 'musLar') {
        if (/posterior crico/.test(key)) glow = Math.max(0, Math.min(1, st.flow))
        else if (/epiglottic/.test(key)) glow = st.epi
        else if (/cricothyroid/.test(key)) glow = 0
        else glow = st.glottis
      }
      const mat = m.material
      if (m === hoveredRef.current) {
        mat.emissive.copy(HOVER); mat.emissiveIntensity = 0.5
      } else if (focusSet.has(key)) {
        mat.emissive.copy(FOCUS); mat.emissiveIntensity = 0.25 + 0.45 * pulse
      } else if (glow > 0.02) {
        mat.emissive.copy(GLOW); mat.emissiveIntensity = glow * 0.9
      } else {
        mat.emissiveIntensity = 0
      }
      const wantOpacity = focusSet.has(key) ? Math.max(base.opacity, 0.85) : base.opacity
      if (mat.opacity !== wantOpacity) {
        mat.opacity = wantOpacity
        mat.transparent = wantOpacity < 1
      }
    }

    // 会厌：随喉平移，再绕根部向后翻转约 80°，压成水平盖住喉口
    model.epiPivot.position.copy(EPI_PIVOT).add(eL)
    model.epiPivot.rotation.x = -st.epi * EPI_ANGLE
    // 软腭：绕硬腭后缘上抬后移，贴向咽后壁
    model.palatePivot.position.copy(PALATE_PIVOT)
    model.palatePivot.rotation.x = st.palate * 0.36

    // 声带与室襞：后端随杓状软骨内收/外展；吸气时声门开得更大
    if (vfRef.current) {
      vfRef.current.position.copy(VF_ANCHOR).add(eL)
      const breathe = Math.max(0, st.flow) * 0.08
      const open = (0.24 + breathe) * (1 - st.glottis) + 0.012
      const fopen = 0.36 * (1 - st.vestib) + 0.06
      folds.vr.rotation.y = open; folds.vl.rotation.y = -open
      folds.fr.rotation.y = fopen; folds.fl.rotation.y = -fopen
    }

    // 食管上括约肌：关闭时红色收紧，开放时绿色张大
    if (uesRef.current) {
      uesRef.current.position.copy(model.uesCenter).add(eL)
      const s = 1 + 0.45 * st.ues
      // 食管颈段横径大、前后径小，环也压扁成椭圆
      uesRef.current.scale.set(1.2 * s, 0.62 * s, s)
      const mt = uesRef.current.material
      mt.color.setRGB(1 - 0.6 * st.ues, 0.35 + 0.5 * st.ues, 0.35 + 0.1 * st.ues)
      mt.emissive.copy(mt.color)
      mt.emissiveIntensity = 0.35
    }

    // 食团
    const s = st.bolus
    const visible = s < 0.995 || t < 9.6
    const p = bolusRest(model, s, tmpBolus)
    const w = s < 0.18 ? 0 : s < 0.3 ? (s - 0.18) / 0.12 : 1
    p.addScaledVector(fieldAt(p, st, tmpField), w)
    if (s < 0.3) { p.y += 0.0045 * st.tonguePress * sm(0.04, 0.06, p.z) }
    const split = splitOf(s)
    const r = 0.0058 * (s > 0.6 ? 0.85 : 1)
    const [b0, b1] = bolusRefs
    if (b0.current && b1.current) {
      if (split > 0.05) {
        const off = 0.0095 * split
        b0.current.position.set(p.x - off, p.y, p.z)
        b1.current.position.set(p.x + off, p.y, p.z)
        const rr = r * (1 - 0.3 * split)
        b0.current.scale.set(rr, rr * 1.3, rr)
        b1.current.scale.set(rr, rr * 1.3, rr)
        b1.current.visible = visible
      } else {
        b0.current.position.copy(p)
        const squash = s > 0.56 && s < 0.66 ? 1.5 : 1.1
        b0.current.scale.set(r, r * squash, r)
        b1.current.visible = false
      }
      b0.current.visible = visible
    }

    // 误吸碎块
    if (fragRef.current) {
      fragRef.current.visible = st.fragOn
      if (st.fragOn) {
        const fp = model.fragCurve.getPoint(Math.max(0, Math.min(1, st.frag)), tmpFrag)
        fp.addScaledVector(fieldAt(fp, st, tmpField), 1)
        fragRef.current.position.copy(fp)
      }
    }

    // 气流粒子：沿路线随呼吸流速前进（吸气向下、呼气向上），呼吸暂停时停住变暗
    if (airRef.current) {
      const offset = st.airOffset * 0.32
      const strength = Math.min(1, Math.abs(st.flow))
      airMat.opacity = 0.15 + 0.8 * strength
      airMat.color.set(st.cough > 0.1 ? '#ff7a7a' : st.flow >= 0 ? '#7cd3ff' : '#bfe6ff')
      for (let i = 0; i < air.N; i++) {
        const u = ((air.phase[i] + offset) % 1 + 1) % 1
        const q = model.airCurve.getPoint(u, tmpAir)
        const wq = u > 0.45 ? pharynxW(q.y) : 0
        q.addScaledVector(E_LARYNX, st.elev * wq)
        dummy.position.set(q.x + air.jx[i], q.y, q.z + air.jz[i])
        const sc = 0.0011 * (0.6 + 0.6 * strength)
        dummy.scale.set(sc, sc, sc)
        dummy.updateMatrix()
        airRef.current.setMatrixAt(i, dummy.matrix)
      }
      airRef.current.instanceMatrix.needsUpdate = true
    }

    // 标注跟随结构
    const L = labelRefs.current
    const set = (id, x, y, z) => { if (L[id]) L[id].position.set(x, y, z) }
    set('nasal', 0, 1.585, 0.08)
    set('naso', 0, 1.58, 0.02)
    {
      const a = st.palate * 0.36
      const dy = -0.004, dz = -0.026
      set('palate', 0, PALATE_PIVOT.y + dy * Math.cos(a) - dz * Math.sin(a) - 0.006, PALATE_PIVOT.z + dy * Math.sin(a) + dz * Math.cos(a))
    }
    set('tongue', 0, 1.523 + 0.002 * st.tonguePress, 0.062)
    set('oroph', 0, 1.53, -0.002)
    {
      const a = -st.epi * EPI_ANGLE
      const dy = 0.024
      set('epi', 0, EPI_PIVOT.y + eL.y + dy * Math.cos(a) + 0.003, EPI_PIVOT.z + eL.z + dy * Math.sin(a) + 0.004)
    }
    set('hyoid', 0, 1.497 + eH.y, 0.045 + eH.z)
    set('glottis', 0, 1.474 + eL.y, 0.03 + eL.z)
    set('ues', model.uesCenter.x, model.uesCenter.y + eL.y, model.uesCenter.z + eL.z - 0.014)
    {
      const [cx, cz] = model.trachCL.at(1.41)
      set('trachea', cx, 1.41, cz + 0.016)
      const [ox, oz] = model.oesoCL.at(1.40)
      set('oeso', ox, 1.40, oz - 0.016)
    }
  })

  const pick = (e, fn) => {
    // 剖切开启时，射线会先打到被裁掉的那半边，需要跳过不可见的命中
    const hit = e.intersections.find((h) => h.object.isMesh && h.object.userData.role && h.object.visible
      && (!clip || h.point.x <= 0.0008) && h.object.userData.role !== 'bone')
    fn(hit ? hit.object : null, e)
  }

  return (
    <group
      onPointerMove={(e) => {
        e.stopPropagation()
        pick(e, (o) => {
          hoveredRef.current = o
          if (o) { hover.show(o.name, e.nativeEvent.clientX, e.nativeEvent.clientY); document.body.style.cursor = 'pointer' }
          else { hover.hide(); document.body.style.cursor = 'default' }
        })
      }}
      onPointerOut={() => { hoveredRef.current = null; hover.hide(); document.body.style.cursor = 'default' }}
      onClick={(e) => { e.stopPropagation(); pick(e, (o) => { if (o) onPick(o) }) }}
    >
      {model.meshes.filter((m) => !['epi', 'palate'].includes(m.userData.role)).map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      <primitive object={model.epiPivot} />
      <primitive object={model.palatePivot} />
      <group ref={vfRef}>
        <primitive object={folds.vr} />
        <primitive object={folds.vl} />
        <group position={[0, 0.0062, -0.0008]}>
          <primitive object={folds.fr} />
          <primitive object={folds.fl} />
        </group>
      </group>

      <mesh ref={uesRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0078, 0.0018, 12, 40]} />
        <meshStandardMaterial color="#ff5a5a" roughness={0.4} />
      </mesh>

      {[0, 1].map((i) => (
        <mesh key={i} ref={bolusRefs[i]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial color="#ffb347" emissive="#ff7a00" emissiveIntensity={0.45} roughness={0.35} />
        </mesh>
      ))}
      <mesh ref={fragRef} scale={0.0028}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#ff5d2e" emissive="#ff3b00" emissiveIntensity={0.7} />
      </mesh>

      <instancedMesh ref={airRef} args={[undefined, undefined, air.N]} material={airMat} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
      </instancedMesh>

      {showLabels && LABELS.map((l) => (
        <group key={l.id} ref={(r) => { labelRefs.current[l.id] = r }}>
          <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="s3-label" style={{ '--c': l.c }}>{l.zh}</div>
          </Html>
        </group>
      ))}
    </group>
  )
}

const tmpBolus = new THREE.Vector3()
const tmpFrag = new THREE.Vector3()
const tmpField = new THREE.Vector3()
const tmpAir = new THREE.Vector3()

URLS.forEach((u) => useGLTF.preload(u, 'draco/'))
