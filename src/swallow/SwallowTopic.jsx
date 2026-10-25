// 专题：吞咽与呼吸——咽喉“十字路口”如何分时通行、防止气道与食道串线。
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { lookup } from '../labels.js'
import NeckScene from './Neck3D.jsx'
import Sagittal from './Sagittal.jsx'
import Laryngoscope from './Laryngoscope.jsx'
import { useClockState } from './useClock.js'
import { DURATION, PHASES, DEFENSES, SCENARIOS, phaseAt } from './timeline.js'
import { ISOLATION, NEURAL, CLINICAL, ASPIRATION_NOTES, TOPIC_SOURCES } from './content.js'

const VIEWS = {
  side:  { zh: '侧面剖切', pos: [0.27, 1.515, 0.03], target: [0, 1.49, 0.02] },
  oblique: { zh: '前外侧', pos: [0.2, 1.55, 0.2], target: [0, 1.49, 0.02] },
  back:  { zh: '后外侧', pos: [0.16, 1.54, -0.2], target: [0, 1.48, 0.0] },
}

function CameraRig({ view }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    const v = VIEWS[view]
    camera.position.set(...v.pos)
    if (controls) { controls.target.set(...v.target); controls.update() }
    else camera.lookAt(...v.target)
  }, [view, camera, controls])
  return null
}

function Toggle({ on, onClick, children }) {
  return <button className={on ? 'chip on' : 'chip'} onClick={onClick}>{children}</button>
}

function Fold({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial)
  return (
    <div className={open ? 'fold open' : 'fold'}>
      <button className="fold-h" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span><i>{open ? '−' : '+'}</i>
      </button>
      {open && <div className="fold-b">{children}</div>}
    </div>
  )
}

function Schematics({ clockRef, scenarioRef }) {
  const st = useClockState(clockRef, scenarioRef, 60)
  return (
    <div className="schem">
      <div className="schem-h">
        <b>正中矢状切面</b><span>面朝左 · 与 3D 同步</span>
      </div>
      <Sagittal st={st} />
      <div className="legend">
        <span><i style={{ background: '#4FA3FF' }} />气道</span>
        <span><i style={{ background: '#FF9A3C' }} />食道</span>
        <span><i style={{ background: '#A77BFF' }} />共用的咽</span>
        <span><i style={{ background: '#ff5a3c' }} />正在收缩的肌肉</span>
      </div>
      <div className="schem-h">
        <b>喉镜俯视</b><span>从咽部往下看，前方在上</span>
      </div>
      <Laryngoscope st={st} />
      <p className="schem-note">会厌把食团劈成两股，经喉口两侧的梨状隐窝绕过气道，在环状软骨后方汇入食管。</p>
    </div>
  )
}

function Timeline({ clockRef, scenarioRef, playing, setPlaying, speed, setSpeed, onSeek }) {
  const st = useClockState(clockRef, scenarioRef, 30)
  const phase = phaseAt(st.t)
  return (
    <div className="tl">
      <div className="tl-row">
        <button className="tl-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? '暂停' : '播放'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="tl-now">
          <b>{phase.zh}</b>
          <span>{st.t.toFixed(2)} s / {DURATION} s</span>
        </div>
        <div className="tl-speed">
          {[1, 0.5, 0.2].map((v) => (
            <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>
          ))}
        </div>
      </div>
      <div className="tl-track">
        <div className="tl-phases">
          {PHASES.map((p) => (
            <button key={p.id} className={p.id === phase.id ? 'on' : ''}
              style={{ left: `${(p.t0 / DURATION) * 100}%`, width: `${((p.t1 - p.t0) / DURATION) * 100}%` }}
              onClick={() => onSeek(p.t0 + 0.001)}
            >{p.zh}</button>
          ))}
        </div>
        <input type="range" min="0" max={DURATION} step="0.01" value={st.t}
          onChange={(e) => onSeek(parseFloat(e.target.value))} />
      </div>
    </div>
  )
}

