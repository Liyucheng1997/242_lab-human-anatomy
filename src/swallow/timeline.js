// 吞咽—呼吸协同的时间轴。
//
// 3D 视图、矢状示意图、喉镜俯视图和讲解面板都从同一个 sample(t) 取状态，
// 保证四处画面在任意时刻一致。时间单位是“演示秒”：咽期在真人身上约 0.7–1 秒，
// 这里放慢到约 1.1 秒；食管期真人约 8–10 秒，这里压缩到 5 秒。

export const DURATION = 10

// 食团沿通道的进度 s ∈ [0,1] 对应的解剖位置。3D 与 2D 两套路径按同一组 s 取点。
export const WAYPOINTS = [
  { s: 0.00, id: 'mouth',     zh: '口腔前部（舌背上）' },
  { s: 0.10, id: 'midTongue', zh: '舌背中部' },
  { s: 0.18, id: 'isthmus',   zh: '咽峡（口腔与咽的交界）' },
  { s: 0.30, id: 'oroph',     zh: '口咽' },
  { s: 0.42, id: 'vallecula', zh: '会厌谷' },
  { s: 0.52, id: 'piriform',  zh: '梨状隐窝（喉口两侧）' },
  { s: 0.58, id: 'ues',       zh: '食管上括约肌（环咽肌）' },
  { s: 0.64, id: 'oesoTop',   zh: '食管颈段' },
  { s: 1.00, id: 'oesoEnd',   zh: '食管胸段（继续下行至胃）' },
]

// 两种情景：正常吞咽，与“边吃边说笑”导致保护动作迟到的误吸示意。
export const SCENARIOS = [
  { id: 'normal',   zh: '正常吞咽' },
  { id: 'aspirate', zh: '防线失灵：误吸' },
]

export const PHASES = [
  {
    id: 'prep', t0: 0, t1: 2.6, zh: '口腔准备期', tag: '随意 · 可长可短',
    air: '经鼻正常呼吸，气流穿过咽部进入喉和气管。',
    food: '咀嚼并混合唾液成食团，舌把它兜在舌背上。',
    key: '软腭下垂、舌根上抬，二者贴合形成“舌腭闭合”，把食团关在口腔里，不让它提前溜进正在通气的咽部。此时气道完全开放，食管上口被环咽肌持续收缩夹紧，空气也进不去食管。',
  },
  {
    id: 'oral', t0: 2.6, t1: 3.5, zh: '口腔期', tag: '随意 · 约 1 秒',
    air: '呼吸多处在呼气相并逐渐放缓，为即将到来的呼吸暂停做准备。',
    food: '舌尖抵住上腭，舌体由前向后依次上抬，像挤牙膏一样把食团推向咽峡。',
    key: '食团（或舌根、咽峡处的感受器）一旦触发，下一阶段就由延髓吞咽中枢接管，变成不可中途停止的反射。',
  },
  {
    id: 'pharyngeal', t0: 3.5, t1: 4.6, zh: '咽期', tag: '反射 · 约 0.7–1 秒',
    air: '呼吸暂停（吞咽性呼吸暂停），声门自下而上逐层关闭：声带 → 室襞 → 杓状软骨前倾贴向会厌根部。',
    food: '舌根后缩、咽缩肌自上而下收缩，把食团挤过咽部；食团被会厌劈开，从喉口两侧的梨状隐窝绕过气道，进入已张开的食管上口。',
    key: '这是“十字路口换道”的关键 1 秒：软腭封住鼻咽、舌骨上肌群把喉拉向前上藏到舌根下、会厌翻转盖住喉口、环咽肌松弛开门——几个动作按固定顺序在零点几秒内完成。',
  },
  {
    id: 'oesophageal', t0: 4.6, t1: DURATION, zh: '食管期', tag: '反射 · 真人约 8–10 秒',
    air: '喉下降、会厌复位、声门打开，呼吸以“呼气”恢复，顺便把喉口附近的残渣吹回咽部。',
    food: '环咽肌重新收缩关门，食管原发蠕动波推动食团下行，下食管括约肌松弛放其入胃。',
    key: '吞咽后先呼气再吸气，是又一道隐形保护：即使有少量残留，也是被吹离气道，而不是被吸进去。',
  },
]

