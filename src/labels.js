// 解剖结构数据查询。
//
// 数据表 anatomy.json 由 assets_source/build_labels.py 生成，覆盖模型中全部
// 1347 个结构，每条含：中文名 zh / 英文名 en / 拉丁名 la / 所属系统 sys /
// 简介 intro / 功能 func / Wikidata 条目号 wd。
//
// 名字匹配的坑：three.js 的 GLTFLoader 会用 PropertyBinding.sanitizeNodeName()
// 处理节点名——空格换成下划线，并删除 [ ] . : / 这几个保留字符。所以 GLB 文件里的
//
//     "Pectoral fascia.l.001"   →   运行时 "Pectoral_fascial001"
//     "Vertebra T7.001"         →   运行时 "Vertebra_T7001"
//
// 点被吃掉后，侧别与编号后缀糊在词尾，且无法用正则可靠地切开：Vertebra_T7001 若
// 贪婪剥掉结尾数字会得到 "Vertebra_T"，把 7 也丢了。因此这里的做法是把候选切分
// 逐个拿去字典里试。
//
// 少数名称存在多种都能命中字典的切法（vertebra_t1001 既可切成 t1+001 也可切成
// t10+01），光看字符串无法判定。这类名称由 build_labels.py 在构建时依据未经
// sanitize 的原始名导出到 mesh-overrides.json，运行时优先查它，不做猜测。
import DATA from './anatomy.json'
import OVERRIDES from './mesh-overrides.json'

export const LABELS = DATA

// 侧别/分组后缀字母：.l 左 .r 右，其余为 Blender 的分组标记
const SIDE_LETTERS = 'lrjmsg'

// 按 three.js 的规则把词典键变换成运行时形态，建立反查索引。
// 源模型里有少数结构名带前导空格或双空格（如 "Orbital part of  inferior frontal
// gyrus"），构建脚本已把空白折叠，而 sanitize 是逐个空格转下划线，会多出一根下划线，
// 故两边都再把连续下划线并成一根并去掉首尾——真实名称中不存在双下划线。
function sanitize(s) {
  return s
    .replace(/\s/g, '_')
    .replace(/[[\].:/]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const BY_SANITIZED = new Map()
for (const key of Object.keys(LABELS)) {
  BY_SANITIZED.set(sanitize(key), key)
}

function clean(name) {
  return sanitize(String(name).replace(/[*]/g, '').trim().toLowerCase())
}

// 返回 { key, side } 或 null。side 为原始后缀字母，'' 表示无。
function resolve(s) {
  if (BY_SANITIZED.has(s)) return { key: BY_SANITIZED.get(s), side: '' }

  const digits = (s.match(/\d+$/) || [''])[0]

  // 依次尝试剥掉 1..n 位结尾数字（对应 .001 / .0001 等编号），
  // 每次再试一次是否还带一个侧别字母。命中字典即认定切分正确。
  for (let n = digits.length; n >= 1; n--) {
    const cut = s.slice(0, s.length - n)
    if (BY_SANITIZED.has(cut)) return { key: BY_SANITIZED.get(cut), side: '' }

    const last = cut.slice(-1)
    if (SIDE_LETTERS.includes(last)) {
      const cut2 = cut.slice(0, -1)
      if (BY_SANITIZED.has(cut2)) return { key: BY_SANITIZED.get(cut2), side: last }
    }
  }

  // 没有编号、只带侧别字母的情况，如 "Femur.l" → "Femurl"
  const tail = s.slice(-1)
  if (SIDE_LETTERS.includes(tail)) {
    const head = s.slice(0, -1)
    if (BY_SANITIZED.has(head)) return { key: BY_SANITIZED.get(head), side: tail }
  }

  return null
}

function lookupKey(rawName) {
  let s = clean(rawName)

  // 构建时导出的歧义表优先，避免运行时误切
  const fixed = OVERRIDES[s]
  if (fixed) return { key: fixed[0], side: fixed[1] }

  const direct = resolve(s)
  if (direct) return direct

  // GLTFLoader 对重名节点会再追加 "_1"、"_2"（createUniqueName），剥掉后重试
  const dedup = s.match(/^(.*)_\d+$/)
  if (dedup) {
    const retry = resolve(dedup[1])
    if (retry) return retry
  }

  // 兜底：万一拿到的是未经 sanitize 的原始名（"Femur.l.001"）
  let raw = s
  for (let i = 0; i < 4; i++) {
    const before = raw
    raw = raw.replace(/\.\d+$/, '').replace(/\.([lrjmsg])$/, '')
    if (raw === before) break
  }
  if (LABELS[raw]) {
    const m = s.match(/\.([lr])(?:\.\d+)?$/)
    return { key: raw, side: m ? m[1] : '' }
  }

  return null
}

// 供构建脚本与测试核对覆盖率
export function resolveName(rawName) {
  const hit = lookupKey(rawName)
  return hit ? hit.key : null
}

const SIDE_ZH = { l: '（左）', r: '（右）' }

// 未收录时至少给出可读的英文名：还原下划线、去掉糊在词尾的后缀
function fallbackName(rawName) {
  return String(rawName)
    .replace(/_\d+$/, '')
    .replace(new RegExp(`[${SIDE_LETTERS}]?\\d+$`), '')
    .replace(/_/g, ' ')
    .trim()
}

export function lookup(rawName) {
  if (!rawName) return null

  const hit = lookupKey(rawName)
  if (!hit) {
    return {
      zh: null, en: fallbackName(rawName), la: null,
      sys: null, intro: null, func: null, wd: null, side: '',
    }
  }

  const e = LABELS[hit.key]
  const sd = SIDE_ZH[hit.side] || ''
  return {
    zh: e.zh ? e.zh + sd : null,
    en: e.en,
    la: e.la || null,
    sys: e.sys || null,
    intro: e.intro || null,
    func: e.func || null,
    wd: e.wd || null,
    side: sd,
  }
}
