import { useEffect, useState } from 'react'
import { sample } from './timeline.js'

// 订阅播放时钟：按给定帧率重渲染，返回当前时刻的完整状态。
// 时钟本身存在 ref 里由 SwallowTopic 推进，这样 3D、示意图、面板可以各取所需的刷新率。
export function useClockState(clockRef, scenarioRef, fps = 60) {
  const [st, setSt] = useState(() => sample(clockRef.current.t, scenarioRef.current))
  useEffect(() => {
    let raf, last = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 1000 / fps - 2) return
      last = now
      const t = clockRef.current.t
      const sc = scenarioRef.current
      setSt((prev) => (prev.t === t && prev.scenario === sc ? prev : { ...sample(t, sc), scenario: sc }))
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [clockRef, scenarioRef, fps])
  return st
}