// 防误吸的各道防线。channel 指向 sample() 返回的状态字段，用于点亮面板指示灯；
// focus 是在 3D 中高亮的结构；at 为点击后跳转的时刻。
export const DEFENSES = [
  {
    id: 'oralSeal', zh: '舌腭闭合', at: 1.2, channel: 'oralSeal',
    what: '软腭下垂与舌根贴合，关住口腔后门。',
    why: '吞咽前防止食物提前漏进正在通气的咽部。老人、卒中患者此处无力，常在“还没咽”时就呛到。',
    focus: ['soft palate', 'tongue', 'uvula of palate'],
  },
  {
    id: 'velum', zh: '腭咽闭合', at: 3.8, channel: 'palate',
    what: '软腭上抬后移，与咽后壁贴紧，封住鼻咽。',
    why: '咽缩肌挤压食团时压力很高，没有这道门，食物和水会从鼻子里喷出（腭裂患儿就是这样）。',
    focus: ['soft palate', 'uvula of palate', 'nasopharynx', 'superior pharyngeal constrictor'],
  },
  {
    id: 'apnea', zh: '吞咽性呼吸暂停', at: 3.8, channel: 'apnea',
    what: '延髓吞咽中枢抑制呼吸中枢，气流停止约 0.5–1.5 秒。',
    why: '没有气流就不会把咽部的食物“吸”进喉。吞咽与呼吸由脑干同一网络协调，所以人无法同时吞咽和吸气。',
    focus: ['trachea'],
  },
  {
    id: 'glottis', zh: '声门三层关闭', at: 3.75, channel: 'glottis',
    what: '声带先闭，室襞随后，再由杓状软骨前倾抵住会厌根部，自下而上逐层封口。',
    why: '这是最可靠的一道。会厌即便被切除，只要声门关得好，多数人仍可安全进食。',
    focus: ['arytenoid cartilage', 'lateral crico-arytenoid muscle', 'transverse arytenoid muscle', 'thyro-epiglottic part of thyro-arytenoid muscle', 'ary-epiglottic part of oblique arytenoid muscle'],
  },
  {
    id: 'elev', zh: '喉上提前移', at: 3.95, channel: 'elev',
    what: '颏舌骨肌、下颌舌骨肌、二腹肌前腹拉舌骨向前上，甲状舌骨肌再把喉拉向舌骨，喉整体上移约 2 cm、前移约 1 cm。',
    why: '一举三得：喉口躲到舌根下方、远离食团主流；带动会厌翻转；把环状软骨从咽后壁拉开，机械地撑开食管上口。',
    focus: ['geniohyoid muscle', 'mylohyoid muscle', 'anterior belly of digastric muscle', 'thyrohyoid muscle', 'hyoid bone', 'thyroid cartilage'],
  },
  {
    id: 'epi', zh: '会厌翻转', at: 4.05, channel: 'epi',
    what: '喉上提、舌根后压和食团重量共同把会厌从直立压成水平，再向下盖住喉口。',
    why: '会厌像分流板：把食团从正中劈开，引向两侧的会厌谷和梨状隐窝，绕过喉口进入食管。',
    focus: ['epiglottis', 'laryngopharynx'],
  },
  {
    id: 'ues', zh: '食管上括约肌开闭', at: 4.1, channel: 'ues',
    what: '环咽肌平时持续收缩紧闭；咽期迷走神经抑制它松弛，喉前移把它拉开，食团压力把它撑大；食团过后立即再关上。',
    why: '平时关着：吸气时空气不会灌进食管，胃食管反流物也不会倒灌进咽、再被吸进喉。',
    focus: ['inferior pharyngeal constrictor', 'oesophagus', 'cricoid cartilage'],
  },
  {
    id: 'cough', zh: '咳嗽反射（兜底）', at: 4.9, channel: 'cough',
    what: '异物碰到喉黏膜（喉上神经支配，非常敏感），立即反射性关闭声门并爆发性咳嗽。',
    why: '前面几道都失手时的最后一道。睡眠、醉酒、麻醉、卒中会削弱它，造成“隐性误吸”和吸入性肺炎。',
    focus: ['trachea', 'thyroid cartilage', 'epiglottis'],
  },
]