function Panel({ clockRef, scenarioRef, scenario, setScenario, focus, onDefense, picked, clearPicked }) {
  const st = useClockState(clockRef, scenarioRef, 20)
  const phase = phaseAt(st.t)
  const note = scenario === 'aspirate' ? ASPIRATION_NOTES.find((n) => st.t >= n.t0 && st.t < n.t1) : null

  return (
    <aside className="panel topic-panel">
      <div>
        <div className="eyebrow">专题 · 咽喉“十字路口”</div>
        <h1>吞咽与呼吸如何不打架</h1>
      </div>
      <p className="lead">
        空气从<b className="c-air">鼻</b>进来要去<b className="c-air">前方的气管</b>，食物从<b className="c-food">口</b>进来要去<b className="c-food">后方的食管</b>——两条路在<b className="c-shared">咽</b>交叉。
        身体的办法是<b>分时通行</b>：平时咽部归呼吸用；每次吞咽，脑干用不到 1 秒把路口切换给食物，再切回来。
      </p>

      <div className="seg">
        {SCENARIOS.map((s) => (
          <button key={s.id} className={scenario === s.id ? 'on' : ''} onClick={() => setScenario(s.id)}>{s.zh}</button>
        ))}
      </div>

      {picked && (
        <div className="card picked">
          <button className="x" onClick={clearPicked} aria-label="关闭">×</button>
          <div className="zh">{picked.zh || picked.en}</div>
          <div className="en">{picked.en}</div>
          {picked.intro && <p>{picked.intro}</p>}
          {picked.func && <p className="dim">{picked.func}</p>}
        </div>
      )}

      <div className={`phase-card ph-${phase.id}`}>
        <div className="ph-h"><b>{phase.zh}</b><span>{phase.tag}</span></div>
        <div className="ph-row"><i className="dot air" /><p>{phase.air}</p></div>
        <div className="ph-row"><i className="dot food" /><p>{phase.food}</p></div>
        <p className="ph-key">{phase.key}</p>
        {note && <p className="ph-warn"><b>误吸情景：</b>{note.text}</p>}
      </div>

      <div>
        <div className="sec-h">八道防线 <span>亮灯 = 此刻正在起作用 · 点击查看</span></div>
        <ul className="defs">
          {DEFENSES.map((d, i) => {
            const level = Math.min(1, Math.max(0, st[d.channel] || 0))
            const on = focus === d.id
            return (
              <li key={d.id} className={on ? 'on' : ''}>
                <button onClick={() => onDefense(d)}>
                  <i className="lamp" style={{ opacity: 0.18 + 0.82 * level, boxShadow: level > 0.5 ? '0 0 10px #5ee08a' : 'none' }} />
                  <span className="n">{i + 1}</span>
                  <span className="t">{d.zh}</span>
                </button>
                {on && (
                  <div className="def-b">
                    <p>{d.what}</p>
                    <p className="dim">{d.why}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <Fold title="平时为什么不串？——结构上的隔离" open>
        <ol className="plain">
          {ISOLATION.map((x) => <li key={x.h}><b>{x.h}</b>{x.p}</li>)}
        </ol>
      </Fold>
      <Fold title="谁在指挥？——延髓吞咽中枢">
        <ol className="plain">
          {NEURAL.map((x) => <li key={x.h}><b>{x.h}</b>{x.p}</li>)}
        </ol>
      </Fold>
      <Fold title="临床与日常">
        <ol className="plain">
          {CLINICAL.map((x) => <li key={x.h}><b>{x.h}</b>{x.p}</li>)}
        </ol>
      </Fold>

      <div className="attribution">
        <div className="lbl">本专题参考</div>
        <ul className="refs-list">
          {TOPIC_SOURCES.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p>
          3D 模型来自 <a href="https://github.com/Z-Anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a>（CC BY-SA 4.0）。
          源模型为静态网格，喉上提、会厌翻转、软腭上抬与食管膨出均为按文献幅度做的示意动画；声带、环咽肌环、食团与气流为补充绘制。
        </p>
      </div>
    </aside>
  )
}

export default function SwallowTopic({ modeSwitch }) {
  const clockRef = useRef({ t: 0 })
  const scenarioRef = useRef('normal')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.5)
  const [scenario, setScenarioState] = useState('normal')
  const [view, setView] = useState('side')
  const [opts, setOpts] = useState({ clip: true, muscles: true, bones: true, labels: true })
  const [focus, setFocus] = useState(null)
  const [picked, setPicked] = useState(null)
  const [showSchem, setShowSchem] = useState(true)
  const tipRef = useRef(null)

  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  playingRef.current = playing
  speedRef.current = speed

  useEffect(() => {
    let raf, last = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!playingRef.current) return
      let t = clockRef.current.t + dt * speedRef.current
      if (t >= DURATION) t -= DURATION
      clockRef.current.t = t
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const setScenario = (id) => {
    scenarioRef.current = id
    setScenarioState(id)
    clockRef.current.t = id === 'aspirate' ? 2.8 : 0
    setPlaying(true)
  }

  const seek = (t) => { clockRef.current.t = Math.max(0, Math.min(DURATION - 0.001, t)) }

  const onDefense = (d) => {
    if (focus === d.id) { setFocus(null); return }
    setFocus(d.id)
    seek(d.at)
    setPlaying(false)
  }

  const focusKeys = useMemo(() => {
    const d = DEFENSES.find((x) => x.id === focus)
    return d ? d.focus : []
  }, [focus])

  const hover = useMemo(() => ({
    show: (name, x, y) => {
      const el = tipRef.current
      if (!el) return
      const r = lookup(name)
      el.textContent = r.zh ? `${r.zh}  ·  ${r.en}` : r.en
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      el.style.opacity = '1'
    },
    hide: () => { if (tipRef.current) tipRef.current.style.opacity = '0' },
  }), [])

  const flip = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }))

  return (
    <div className={showSchem ? 'app topic' : 'app topic no-schem'}>
      <div className="stage">
        <Canvas
          camera={{ position: VIEWS.side.pos, fov: 34, near: 0.004, far: 20 }}
          onCreated={({ gl }) => { gl.localClippingEnabled = true }}
          onPointerMissed={() => setPicked(null)}
        >
          <color attach="background" args={['#0f131a']} />
          <hemisphereLight args={['#ffffff', '#404a5a', 0.95]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 1]} intensity={1.15} />
          <directionalLight position={[1, 1, 3]} intensity={0.5} />
          <directionalLight position={[-2, 1, -2]} intensity={0.35} />
          <Suspense fallback={<Html center><div className="loading">加载头颈部模型…</div></Html>}>
            <NeckScene
              clockRef={clockRef} scenarioRef={scenarioRef}
              clip={opts.clip} showMuscles={opts.muscles} showBones={opts.bones} showLabels={opts.labels}
              focus={focusKeys} hover={hover}
              onPick={(m) => setPicked(lookup(m.name))}
            />
          </Suspense>
          <OrbitControls makeDefault enableDamping target={VIEWS.side.target} minDistance={0.06} maxDistance={0.9} />
          <CameraRig view={view} />
        </Canvas>
        <div ref={tipRef} className="tooltip" />

        <div className="stage-top">
          {modeSwitch}
          <div className="stage-tools">
            <div className="seg small">
              {Object.entries(VIEWS).map(([k, v]) => (
                <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{v.zh}</button>
              ))}
            </div>
            <div className="layers">
              <Toggle on={opts.clip} onClick={() => flip('clip')}>正中剖开</Toggle>
              <Toggle on={opts.bones} onClick={() => flip('bones')}>骨骼参照</Toggle>
              <Toggle on={opts.muscles} onClick={() => flip('muscles')}>肌肉</Toggle>
              <Toggle on={opts.labels} onClick={() => flip('labels')}>标注</Toggle>
              <Toggle on={showSchem} onClick={() => setShowSchem((v) => !v)}>示意图</Toggle>
            </div>
          </div>
        </div>

        <Timeline clockRef={clockRef} scenarioRef={scenarioRef}
          playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onSeek={seek} />
      </div>
      {showSchem && <Schematics clockRef={clockRef} scenarioRef={scenarioRef} />}
      <Panel clockRef={clockRef} scenarioRef={scenarioRef} scenario={scenario} setScenario={setScenario}
        focus={focus} onDefense={onDefense} picked={picked} clearPicked={() => setPicked(null)} />
    </div>
  )
}
