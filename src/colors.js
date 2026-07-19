import * as THREE from 'three'

// 按解剖惯例给结构上色（Z-Anatomy 源模型是白模，需自行染色，humanome 也是这么做的）。
// 依据：所属系统 + 结构英文名关键词。
const C = (hex) => new THREE.Color(hex)

const SYSTEM_BASE = {
  skeleton:       '#EDE6D3', // 骨 · 象牙白
  muscular:       '#B14A42', // 肌肉 · 暗红
  cardiovascular: '#C0392B', // 默认红（下面按动/静脉细分）
  nervous:        '#E9D67A', // 神经 · 淡黄
  visceral:       '#D98B7A', // 内脏 · 暖肉色
}

// 关键词 → 颜色（优先于系统默认色）
const KEYWORD = [
  // 心血管：静脉/动脉细分
  [/\bvein|venous|vena|sinus\b/i,        '#2E6FB0'], // 静脉 · 蓝
  [/\bvenae?\b/i,                        '#2E6FB0'],
  [/\bartery|arteria|aorta|arterial\b/i, '#C0392B'], // 动脉 · 红
  [/\bpulmonary trunk|truncus\b/i,       '#C0392B'],
  [/\batrium|ventricle|heart|papillary|valve|leaflet\b/i, '#B5322A'], // 心脏 · 深红
  // 神经
  [/\bnerve|nervus|ganglion|plexus\b/i,  '#E9C94A'], // 周围神经 · 黄
  [/\bnucleus|gyrus|cortex|cerebell|thalam|hippocamp|amygdal|hypophysis|commissure|tract\b/i, '#E7D9B0'], // 脑 · 米色
  // 内脏具体器官
  [/\bliver|hepat|segment of liver\b/i,  '#8C4A3A'], // 肝 · 褐
  [/\blung|pulmo\b/i,                    '#D98A93'], // 肺 · 粉
  [/\bkidney|ren\b/i,                    '#9B5A4A'], // 肾
  [/\bcolon|intestine|bowel|caecum|cecum|appendix|rectum|duoden|jejun|ileum\b/i, '#D9A15C'], // 肠 · 土黄
  [/\bstomach|gaster\b/i,                '#D98B6A'], // 胃
  [/\bspleen\b/i,                        '#7A3A4A'], // 脾
  [/\bomentum|mesocolon|meso|peritone|serosa\b/i, '#E8C9A0'], // 系膜/网膜 · 淡黄
  // 淋巴
  [/\blymph|thymus|tonsil\b/i,           '#C9A96A'],
]

export function colorFor(layerId, name) {
  if (name) {
    for (const [re, hex] of KEYWORD) {
      if (re.test(name)) return C(hex)
    }
  }
  return C(SYSTEM_BASE[layerId] || '#DDDDDD')
}
