import React, { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Bounds, Html } from '@react-three/drei'
import * as THREE from 'three'
import { lookup } from './labels.js'

// 各解剖系统图层（从 Z-Anatomy 的 Startup.blend 导出）
const LAYERS = [
  { id: 'skeleton',       url: '/models/skeleton.glb',       zh: '骨骼系统' },
  { id: 'muscular',       url: '/models/muscular.glb',       zh: '肌肉系统' },
  { id: 'cardiovascular', url: '/models/cardiovascular.glb', zh: '心血管系统' },
  { id: 'nervous',        url: '/models/nervous.glb',        zh: '神经与感官' },
  { id: 'visceral',       url: '/models/visceral.glb',       zh: '内脏系统' },
]

LAYERS.forEach((l) => useGLTF.preload(l.url, '/draco/'))

const SELECT_COLOR = new THREE.Color('#ff5252')
const HOVER_EMISSIVE = new THREE.Color('#ffd24a')

// 命令式 hover 高亮：直接改材质自发光，避免逐帧 React 重渲染。
function setHover(o, on) {
  const m = o && o.material
  if (!m || !m.emissive) return
  if (on) {
    if (m.userData._e === undefined) m.userData._e = m.emissive.getHex()
    m.emissive.copy(HOVER_EMISSIVE)
    m.emissiveIntensity = 0.55
  } else {
    if (m.userData._e !== undefined) m.emissive.setHex(m.userData._e)
    else m.emissive.setHex(0x000000)
    m.emissiveIntensity = 1
  }
}

function Layer({ url, layerId, onPick, selected, hover }) {
  const { scene } = useGLTF(url, '/draco/')
  const original = useRef(new Map())
  const hoveredRef = useRef(null)

  // 首次加载：每个 mesh 独立材质（避免高亮串色），记录烤进模型的原色。
  useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = (Array.isArray(o.material) ? o.material[0] : o.material).clone()
        const m = o.material
        m.metalness = 0
        if (m.roughness === undefined || m.roughness === 1) m.roughness = 0.65
        if (m.color) original.current.set(o.uuid, m.color.clone())
      }
    })
  }, [scene, layerId])

  // 点击选中高亮（仅在选择变化时随 App 重渲染执行）
  scene.traverse((o) => {
    if (o.isMesh && o.material && o.material.color) {
      if (selected && o === selected) o.material.color.copy(SELECT_COLOR)
      else if (original.current.has(o.uuid)) o.material.color.copy(original.current.get(o.uuid))
    }
  })

  const clearHover = () => {
    if (hoveredRef.current) { setHover(hoveredRef.current, false); hoveredRef.current = null }
  }

  return (
    <primitive
      object={scene}
      onClick={(e) => { e.stopPropagation(); onPick(e.object) }}
      onPointerMove={(e) => {
        e.stopPropagation()
        const o = e.object
        if (o !== hoveredRef.current) {
          setHover(hoveredRef.current, false)
          setHover(o, true)
          hoveredRef.current = o
          document.body.style.cursor = 'pointer'
        }
        hover.show(o.name, e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={() => {
        clearHover()
        document.body.style.cursor = 'default'
        hover.hide()
      }}
    />
  )
}

function Panel({ info, active, toggle, layers }) {
  return (
    <aside className="panel">
      <h1>人体结构</h1>
      <p className="sub">交互式 3D 解剖图谱 · 原型</p>

      <div className="layers">
        {layers.map((l) => (
          <button
            key={l.id}
            className={active.has(l.id) ? 'chip on' : 'chip'}
            onClick={() => toggle(l.id)}
          >{l.zh}</button>
        ))}
      </div>

      {info ? (
        <div className="card">
          <div className="zh">{info.zh || info.name}</div>
          <div className="en">{info.name}</div>
          {info.system && <div className="row"><span>系统</span><b>{info.system}</b></div>}
          {info.intro && (
            <div className="block"><div className="lbl">简介</div><p>{info.intro}</p></div>
          )}
          {info.func && (
            <div className="block"><div className="lbl">功能</div><p>{info.func}</p></div>
          )}
          {!info.zh && (
            <div className="todo">该结构中文说明待补充（可在 src/labels.js 添加）。</div>
          )}
        </div>
      ) : (
        <div className="hint">悬停任意结构浮出名称，点击选中查看详情。<br/>拖拽旋转，滚轮缩放，上方切换图层。</div>
      )}

      <div className="attribution">
        模型来源：<a href="https://github.com/Z-Anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a>
        （CC-BY-SA 4.0，源自 BodyParts3D）。
      </div>
    </aside>
  )
}

export default function App() {
  const [selected, setSelected] = useState(null)
  const [info, setInfo] = useState(null)
  const [active, setActive] = useState(new Set(['skeleton']))
  const tipRef = useRef(null)

  // 命令式气泡：直接写 DOM，不走 React state，保证 hover 流畅。
  const hover = useMemo(() => ({
    show: (name, x, y) => {
      const el = tipRef.current
      if (!el) return
      const r = lookup(name)
      el.textContent = r.zh ? `${r.zh}  ·  ${name}` : name
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      el.style.opacity = '1'
    },
    hide: () => { if (tipRef.current) tipRef.current.style.opacity = '0' },
  }), [])

  const onPick = (mesh) => { setSelected(mesh); setInfo(lookup(mesh.name)) }
  const toggle = (id) => setActive((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const visible = LAYERS.filter((l) => active.has(l.id))

  return (
    <div className="app">
      <div className="stage">
        <Canvas camera={{ position: [0, 1, 3], fov: 45 }} onPointerMissed={() => { setSelected(null); setInfo(null) }}>
          <hemisphereLight args={['#ffffff', '#4a5568', 0.9]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 5, 2]} intensity={1.1} />
          <directionalLight position={[-4, 1, -3]} intensity={0.5} />
          <directionalLight position={[0, -3, 2]} intensity={0.3} />
          <Suspense fallback={<Html center>加载模型中…</Html>}>
            <Bounds fit clip observe margin={1.1} key={visible.map((v) => v.id).join(',')}>
              {visible.map((l) => (
                <Layer key={l.id} url={l.url} layerId={l.id} onPick={onPick} selected={selected} hover={hover} />
              ))}
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>
        <div ref={tipRef} className="tooltip" />
      </div>
      <Panel info={info} active={active} toggle={toggle} layers={LAYERS} />
    </div>
  )
}