// ---- 关键帧插值 ----
const smooth = (x) => x * x * (3 - 2 * x)

function keyed(keys, t) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i]
    if (t <= t1) {
      const [t0, v0] = keys[i - 1]
      return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0))
    }
  }
  return keys[keys.length - 1][1]
}

const bump = (t, c, w) => Math.exp(-((t - c) * (t - c)) / (2 * w * w))

// 呼吸气流：>0 吸气，<0 呼气，0 为暂停。数值为相对流速。
const FLOW_NORMAL = [
  [0, 0], [0.7, 1], [1.3, 0], [2.2, -0.8], [3.2, -0.35], [3.45, 0],
  [5.05, 0], [5.6, -0.9], [6.6, 0], [7.4, 1], [8.2, 0], [9.2, -0.8], [10, 0],
]

const TRACKS = {
  normal: {
    flow: FLOW_NORMAL,
    oralSeal: [[0, 1], [3.3, 1], [3.6, 0], [10, 0]],
    tonguePress: [[0, 0], [2.6, 0], [3.0, 1], [3.6, 0.6], [4.6, 0], [10, 0]],
    tongueBack: [[0, 0], [3.55, 0], [3.9, 1], [4.5, 1], [4.9, 0], [10, 0]],
    palate: [[0, 0], [3.5, 0], [3.75, 1], [4.8, 1], [5.1, 0], [10, 0]],
    glottis: [[0, 0], [3.55, 0], [3.7, 1], [4.9, 1], [5.15, 0], [10, 0]],
    vestib: [[0, 0], [3.62, 0], [3.8, 1], [4.85, 1], [5.1, 0], [10, 0]],
    elev: [[0, 0], [3.6, 0], [3.92, 1], [4.75, 1], [5.1, 0], [10, 0]],
    epi: [[0, 0], [3.72, 0], [4.02, 1], [4.7, 1], [5.0, 0], [10, 0]],
    ues: [[0, 0], [3.82, 0], [3.97, 1], [4.42, 1], [4.6, 0], [10, 0]],
    bolus: [
      [0, 0], [2.6, 0], [3.0, 0.1], [3.5, 0.18], [3.85, 0.30], [4.02, 0.42],
      [4.2, 0.52], [4.38, 0.58], [4.6, 0.64], [9.4, 1], [10, 1],
    ],
    waves: [3.85, 4.05, 4.28],
    cough: [[0, 0], [10, 0]],
    frag: null,
  },
  // 误吸示意：说笑分心 → 吞咽反射触发晚、喉上提和会厌翻转迟到且不完全，
  // 声门关得晚，一小块食团趁隙滑进喉前庭，碰到声带后诱发咳嗽把它咳出。
  aspirate: {
    flow: [
      [0, 0], [0.7, 1], [1.3, 0], [2.2, -0.8], [3.2, -0.35], [3.5, 0.5],
      [3.95, 0], [4.6, 0], [4.72, -3.2], [5.15, -2.6], [5.4, 0], [6.0, 0.8],
      [6.6, 0], [7.4, 1], [8.2, 0], [9.2, -0.8], [10, 0],
    ],
    oralSeal: [[0, 1], [3.1, 1], [3.4, 0], [10, 0]],
    tonguePress: [[0, 0], [2.6, 0], [3.0, 1], [3.6, 0.6], [4.6, 0], [10, 0]],
    tongueBack: [[0, 0], [3.8, 0], [4.15, 0.8], [4.6, 0.8], [5.0, 0], [10, 0]],
    palate: [[0, 0], [3.6, 0], [3.85, 1], [4.8, 1], [5.1, 0], [10, 0]],
    glottis: [[0, 0], [4.12, 0], [4.3, 1], [4.62, 1], [4.7, 0.2], [5.15, 0.2], [5.3, 1], [5.45, 0], [10, 0]],
    vestib: [[0, 0], [4.2, 0], [4.4, 0.6], [4.9, 0.6], [5.15, 0], [10, 0]],
    elev: [[0, 0], [3.95, 0], [4.3, 0.55], [4.8, 0.55], [5.15, 0], [10, 0]],
    epi: [[0, 0], [4.05, 0], [4.35, 0.45], [4.75, 0.45], [5.05, 0], [10, 0]],
    ues: [[0, 0], [3.95, 0], [4.12, 1], [4.5, 1], [4.66, 0], [10, 0]],
    bolus: [
      [0, 0], [2.6, 0], [3.0, 0.1], [3.4, 0.18], [3.8, 0.30], [4.02, 0.42],
      [4.22, 0.52], [4.42, 0.58], [4.64, 0.64], [9.4, 1], [10, 1],
    ],
    waves: [4.0, 4.18, 4.38],
    cough: [[0, 0], [4.62, 0], [4.72, 1], [5.2, 1], [5.45, 0], [10, 0]],
    // 碎块沿“误入路线”的进度 f：0=口咽，0.5=喉口，1=声带上方；之后被咳回咽部
    frag: [[0, 0], [3.8, 0], [4.05, 0.45], [4.28, 1], [4.66, 1], [5.0, 0.15], [5.25, 0], [10, 0]],
    fragVisible: [3.8, 5.25],
  },
}

// 气流的累积量（流速对时间的积分），让气流粒子的位置只取决于时刻本身：
// 拖动进度条、暂停、倒放时画面都一致。
const STEP = 0.01
const FLOW_INTEGRAL = {}
for (const [id, k] of Object.entries(TRACKS)) {
  const n = Math.round(DURATION / STEP) + 1
  const F = new Float32Array(n)
  for (let i = 1; i < n; i++) F[i] = F[i - 1] + keyed(k.flow, (i - 0.5) * STEP) * STEP
  FLOW_INTEGRAL[id] = F
}
function airOffsetAt(id, t) {
  const F = FLOW_INTEGRAL[id]
  const f = Math.min(F.length - 1, Math.max(0, t / STEP))
  const a = Math.floor(f), b = Math.min(F.length - 1, a + 1)
  return F[a] + (F[b] - F[a]) * (f - a)
}

export function sample(t, scenario = 'normal') {
  const k = TRACKS[scenario] || TRACKS.normal
  const flow = keyed(k.flow, t)
  const s = {
    t,
    flow,
    airOffset: airOffsetAt(TRACKS[scenario] ? scenario : 'normal', t),
    apnea: t > (scenario === 'aspirate' ? 3.95 : 3.45) && t < 5.05 && Math.abs(flow) < 0.05 ? 1 : 0,
    oralSeal: keyed(k.oralSeal, t),
    tonguePress: keyed(k.tonguePress, t),
    tongueBack: keyed(k.tongueBack, t),
    palate: keyed(k.palate, t),
    glottis: keyed(k.glottis, t),
    vestib: keyed(k.vestib, t),
    elev: keyed(k.elev, t),
    epi: keyed(k.epi, t),
    ues: keyed(k.ues, t),
    bolus: keyed(k.bolus, t),
    cough: keyed(k.cough, t),
    // 咽缩肌上、中、下三段依次收缩
    waves: k.waves.map((c) => bump(t, c, 0.11)),
    frag: k.frag ? keyed(k.frag, t) : 0,
    fragOn: !!k.frag && t > k.fragVisible[0] && t < k.fragVisible[1],
  }
  // 食团在食管里时，蠕动收缩紧跟在它后方
  s.peristalsis = s.bolus > 0.6 && s.bolus < 0.995 ? 1 : 0
  return s
}

export function phaseAt(t) {
  return PHASES.find((p) => t >= p.t0 && t < p.t1) || PHASES[PHASES.length - 1]
}

// 由 s 找出所在的两个路标及段内参数 u，供 3D 与 2D 路径共用
export function segmentOf(s) {
  const w = WAYPOINTS
  if (s <= w[0].s) return { i: 0, u: 0 }
  for (let i = 1; i < w.length; i++) {
    if (s <= w[i].s) return { i: i - 1, u: (s - w[i - 1].s) / (w[i].s - w[i - 1].s) }
  }
  return { i: w.length - 2, u: 1 }
}

// 食团被会厌劈成左右两股的程度（0 合一，1 完全分开），用于 3D 与喉镜视图
export function splitOf(s) {
  if (s < 0.36 || s > 0.6) return 0
  if (s < 0.44) return (s - 0.36) / 0.08
  if (s < 0.53) return 1
  return 1 - (s - 0.53) / 0.07
}
